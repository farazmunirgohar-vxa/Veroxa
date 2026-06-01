/**
 * Client Portal navigation — real client routes (/client/*).
 *
 * Only the active, focused Client Portal surfaces are linked here. The
 * /client/dashboard component is also served at /demo/client/dashboard as a
 * public Client Demo alias; the nav items here always point to the canonical
 * /client/* paths.
 */
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Images,
  Bell,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const clientPortalNavItems: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/client/dashboard" },
  { label: "Media", icon: Images, href: "/client/media" },
  { label: "Updates", icon: Bell, href: "/client/updates" },
  { label: "Requests", icon: ClipboardList, href: "/client/requests" },
  { label: "Reports", icon: FileText, href: "/client/reports" },
];
