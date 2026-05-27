/**
 * Client Portal navigation — simplified cleanup pass.
 *
 * PRIMARY (surfaced in nav — public, no login required):
 *   client-dashboard        — primary home
 *   client-media            — upload media / media library
 *   client-calendar         — content calendar
 *   client-reports          — weekly / monthly reports
 *   client-requests         — client requests
 *   client-account          — account settings
 *
 * SECONDARY (routed but hidden — not linked from nav):
 *   client-workspace        — workspace surface
 *   client-onboarding-center — onboarding center
 *   client-content-pipeline — content pipeline
 *   client-google           — Google Business Profile
 *   client-activity-log     — activity log
 *   client-updates          — updates / notifications
 *
 * FUTURE DELETION CANDIDATES:
 *   None identified — secondary pages are distinct features,
 *   not duplicates of primary pages.
 */
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  ClipboardList,
  Images,
  Briefcase,
  Sparkles,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const clientPortalNavItems: SidebarItem[] = [
  { label: "Dashboard",        icon: LayoutDashboard, href: "/demo/client/dashboard"        },
  { label: "Upload Media",     icon: Images,          href: "/demo/client/media"            },
  { label: "AI Draft Preview", icon: Sparkles,        href: "/demo/client/ai-draft-preview" },
  { label: "Calendar",         icon: CalendarDays,    href: "/demo/client/calendar"         },
  { label: "Reports",          icon: FileText,        href: "/demo/client/reports"          },
  { label: "Requests",         icon: ClipboardList,   href: "/demo/client/requests"         },
  { label: "Account",          icon: Briefcase,       href: "/demo/client/account"          },
];

// Hidden from nav (routes still active at their original paths):
// /demo/client/workspace         — Workspace
// /demo/client/onboarding-center — Onboarding
// /demo/client/content-pipeline  — Content
// /demo/client/google            — Google
// /demo/client/activity-log      — Activity
// /demo/client/updates           — Notifications
