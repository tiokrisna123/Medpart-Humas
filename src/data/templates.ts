import {
  COMMUNICATION_TYPE_LABELS,
  COMMUNICATION_TYPES,
  type CommunicationType,
} from "./communications";
import { supabase } from "../lib/supabase";

export type MessageTemplate = {
  id: string;
  name: string;
  channel: CommunicationType;
  subject: string | null;
  content: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageTemplateDraft = {
  name: string;
  channel: CommunicationType;
  subject: string | null;
  content: string;
  description: string | null;
};

export const TEMPLATE_CHANNEL_LABELS: Record<CommunicationType, string> = {
  ...COMMUNICATION_TYPE_LABELS,
  meeting: "Meeting",
};

export const TEMPLATE_CHANNELS = COMMUNICATION_TYPES;

const TEMPLATE_COLUMNS =
  "id, name, channel, subject, content, description, created_by, created_at, updated_at";
let pendingTemplatesRequest: Promise<MessageTemplate[]> | null = null;

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase belum terhubung.");
  }

  return supabase;
}

export function loadMessageTemplates(): Promise<MessageTemplate[]> {
  if (pendingTemplatesRequest) return pendingTemplatesRequest;

  const request = (async () => {
    const { data, error } = await requireSupabase()
      .from("message_templates")
      .select(TEMPLATE_COLUMNS)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return data ?? [];
  })();
  let trackedRequest: Promise<MessageTemplate[]>;
  trackedRequest = request.finally(() => {
    if (pendingTemplatesRequest === trackedRequest) {
      pendingTemplatesRequest = null;
    }
  });
  pendingTemplatesRequest = trackedRequest;

  return trackedRequest;
}

export function getMessageTemplateErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Operasi template gagal. Coba lagi.";
}

export async function createMessageTemplate(
  draft: MessageTemplateDraft,
  memberId: string,
): Promise<void> {
  const { error } = await requireSupabase()
    .from("message_templates")
    .insert({
      ...draft,
      created_by: memberId,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

export async function updateMessageTemplate(
  id: string,
  draft: MessageTemplateDraft,
): Promise<void> {
  const { error } = await requireSupabase()
    .from("message_templates")
    .update({
      ...draft,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteMessageTemplate(id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from("message_templates")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
