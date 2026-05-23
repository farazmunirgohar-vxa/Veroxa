import { LineChart, DollarSign, Target, AlertTriangle, Settings } from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const ownerPortalNavItems: SidebarItem[] = [
  { label: "Dashboard",     icon: LineChart,     href: "/demo/owner/dashboard"     },
  { label: "Revenue",       icon: DollarSign,    href: "/demo/owner/revenue"       },
  { label: "Client Health", icon: Target,        href: "/demo/owner/client-health" },
  { label: "Alerts",        icon: AlertTriangle, href: "/demo/owner/alerts"        },
  { label: "Settings",      icon: Settings,      href: "/demo/owner/settings"      },
];
