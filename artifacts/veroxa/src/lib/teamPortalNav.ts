/**
 * Team Portal navigation — simplified cleanup pass.
 *
 * PRIMARY (surfaced in nav + login destination):
 *   team-dashboard      — login destination, primary home
 *   team-work-queue     — active content tasks across all clients
 *   team-media-review   — approve uploaded media
 *   team-drafts         — drafts pending review
 *   team-scheduling     — schedule approved posts
 *   team-report-queue   — reports awaiting operator approval
 *   team-alerts         — alert center
 *
 * SECONDARY (routed but hidden — not linked from nav):
 *   team-task-engine    — Kanban view; future deletion candidate
 *   team-tasks          — personal task list; future deletion candidate
 *   team-content-review — content review surface
 *   team-ai-review      — AI-suggested draft review
 *   team-performance    — team performance metrics
 *   team-activity-feed  — activity feed
 *   team-client-detail  — per-client detail view
 *
 * FUTURE DELETION CANDIDATES:
 *   team-task-engine    — Kanban view not linked, overlaps work-queue
 *   team-tasks          — personal task list not linked, overlaps dashboard
 */
import {
  LayoutDashboard,
  Image as ImageIcon,
  Layers,
  CalendarDays,
  FileText,
  ShieldAlert,
  ListChecks,
  PenLine,
  Inbox,
  Compass,
  Brain,
  PhoneCall,
  Search,
  FlaskConical,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const teamPortalNavItems: SidebarItem[] = [
  { label: "Dashboard",            icon: LayoutDashboard, href: "/demo/team/dashboard"              },
  { label: "Direction Queue",      icon: Compass,         href: "/demo/team/direction-queue"        },
  { label: "Work Queue",           icon: ListChecks,      href: "/demo/team/work-queue"             },
  { label: "Upload Inbox",         icon: Inbox,           href: "/demo/team/upload-inbox"           },
  { label: "Adaptive Intelligence", icon: Brain,          href: "/demo/team/adaptive-intelligence"  },
  { label: "Media Review",    icon: ImageIcon,       href: "/demo/team/media-review"   },
  { label: "Content Review",  icon: PenLine,         href: "/demo/team/content-review" },
  { label: "Drafts",          icon: Layers,          href: "/demo/team/drafts"         },
  { label: "Scheduling",      icon: CalendarDays,    href: "/demo/team/scheduling"     },
  { label: "Reports",         icon: FileText,        href: "/demo/team/report-queue"   },
  { label: "Alerts",          icon: ShieldAlert,     href: "/demo/team/alerts"         },
  { label: "Audit Leads",      icon: PhoneCall,       href: "/demo/team/audit-leads"      },
  { label: "Prospect Scanner", icon: Search,         href: "/demo/team/prospect-scanner" },
  { label: "Lead Source Lab",  icon: FlaskConical,   href: "/demo/team/lead-source-lab"  },
];

// Hidden from nav (routes still active at their original paths):
// /demo/internal/client-health   — Client Health (cross-role command center)
// /demo/team/task-engine         — Task Engine (Kanban) — future deletion candidate
// /demo/team/client-detail       — Client Detail
// /demo/team/content-review      — Content Review
// /demo/team/tasks               — My Tasks (personal list) — future deletion candidate
// /demo/team/ai-review           — AI Review
// /demo/team/performance         — Performance
// /demo/team/activity-feed       — Activity Feed
