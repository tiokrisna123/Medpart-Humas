export const MEDIA_ACTIVITIES = [
  "open_call",
  "workshop",
  "pameran",
] as const;

export const MEDIA_ACTIVITY_LABELS = {
  open_call: "Open Call",
  workshop: "Workshop",
  pameran: "Pameran",
} as const;

export const MEDIA_STATUSES = [
  "target",
  "not_contacted",
  "contacted",
  "waiting_response",
  "response_received",
  "negotiation",
  "confirmed",
  "completed",
  "rejected",
  "no_response",
  "not_relevant",
] as const;

export const MEDIA_STATUS_LABELS = {
  target: "Target",
  not_contacted: "Belum Dihubungi",
  contacted: "Sudah Dihubungi",
  waiting_response: "Menunggu Respons",
  response_received: "Sudah Merespons",
  negotiation: "Negosiasi/Konfirmasi",
  confirmed: "Dikonfirmasi",
  completed: "Selesai",
  rejected: "Ditolak",
  no_response: "Tidak Ada Respons",
  not_relevant: "Tidak Relevan",
} as const;

export type MediaActivity = (typeof MEDIA_ACTIVITIES)[number];
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export function buildInstagramUrl(handle: string): string {
  const trimmed = handle.trim();

  if (!trimmed) {
    return "";
  }

  const lower = trimmed.toLowerCase();

  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return trimmed;
  }

  return `https://instagram.com/${trimmed.replace(/^@+/, "")}`;
}