import {
  LayoutDashboard,
  CalendarDays,
  Globe,
  FileText,
  Bell,
  ClipboardList,
  Images,
  FileBarChart,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

// Client sees only their own dashboard, onboarding, calendar, media,
// reports, Google visibility, and updates. No owner/operator views.
export const clientPortalNavItems: SidebarItem[] = [
  { label: "Dashboard",         icon: LayoutDashboard, href: "/demo/client/dashboard"      },
  { label: "Content Calendar",  icon: CalendarDays,    href: "/demo/client/calendar"       },
  { label: "Google Visibility", icon: Globe,           href: "/demo/client/google"         },
  { label: "Weekly Report",     icon: FileText,        href: "/demo/client/weekly-report"  },
  { label: "Monthly Report",    icon: FileBarChart,    href: "/demo/client/monthly-report" },
  { label: "Reports",           icon: FileText,        href: "/demo/client/reports"        },
  { label: "Updates",           icon: Bell,            href: "/demo/client/updates"        },
  { label: "Onboarding",        icon: ClipboardList,   href: "/demo/client/onboarding"     },
  { label: "Media Library",     icon: Images,          href: "/demo/client/media"          },
];
