/**
 * Operator Portal navigation — simplified cleanup pass.
 *
 * PRIMARY (surfaced in nav + login destination):
 *   operator-os             — login destination, primary command center
 *   operator-client-health  — per-client risk surface
 *   operator-alerts         — failed posts, escalations
 *   operator-report-approvals — final approval gate for reports
 *   operator-media-library  — all client media
 *   operator-team-oversight — team workload and performance
 *
 * SECONDARY (routed but hidden — not linked from nav):
 *   operator-overview          — legacy overview; future deletion candidate
 *   operator-command-board     — not in nav; future deletion candidate
 *   operator-workflow-engine   — workflow engine
 *   operator-operations-center — operations center
 *   operator-content-calendar  — content calendar
 *   operator-daily-digest      — daily digest
 *   operator-priority-board    — priority board
 *   operator-action-center     — action center
 *   operator-risk-center       — risk center
 *   operator-content-ops       — content operations
 *   operator-reporting-command — reporting command
 *   operator-ai-agents         — AI agents
 *   operator-kpis              — KPIs
 *   operator-activity          — activity feed
 *   operator-failed-posts      — failed posts triage
 *   operator-client-detail     — per-client detail view
 *   operator-weekly-reports    — weekly reports archive
 *   operator-monthly-reports   — monthly reports archive
 *   operator-media-inventory   — media inventory
 *
 * FUTURE DELETION CANDIDATES:
 *   operator-overview       — replaced by operator-os as primary
 *   operator-command-board  — not linked anywhere, no clear replacement
 */
import {
  HeartPulse,
  LayoutDashboard,
  ShieldAlert,
  FileCheck,
  Images,
  UsersRound,
  Kanban,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const operatorPortalNavItems: SidebarItem[] = [
  { label: "Command Center",   icon: LayoutDashboard, href: "/demo/operator/operator-os"      },
  { label: "Client Health",    icon: HeartPulse,      href: "/demo/operator/client-health"    },
  { label: "Alerts",           icon: ShieldAlert,     href: "/demo/operator/alerts"           },
  { label: "Report Approvals", icon: FileCheck,       href: "/demo/operator/report-approvals" },
  { label: "Media Library",    icon: Images,          href: "/demo/operator/media-library"    },
  { label: "Team Oversight",   icon: UsersRound,      href: "/demo/operator/team-oversight"   },
  { label: "Priority Board",   icon: Kanban,          href: "/demo/operator/priority-board"   },
];

// Hidden from nav (routes still active at their original paths):
// /demo/internal/architecture        — Architecture
// /demo/internal/demo-controls       — Demo Controls
// /demo/internal/integrations        — Integrations
// /demo/operator/workflow-engine     — Workflow Engine
// /demo/operator/operations-center   — Operations Center
// /demo/operator/content-calendar    — Content Calendar
// /demo/operator/client-detail       — Client Detail
// /demo/operator/overview            — Overview (legacy) — future deletion candidate
// /demo/operator/command-board       — Command Board — future deletion candidate
// /demo/operator/daily-digest        — Daily Digest
// /demo/operator/priority-board      — Priority Board
// /demo/operator/action-center       — Action Center
// /demo/operator/risk-center         — Risk Center
// /demo/operator/content-ops         — Content Operations
// /demo/operator/reporting-command   — Reporting Command
// /demo/operator/weekly-reports      — Weekly Reports
// /demo/operator/monthly-reports     — Monthly Reports
// /demo/operator/ai-agents           — AI Agents
// /demo/operator/media-inventory     — Media Inventory
// /demo/operator/kpis                — KPIs
// /demo/operator/activity            — Activity
// /demo/operator/failed-posts        — Failed Posts
