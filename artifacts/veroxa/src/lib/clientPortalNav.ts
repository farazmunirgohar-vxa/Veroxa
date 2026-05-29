/**
 * Client Portal navigation — real-review and demo-alias paths.
 *
 * Hrefs point to /client/* (real Veroxa OS review routes). The same page
 * components are also served at /demo/client/* as public demo preview aliases
 * — the nav items here are shared by both so clicking them leads to the
 * canonical /client/* path in all cases.
 *
 * PRIMARY (surfaced in nav):
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
 */
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  ClipboardList,
  Images,
  Briefcase,
  Sparkles,
  Compass,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const clientPortalNavItems: SidebarItem[] = [
  { label: "Dashboard",        icon: LayoutDashboard, href: "/client/dashboard"        },
  { label: "Direction Center", icon: Compass,         href: "/client/direction"        },
  { label: "Upload Media",     icon: Images,          href: "/client/media"            },
  { label: "AI Draft Preview", icon: Sparkles,        href: "/client/ai-draft-preview" },
  { label: "Calendar",         icon: CalendarDays,    href: "/client/calendar"         },
  { label: "Reports",          icon: FileText,        href: "/client/reports"          },
  { label: "Requests",         icon: ClipboardList,   href: "/client/requests"         },
  { label: "Account",          icon: Briefcase,       href: "/client/account"          },
];

// Hidden from nav (routes still active at their canonical paths):
// /client/workspace         — Workspace
// /client/onboarding-center — Onboarding
// /client/content-pipeline  — Content
// /client/google            — Google
// /client/activity-log      — Activity
// /client/updates           — Notifications
