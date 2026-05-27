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
 *   visible_nav entries must exactly match the four portal nav files:
 *     src/lib/clientPortalNav.ts    — 6 visible items
 *     src/lib/teamPortalNav.ts      — 7 visible items
 *     src/lib/operatorPortalNav.ts  — 7 visible items
 *     src/lib/ownerPortalNav.ts     — 7 visible items
 *
 * VALIDATION:
 *   Run `pnpm --filter @workspace/scripts run check-demo-routes`
 *   to diff this registry against App.tsx route strings.
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
 *  - `internal_demo`      — internal-only diagnostics surface.
 *                           Must be hidden behind internal access before
 *                           public launch.
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
  { path: "/demo/team/drafts",         portal: "team", label: "Drafts",         visibility: "visible_nav",     purpose: "Working drafts pending team / operator review." },
  { path: "/demo/team/scheduling",     portal: "team", label: "Scheduling",     visibility: "visible_nav",     purpose: "Schedule approved posts to social calendars." },
  { path: "/demo/team/report-queue",   portal: "team", label: "Reports",        visibility: "visible_nav",     purpose: "Team report queue — drafts awaiting operator approval." },
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

// ── Operator Portal ───────────────────────────────────────────────────────────
// visible_nav count: 24  (must match operatorPortalNav.ts exactly)
// Section headers in operatorPortalNav.ts are NOT counted — only routable items.

export const operatorDemoRoutes: DemoRoute[] = [
  // ── Visible nav — Core (7) ───────────────────────────────────────────────
  { path: "/demo/operator/operator-os",       portal: "operator", label: "Command Center",    visibility: "visible_nav",     purpose: "Primary operator overview — health, alerts, reports, AI monitoring." },
  { path: "/demo/operator/client-health",     portal: "operator", label: "Client Health",     visibility: "visible_nav",     purpose: "Per-client risk surface with health scores and flag reasons." },
  { path: "/demo/operator/alerts",            portal: "operator", label: "Alerts",            visibility: "visible_nav",     purpose: "Failed posts, blocked uploads, escalations." },
  { path: "/demo/operator/report-approvals",  portal: "operator", label: "Report Approvals",  visibility: "visible_nav",     purpose: "Final approval gate for client-facing reports." },
  { path: "/demo/operator/media-library",     portal: "operator", label: "Media Library",     visibility: "visible_nav",     purpose: "All client media — status, quality flags, caption readiness." },
  { path: "/demo/operator/team-oversight",    portal: "operator", label: "Team Oversight",    visibility: "visible_nav",     purpose: "Team member workload, task distribution, performance." },
  { path: "/demo/operator/system-status",     portal: "operator", label: "System Status",     visibility: "visible_nav",     purpose: "Build connections — what is live vs stubbed in this demo build." },
  // ── Visible nav — Intelligence (4) ───────────────────────────────────────
  { path: "/demo/operator/action-center",     portal: "operator", label: "Action Center",     visibility: "visible_nav",     purpose: "Recommended operator actions and AI-generated intelligence." },
  { path: "/demo/operator/priority-board",    portal: "operator", label: "Priority Board",    visibility: "visible_nav",     purpose: "Kanban-style client priority board ranked by urgency and risk." },
  { path: "/demo/operator/risk-center",       portal: "operator", label: "Risk Center",       visibility: "visible_nav",     purpose: "Risk monitoring surface — severity-ranked flags across the portfolio." },
  { path: "/demo/operator/daily-digest",      portal: "operator", label: "Daily Digest",      visibility: "visible_nav",     purpose: "Daily briefing — priorities, alerts, reports due, pipeline bottlenecks." },
  { path: "/demo/operator/evidence-engine",   portal: "operator", label: "Evidence Engine",   visibility: "visible_nav",     purpose: "Evidence-Based Selection Engine V1 — demo-only deterministic rule engine for media and posting decisions." },
  // ── Visible nav — Operations (5) ─────────────────────────────────────────
  { path: "/demo/operator/content-calendar",  portal: "operator", label: "Content Calendar",  visibility: "visible_nav",     purpose: "Operator-side two-week content calendar across the portfolio." },
  { path: "/demo/operator/content-ops",       portal: "operator", label: "Content Ops",       visibility: "visible_nav",     purpose: "Content operations surface." },
  { path: "/demo/operator/workflow-engine",   portal: "operator", label: "Workflow Engine",   visibility: "visible_nav",     purpose: "Workflow engine surface." },
  { path: "/demo/operator/operations-center", portal: "operator", label: "Ops Center",        visibility: "visible_nav",     purpose: "Operations center surface." },
  { path: "/demo/operator/failed-posts",      portal: "operator", label: "Failed Posts",      visibility: "visible_nav",     purpose: "Posts that failed to publish — retry / triage queue." },
  // ── Visible nav — Reporting (4) ──────────────────────────────────────────
  { path: "/demo/operator/reporting-command", portal: "operator", label: "Report Command",    visibility: "visible_nav",     purpose: "Reporting command surface — weekly + monthly report pipeline." },
  { path: "/demo/operator/weekly-reports",    portal: "operator", label: "Weekly Reports",    visibility: "visible_nav",     purpose: "Weekly reports archive." },
  { path: "/demo/operator/monthly-reports",   portal: "operator", label: "Monthly Reports",   visibility: "visible_nav",     purpose: "Monthly reports archive." },
  { path: "/demo/operator/kpis",              portal: "operator", label: "KPIs",              visibility: "visible_nav",     purpose: "Operator KPI surface." },
  // ── Visible nav — Agents & Data (3) ──────────────────────────────────────
  { path: "/demo/operator/ai-agents",         portal: "operator", label: "AI Agents",         visibility: "visible_nav",     purpose: "Operator view of the AI agent layer — purpose, outputs, confidence." },
  { path: "/demo/operator/activity",          portal: "operator", label: "Activity",          visibility: "visible_nav",     purpose: "Operator activity feed — chronological audit trail." },
  { path: "/demo/operator/media-inventory",   portal: "operator", label: "Media Inventory",   visibility: "visible_nav",     purpose: "Media inventory surface." },
  // ── Hidden from nav ───────────────────────────────────────────────────────
  { path: "/demo/operator",                   portal: "operator", label: "Portal Index",      visibility: "hidden_from_nav", purpose: "Operator demo portal index — alias for /demo/operator/operator-os." },
  { path: "/demo/operator/client-detail",     portal: "operator", label: "Client Detail",     visibility: "hidden_from_nav", purpose: "Per-client detail view — accessed via other pages, not top-level nav." },
  // ── Legacy ────────────────────────────────────────────────────────────────
  { path: "/demo/operator/overview",          portal: "operator", label: "Overview",          visibility: "legacy_demo",     purpose: "Legacy overview route — superseded by /demo/operator/operator-os." },
  { path: "/demo/operator/command-board",     portal: "operator", label: "Command Board",     visibility: "legacy_demo",     purpose: "Legacy command board — no clear replacement, deletion candidate." },
];

// ── Owner Portal ──────────────────────────────────────────────────────────────
// visible_nav count: 7 (must match ownerPortalNav.ts exactly)

export const ownerDemoRoutes: DemoRoute[] = [
  // ── Visible nav (7) ──────────────────────────────────────────────────────
  { path: "/demo/owner/executive-dashboard",  portal: "owner", label: "Executive Dashboard", visibility: "visible_nav",     purpose: "Primary owner home — MRR, client health, critical alerts, AI status." },
  { path: "/demo/owner/revenue",              portal: "owner", label: "Revenue",             visibility: "visible_nav",     purpose: "MRR / ARR, plan mix, churn forecast." },
  { path: "/demo/owner/client-health",        portal: "owner", label: "Client Health",       visibility: "visible_nav",     purpose: "Owner-level client health surface." },
  { path: "/demo/owner/alerts",               portal: "owner", label: "Critical Alerts",     visibility: "visible_nav",     purpose: "Owner-level alerts (revenue, churn, ops risk)." },
  { path: "/demo/owner/ai-agents-v2",         portal: "owner", label: "AI / System Health",  visibility: "visible_nav",     purpose: "AI agent confidence, system integration status, pipeline health." },
  { path: "/demo/owner/owner-os",             portal: "owner", label: "Growth",              visibility: "visible_nav",     purpose: "Owner-level growth and retention metrics surface." },
  { path: "/demo/owner/settings",             portal: "owner", label: "Settings",            visibility: "visible_nav",     purpose: "Brand, team, billing, integrations settings (all 'coming soon')." },
  // ── Hidden from nav ───────────────────────────────────────────────────────
  { path: "/demo/owner",                      portal: "owner", label: "Portal Index",        visibility: "hidden_from_nav", purpose: "Owner demo portal index — alias for /demo/owner/executive-dashboard." },
  { path: "/demo/owner/activity",             portal: "owner", label: "Activity",            visibility: "hidden_from_nav", purpose: "Owner activity feed — audit trail." },
  { path: "/demo/owner/kpis",                 portal: "owner", label: "KPIs",               visibility: "hidden_from_nav", purpose: "Owner KPI surface." },
  { path: "/demo/owner/media-inventory",      portal: "owner", label: "Media Inventory",     visibility: "hidden_from_nav", purpose: "Media inventory surface." },
  { path: "/demo/owner/weekly-reports",       portal: "owner", label: "Weekly Reports",      visibility: "hidden_from_nav", purpose: "Weekly reports archive." },
  { path: "/demo/owner/monthly-reports",      portal: "owner", label: "Monthly Reports",     visibility: "hidden_from_nav", purpose: "Monthly reports archive." },
  { path: "/demo/owner/agent-workflow",       portal: "owner", label: "Agent Workflow",      visibility: "hidden_from_nav", purpose: "AI agent workflow detail view." },
  { path: "/demo/owner/bi-center",            portal: "owner", label: "BI Center",          visibility: "hidden_from_nav", purpose: "Business intelligence analytics." },
  { path: "/demo/owner/client-analytics",     portal: "owner", label: "Client Analytics",    visibility: "hidden_from_nav", purpose: "Client analytics deep-dive." },
  { path: "/demo/owner/reporting-analytics",  portal: "owner", label: "Reporting Analytics", visibility: "hidden_from_nav", purpose: "Reporting analytics surface." },
  { path: "/demo/owner/media-analytics",      portal: "owner", label: "Media Analytics",     visibility: "hidden_from_nav", purpose: "Media analytics surface." },
  { path: "/demo/owner/ops-intelligence",     portal: "owner", label: "Ops Intelligence",    visibility: "hidden_from_nav", purpose: "Operations intelligence surface." },
  { path: "/demo/owner/permissions",          portal: "owner", label: "Permissions",         visibility: "hidden_from_nav", purpose: "Role permissions reference page." },
  { path: "/demo/owner/automation-roadmap",   portal: "owner", label: "Automation Roadmap",  visibility: "hidden_from_nav", purpose: "Automation roadmap surface." },
  { path: "/demo/owner/system-map",           portal: "owner", label: "System Map",          visibility: "hidden_from_nav", purpose: "System architecture map." },
  { path: "/demo/owner/daily-briefing",       portal: "owner", label: "Daily Briefing",      visibility: "hidden_from_nav", purpose: "Daily briefing digest." },
  { path: "/demo/owner/client-detail",        portal: "owner", label: "Client Detail",       visibility: "hidden_from_nav", purpose: "Per-client detail view accessible from owner portal." },
  // ── Legacy ────────────────────────────────────────────────────────────────
  { path: "/demo/owner/dashboard",            portal: "owner", label: "Dashboard",           visibility: "legacy_demo",     purpose: "Legacy dashboard route — superseded by /demo/owner/executive-dashboard." },
];

// ── Internal-only diagnostics ─────────────────────────────────────────────────
// Must be hidden behind internal access before any public launch.

export const internalDemoRoutes: DemoRoute[] = [
  { path: "/demo/internal/system-status",  portal: "operator", label: "System Status (internal)", visibility: "internal_demo", purpose: "Original internal build-connections diagnostics page." },
  { path: "/demo/internal/architecture",   portal: "operator", label: "Architecture",             visibility: "internal_demo", purpose: "Architecture reference page." },
  { path: "/demo/internal/integrations",   portal: "operator", label: "Integrations",             visibility: "internal_demo", purpose: "Integration status reference page." },
  { path: "/demo/internal/demo-controls",  portal: "operator", label: "Demo Controls",            visibility: "internal_demo", purpose: "Demo controls / toggles." },
  { path: "/demo/internal/client-health",  portal: "operator", label: "Client Health Command",    visibility: "internal_demo", purpose: "Cross-role client health command surface (internal)." },
  { path: "/demo/internal/db-explorer",    portal: "operator", label: "DB Explorer",              visibility: "internal_demo", purpose: "Internal database explorer — never expose publicly." },
  { path: "/demo/internal/permissions",    portal: "operator", label: "Permissions (internal)",   visibility: "internal_demo", purpose: "Internal permissions reference surface." },
  // Note: /demo/supabase-test is an ad-hoc diagnostics route registered in App.tsx
  // outside /demo/internal/*. Tracked here for completeness; treat as internal_demo.
  { path: "/demo/supabase-test",           portal: "operator", label: "Supabase Test",            visibility: "internal_demo", purpose: "Ad-hoc Supabase connectivity diagnostics page." },
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
  // Operator
  { path: "/operator/overview",      portal: "operator", label: "Operator Overview",   visibility: "future_protected", purpose: "Future authenticated operator home." },
  { path: "/operator/alerts",        portal: "operator", label: "Operator Alerts",     visibility: "future_protected", purpose: "Future authenticated alerts." },
  { path: "/operator/report-approvals", portal: "operator", label: "Report Approvals", visibility: "future_protected", purpose: "Future authenticated report approvals." },
  // Owner
  { path: "/owner/dashboard",        portal: "owner",    label: "Owner Dashboard",     visibility: "future_protected", purpose: "Future authenticated owner home." },
  { path: "/owner/revenue",          portal: "owner",    label: "Owner Revenue",       visibility: "future_protected", purpose: "Future authenticated revenue surface." },
  { path: "/owner/client-health",    portal: "owner",    label: "Owner Client Health", visibility: "future_protected", purpose: "Future authenticated client health." },
];

// ── Aggregates ────────────────────────────────────────────────────────────────

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

/**
 * Returns routes with `visible_nav` for a given portal.
 * Count must match the corresponding portal nav file.
 *   client: 6 | team: 7 | operator: 7 | owner: 7
 */
export function getVisibleNavRoutes(portal: DemoPortal): DemoRoute[] {
  return (demoRoutesByPortal[portal] ?? []).filter((r) => r.visibility === "visible_nav");
}
