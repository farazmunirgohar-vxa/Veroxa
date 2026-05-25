import {
  LayoutDashboard,
  CalendarDays,
  Globe,
  FileText,
  Bell,
  ClipboardList,
  Images,
  FileBarChart,
  Briefcase,
  Workflow,
  Bot,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

// Client portal navigation. Adds Workspace, Onboarding Center, Content
// Pipeline, and AI Agents alongside the existing client demo pages.
export const clientPortalNavItems: SidebarItem[] = [
  { label: "Overview",          icon: LayoutDashboard, href: "/demo/client/dashboard"         },
  { label: "Client Workspace",  icon: Briefcase,       href: "/demo/client/workspace"         },
  { label: "Onboarding Center", icon: ClipboardList,   href: "/demo/client/onboarding-center" },
  { label: "Content Pipeline",  icon: Workflow,        href: "/demo/client/content-pipeline"  },
  { label: "Content Calendar",  icon: CalendarDays,    href: "/demo/client/calendar"          },
  { label: "Media Inventory",   icon: Images,          href: "/demo/client/media"             },
  { label: "Google Visibility", icon: Globe,           href: "/demo/client/google"            },
  { label: "Weekly Report",     icon: FileText,        href: "/demo/client/weekly-report"     },
  { label: "Monthly Report",    icon: FileBarChart,    href: "/demo/client/monthly-report"    },
  { label: "Reports",           icon: FileText,        href: "/demo/client/reports"           },
  { label: "AI Agents",         icon: Bot,             href: "/demo/client/ai-agents"         },
  { label: "Notifications",     icon: Bell,            href: "/demo/client/updates"           },
];
