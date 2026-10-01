export const COMMUNICATION_TYPES = [
  "whatsapp",
  "instagram_dm",
  "email",
  "phone",
  "meeting",
  "other",
] as const;

export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];

export const COMMUNICATION_TYPE_LABELS: Record<
  CommunicationType,
  string
> = {
  whatsapp: "WhatsApp",
  instagram_dm: "Instagram DM",
  email: "Email",
  phone: "Telepon",
  meeting: "Pertemuan",
  other: "Lainnya",
};

export function isCommunicationType(
  value: string,
): value is CommunicationType {
  return COMMUNICATION_TYPES.some((item) => item === value);
}
