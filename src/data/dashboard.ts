import {
  MEDIA_ACTIVITIES,
  MEDIA_STATUSES,
  type MediaActivity,
  type MediaStatus,
} from "./media";
import type { CommunicationType } from "./communications";
import { loadFollowUpTargets, type FollowUpTarget } from "./followUps";
import { supabase } from "../lib/supabase";

export type RecentCommunication = {
  id: string;
  type: CommunicationType;
  subject: string | null;
  contacted_at: string;
  created_at: string;
  created_by: string | null;
  media_target_id: string;
  media_partner_id: string | null;
  activity: MediaActivity | null;
  media_name: string | null;
  recorder_name: string | null;
};

export type DashboardData = {
  followUpTargets: FollowUpTarget[];
  activityCounts: Record<MediaActivity, number>;
  activityStatusCounts: Record<
    MediaActivity,
    Partial<Record<MediaStatus, number>>
  >;
  recentCommunications: RecentCommunication[];
};

let inFlightDashboardLoad: Promise<DashboardData> | null = null;

type RawRecentCommunication = {
  id: string;
  type: CommunicationType;
  subject: string | null;
  contacted_at: string;
  created_at: string;
  created_by: string | null;
  target:
    | {
        id: string;
      media_partner_id: string;
      activity: MediaActivity;
        media_partner:
          | { name: string }
          | { name: string }[]
          | null;
      }
    | {
        id: string;
      media_partner_id: string;
      activity: MediaActivity;
        media_partner:
          | { name: string }
          | { name: string }[]
          | null;
      }[]
    | null;
  recorder:
    | { full_name: string }
    | { full_name: string }[]
    | null;
};

type ActivityStatusRow = {
  activity: MediaActivity;
  status: MediaStatus;
};

function isMediaActivity(value: string): value is MediaActivity {
  return MEDIA_ACTIVITIES.some((activity) => activity === value);
}

function isMediaStatus(value: string): value is MediaStatus {
  return MEDIA_STATUSES.some((status) => status === value);
}

async function loadActivityStatusRows(
  client: NonNullable<typeof supabase>,
): Promise<ActivityStatusRow[]> {
  const rows: ActivityStatusRow[] = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from("media_targets")
      .select("activity, status")
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    for (const row of data ?? []) {
      if (
        !isMediaActivity(row.activity) ||
        !isMediaStatus(row.status)
      ) {
        throw new Error(
          "Ditemukan aktivitas atau status target yang tidak dikenali.",
        );
      }

      rows.push({
        activity: row.activity,
        status: row.status,
      });
    }

    if (!data || data.length < pageSize) break;
  }

  return rows;
}

export function loadDashboardData(): Promise<DashboardData> {
  if (inFlightDashboardLoad) {
    return inFlightDashboardLoad;
  }

  const request = fetchDashboardData();
  inFlightDashboardLoad = request;

  void request.then(
    () => {
      if (inFlightDashboardLoad === request) {
        inFlightDashboardLoad = null;
      }
    },
    () => {
      if (inFlightDashboardLoad === request) {
        inFlightDashboardLoad = null;
      }
    },
  );

  return request;
}

async function fetchDashboardData(): Promise<DashboardData> {
  if (!supabase) {
    throw new Error("Supabase belum terhubung.");
  }

  const client = supabase;
  const [
    followUpTargets,
    activityResult,
    activityStatusRows,
    communicationResult,
  ] =
    await Promise.all([
      loadFollowUpTargets(),
      Promise.all(
        MEDIA_ACTIVITIES.map((activity) =>
          client
            .from("media_targets")
            .select("id", { count: "exact" })
            .eq("activity", activity),
        ),
      ),
      loadActivityStatusRows(client),
      client
        .from("communication_logs")
        .select(`
          id,
          type,
          subject,
          contacted_at,
          created_at,
          created_by,
          target:media_targets!communication_logs_media_target_id_fkey (
            id,
            media_partner_id,
            activity,
            media_partner:media_partners!media_targets_media_partner_id_fkey (
              name
            )
          ),
          recorder:team_members!communication_logs_created_by_fkey (
            full_name
          )
        `)
        .order("contacted_at", { ascending: false })
        .limit(6),
    ]);

  const activityError = activityResult.find((result) => result.error)?.error;
  if (activityError) {
    throw activityError;
  }

  if (communicationResult.error) {
    throw communicationResult.error;
  }

  const activityCounts: Record<MediaActivity, number> = {
    open_call: 0,
    workshop: 0,
    pameran: 0,
  };
  for (const [index, activity] of MEDIA_ACTIVITIES.entries()) {
    activityCounts[activity] = activityResult[index].count ?? 0;
  }

  const activityStatusCounts: DashboardData["activityStatusCounts"] = {
    open_call: {},
    workshop: {},
    pameran: {},
  };
  for (const row of activityStatusRows) {
    const counts = activityStatusCounts[row.activity];
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  const rawCommunications: RawRecentCommunication[] =
    communicationResult.data ?? [];
  const recentCommunications = rawCommunications.map((item) => {
    const target = Array.isArray(item.target)
      ? item.target[0] ?? null
      : item.target;
    const mediaPartner = Array.isArray(target?.media_partner)
      ? target.media_partner[0] ?? null
      : target?.media_partner ?? null;
    const recorder = Array.isArray(item.recorder)
      ? item.recorder[0] ?? null
      : item.recorder;

    return {
      id: item.id,
      type: item.type,
      subject: item.subject,
      contacted_at: item.contacted_at,
      created_at: item.created_at,
      created_by: item.created_by,
      media_target_id: target?.id ?? "",
      media_partner_id: target?.media_partner_id ?? null,
      activity: target?.activity ?? null,
      media_name: mediaPartner?.name ?? null,
      recorder_name: recorder?.full_name ?? null,
    };
  });

  return {
    followUpTargets,
    activityCounts,
    activityStatusCounts,
    recentCommunications,
  };
}
