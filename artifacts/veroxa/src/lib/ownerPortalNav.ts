import {
  LineChart,
  DollarSign,
  Target,
  Bell,
  Settings,
  Sparkles,
  Activity,
  BarChart3,
  Images,
  FileText,
  FileBarChart,
  Crosshair,
  GitBranch,
  Brain,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Rocket,
  Network,
  Sunrise,
  Heart,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const ownerPortalNavItems: SidebarItem[] = [
  // Executive command
  { label: "Owner OS",            icon: Crosshair,    href: "/demo/owner/owner-os"               },
  { label: "Client Health",       icon: Heart,        href: "/demo/internal/client-health"       },
  { label: "Integration Center",  icon: Network,      href: "/demo/internal/integrations"        },
  { label: "Command Center",      icon: LineChart,    href: "/demo/owner/dashboard"              },
  { label: "Executive Dashboard", icon: BarChart3,    href: "/demo/owner/executive-dashboard"    },
  { label: "Daily Briefing",      icon: Sunrise,      href: "/demo/owner/daily-briefing"         },
  { label: "Business Command",    icon: Crosshair,    href: "/demo/owner/command-center"         },

  // Intelligence
  { label: "BI Center",           icon: Brain,        href: "/demo/owner/bi-center"              },
  { label: "Client Analytics",    icon: Building2,    href: "/demo/owner/client-analytics"       },
  { label: "Reporting Analytics", icon: FileBarChart, href: "/demo/owner/reporting-analytics"    },
  { label: "Media Analytics",     icon: Images,       href: "/demo/owner/media-analytics"        },
  { label: "Ops Intelligence",    icon: Activity,     href: "/demo/owner/ops-intelligence"       },

  // AI
  { label: "AI Agent Library",    icon: Sparkles,     href: "/demo/owner/ai-agents-v2"           },
  { label: "Agent Workflow",      icon: GitBranch,    href: "/demo/owner/agent-workflow"         },
  { label: "AI Agents (summary)", icon: Sparkles,     href: "/demo/owner/ai-agents"              },

  // Architecture
  { label: "Permissions",         icon: ShieldCheck,  href: "/demo/owner/permissions"            },
  { label: "Automation Roadmap",  icon: Rocket,       href: "/demo/owner/automation-roadmap"     },
  { label: "System Map",          icon: Network,      href: "/demo/owner/system-map"             },

  // Operations
  { label: "Client Detail",       icon: Building2,    href: "/demo/owner/client-detail"          },
  { label: "Client Health",       icon: Heart,        href: "/demo/owner/client-health"          },
  { label: "Notifications",       icon: Bell,         href: "/demo/owner/alerts"                 },
  { label: "Activity",            icon: Activity,     href: "/demo/owner/activity"               },
  { label: "KPIs",                icon: Target,       href: "/demo/owner/kpis"                   },
  { label: "Media Inventory",     icon: Images,       href: "/demo/owner/media-inventory"        },
  { label: "Weekly Reports",      icon: FileText,     href: "/demo/owner/weekly-reports"         },
  { label: "Monthly Reports",     icon: FileBarChart, href: "/demo/owner/monthly-reports"        },
  { label: "Risks",               icon: AlertTriangle,href: "/demo/owner/command-center"         },
  { label: "Revenue",             icon: DollarSign,   href: "/demo/owner/revenue"                },
  { label: "Settings",            icon: Settings,     href: "/demo/owner/settings"               },
];
