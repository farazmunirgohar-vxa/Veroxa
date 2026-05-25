/**
 * Operator Portal navigation — simplified cleanup pass.
 *
 * Visible: Command Center · Client Health · Alerts · Reports Approval ·
 *          Media Library · Team Oversight · System Status
 *
 * Hidden (routes still exist): Operator OS label (merged into Command Center),
 *   Architecture, Demo Controls, Integrations, Workflow Engine, Operations Center,
 *   Daily Digest, Priority Board, Action Center, Content Operations,
 *   Reporting Command, AI Agents, KPIs, Activity, Failed Posts, Risk Center,
 *   Weekly/Monthly Reports, Media Inventory
 */
import {
  HeartPulse,
  LayoutDashboard,
  ShieldAlert,
  FileCheck,
  Images,
  UsersRound,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const operatorPortalNavItems: SidebarItem[] = [
  { label: "Command Center",   icon: LayoutDashboard, href: "/demo/operator/operator-os"      },
  { label: "Client Health",    icon: HeartPulse,      href: "/demo/operator/client-health"    },
  { label: "Alerts",           icon: ShieldAlert,     href: "/demo/operator/alerts"           },
  { label: "Report Approvals", icon: FileCheck,       href: "/demo/operator/report-approvals" },
  { label: "Media Library",    icon: Images,          href: "/demo/operator/media-library"    },
  { label: "Team Oversight",   icon: UsersRound,      href: "/demo/operator/team-oversight"   },
];

// Hidden from nav (routes still active at their original paths):
// /demo/operator/media-library       — Media Library (kept above, now top-level)
// /demo/internal/architecture        — Architecture
// /demo/internal/demo-controls       — Demo Controls
// /demo/internal/integrations        — Integrations
// /demo/operator/workflow-engine     — Workflow Engine
// /demo/operator/operations-center   — Operations Center
// /demo/operator/content-calendar    — Content Calendar
// /demo/operator/client-detail       — Client Detail
// /demo/operator/overview            — Overview
// /demo/operator/daily-digest        — Daily Digest
// /demo/operator/priority-board      — Priority Board
// /demo/operator/action-center       — Action Center
// /demo/operator/client-health       — (old) Client Health
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
