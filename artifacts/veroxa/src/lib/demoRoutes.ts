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
 * See: `docs/ROUTE_VISIBILITY_STRATEGY.md`,
 *      `docs/INTERNAL_DEMO_PROTECTION_PLAN.md`,
 *      `docs/ROUTE_ARCHITECTURE.md`.
 */

export type DemoPortal = "client" | "team" | "operator" | "owner";

/**
 * Visibility intent for a demo route.
 *  - `visible_nav`        — actively surfaced in the portal sidebar today.
 *  - `hidden_from_nav`    — wired and reachable by URL, but intentionally
 *                           not linked from the sidebar (kept warm for
 *                           future surfacing or deep links).
 *  - `legacy_demo`        — older route kept alive for back-compat /
 *                           bookmarks; superseded by a newer canonical
 *                           page. Deletion candidate.
 *  - `internal_demo`      — internal-only diagnostics surface
 *                           (`/demo/internal/*`). Must be hidden behind
 *                           internal access before public launch.
 *  - `future_protected`   — placeholder for a future auth-gated route
 *                           (`/client/*`, `/team/*`, `/operator/*`,
 *                           `/owner/*`). Today renders the protected
 *                           route preview card only.
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

export const clientDemoRoutes: DemoRoute[] = [
  { path: "/demo/client",            portal: "client", label: "Portal Index", visibility: "hidden_from_nav", purpose: "Client demo portal index — alias for /demo/client/dashboard." },
  { path: "/demo/client/dashboard",  portal: "client", label: "Dashboard",    visibility: "visible_nav",     purpose: "Client home — primary login destination." },
  { path: "/demo/client/calendar",   portal: "client", label: "Calendar",     visibility: "visible_nav",     purpose: "Preview the scheduled-post / content-concept calendar." },
  { path: "/demo/client/google",     portal: "client", label: "Google",       visibility: "visible_nav",     purpose: "Preview the Google Business Profile / local SEO surface." },
  { path: "/demo/client/reports",    portal: "client", label: "Reports",      visibility: "visible_nav",     purpose: "Preview weekly / monthly client reports." },
  { path: "/demo/client/updates",    portal: "client", label: "Updates",      visibility: "visible_nav",     purpose: "Client updates / notifications stream." },
  { path: "/demo/client/onboarding", portal: "client", label: "Onboarding",   visibility: "visible_nav",     purpose: "Preview the restaurant onboarding form." },
  { path: "/demo/client/media",      portal: "client", label: "Media",        visibility: "visible_nav",     purpose: "Media library + Restaurant Media Guidance Engine." },
  { path: "/demo/client/account",    portal: "client", label: "Account",      visibility: "visible_nav",     purpose: "Sample client account view — profile, onboarding %, requests." },
  { path: "/demo/client/requests",   portal: "client", label: "Requests",     visibility: "visible_nav",     purpose: "Open client requests / to-dos." },
];

export const teamDemoRoutes: DemoRoute[] = [
  { path: "/demo/team",              portal: "team", label: "Portal Index",   visibility: "hidden_from_nav", purpose: "Team demo portal index — alias for /demo/team/dashboard." },
  { path: "/demo/team/dashboard",    portal: "team", label: "Dashboard",      visibility: "visible_nav",     purpose: "Team home — priority alerts, queue summary, AI agent status." },
  { path: "/demo/team/work-queue",   portal: "team", label: "Work Queue",     visibility: "visible_nav",     purpose: "Active content tasks across all clients." },
  { path: "/demo/team/media-review", portal: "team", label: "Media Review",   visibility: "visible_nav",     purpose: "Approve uploaded media and match it to capture plan." },
  { path: "/demo/team/drafts",       portal: "team", label: "Drafts",         visibility: "visible_nav",     purpose: "Working drafts pending team / operator review." },
  { path: "/demo/team/scheduling",   portal: "team", label: "Scheduling",     visibility: "visible_nav",     purpose: "Schedule approved posts to social calendars." },
  { path: "/demo/team/report-queue", portal: "team", label: "Reports",        visibility: "visible_nav",     purpose: "Team report queue — drafts awaiting operator approval." },
  { path: "/demo/team/alerts",       portal: "team", label: "Alerts",         visibility: "visible_nav",     purpose: "Team-facing alert center — media, post failures, deadlines." },
  { path: "/demo/team/ai-review",    portal: "team", label: "AI Review",      visibility: "hidden_from_nav", purpose: "Review AI-suggested drafts before they reach the client." },
  { path: "/demo/team/tasks",        portal: "team", label: "Tasks",          visibility: "legacy_demo",     purpose: "Legacy task view — superseded by /demo/team/dashboard." },
];

export const operatorDemoRoutes: DemoRoute[] = [
  { path: "/demo/operator",                  portal: "operator", label: "Portal Index",     visibility: "hidden_from_nav", purpose: "Operator demo portal index — alias for /demo/operator/operator-os." },
  { path: "/demo/operator/operator-os",      portal: "operator", label: "Command Center",   visibility: "visible_nav",     purpose: "Primary operator overview — health, alerts, reports, AI monitoring." },
  { path: "/demo/operator/client-health",    portal: "operator", label: "Client Health",    visibility: "visible_nav",     purpose: "Per-client risk surface with health scores and flag reasons." },
  { path: "/demo/operator/alerts",           portal: "operator", label: "Alerts",           visibility: "visible_nav",     purpose: "Failed posts, blocked uploads, escalations." },
  { path: "/demo/operator/report-approvals", portal: "operator", label: "Report Approvals", visibility: "visible_nav",     purpose: "Final approval gate for client-facing reports." },
  { path: "/demo/operator/media-library",    portal: "operator", label: "Media Library",    visibility: "visible_nav",     purpose: "All client media — status, quality flags, caption readiness." },
  { path: "/demo/operator/team-oversight",   portal: "operator", label: "Team Oversight",   visibility: "visible_nav",     purpose: "Team member workload, task distribution, performance." },
  { path: "/demo/operator/system-status",    portal: "operator", label: "System Status",    visibility: "visible_nav",     purpose: "Build connections — what is live vs stubbed in this demo build." },
  { path: "/demo/operator/failed-posts",     portal: "operator", label: "Failed Posts",     visibility: "hidden_from_nav", purpose: "Posts that failed to publish — retry / triage queue." },
  { path: "/demo/operator/priority-board",   portal: "operator", label: "Priority Board",   visibility: "hidden_from_nav", purpose: "Kanban-style priority board — kept warm; not currently in nav." },
  { path: "/demo/operator/workflow-engine",  portal: "operator", label: "Workflow Engine",  visibility: "hidden_from_nav", purpose: "Workflow engine surface." },
  { path: "/demo/operator/operations-center",portal: "operator", label: "Operations Center",visibility: "hidden_from_nav", purpose: "Operations center surface." },
  { path: "/demo/operator/content-calendar", portal: "operator", label: "Content Calendar", visibility: "hidden_from_nav", purpose: "Operator-side content calendar." },
  { path: "/demo/operator/content-ops",      portal: "operator", label: "Content Ops",      visibility: "hidden_from_nav", purpose: "Content operations surface." },
  { path: "/demo/operator/reporting-command",portal: "operator", label: "Reporting Command",visibility: "hidden_from_nav", purpose: "Reporting command surface." },
  { path: "/demo/operator/risk-center",      portal: "operator", label: "Risk Center",      visibility: "hidden_from_nav", purpose: "Risk center surface." },
  { path: "/demo/operator/action-center",    portal: "operator", label: "Action Center",    visibility: "hidden_from_nav", purpose: "Action center surface." },
  { path: "/demo/operator/daily-digest",     portal: "operator", label: "Daily Digest",     visibility: "hidden_from_nav", purpose: "Daily digest surface." },
  { path: "/demo/operator/weekly-reports",   portal: "operator", label: "Weekly Reports",   visibility: "hidden_from_nav", purpose: "Weekly reports archive." },
  { path: "/demo/operator/monthly-reports",  portal: "operator", label: "Monthly Reports",  visibility: "hidden_from_nav", purpose: "Monthly reports archive." },
  { path: "/demo/operator/ai-agents",        portal: "operator", label: "AI Agents",        visibility: "hidden_from_nav", purpose: "AI agents surface." },
  { path: "/demo/operator/kpis",             portal: "operator", label: "KPIs",             visibility: "hidden_from_nav", purpose: "Operator KPIs." },
  { path: "/demo/operator/activity",         portal: "operator", label: "Activity",         visibility: "hidden_from_nav", purpose: "Operator activity feed." },
  { path: "/demo/operator/media-inventory",  portal: "operator", label: "Media Inventory",  visibility: "hidden_from_nav", purpose: "Media inventory surface." },
  { path: "/demo/operator/client-detail",    portal: "operator", label: "Client Detail",    visibility: "hidden_from_nav", purpose: "Per-client detail view." },
  { path: "/demo/operator/overview",         portal: "operator", label: "Overview",         visibility: "legacy_demo",     purpose: "Legacy overview route — superseded by /demo/operator/operator-os." },
  { path: "/demo/operator/command-board",    portal: "operator", label: "Command Board",    visibility: "legacy_demo",     purpose: "Legacy command board — no clear replacement, deletion candidate." },
];

export const ownerDemoRoutes: DemoRoute[] = [
  { path: "/demo/owner",                     portal: "owner", label: "Portal Index",        visibility: "hidden_from_nav", purpose: "Owner demo portal index — alias for /demo/owner/executive-dashboard." },
  { path: "/demo/owner/executive-dashboard", portal: "owner", label: "Executive Dashboard", visibility: "visible_nav",     purpose: "Primary owner home — MRR, client health, critical alerts, AI status." },
  { path: "/demo/owner/revenue",             portal: "owner", label: "Revenue",             visibility: "visible_nav",     purpose: "MRR / ARR, plan mix, churn forecast." },
  { path: "/demo/owner/client-health",       portal: "owner", label: "Client Health",       visibility: "visible_nav",     purpose: "Owner-level client health surface." },
  { path: "/demo/owner/alerts",              portal: "owner", label: "Critical Alerts",     visibility: "visible_nav",     purpose: "Owner-level alerts (revenue, churn, ops risk)." },
  { path: "/demo/owner/ai-agents-v2",        portal: "owner", label: "AI / System Health",  visibility: "visible_nav",     purpose: "AI agent confidence, system integration status, pipeline health." },
  { path: "/demo/owner/owner-os",            portal: "owner", label: "Growth",              visibility: "visible_nav",     purpose: "Owner-level growth and retention metrics surface." },
  { path: "/demo/owner/settings",            portal: "owner", label: "Settings",            visibility: "visible_nav",     purpose: "Brand, team, billing, integrations settings (all 'coming soon')." },
  { path: "/demo/owner/dashboard",           portal: "owner", label: "Dashboard",           visibility: "legacy_demo",     purpose: "Legacy dashboard route — superseded by /demo/owner/executive-dashboard." },
];

/**
 * Internal-only diagnostics routes under /demo/internal/*. Must be
 * hidden behind internal access before any public launch.
 */
export const internalDemoRoutes: DemoRoute[] = [
  { path: "/demo/internal/system-status", portal: "operator", label: "System Status (internal)", visibility: "internal_demo", purpose: "Original internal build-connections diagnostics page." },
  { path: "/demo/internal/architecture",  portal: "operator", label: "Architecture",             visibility: "internal_demo", purpose: "Architecture reference page." },
  { path: "/demo/internal/integrations",  portal: "operator", label: "Integrations",             visibility: "internal_demo", purpose: "Integration status reference page." },
  { path: "/demo/internal/demo-controls", portal: "operator", label: "Demo Controls",            visibility: "internal_demo", purpose: "Demo controls / toggles." },
];

/**
 * Future auth-protected routes. Today every entry renders the
 * `RealRoutePlaceholder` → `RequireRole` "Protected Route Preview"
 * card. Listed here so the registry can document the full URL surface.
 */
export const futureProtectedDemoRoutes: DemoRoute[] = [
  { path: "/client/dashboard",      portal: "client",   label: "Client Dashboard",   visibility: "future_protected", purpose: "Future authenticated client home." },
  { path: "/team/tasks",            portal: "team",     label: "Team Tasks",         visibility: "future_protected", purpose: "Future authenticated team home." },
  { path: "/operator/overview",     portal: "operator", label: "Operator Overview",  visibility: "future_protected", purpose: "Future authenticated operator home." },
  { path: "/owner/dashboard",       portal: "owner",    label: "Owner Dashboard",    visibility: "future_protected", purpose: "Future authenticated owner home." },
];

export const allDemoRoutes: DemoRoute[] = [
  ...clientDemoRoutes,
  ...teamDemoRoutes,
  ...operatorDemoRoutes,
  ...ownerDemoRoutes,
  ...internalDemoRoutes,
  ...futureProtectedDemoRoutes,
];

export const demoRoutesByPortal: Readonly<Record<DemoPortal, DemoRoute[]>> = Object.freeze({
  client:   clientDemoRoutes,
  team:     teamDemoRoutes,
  operator: operatorDemoRoutes,
  owner:    ownerDemoRoutes,
});

export function getDemoRoute(path: string): DemoRoute | null {
  return allDemoRoutes.find((r) => r.path === path) ?? null;
}
