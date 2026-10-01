import {
  CalendarClock,
  LayoutDashboard,
  MessageSquareText,
  Settings2,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export const navigationItems: {
  label: string;
  path: string;
  icon: LucideIcon;
}[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Media Partner", path: "/media", icon: Workflow },
  { label: "Tindak Lanjut", path: "/follow-ups", icon: CalendarClock },
  { label: "Template Pesan", path: "/templates", icon: MessageSquareText },
  { label: "Tim", path: "/team", icon: UsersRound },
  { label: "Pengaturan", path: "/settings", icon: Settings2 },
];
