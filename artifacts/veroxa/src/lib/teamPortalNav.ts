/**
 * Team Portal navigation — simplified cleanup pass.
 *
 * Visible: Dashboard · Work Queue · Media Review · Drafts · Scheduling · Reports · Alerts
 * Hidden (routes still exist): Client Health, Task Engine, Client Detail, Content Review,
 *   My Tasks, AI Review, Performance, Activity Feed
 */
import {
  LayoutDashboard,
  Image as ImageIcon,
  Layers,
  CalendarDays,
  FileText,
  ShieldAlert,
  ListChecks,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const teamPortalNavItems: SidebarItem[] = [
  { label: "Dashboard",    icon: LayoutDashboard, href: "/demo/team/dashboard"    },
  { label: "Work Queue",   icon: ListChecks,      href: "/demo/team/work-queue"   },
  { label: "Media Review", icon: ImageIcon,       href: "/demo/team/media-review" },
  { label: "Drafts",       icon: Layers,          href: "/demo/team/drafts"       },
  { label: "Scheduling",   icon: CalendarDays,    href: "/demo/team/scheduling"   },
  { label: "Reports",      icon: FileText,        href: "/demo/team/report-queue" },
  { label: "Alerts",       icon: ShieldAlert,     href: "/demo/team/alerts"       },
];

// Hidden from nav (routes still active at their original paths):
// /demo/internal/client-health   — Client Health (accessible directly)
// /demo/team/task-engine         — Task Engine
// /demo/team/client-detail       — Client Detail
// /demo/team/content-review      — Content Review
// /demo/team/tasks               — My Tasks
// /demo/team/ai-review           — AI Review
// /demo/team/performance         — Performance
// /demo/team/activity-feed       — Activity Feed
