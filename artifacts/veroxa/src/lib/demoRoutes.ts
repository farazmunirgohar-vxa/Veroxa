/**
 * Demo Route Registry — central source of truth for Veroxa's demo
 * routes and their visibility intent.
 *
 * Used for:
 *   - documenting which demo routes are surfaced in portal navigation
 *     vs hidden / legacy / internal / future-protected,
 *   - future tests / navigation helpers,
 *   - keeping `App.tsx` honest — every demo route in `App.tsx` should
 *     also appear here.
 *
 * Pure data. No Supabase, no network, no side effects.
 *
 * VISIBILITY RULES:
 *   visible_nav entries must match the active Client and Team portal nav files.
 *
 * VALIDATION:
 *   Run `pnpm --filter @workspace/scripts run check-demo-routes`
 *   to diff this registry against App.tsx route strings.
 *
 * See: `docs/ROUTE_VISIBILITY_STRATEGY.md`,
 *      `docs/INTERNAL_DEMO_PROTECTION_PLAN.md`,
 *      `docs/ROUTE_ARCHITECTURE.md`.
 */

export type DemoPortal = "client" | "team";

/**
 * Visibility intent for a demo route.
 *  - `visible_nav`        — actively surfaced in the portal sidebar today.
 *  - `hidden_from_nav`    — wired and reachable by URL, but intentionally
 *                           not linked from the sidebar (kept warm for
 *                           future surfacing or deep links).
 *  - `legacy_demo`        — older route kept alive for back-compat /
 *                           bookmarks; superseded by a newer canonical
 *                           page. Deletion candidate.
 *  - `internal_demo`      — internal-only diagnostics surface.
 *                           Must be hidden behind internal access before
 *                           public launch.
 *  - `future_protected`   — placeholder for a future auth-gated route
 *                           (`/client/*`, `/team/*`). Today renders the
 *                           protected route preview card only.
 */
export type DemoVisibility =
  | "visible_nav"
  | "hidden_from_nav"
  | "legacy_demo"
  | "internal_demo"
  | "future_protected";

export interface DemoRoute {
  path: string;
  portal: DemoPortal;
  label: string;
  purpose: string;
  visibility: DemoVisibility;
}

// ── Client Portal ─────────────────────────────────────────────────────────────
// visible_nav count: 6 (must match clientPortalNav.ts exactly)

export const clientDemoRoutes: DemoRoute[] = [
  // ── Visible nav (6) ──────────────────────────────────────────────────────
  { path: "/demo/client/dashboard",        portal: "client", label: "Dashboard",         visibility: "visible_nav",     purpose: "Client home — primary login destination." },
  { path: "/demo/client/media",            portal: "client", label: "Upload Media",       visibility: "visible_nav",     purpose: "Media library + Restaurant Media Guidance Engine." },
  { path: "/demo/client/calendar",         portal: "client", label: "Calendar",           visibility: "visible_nav",     purpose: "Preview the scheduled-post / content-concept calendar." },
  { path: "/demo/client/reports",          portal: "client", label: "Reports",            visibility: "visible_nav",     purpose: "Preview weekly / monthly client reports." },
  { path: "/demo/client/requests",         portal: "client", label: "Requests",           visibility: "visible_nav",     purpose: "Open client requests / to-dos." },
  { path: "/demo/client/account",          portal: "client", label: "Account",            visibility: "visible_nav",     purpose: "Sample client account view — profile, onboarding %, requests." },
  // ── Hidden from nav ───────────────────────────────────────────────────────
  { path: "/demo/client",                  portal: "client", label: "Portal Index",       visibility: "hidden_from_nav", purpose: "Client demo portal index — alias for /demo/client/dashboard." },
  { path: "/demo/client/google",           portal: "client", label: "Google",             visibility: "hidden_from_nav", purpose: "Preview the Google Business Profile / local SEO surface." },
  { path: "/demo/client/updates",          portal: "client", label: "Updates",            visibility: "hidden_from_nav", purpose: "Client updates / notifications stream." },
  { path: "/demo/client/onboarding",       portal: "client", label: "Onboarding",         visibility: "hidden_from_nav", purpose: "Preview the restaurant onboarding form." },
  { path: "/demo/client/weekly-report",    portal: "client", label: "Weekly Report",      visibility: "hidden_from_nav", purpose: "Standalone weekly report detail view." },
  { path: "/demo/client/monthly-report",   portal: "client", label: "Monthly Report",     visibility: "hidden_from_nav", purpose: "Standalone monthly report detail view." },
  { path: "/demo/client/workspace",        portal: "client", label: "Workspace",          visibility: "hidden_from_nav", purpose: "Full client workspace surface — kept warm for future nav inclusion." },
  { path: "/demo/client/onboarding-center",portal: "client", label: "Onboarding Center",  visibility: "hidden_from_nav", purpose: "Extended onboarding center — superseded by /demo/client/onboarding." },
  { path: "/demo/client/content-pipeline", portal: "client", label: "Content Pipeline",   visibility: "hidden_from_nav", purpose: "Client-side content pipeline status view." },
  { path: "/demo/client/ai-agents",        portal: "client", label: "AI Agents",          visibility: "hidden_from_nav", purpose: "Client-visible AI agent summary." },
  { path: "/demo/client/activity-log",     portal: "client", label: "Activity Log",       visibility: "hidden_from_nav", purpose: "Client activity log — audit trail of actions." },
];

// ── Team Portal ───────────────────────────────────────────────────────────────
// visible_nav count: 7 (must match teamPortalNav.ts exactly)

export const teamDemoRoutes: DemoRoute[] = [
  // ── Visible nav (7) ──────────────────────────────────────────────────────
  { path: "/demo/team/dashboard",      portal: "team", label: "Dashboard",      visibility: "visible_nav",     purpose: "Team home — priority alerts, queue summary, AI agent status." },
  { path: "/demo/team/work-queue",     portal: "team", label: "Work Queue",     visibility: "visible_nav",     purpose: "Active content tasks across all clients." },
  { path: "/demo/team/media-review",   portal: "team", label: "Media Review",   visibility: "visible_nav",     purpose: "Approve uploaded media and match it to capture plan." },
  { path: "/demo/team/drafts",         portal: "team", label: "Drafts",         visibility: "visible_nav",     purpose: "Working drafts pending Veroxa team review." },
  { path: "/demo/team/scheduling",     portal: "team", label: "Scheduling",     visibility: "visible_nav",     purpose: "Schedule approved posts to social calendars." },
  { path: "/demo/team/report-queue",   portal: "team", label: "Reports",        visibility: "visible_nav",     purpose: "Team report queue — drafts awaiting Veroxa team review." },
  { path: "/demo/team/alerts",         portal: "team", label: "Alerts",         visibility: "visible_nav",     purpose: "Team-facing alert center — media, post failures, deadlines." },
  // ── Hidden from nav ───────────────────────────────────────────────────────
  { path: "/demo/team",                portal: "team", label: "Portal Index",   visibility: "hidden_from_nav", purpose: "Team demo portal index — alias for /demo/team/dashboard." },
  { path: "/demo/team/ai-review",      portal: "team", label: "AI Review",      visibility: "hidden_from_nav", purpose: "Review AI-suggested drafts before they reach the client." },
  { path: "/demo/team/content-review", portal: "team", label: "Content Review", visibility: "hidden_from_nav", purpose: "Content review surface — detailed draft QA." },
  { path: "/demo/team/performance",    portal: "team", label: "Performance",    visibility: "hidden_from_nav", purpose: "Team performance metrics — output rates, quality scores." },
  { path: "/demo/team/activity-feed",  portal: "team", label: "Activity Feed",  visibility: "hidden_from_nav", purpose: "Team activity feed — chronological audit trail." },
  { path: "/demo/team/client-detail",  portal: "team", label: "Client Detail",  visibility: "hidden_from_nav", purpose: "Per-client detail view accessible from team portal." },
  // ── Legacy ────────────────────────────────────────────────────────────────
  { path: "/demo/team/tasks",          portal: "team", label: "Tasks",          visibility: "legacy_demo",     purpose: "Legacy task view — superseded by /demo/team/dashboard." },
];

// ── Internal-only diagnostics ─────────────────────────────────────────────────
// Must be hidden behind internal access before any public launch.

export const internalDemoRoutes: DemoRoute[] = [
  { path: "/demo/internal/system-status",  portal: "team", label: "System Status (internal)", visibility: "internal_demo", purpose: "Original internal build-connections diagnostics page." },
  { path: "/demo/internal/architecture",   portal: "team", label: "Architecture",             visibility: "internal_demo", purpose: "Architecture reference page." },
  { path: "/demo/internal/integrations",   portal: "team", label: "Integrations",             visibility: "internal_demo", purpose: "Integration status reference page." },
  { path: "/demo/internal/demo-controls",  portal: "team", label: "Demo Controls",            visibility: "internal_demo", purpose: "Demo controls / toggles." },
  { path: "/demo/internal/client-health",  portal: "team", label: "Client Health Command",    visibility: "internal_demo", purpose: "Cross-role client health command surface (internal)." },
  { path: "/demo/internal/db-explorer",    portal: "team", label: "DB Explorer",              visibility: "internal_demo", purpose: "Internal database explorer — never expose publicly." },
  { path: "/demo/internal/permissions",    portal: "team", label: "Permissions (internal)",   visibility: "internal_demo", purpose: "Internal permissions reference surface." },
  // Note: /demo/supabase-test is an ad-hoc diagnostics route registered in App.tsx
  // outside /demo/internal/*. Tracked here for completeness; treat as internal_demo.
  { path: "/demo/supabase-test",           portal: "team", label: "Supabase Test",            visibility: "internal_demo", purpose: "Ad-hoc Supabase connectivity diagnostics page." },
];

// ── Future auth-protected routes ──────────────────────────────────────────────
// Today every entry renders the `RealRoutePlaceholder` → `RequireRole`
// "Protected Route Preview" card. Listed here so the registry documents
// the full intended URL surface for the real auth-gated app.

export const futureProtectedDemoRoutes: DemoRoute[] = [
  // Client
  { path: "/client/dashboard",       portal: "client",   label: "Client Dashboard",    visibility: "future_protected", purpose: "Future authenticated client home." },
  { path: "/client/onboarding",      portal: "client",   label: "Client Onboarding",   visibility: "future_protected", purpose: "Future authenticated onboarding flow." },
  { path: "/client/media",           portal: "client",   label: "Client Media",        visibility: "future_protected", purpose: "Future authenticated media upload." },
  { path: "/client/calendar",        portal: "client",   label: "Client Calendar",     visibility: "future_protected", purpose: "Future authenticated content calendar." },
  { path: "/client/reports",         portal: "client",   label: "Client Reports",      visibility: "future_protected", purpose: "Future authenticated reports." },
  // Team
  { path: "/team/tasks",             portal: "team",     label: "Team Tasks",          visibility: "future_protected", purpose: "Future authenticated team home." },
  { path: "/team/media-review",      portal: "team",     label: "Team Media Review",   visibility: "future_protected", purpose: "Future authenticated media review." },
  { path: "/team/drafts",            portal: "team",     label: "Team Drafts",         visibility: "future_protected", purpose: "Future authenticated drafts." },
  { path: "/team/scheduling",        portal: "team",     label: "Team Scheduling",     visibility: "future_protected", purpose: "Future authenticated scheduling." },
];

// ── Aggregates ────────────────────────────────────────────────────────────────

export const allDemoRoutes: DemoRoute[] = [
  ...clientDemoRoutes,
  ...teamDemoRoutes,
  ...internalDemoRoutes,
  ...futureProtectedDemoRoutes,
];

export const demoRoutesByPortal: Readonly<Record<DemoPortal, DemoRoute[]>> = Object.freeze({
  client: clientDemoRoutes,
  team: teamDemoRoutes,
});

export function getDemoRoute(path: string): DemoRoute | null {
  return allDemoRoutes.find((r) => r.path === path) ?? null;
}

/**
 * Returns routes with `visible_nav` for a given portal.
 * Count must match the corresponding active portal nav file.
 *   client: 6 | team: 7
 */
export function getVisibleNavRoutes(portal: DemoPortal): DemoRoute[] {
  return (demoRoutesByPortal[portal] ?? []).filter((r) => r.visibility === "visible_nav");
}
