/**
 * Demo Route Registry — central source of truth for Veroxa's demo
 * routes and their visibility intent.
 *
 * Used for:
 *   - documenting which demo routes are intended to remain public
 *     (sales / preview) vs which should later be hidden behind
 *     internal-only access,
 *   - future tests / navigation helpers,
 *   - keeping `App.tsx` honest — every demo route in `App.tsx` should
 *     also appear here.
 *
 * Pure data. No Supabase, no network, no side effects.
 *
 * See: `docs/ROUTE_VISIBILITY_STRATEGY.md`,
 *      `docs/INTERNAL_DEMO_PROTECTION_PLAN.md`.
 */

export type DemoPortal = "client" | "team" | "operator" | "owner";

/**
 * Visibility intent for a demo route.
 *  - `public_sales_preview` — safe to expose publicly long-term as a
 *    restaurant-owner sales / preview surface (the client demo).
 *  - `internal_demo_protect_later` — public during development only;
 *    must be hidden behind internal access before serious launch
 *    (team / operator / owner demos).
 */
export type DemoVisibility = "public_sales_preview" | "internal_demo_protect_later";

export interface DemoRoute {
  path: string;
  portal: DemoPortal;
  label: string;
  purpose: string;
  visibility: DemoVisibility;
}

export const clientDemoRoutes: DemoRoute[] = [
  { path: "/demo/client",            portal: "client", label: "Portal Index", visibility: "public_sales_preview", purpose: "Client demo portal index — landing for the client preview." },
  { path: "/demo/client/dashboard",  portal: "client", label: "Dashboard",  visibility: "public_sales_preview", purpose: "Show restaurant owners what the live client home will feel like." },
  { path: "/demo/client/calendar",   portal: "client", label: "Calendar",   visibility: "public_sales_preview", purpose: "Preview the scheduled-post / content-concept calendar." },
  { path: "/demo/client/google",     portal: "client", label: "Google",     visibility: "public_sales_preview", purpose: "Preview the Google Business Profile / local SEO surface." },
  { path: "/demo/client/reports",    portal: "client", label: "Reports",    visibility: "public_sales_preview", purpose: "Preview weekly / monthly client reports." },
  { path: "/demo/client/updates",    portal: "client", label: "Updates",    visibility: "public_sales_preview", purpose: "Preview the client updates / changelog stream." },
  { path: "/demo/client/onboarding", portal: "client", label: "Onboarding", visibility: "public_sales_preview", purpose: "Preview the restaurant onboarding form (brand, audience, dietary notes)." },
  { path: "/demo/client/media",      portal: "client", label: "Media",      visibility: "public_sales_preview", purpose: "Preview the media library + Restaurant Media Guidance Engine." },
];

export const teamDemoRoutes: DemoRoute[] = [
  { path: "/demo/team",                portal: "team", label: "Portal Index",  visibility: "internal_demo_protect_later", purpose: "Team demo portal index — landing for internal walkthrough." },
  { path: "/demo/team/dashboard",      portal: "team", label: "Dashboard",     visibility: "internal_demo_protect_later", purpose: "Team home — priority alerts, queue summary, AI agent status." },
  { path: "/demo/team/work-queue",     portal: "team", label: "Work Queue",    visibility: "internal_demo_protect_later", purpose: "Active content tasks across all clients." },
  { path: "/demo/team/media-review",   portal: "team", label: "Media Review",  visibility: "internal_demo_protect_later", purpose: "Approve uploaded media and match it to capture plan." },
  { path: "/demo/team/drafts",         portal: "team", label: "Drafts",        visibility: "internal_demo_protect_later", purpose: "Working drafts pending team / operator review." },
  { path: "/demo/team/scheduling",     portal: "team", label: "Scheduling",    visibility: "internal_demo_protect_later", purpose: "Schedule approved posts to social calendars." },
  { path: "/demo/team/report-queue",   portal: "team", label: "Reports",       visibility: "internal_demo_protect_later", purpose: "Team report queue — drafts awaiting operator approval." },
  { path: "/demo/team/alerts",         portal: "team", label: "Alerts",        visibility: "internal_demo_protect_later", purpose: "Team-facing alert center — media, post failures, deadlines." },
  { path: "/demo/team/tasks",          portal: "team", label: "Tasks (legacy)", visibility: "internal_demo_protect_later", purpose: "Legacy task view — redirected to dashboard in auth flow." },
  { path: "/demo/team/ai-review",      portal: "team", label: "AI Review",     visibility: "internal_demo_protect_later", purpose: "Review AI-suggested drafts before they reach the client." },
];

export const operatorDemoRoutes: DemoRoute[] = [
  { path: "/demo/operator",                    portal: "operator", label: "Portal Index",    visibility: "internal_demo_protect_later", purpose: "Operator demo portal index — landing for internal walkthrough." },
  { path: "/demo/operator/operator-os",        portal: "operator", label: "Command Center",  visibility: "internal_demo_protect_later", purpose: "Primary operator overview — health, alerts, reports, AI monitoring." },
  { path: "/demo/operator/client-health",      portal: "operator", label: "Client Health",   visibility: "internal_demo_protect_later", purpose: "Per-client risk surface with health scores and flag reasons." },
  { path: "/demo/operator/alerts",             portal: "operator", label: "Alerts",          visibility: "internal_demo_protect_later", purpose: "Failed posts, blocked uploads, escalations." },
  { path: "/demo/operator/report-approvals",   portal: "operator", label: "Report Approvals",visibility: "internal_demo_protect_later", purpose: "Final approval gate for client-facing reports." },
  { path: "/demo/operator/media-library",      portal: "operator", label: "Media Library",   visibility: "internal_demo_protect_later", purpose: "All client media — status, quality flags, caption readiness." },
  { path: "/demo/operator/team-oversight",     portal: "operator", label: "Team Oversight",  visibility: "internal_demo_protect_later", purpose: "Team member workload, task distribution, performance." },
  { path: "/demo/operator/overview",           portal: "operator", label: "Overview (legacy)",visibility: "internal_demo_protect_later", purpose: "Legacy overview route — replaced by /operator-os." },
  { path: "/demo/operator/failed-posts",       portal: "operator", label: "Failed Posts",    visibility: "internal_demo_protect_later", purpose: "Posts that failed to publish — retry / triage queue." },
];

export const ownerDemoRoutes: DemoRoute[] = [
  { path: "/demo/owner",                     portal: "owner", label: "Portal Index",       visibility: "internal_demo_protect_later", purpose: "Owner demo portal index — landing for internal walkthrough." },
  { path: "/demo/owner/executive-dashboard", portal: "owner", label: "Executive Dashboard",visibility: "internal_demo_protect_later", purpose: "Primary owner home — MRR, client health, critical alerts, AI status." },
  { path: "/demo/owner/revenue",             portal: "owner", label: "Revenue",            visibility: "internal_demo_protect_later", purpose: "MRR / ARR, plan mix, churn forecast." },
  { path: "/demo/owner/client-health",       portal: "owner", label: "Client Health",      visibility: "internal_demo_protect_later", purpose: "Owner-level client health surface." },
  { path: "/demo/owner/alerts",             portal: "owner", label: "Critical Alerts",    visibility: "internal_demo_protect_later", purpose: "Owner-level alerts (revenue, churn, ops risk)." },
  { path: "/demo/owner/ai-agents-v2",        portal: "owner", label: "AI / System Health", visibility: "internal_demo_protect_later", purpose: "AI agent confidence, system integration status, pipeline health." },
  { path: "/demo/owner/owner-os",            portal: "owner", label: "Growth",             visibility: "internal_demo_protect_later", purpose: "Owner-level growth and retention metrics surface." },
  { path: "/demo/owner/settings",            portal: "owner", label: "Settings",           visibility: "internal_demo_protect_later", purpose: "Brand, team, billing, integrations settings (all 'coming soon')." },
  { path: "/demo/owner/dashboard",           portal: "owner", label: "Dashboard (legacy)", visibility: "internal_demo_protect_later", purpose: "Legacy dashboard route — replaced by /executive-dashboard." },
];

export const allDemoRoutes: DemoRoute[] = [
  ...clientDemoRoutes,
  ...teamDemoRoutes,
  ...operatorDemoRoutes,
  ...ownerDemoRoutes,
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
