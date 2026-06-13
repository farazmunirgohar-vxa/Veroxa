/**
 * Client Portal navigation — CP-V1 owner-facing real client routes (/client/*).
 * Hidden compatibility routes may remain routed, but primary navigation is locked
 * to Home, Media, Messages, Reports, Connections, and Profile.
 */
import { FileText, Home, Images, Link2, MessageSquare, UserRound } from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const clientPortalNavItems: SidebarItem[] = [
  { label: "Home", icon: Home, href: "/client/dashboard" },
  { label: "Media", icon: Images, href: "/client/media" },
  { label: "Messages", icon: MessageSquare, href: "/client/messages" },
  { label: "Reports", icon: FileText, href: "/client/reports" },
  { label: "Connections", icon: Link2, href: "/client/connections" },
  { label: "Profile", icon: UserRound, href: "/client/profile" },
];
