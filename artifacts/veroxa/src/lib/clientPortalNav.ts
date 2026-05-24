import { LayoutDashboard, CalendarDays, Globe, FileText, Bell, ClipboardList, Images } from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const clientPortalNavItems: SidebarItem[] = [
  { label: "Dashboard",         icon: LayoutDashboard, href: "/demo/client/dashboard"  },
  { label: "Content Calendar",  icon: CalendarDays,    href: "/demo/client/calendar"   },
  { label: "Google Visibility", icon: Globe,           href: "/demo/client/google"     },
  { label: "Reports",           icon: FileText,        href: "/demo/client/reports"    },
  { label: "Updates",           icon: Bell,            href: "/demo/client/updates"    },
  { label: "Onboarding",        icon: ClipboardList,   href: "/demo/client/onboarding" },
  { label: "Media Library",     icon: Images,          href: "/demo/client/media"      },
];
