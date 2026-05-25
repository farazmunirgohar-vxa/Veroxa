/**
 * Owner Portal navigation — simplified cleanup pass.
 *
 * Visible: Executive Dashboard · Revenue · Client Health · Critical Alerts ·
 *          AI / System Health · Growth · Settings
 *
 * Hidden (routes still exist): Owner OS, Integration Center, Command Center,
 *   Daily Briefing, Business Command, BI Center, Client Analytics,
 *   Reporting Analytics, Media Analytics, Ops Intelligence, AI Agent Library,
 *   Agent Workflow, AI Agents (summary), Permissions, Automation Roadmap,
 *   System Map, Client Detail, Notifications, Activity, KPIs,
 *   Media Inventory, Weekly Reports, Monthly Reports, Risks
 */
import {
  BarChart3,
  DollarSign,
  HeartPulse,
  Bell,
  Cpu,
  TrendingUp,
  Settings,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const ownerPortalNavItems: SidebarItem[] = [
  { label: "Executive Dashboard", icon: BarChart3,   href: "/demo/owner/executive-dashboard" },
  { label: "Revenue",             icon: DollarSign,  href: "/demo/owner/revenue"             },
  { label: "Client Health",       icon: HeartPulse,  href: "/demo/owner/client-health"       },
  { label: "Critical Alerts",     icon: Bell,        href: "/demo/owner/alerts"              },
  { label: "AI / System Health",  icon: Cpu,         href: "/demo/owner/ai-agents-v2"        },
  { label: "Growth",              icon: TrendingUp,  href: "/demo/owner/owner-os"            },
  { label: "Settings",            icon: Settings,    href: "/demo/owner/settings"            },
];

// Hidden from nav (routes still active at their original paths):
// /demo/owner/owner-os               — Owner OS (surfaced as "Growth")
// /demo/internal/integrations        — Integration Center
// /demo/owner/dashboard              — Command Center
// /demo/owner/executive-dashboard    — kept as primary
// /demo/owner/daily-briefing         — Daily Briefing
// /demo/owner/command-center         — Business Command
// /demo/owner/bi-center              — BI Center
// /demo/owner/client-analytics       — Client Analytics
// /demo/owner/reporting-analytics    — Reporting Analytics
// /demo/owner/media-analytics        — Media Analytics
// /demo/owner/ops-intelligence       — Ops Intelligence
// /demo/owner/ai-agents-v2          — kept as "AI / System Health"
// /demo/owner/agent-workflow         — Agent Workflow
// /demo/owner/ai-agents              — AI Agents (summary)
// /demo/owner/permissions            — Permissions
// /demo/owner/automation-roadmap     — Automation Roadmap
// /demo/owner/system-map             — System Map
// /demo/owner/client-detail          — Client Detail
// /demo/owner/client-health          — Client Health (old)
// /demo/owner/alerts                 — kept as "Critical Alerts"
// /demo/owner/activity               — Activity
// /demo/owner/kpis                   — KPIs
// /demo/owner/media-inventory        — Media Inventory
// /demo/owner/weekly-reports         — Weekly Reports
// /demo/owner/monthly-reports        — Monthly Reports
// /demo/owner/revenue                — kept
// /demo/owner/settings               — kept
