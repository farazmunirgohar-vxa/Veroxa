/**
 * Real Route Registry — current two-role source of truth for Veroxa's
 * active client and Team/Internal Admin portal routes.
 *
 * This file is used for:
 *   - documentation of every active real route in one place,
 *   - future tests / typed navigation helpers,
 *   - mapping a real route back to its closest public preview route when one
 *     exists.
 *
 * `App.tsx` intentionally still declares routes explicitly rather than
 * iterating over this registry — that keeps the router static, easy to read,
 * and easy to grep. This registry is the planning / consistency companion,
 * not the runtime router.
 *
 * Pure data. No Supabase, no network, no side effects.
 */

import type { VeroxaRole } from "./auth/authContract";

export interface RealRoute {
  path: string;
  role: VeroxaRole;
  label: string;
  demoPath: string;
  description: string;
}

export const clientRoutes: RealRoute[] = [
  {
    path: "/client/dashboard",
    role: "client",
    label: "Home",
    demoPath: "/demo/client/dashboard",
    description: "CP-V1 client home answering what Veroxa did, needs, and is doing now.",
  },
  {
    path: "/client/media",
    role: "client",
    label: "Media",
    demoPath: "/demo/client/dashboard",
    description: "CP-V1 media needs, manual intake structure, and one continuous media feed.",
  },
  {
    path: "/client/messages",
    role: "client",
    label: "Messages",
    demoPath: "/demo/client/dashboard",
    description: "CP-V1 inbox-style owner communication with Veroxa.",
  },
  {
    path: "/client/reports",
    role: "client",
    label: "Reports",
    demoPath: "/demo/client/dashboard",
    description: "CP-V1 Reports page containing Weekly Updates and Monthly Reports.",
  },
  {
    path: "/client/connections",
    role: "client",
    label: "Connections",
    demoPath: "/demo/client/dashboard",
    description: "CP-V1 status tracking for Meta Business Suite and Google Business Profile only.",
  },
  {
    path: "/client/profile",
    role: "client",
    label: "Profile",
    demoPath: "/demo/client/dashboard",
    description: "CP-V1 editable business-truth review page for Veroxa review.",
  },
];


export const hiddenClientCompatibilityRoutes: RealRoute[] = [
  { path: "/client/requests", role: "client", label: "Messages alias", demoPath: "/demo/client/dashboard", description: "Hidden guarded compatibility alias that renders CP-V1 Messages." },
  { path: "/client/updates", role: "client", label: "Reports alias", demoPath: "/demo/client/dashboard", description: "Hidden guarded compatibility alias that renders CP-V1 Reports." },
  { path: "/client/onboarding", role: "client", label: "Profile setup review alias", demoPath: "/demo/client/dashboard", description: "Hidden guarded compatibility alias that renders CP-V1 Profile setup review." },
];

export const teamRoutes: RealRoute[] = [
  {
    path: "/team/dashboard",
    role: "team",
    label: "Dashboard",
    demoPath: "/demo/client/dashboard",
    description: "Team/Internal Admin command center.",
  },
  {
    path: "/team/approval-queue",
    role: "team",
    label: "Approval Queue",
    demoPath: "/demo/client/dashboard",
    description: "Prepared actions awaiting Veroxa team review.",
  },
  {
    path: "/team/visibility-audit",
    role: "team",
    label: "Visibility Audit",
    demoPath: "/demo/client/dashboard",
    description: "Google Maps and local visibility readiness review.",
  },
  {
    path: "/team/first-client-readiness",
    role: "team",
    label: "First-Client Readiness",
    demoPath: "/demo/client/dashboard",
    description:
      "First-client readiness foundation for manual operations and review gates.",
  },
  {
    path: "/team/upload-inbox",
    role: "team",
    label: "Upload Inbox",
    demoPath: "/demo/client/dashboard",
    description: "Review uploaded media and client submissions.",
  },
  {
    path: "/team/work-queue",
    role: "team",
    label: "Work Queue",
    demoPath: "/demo/client/dashboard",
    description: "Team queue of content, media, and client tasks.",
  },
  {
    path: "/team/direction-queue",
    role: "team",
    label: "Direction Queue",
    demoPath: "/demo/client/dashboard",
    description: "Prepared directions pending internal review.",
  },
  {
    path: "/team/report-queue",
    role: "team",
    label: "Report Queue",
    demoPath: "/demo/client/dashboard",
    description:
      "Weekly and monthly reports pending Team/Internal Admin review.",
  },
  {
    path: "/team/audit-leads",
    role: "team",
    label: "Audit Leads",
    demoPath: "/demo/client/dashboard",
    description: "Free Audit leads and follow-up review queue.",
  },

  {
    path: "/team/onboarding",
    role: "team",
    label: "Onboarding",
    demoPath: "/demo/client/dashboard",
    description: "Team/Internal Admin routed review surface.",
  },

  {
    path: "/team/manual-execution",
    role: "team",
    label: "Manual Execution",
    demoPath: "/demo/client/dashboard",
    description: "Team/Internal Admin routed review surface.",
  },

  {
    path: "/team/first-client-ops",
    role: "team",
    label: "First-Client Ops",
    demoPath: "/demo/client/dashboard",
    description: "Team/Internal Admin routed review surface.",
  },
];

export const allRealRoutes: RealRoute[] = [...clientRoutes, ...hiddenClientCompatibilityRoutes, ...teamRoutes];

export const routesByRole: Readonly<Record<VeroxaRole, RealRoute[]>> =
  Object.freeze({
    client: clientRoutes,
    team: teamRoutes,
  });

export function getDemoPathForRealRoute(path: string): string | null {
  const match = allRealRoutes.find((r) => r.path === path);
  return match ? match.demoPath : null;
}
