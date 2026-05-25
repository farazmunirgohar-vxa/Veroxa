/**
 * Owner Portal navigation — simplified cleanup pass.
 *
 * PRIMARY (surfaced in nav + login destination):
 *   owner-executive-dashboard  — login destination, primary home
 *   owner-revenue              — MRR / ARR surface
 *   owner-client-health        — client health overview
 *   owner-alerts               — critical alerts
 *   owner-ai-agents-v2         — AI / System Health (primary AI page)
 *   owner-os                   — Growth sub-page
 *   owner-settings             — settings
 *
 * SECONDARY (routed but hidden — not linked from nav):
 *   owner-dashboard            — overlaps executive-dashboard; future deletion candidate
 *   owner-command-center       — risk-focused view; future deletion candidate
 *   owner-ai-agents            — wraps AIAgentsView; shadowed by v2; future deletion candidate
 *   owner-bi-center            — BI analytics
 *   owner-client-analytics     — client analytics deep-dive
 *   owner-reporting-analytics  — reporting analytics
 *   owner-media-analytics      — media analytics
 *   owner-ops-intelligence     — ops intelligence
 *   owner-agent-workflow       — agent workflow detail
 *   owner-automation-roadmap   — automation roadmap
 *   owner-system-map           — system map
 *   owner-daily-briefing       — daily briefing
 *   owner-permissions          — permissions
 *   owner-client-detail        — per-client detail view
 *   owner-activity             — activity feed
 *   owner-kpis                 — KPI surface
 *   owner-media-inventory      — media inventory
 *   owner-weekly-reports       — weekly reports archive
 *   owner-monthly-reports      — monthly reports archive
 *
 * FUTURE DELETION CANDIDATES (secondary pages that shadow a primary):
 *   owner-dashboard            — shadowed by owner-executive-dashboard
 *   owner-command-center       — no active nav entry, risk view not surfaced
 *   owner-ai-agents            — shadowed by owner-ai-agents-v2
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
// /demo/internal/integrations        — Integration Center
// /demo/owner/dashboard              — Legacy Dashboard (future deletion candidate)
// /demo/owner/daily-briefing         — Daily Briefing
// /demo/owner/command-center         — Business Command (future deletion candidate)
// /demo/owner/bi-center              — BI Center
// /demo/owner/client-analytics       — Client Analytics
// /demo/owner/reporting-analytics    — Reporting Analytics
// /demo/owner/media-analytics        — Media Analytics
// /demo/owner/ops-intelligence       — Ops Intelligence
// /demo/owner/agent-workflow         — Agent Workflow
// /demo/owner/ai-agents              — AI Agents summary (future deletion candidate, shadowed by v2)
// /demo/owner/permissions            — Permissions
// /demo/owner/automation-roadmap     — Automation Roadmap
// /demo/owner/system-map             — System Map
// /demo/owner/client-detail          — Client Detail
// /demo/owner/activity               — Activity
// /demo/owner/kpis                   — KPIs
// /demo/owner/media-inventory        — Media Inventory
// /demo/owner/weekly-reports         — Weekly Reports
// /demo/owner/monthly-reports        — Monthly Reports
