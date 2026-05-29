/**
 * Team Portal navigation — real Veroxa OS review routes (/team/*).
 *
 * Only the active, focused Team Portal surfaces are linked here. Team routes
 * require login (role = "team"); /team/dashboard is the login destination.
 */
import {
  LayoutDashboard,
  ListChecks,
  FileText,
  Inbox,
  Compass,
  PhoneCall,
  ClipboardCheck,
  SearchCheck,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const teamPortalNavItems: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/team/dashboard" },
  { label: "Approvals", icon: ClipboardCheck, href: "/team/approval-queue" },
  { label: "Visibility Audit", icon: SearchCheck, href: "/team/visibility-audit" },
  { label: "Upload Inbox", icon: Inbox, href: "/team/upload-inbox" },
  { label: "Work Queue", icon: ListChecks, href: "/team/work-queue" },
  { label: "Direction Queue", icon: Compass, href: "/team/direction-queue" },
  { label: "Reports", icon: FileText, href: "/team/report-queue" },
  { label: "Audit Leads", icon: PhoneCall, href: "/team/audit-leads" },
];
