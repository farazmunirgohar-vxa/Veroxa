import {
  LayoutDashboard,
  CalendarDays,
  Globe,
  FileText,
  Bell,
  ClipboardList,
  Images,
  Briefcase,
  Workflow,
  Activity,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

// Client portal navigation — client-facing only. No internal roles, AI agents,
// or operational labels visible here.
export const clientPortalNavItems: SidebarItem[] = [
  { label: "Overview",     icon: LayoutDashboard, href: "/demo/client/dashboard"         },
  { label: "Account",      icon: Briefcase,       href: "/demo/client/account"           },
  { label: "Workspace",    icon: Briefcase,       href: "/demo/client/workspace"         },
  { label: "Requests",     icon: ClipboardList,   href: "/demo/client/requests"          },
  { label: "Onboarding",   icon: ClipboardList,   href: "/demo/client/onboarding-center" },
  { label: "Content",      icon: Workflow,        href: "/demo/client/content-pipeline"  },
  { label: "Calendar",     icon: CalendarDays,    href: "/demo/client/calendar"          },
  { label: "Media",        icon: Images,          href: "/demo/client/media"             },
  { label: "Google",       icon: Globe,           href: "/demo/client/google"            },
  { label: "Reports",      icon: FileText,        href: "/demo/client/reports"           },
  { label: "Activity",     icon: Activity,        href: "/demo/client/activity-log"      },
  { label: "Notifications",icon: Bell,            href: "/demo/client/updates"           },
];
