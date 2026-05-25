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
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

// Operator sees all client operational health, reports pending review,
// notifications, activity timeline, and team workload. No owner-only
// revenue strategy.
export const operatorPortalNavItems: SidebarItem[] = [
  { label: "Overview",         icon: LayoutDashboard, href: "/demo/operator/overview"          },
  { label: "AI Agents",        icon: Sparkles,        href: "/demo/operator/ai-agents"         },
  { label: "Client Health",    icon: Users,           href: "/demo/operator/client-health"     },
  { label: "Notifications",    icon: Bell,            href: "/demo/operator/alerts"            },
  { label: "Activity",         icon: Activity,        href: "/demo/operator/activity"          },
  { label: "KPIs",             icon: BarChart3,       href: "/demo/operator/kpis"              },
  { label: "Media Inventory",  icon: Images,          href: "/demo/operator/media-inventory"   },
  { label: "Weekly Reports",   icon: FileText,        href: "/demo/operator/weekly-reports"    },
  { label: "Monthly Reports",  icon: FileBarChart,    href: "/demo/operator/monthly-reports"   },
  { label: "Failed Posts",     icon: FileX,           href: "/demo/operator/failed-posts"      },
  { label: "Report Approvals", icon: FileCheck,       href: "/demo/operator/report-approvals"  },
];
