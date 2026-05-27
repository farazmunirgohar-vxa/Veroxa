/**
 * Operator Portal navigation.
 *
 * All items with real hrefs are wired to fully built page components.
 * Items with type:'section' are visual section dividers — no link, no icon.
 *
 * VISIBLE NAV COUNT: 24  (must match operatorDemoRoutes visible_nav entries
 * in demoRoutes.ts)
 */
import {
  // Core
  HeartPulse,
  LayoutDashboard,
  ShieldAlert,
  FileCheck,
  Images,
  UsersRound,
  ShieldCheck,
  // Intelligence
  Zap,
  LayoutList,
  ShieldOff,
  Sunrise,
  Brain,
  // Operations
  CalendarDays,
  Layers,
  GitBranch,
  Monitor,
  AlertOctagon,
  // Reporting
  FileBarChart,
  FileText,
  BarChart2,
  TrendingUp,
  // Agents & Data
  Bot,
  Activity,
  Film,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const operatorPortalNavItems: SidebarItem[] = [
  // ── Core ──────────────────────────────────────────────────────────────────
  { label: "Command Center",   icon: LayoutDashboard, href: "/demo/operator/operator-os"      },
  { label: "Client Health",    icon: HeartPulse,      href: "/demo/operator/client-health"    },
  { label: "Alerts",           icon: ShieldAlert,     href: "/demo/operator/alerts"           },
  { label: "Report Approvals", icon: FileCheck,       href: "/demo/operator/report-approvals" },
  { label: "Media Library",    icon: Images,          href: "/demo/operator/media-library"    },
  { label: "Team Oversight",   icon: UsersRound,      href: "/demo/operator/team-oversight"   },
  { label: "System Status",    icon: ShieldCheck,     href: "/demo/operator/system-status"    },

  // ── Intelligence ──────────────────────────────────────────────────────────
  { label: "Intelligence", type: "section" },
  { label: "Action Center",    icon: Zap,          href: "/demo/operator/action-center"      },
  { label: "Priority Board",   icon: LayoutList,   href: "/demo/operator/priority-board"     },
  { label: "Risk Center",      icon: ShieldOff,    href: "/demo/operator/risk-center"        },
  { label: "Daily Digest",     icon: Sunrise,      href: "/demo/operator/daily-digest"       },
  { label: "Evidence Engine",  icon: Brain,        href: "/demo/operator/evidence-engine"    },

  // ── Operations ────────────────────────────────────────────────────────────
  { label: "Operations", type: "section" },
  { label: "Content Calendar", icon: CalendarDays, href: "/demo/operator/content-calendar"  },
  { label: "Content Ops",      icon: Layers,       href: "/demo/operator/content-ops"       },
  { label: "Workflow Engine",  icon: GitBranch,    href: "/demo/operator/workflow-engine"   },
  { label: "Ops Center",       icon: Monitor,      href: "/demo/operator/operations-center" },
  { label: "Failed Posts",     icon: AlertOctagon, href: "/demo/operator/failed-posts"      },

  // ── Reporting ─────────────────────────────────────────────────────────────
  { label: "Reporting", type: "section" },
  { label: "Report Command",   icon: FileBarChart, href: "/demo/operator/reporting-command" },
  { label: "Weekly Reports",   icon: FileText,     href: "/demo/operator/weekly-reports"    },
  { label: "Monthly Reports",  icon: BarChart2,    href: "/demo/operator/monthly-reports"   },
  { label: "KPIs",             icon: TrendingUp,   href: "/demo/operator/kpis"              },

  // ── Agents & Data ─────────────────────────────────────────────────────────
  { label: "Agents & Data", type: "section" },
  { label: "AI Agents",        icon: Bot,      href: "/demo/operator/ai-agents"       },
  { label: "Activity",         icon: Activity, href: "/demo/operator/activity"        },
  { label: "Media Inventory",  icon: Film,     href: "/demo/operator/media-inventory" },
];
