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
  MessagesSquare,
  Compass,
  PhoneCall,
  ClipboardCheck,
  ScanSearch,
  ShieldCheck,
  CopyCheck,
  BriefcaseBusiness,
  CheckSquare,
  ClipboardEdit,
  Activity,
  Bot,
  SlidersHorizontal,
  ClipboardList,
  ShieldAlert,
  KeyRound,
  PackageCheck,
  SearchCheck,
  Images,
  BotMessageSquare,
  Sparkles,
  ShieldQuestion,
} from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const teamPortalNavItems: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/team/dashboard" },
  { label: "Onboarding", icon: CheckSquare, href: "/team/onboarding" },
  { label: "Approvals", icon: ClipboardCheck, href: "/team/approval-queue" },
  { label: "Control Center", icon: SlidersHorizontal, href: "/team/control-center" },
  { label: "Reports From Activity", icon: ClipboardList, href: "/team/reports-from-activity" },
  { label: "Momo Readiness", icon: ShieldAlert, href: "/team/momo-live-readiness" },
  { label: "Momo Prep", icon: PackageCheck, href: "/team/momo-pilot-prep" },
  { label: "Momo Truth", icon: SearchCheck, href: "/team/momo-business-truth" },
  { label: "Momo Media", icon: Images, href: "/team/momo-media-content" },
  { label: "Momo Brand AI", icon: BotMessageSquare, href: "/team/momo-brand-ai-rules" },
  { label: "Momo AI Gen", icon: Sparkles, href: "/team/momo-ai-generation" },
  { label: "Momo AI Approval", icon: ShieldQuestion, href: "/team/momo-ai-approval" },
  { label: "Activation Gate", icon: KeyRound, href: "/team/momo-activation-gate" },
  { label: "Profile Corrections", icon: ClipboardEdit, href: "/team/profile-corrections" },
  { label: "Messages", icon: MessagesSquare, href: "/team/messages" },
  { label: "Activity Log", icon: Activity, href: "/team/activity-log" },
  { label: "AI Drafts", icon: Bot, href: "/team/ai-drafts" },
  { label: "Visibility Audit", icon: ScanSearch, href: "/team/visibility-audit" },
  { label: "First-Client Readiness", icon: ShieldCheck, href: "/team/first-client-readiness" },
  { label: "First-Client Ops", icon: BriefcaseBusiness, href: "/team/first-client-ops" },
  { label: "Upload Inbox", icon: Inbox, href: "/team/upload-inbox" },
  { label: "Work Queue", icon: ListChecks, href: "/team/work-queue" },
  { label: "Manual Execution", icon: CopyCheck, href: "/team/manual-execution" },
  { label: "Direction Queue", icon: Compass, href: "/team/direction-queue" },
  { label: "Reports", icon: FileText, href: "/team/report-queue" },
  { label: "Audit Leads", icon: PhoneCall, href: "/team/audit-leads" },
];
