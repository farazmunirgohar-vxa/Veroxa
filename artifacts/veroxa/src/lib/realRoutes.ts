/**
 * Real Route Registry — central source of truth for Veroxa's future
 * authenticated routes.
 *
 * Today these routes are wired in `App.tsx` to the various
 * `Real*Placeholder` components, which always render the
 * `RequireRole` "Protected Route Preview" card (no real auth).
 *
 * This file is used for:
 *   - documentation of every future real route in one place,
 *   - future tests / typed navigation helpers,
 *   - mapping a real route back to its companion demo route so we can
 *     always show "Preview at {demoPath}" without hard-coding it.
 *
 * `App.tsx` intentionally still declares routes explicitly rather than
 * iterating over this registry — that keeps the router static, easy to
 * read, and easy to grep. This registry is the planning / consistency
 * companion, not the runtime router.
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
  { path: "/client/dashboard",  role: "client", label: "Dashboard",  demoPath: "/demo/client/dashboard",  description: "Authenticated client home — performance snapshot, upcoming posts, content supply." },
  { path: "/client/onboarding", role: "client", label: "Onboarding", demoPath: "/demo/client/onboarding", description: "Restaurant brand, audience, dietary notes, best sellers — saved per client." },
  { path: "/client/media",      role: "client", label: "Media",      demoPath: "/demo/client/media",      description: "Upload + browse the client's media library. Private bucket. Reviewed by team." },
  { path: "/client/calendar",   role: "client", label: "Calendar",   demoPath: "/demo/client/calendar",   description: "Scheduled posts and content concepts across platforms." },
  { path: "/client/reports",    role: "client", label: "Reports",    demoPath: "/demo/client/reports",    description: "Weekly / monthly performance reports for the restaurant partner." },
];

export const teamRoutes: RealRoute[] = [
  { path: "/team/dashboard",        role: "team", label: "Dashboard",        demoPath: "/demo/team/dashboard",        description: "Team/Internal Admin command center." },
  { path: "/team/upload-inbox",     role: "team", label: "Upload Inbox",     demoPath: "/demo/team/media-review",   description: "Review uploaded media and client submissions." },
  { path: "/team/work-queue",       role: "team", label: "Work Queue",       demoPath: "/demo/team/work-queue",      description: "Team queue of content, media, and client tasks." },
  { path: "/team/direction-queue",  role: "team", label: "Direction Queue",  demoPath: "/demo/team/drafts",          description: "Prepared directions pending internal review." },
  { path: "/team/report-queue",     role: "team", label: "Report Queue",     demoPath: "/demo/team/report-queue",    description: "Weekly and monthly reports pending Team/Internal Admin review." },
  { path: "/team/approval-queue",   role: "team", label: "Approval Queue",   demoPath: "/demo/team/content-review",  description: "Prepared actions awaiting Team/Internal Admin approval." },
  { path: "/team/visibility-audit", role: "team", label: "Visibility Audit", demoPath: "/demo/team/performance",     description: "Google Maps and local visibility readiness review." },
];

export const allRealRoutes: RealRoute[] = [
  ...clientRoutes,
  ...teamRoutes,
];

export const routesByRole: Readonly<Record<VeroxaRole, RealRoute[]>> = Object.freeze({
  client: clientRoutes,
  team: teamRoutes,
});

export function getDemoPathForRealRoute(path: string): string | null {
  const match = allRealRoutes.find((r) => r.path === path);
  return match ? match.demoPath : null;
}
