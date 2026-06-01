/**
 * Demo/Portal Route Registry — current two-role route source of truth for
 * Veroxa's public client preview and active portal routes.
 *
 * Used for:
 *   - documenting which current routes are intentionally surfaced,
 *   - future tests / navigation helpers,
 *   - keeping `App.tsx` honest — every active `/demo/client/*`, `/client/*`,
 *     and `/team/*` route in `App.tsx` should also appear here.
 *
 * Pure data. No Supabase, no network, no side effects.
 *
 * VISIBILITY RULES:
 *   visible_nav entries must match the active Client and Team portal nav files.
 *
 * VALIDATION:
 *   Run `pnpm --filter @workspace/scripts run check-demo-routes`
 *   to diff this registry against App.tsx route strings.
 */

export type DemoPortal = "client" | "team";

/**
 * Visibility intent for a current route.
 *  - `visible_nav`        — actively surfaced in the portal sidebar today.
 *  - `public_preview`     — public demo preview route intentionally exposed
 *                           outside the authenticated portal flow.
 *  - `hidden_from_nav`    — wired and reachable by URL, but intentionally not
 *                           linked from the sidebar.
 */
export type DemoVisibility =
  | "visible_nav"
  | "public_preview"
  | "hidden_from_nav";

export interface DemoRoute {
  path: string;
  portal: DemoPortal;
  label: string;
  purpose: string;
  visibility: DemoVisibility;
}

// ── Public client preview ───────────────────────────────────────────────────
// Demo Preview exposes the full client portal surface (dashboard, media,
// updates, requests, reports) with sample data only — no login required.

export const clientPreviewRoutes: DemoRoute[] = [
  {
    path: "/demo/client/dashboard",
    portal: "client",
    label: "Client Demo Preview",
    visibility: "public_preview",
    purpose: "Public client preview surfaced from the demo hub.",
  },
  {
    path: "/demo/client/media",
    portal: "client",
    label: "Client Demo — Media",
    visibility: "public_preview",
    purpose: "Public client media preview (sample data only).",
  },
  {
    path: "/demo/client/updates",
    portal: "client",
    label: "Client Demo — Updates",
    visibility: "public_preview",
    purpose: "Public client updates preview (sample data only).",
  },
  {
    path: "/demo/client/requests",
    portal: "client",
    label: "Client Demo — Requests",
    visibility: "public_preview",
    purpose: "Public client requests preview (sample data only).",
  },
  {
    path: "/demo/client/reports",
    portal: "client",
    label: "Client Demo — Reports",
    visibility: "public_preview",
    purpose: "Public client reports preview (sample data only).",
  },
];

// ── Client Portal ────────────────────────────────────────────────────────────
// visible_nav count: 5 (must match clientPortalNav.ts exactly)

export const clientDemoRoutes: DemoRoute[] = [
  {
    path: "/client/dashboard",
    portal: "client",
    label: "Dashboard",
    visibility: "visible_nav",
    purpose: "Client home — simple progress and next-step visibility.",
  },
  {
    path: "/client/media",
    portal: "client",
    label: "Media",
    visibility: "visible_nav",
    purpose: "Client-safe media upload and media library surface.",
  },
  {
    path: "/client/updates",
    portal: "client",
    label: "Updates",
    visibility: "visible_nav",
    purpose: "Client-safe updates on prepared work and progress.",
  },
  {
    path: "/client/requests",
    portal: "client",
    label: "Requests",
    visibility: "visible_nav",
    purpose: "Simple requests from Veroxa that need client input.",
  },
  {
    path: "/client/reports",
    portal: "client",
    label: "Reports",
    visibility: "visible_nav",
    purpose: "Weekly and monthly reports for the restaurant partner.",
  },
];

// ── Team / Internal Admin Portal ─────────────────────────────────────────────
// visible_nav count: 9 (must match teamPortalNav.ts exactly)

export const teamDemoRoutes: DemoRoute[] = [
  {
    path: "/team/dashboard",
    portal: "team",
    label: "Dashboard",
    visibility: "visible_nav",
    purpose: "Team/Internal Admin command center.",
  },
  {
    path: "/team/approval-queue",
    portal: "team",
    label: "Approvals",
    visibility: "visible_nav",
    purpose: "Prepared actions awaiting Veroxa team review.",
  },
  {
    path: "/team/visibility-audit",
    portal: "team",
    label: "Visibility Audit",
    visibility: "visible_nav",
    purpose: "Google Maps and local visibility readiness review.",
  },
  {
    path: "/team/first-client-readiness",
    portal: "team",
    label: "First-Client Readiness",
    visibility: "visible_nav",
    purpose: "First-client operating readiness and launch-gate review.",
  },
  {
    path: "/team/upload-inbox",
    portal: "team",
    label: "Upload Inbox",
    visibility: "visible_nav",
    purpose: "Review uploaded media and client submissions.",
  },
  {
    path: "/team/work-queue",
    portal: "team",
    label: "Work Queue",
    visibility: "visible_nav",
    purpose: "Team queue of content, media, and client tasks.",
  },
  {
    path: "/team/direction-queue",
    portal: "team",
    label: "Direction Queue",
    visibility: "visible_nav",
    purpose: "Prepared directions pending internal review.",
  },
  {
    path: "/team/report-queue",
    portal: "team",
    label: "Reports",
    visibility: "visible_nav",
    purpose: "Weekly and monthly reports pending Team/Internal Admin review.",
  },
  {
    path: "/team/audit-leads",
    portal: "team",
    label: "Audit Leads",
    visibility: "visible_nav",
    purpose: "Free Audit leads and follow-up review queue.",
  },
];

export const allDemoRoutes: DemoRoute[] = [
  ...clientPreviewRoutes,
  ...clientDemoRoutes,
  ...teamDemoRoutes,
];

export const demoRoutesByPortal: Readonly<Record<DemoPortal, DemoRoute[]>> =
  Object.freeze({
    client: [...clientPreviewRoutes, ...clientDemoRoutes],
    team: teamDemoRoutes,
  });

export function getDemoRoute(path: string): DemoRoute | null {
  return allDemoRoutes.find((r) => r.path === path) ?? null;
}

export function getRoutesByVisibility(visibility: DemoVisibility): DemoRoute[] {
  return allDemoRoutes.filter((r) => r.visibility === visibility);
}

export function getVisibleNavRoutes(portal: DemoPortal): DemoRoute[] {
  return (demoRoutesByPortal[portal] ?? []).filter(
    (r) => r.visibility === "visible_nav",
  );
}
