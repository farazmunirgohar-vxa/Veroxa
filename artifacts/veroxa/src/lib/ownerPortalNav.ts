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
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

// Owner sees the full command overview, all clients, KPIs, client health,
// AI agent summary, notifications, reports, and business-level visibility.
export const ownerPortalNavItems: SidebarItem[] = [
  { label: "Command Center", icon: LineChart,    href: "/demo/owner/dashboard"         },
  { label: "AI Agents",      icon: Sparkles,     href: "/demo/owner/ai-agents"         },
  { label: "Client Health",  icon: Target,       href: "/demo/owner/client-health"     },
  { label: "Notifications",  icon: Bell,         href: "/demo/owner/alerts"            },
  { label: "Activity",       icon: Activity,     href: "/demo/owner/activity"          },
  { label: "KPIs",           icon: BarChart3,    href: "/demo/owner/kpis"              },
  { label: "Media Inventory",icon: Images,       href: "/demo/owner/media-inventory"   },
  { label: "Weekly Reports", icon: FileText,     href: "/demo/owner/weekly-reports"    },
  { label: "Monthly Reports",icon: FileBarChart, href: "/demo/owner/monthly-reports"   },
  { label: "Revenue",        icon: DollarSign,   href: "/demo/owner/revenue"           },
  { label: "Settings",       icon: Settings,     href: "/demo/owner/settings"          },
];
