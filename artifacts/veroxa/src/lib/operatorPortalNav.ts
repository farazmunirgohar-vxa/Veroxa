import {
  LayoutDashboard,
  Bell,
  Users,
  FileX,
  FileCheck,
  Sparkles,
  Activity,
  BarChart3,
  Images,
  FileText,
  FileBarChart,
  ClipboardList,
  UsersRound,
  GitBranch,
  ShieldAlert,
  Zap,
  Sunrise,
  ShieldX,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const operatorPortalNavItems: SidebarItem[] = [
  // Core command
  { label: "Operations Center",  icon: Zap,             href: "/demo/operator/operations-center" },
  { label: "Workflow Engine",    icon: GitBranch,       href: "/demo/operator/workflow-engine"   },
  { label: "Content Calendar",   icon: ClipboardList,   href: "/demo/operator/content-calendar"  },
  { label: "Overview",           icon: LayoutDashboard, href: "/demo/operator/overview"          },
  { label: "Daily Digest",       icon: Sunrise,         href: "/demo/operator/daily-digest"      },
  { label: "Priority Board",     icon: ClipboardList,   href: "/demo/operator/priority-board"    },
  { label: "Action Center",      icon: Zap,             href: "/demo/operator/action-center"     },
  // Client & health
  { label: "Client Health",      icon: Users,           href: "/demo/operator/client-health"     },
  { label: "Risk Center",        icon: ShieldX,         href: "/demo/operator/risk-center"       },
  { label: "Team Oversight",     icon: UsersRound,      href: "/demo/operator/team-oversight"    },
  // Content & reporting
  { label: "Content Operations", icon: GitBranch,       href: "/demo/operator/content-ops"       },
  { label: "Reporting Command",  icon: FileBarChart,    href: "/demo/operator/reporting-command" },
  { label: "Weekly Reports",     icon: FileText,        href: "/demo/operator/weekly-reports"    },
  { label: "Monthly Reports",    icon: FileBarChart,    href: "/demo/operator/monthly-reports"   },
  { label: "Report Approvals",   icon: FileCheck,       href: "/demo/operator/report-approvals"  },
  // Monitoring & tools
  { label: "AI Agents",          icon: Sparkles,        href: "/demo/operator/ai-agents"         },
  { label: "Media Inventory",    icon: Images,          href: "/demo/operator/media-inventory"   },
  { label: "KPIs",               icon: BarChart3,       href: "/demo/operator/kpis"              },
  { label: "Notifications",      icon: Bell,            href: "/demo/operator/alerts"            },
  { label: "Activity",           icon: Activity,        href: "/demo/operator/activity"          },
  { label: "Failed Posts",       icon: FileX,           href: "/demo/operator/failed-posts"      },
  { label: "Alert Center",       icon: ShieldAlert,     href: "/demo/operator/alerts"            },
];
