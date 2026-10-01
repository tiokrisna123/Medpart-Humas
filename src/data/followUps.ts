import { supabase } from "../lib/supabase";
import type { MediaActivity, MediaStatus } from "./media";

export type FollowUpTarget = {
  id: string;
  media_partner_id: string;
  activity: MediaActivity;
  status: MediaStatus;
  assigned_to: string | null;
  follow_up_at: string | null;
  notes: string | null;
  media_partner: {
    name: string;
    instagram: string | null;
  } | null;
  assigned_member: {
    full_name: string;
  } | null;
};

type RawFollowUpTarget = Omit<
  FollowUpTarget,
  "media_partner" | "assigned_member"
> & {
  media_partner:
    | FollowUpTarget["media_partner"]
    | NonNullable<FollowUpTarget["media_partner"]>[]
    | null;
  assigned_member:
    | FollowUpTarget["assigned_member"]
    | NonNullable<FollowUpTarget["assigned_member"]>[]
    | null;
};

export type FollowUpBucket = "today" | "overdue" | "upcoming";
export type FollowUpFilter = "all" | FollowUpBucket;

const CLOSED_STATUSES: MediaStatus[] = ["confirmed", "completed"];
const FOLLOW_UP_PAGE_SIZE = 1000;

export async function loadFollowUpTargets(): Promise<FollowUpTarget[]> {
  if (!supabase) {
    throw new Error("Supabase belum terhubung.");
  }

  const rows: RawFollowUpTarget[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("media_targets")
      .select(`
        id,
        media_partner_id,
        activity,
        status,
        assigned_to,
        follow_up_at,
        notes,
        media_partner:media_partners!media_targets_media_partner_id_fkey (
          name,
          instagram
        ),
        assigned_member:team_members!media_targets_assigned_to_fkey (
          full_name
        )
      `)
      .not("follow_up_at", "is", null)
      .order("follow_up_at", { ascending: true })
      .range(offset, offset + FOLLOW_UP_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = (data ?? []) as RawFollowUpTarget[];
    rows.push(...page);

    if (page.length < FOLLOW_UP_PAGE_SIZE) {
      break;
    }

    offset += FOLLOW_UP_PAGE_SIZE;
  }

  return rows.map((row) => ({
    ...row,
    media_partner: Array.isArray(row.media_partner)
      ? row.media_partner[0] ?? null
      : row.media_partner,
    assigned_member: Array.isArray(row.assigned_member)
      ? row.assigned_member[0] ?? null
      : row.assigned_member,
  }));
}

function localCalendarDay(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

export function getFollowUpBucket(
  target: FollowUpTarget,
  now: Date,
): FollowUpBucket | null {
  if (!target.follow_up_at || CLOSED_STATUSES.includes(target.status)) {
    return null;
  }

  const followUpTime = new Date(target.follow_up_at);
  const timestamp = followUpTime.getTime();

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  if (timestamp < now.getTime()) {
    return "overdue";
  }

  const daysFromToday =
    localCalendarDay(followUpTime) - localCalendarDay(now);

  if (daysFromToday === 0) {
    return "today";
  }

  if (daysFromToday >= 1 && daysFromToday <= 7) {
    return "upcoming";
  }

  return null;
}

export function filterFollowUpTargets(
  targets: FollowUpTarget[],
  filter: FollowUpFilter,
  now: Date,
): FollowUpTarget[] {
  if (filter === "all") {
    return targets.filter((target) => target.follow_up_at !== null);
  }

  return targets.filter(
    (target) => getFollowUpBucket(target, now) === filter,
  );
}

export function toDateTimeLocalValue(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}
