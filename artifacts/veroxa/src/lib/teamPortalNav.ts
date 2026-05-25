import {
  LayoutDashboard,
  CheckSquare,
  Image as ImageIcon,
  Cpu,
  Layers,
  CalendarDays,
  ClipboardList,
  Eye,
  FileText,
  BarChart2,
  Activity,
  ShieldAlert,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const teamPortalNavItems: SidebarItem[] = [
  { label: "Dashboard",      icon: LayoutDashboard, href: "/demo/team/dashboard"       },
  { label: "Task Engine",    icon: ClipboardList,   href: "/demo/team/task-engine"     },
  { label: "Client Detail",  icon: ClipboardList,   href: "/demo/team/client-detail"   },
  { label: "Work Queue",     icon: ClipboardList,   href: "/demo/team/work-queue"      },
  { label: "Content Review", icon: Eye,             href: "/demo/team/content-review"  },
  { label: "Report Queue",   icon: FileText,        href: "/demo/team/report-queue"    },
  { label: "My Tasks",       icon: CheckSquare,     href: "/demo/team/tasks"           },
  { label: "Media Review",   icon: ImageIcon,       href: "/demo/team/media-review"    },
  { label: "AI Review",      icon: Cpu,             href: "/demo/team/ai-review"       },
  { label: "Drafts",         icon: Layers,          href: "/demo/team/drafts"          },
  { label: "Scheduling",     icon: CalendarDays,    href: "/demo/team/scheduling"      },
  { label: "Performance",    icon: BarChart2,       href: "/demo/team/performance"     },
  { label: "Activity Feed",  icon: Activity,        href: "/demo/team/activity-feed"   },
  { label: "Alerts",         icon: ShieldAlert,     href: "/demo/team/alerts"          },
];
