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
  { path: "/demo/team",              portal: "team", label: "Portal Index", visibility: "internal_demo_protect_later", purpose: "Team demo portal index — landing for internal walkthrough." },
  { path: "/demo/team/tasks",        portal: "team", label: "Tasks",        visibility: "internal_demo_protect_later", purpose: "Team queue of content / media / client work." },
  { path: "/demo/team/media-review", portal: "team", label: "Media Review", visibility: "internal_demo_protect_later", purpose: "Approve uploaded media and match it to capture plan." },
  { path: "/demo/team/ai-review",    portal: "team", label: "AI Review",    visibility: "internal_demo_protect_later", purpose: "Review AI-suggested drafts before they reach the client." },
  { path: "/demo/team/drafts",       portal: "team", label: "Drafts",       visibility: "internal_demo_protect_later", purpose: "Working drafts pending team / operator review." },
  { path: "/demo/team/scheduling",   portal: "team", label: "Scheduling",   visibility: "internal_demo_protect_later", purpose: "Schedule approved posts to social calendars." },
];

export const operatorDemoRoutes: DemoRoute[] = [
  { path: "/demo/operator",                  portal: "operator", label: "Portal Index", visibility: "internal_demo_protect_later", purpose: "Operator demo portal index — landing for internal walkthrough." },
  { path: "/demo/operator/overview",         portal: "operator", label: "Overview",         visibility: "internal_demo_protect_later", purpose: "Cross-client operations view." },
  { path: "/demo/operator/alerts",           portal: "operator", label: "Alerts",           visibility: "internal_demo_protect_later", purpose: "Failed posts, blocked uploads, escalations." },
  { path: "/demo/operator/client-health",    portal: "operator", label: "Client Health",    visibility: "internal_demo_protect_later", purpose: "Per-client risk surface." },
  { path: "/demo/operator/failed-posts",     portal: "operator", label: "Failed Posts",     visibility: "internal_demo_protect_later", purpose: "Posts that failed to publish — retry / triage queue." },
  { path: "/demo/operator/report-approvals", portal: "operator", label: "Report Approvals", visibility: "internal_demo_protect_later", purpose: "Final approval gate for client-facing reports." },
];

export const ownerDemoRoutes: DemoRoute[] = [
  { path: "/demo/owner",               portal: "owner", label: "Portal Index", visibility: "internal_demo_protect_later", purpose: "Owner demo portal index — landing for internal walkthrough." },
  { path: "/demo/owner/dashboard",     portal: "owner", label: "Dashboard",     visibility: "internal_demo_protect_later", purpose: "Owner-only KPIs." },
  { path: "/demo/owner/revenue",       portal: "owner", label: "Revenue",       visibility: "internal_demo_protect_later", purpose: "MRR / ARR, plan mix, churn forecast." },
  { path: "/demo/owner/client-health", portal: "owner", label: "Client Health", visibility: "internal_demo_protect_later", purpose: "Owner-level client health surface." },
  { path: "/demo/owner/alerts",        portal: "owner", label: "Alerts",        visibility: "internal_demo_protect_later", purpose: "Owner-level alerts (revenue, churn, ops risk)." },
  { path: "/demo/owner/settings",      portal: "owner", label: "Settings",      visibility: "internal_demo_protect_later", purpose: "Brand, team, billing, integrations settings (all 'coming soon')." },
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
