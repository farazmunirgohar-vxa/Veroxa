/**
 * Client Portal navigation — simplified cleanup pass.
 *
 * Visible: Dashboard · Upload Media · Calendar · Reports · Requests · Account
 * Hidden (routes still exist): Workspace, Content Pipeline, Google, Activity, Notifications, Onboarding
 */
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  ClipboardList,
  Images,
  Briefcase,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const clientPortalNavItems: SidebarItem[] = [
  { label: "Dashboard",    icon: LayoutDashboard, href: "/demo/client/dashboard"   },
  { label: "Upload Media", icon: Images,          href: "/demo/client/media"        },
  { label: "Calendar",     icon: CalendarDays,    href: "/demo/client/calendar"    },
  { label: "Reports",      icon: FileText,        href: "/demo/client/reports"     },
  { label: "Requests",     icon: ClipboardList,   href: "/demo/client/requests"    },
  { label: "Account",      icon: Briefcase,       href: "/demo/client/account"     },
];

// Hidden from nav (routes still active at their original paths):
// /demo/client/workspace        — Workspace
// /demo/client/onboarding-center — Onboarding
// /demo/client/content-pipeline  — Content
// /demo/client/google            — Google
// /demo/client/activity-log      — Activity
// /demo/client/updates           — Notifications
