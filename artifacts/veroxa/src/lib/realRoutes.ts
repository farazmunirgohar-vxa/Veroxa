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
    label: "Dashboard",
    demoPath: "/demo/client/dashboard",
    description: "Client home — simple progress and next-step visibility.",
  },
  {
    path: "/client/media",
    role: "client",
    label: "Media",
    demoPath: "/demo/client/dashboard",
    description:
      "Upload and browse the client's media library for Veroxa team review.",
  },
  {
    path: "/client/updates",
    role: "client",
    label: "Updates",
    demoPath: "/demo/client/dashboard",
    description: "Client-safe updates on prepared work and progress.",
  },
  {
    path: "/client/requests",
    role: "client",
    label: "Requests",
    demoPath: "/demo/client/dashboard",
    description: "Simple requests from Veroxa that need client input.",
  },
  {
    path: "/client/reports",
    role: "client",
    label: "Reports",
    demoPath: "/demo/client/dashboard",
    description: "Weekly and monthly reports for the restaurant partner.",
  },
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
];

export const allRealRoutes: RealRoute[] = [...clientRoutes, ...teamRoutes];

export const routesByRole: Readonly<Record<VeroxaRole, RealRoute[]>> =
  Object.freeze({
    client: clientRoutes,
    team: teamRoutes,
  });

export function getDemoPathForRealRoute(path: string): string | null {
  const match = allRealRoutes.find((r) => r.path === path);
  return match ? match.demoPath : null;
}
