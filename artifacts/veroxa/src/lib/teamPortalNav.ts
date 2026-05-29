/**
 * Team Portal navigation — real-review and demo-alias paths.
 *
 * Hrefs point to /team/* (real Veroxa OS review routes). The same page
 * components are also served at /demo/team/* as internal demo aliases
 * — the nav items here are shared by both so clicking them leads to the
 * canonical /team/* path in all cases.
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
  { label: "Dashboard",            icon: LayoutDashboard, href: "/team/dashboard"              },
  { label: "Direction Queue",      icon: Compass,         href: "/team/direction-queue"        },
  { label: "Work Queue",           icon: ListChecks,      href: "/team/work-queue"             },
  { label: "Upload Inbox",         icon: Inbox,           href: "/team/upload-inbox"           },
  { label: "Adaptive Intelligence", icon: Brain,          href: "/team/adaptive-intelligence"  },
  { label: "Media Review",    icon: ImageIcon,       href: "/team/media-review"   },
  { label: "Content Review",  icon: PenLine,         href: "/team/content-review" },
  { label: "Drafts",          icon: Layers,          href: "/team/drafts"         },
  { label: "Scheduling",      icon: CalendarDays,    href: "/team/scheduling"     },
  { label: "Reports",         icon: FileText,        href: "/team/report-queue"   },
  { label: "Alerts",          icon: ShieldAlert,     href: "/team/alerts"         },
  { label: "Audit Leads",      icon: PhoneCall,       href: "/team/audit-leads"      },
  { label: "Prospect Scanner", icon: Search,         href: "/team/prospect-scanner" },
  { label: "Lead Source Lab",  icon: FlaskConical,   href: "/team/lead-source-lab"  },
];

// Hidden from nav (routes still active at their canonical paths):
// /team/client-detail       — Client Detail
// /team/content-review      — Content Review
// /team/tasks               — My Tasks (personal list) — future deletion candidate
// /team/ai-review           — AI Review
// /team/performance         — Performance
// /team/activity-feed       — Activity Feed
// /demo/internal/client-health — Client Health (cross-role command center)
