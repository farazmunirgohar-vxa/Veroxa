import { LayoutDashboard, AlertTriangle, Users, FileX, FileCheck } from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const operatorPortalNavItems: SidebarItem[] = [
  { label: "Overview",         icon: LayoutDashboard, href: "/demo/operator/overview"         },
  { label: "Alerts",           icon: AlertTriangle,   href: "/demo/operator/alerts"           },
  { label: "Client Health",    icon: Users,           href: "/demo/operator/client-health"    },
  { label: "Failed Posts",     icon: FileX,           href: "/demo/operator/failed-posts"     },
  { label: "Report Approvals", icon: FileCheck,       href: "/demo/operator/report-approvals" },
];
