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
  { path: "/client/reports",    role: "client", label: "Reports",    demoPath: "/demo/client/reports",    description: "Weekly / monthly performance reports for the restaurant owner." },
];

export const teamRoutes: RealRoute[] = [
  { path: "/team/tasks",        role: "team", label: "Tasks",        demoPath: "/demo/team/tasks",        description: "Team queue of content, media, and client tasks." },
  { path: "/team/media-review", role: "team", label: "Media Review", demoPath: "/demo/team/media-review", description: "Review and approve uploaded media, match against capture plan." },
  { path: "/team/drafts",       role: "team", label: "Drafts",       demoPath: "/demo/team/drafts",       description: "Caption / post drafts pending review." },
  { path: "/team/scheduling",   role: "team", label: "Scheduling",   demoPath: "/demo/team/scheduling",   description: "Schedule approved posts to social calendars." },
];

export const operatorRoutes: RealRoute[] = [
  { path: "/operator/overview",         role: "operator", label: "Overview",         demoPath: "/demo/operator/overview",         description: "Cross-client operations view — workload, risk, throughput." },
  { path: "/operator/alerts",           role: "operator", label: "Alerts",           demoPath: "/demo/operator/alerts",           description: "Failed posts, blocked uploads, escalations." },
  { path: "/operator/report-approvals", role: "operator", label: "Report Approvals", demoPath: "/demo/operator/report-approvals", description: "Final approval gate before client-facing reports are sent." },
];

export const ownerRoutes: RealRoute[] = [
  { path: "/owner/dashboard",     role: "owner", label: "Dashboard",     demoPath: "/demo/owner/dashboard",     description: "Owner-only KPIs: revenue, client health, growth." },
  { path: "/owner/revenue",       role: "owner", label: "Revenue",       demoPath: "/demo/owner/revenue",       description: "MRR / ARR, plan mix, churn forecast." },
  { path: "/owner/client-health", role: "owner", label: "Client Health", demoPath: "/demo/owner/client-health", description: "Owner-level client health & risk surface." },
];

export const allRealRoutes: RealRoute[] = [
  ...clientRoutes,
  ...teamRoutes,
  ...operatorRoutes,
  ...ownerRoutes,
];

export const routesByRole: Readonly<Record<VeroxaRole, RealRoute[]>> = Object.freeze({
  client:   clientRoutes,
  team:     teamRoutes,
  operator: operatorRoutes,
  owner:    ownerRoutes,
});

export function getDemoPathForRealRoute(path: string): string | null {
  const match = allRealRoutes.find((r) => r.path === path);
  return match ? match.demoPath : null;
}
