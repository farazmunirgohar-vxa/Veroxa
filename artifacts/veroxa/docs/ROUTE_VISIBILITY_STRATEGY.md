# Route Visibility Strategy

> **Authoritative rule for who is supposed to see what URL.** This
> file overrides any older note that implied "all `/demo/*` routes
> remain public forever." That is **not** the policy.

## The buckets

### 1. Public long-term

These routes are intended to remain reachable by anyone, forever:

- `/`
- `/login`
- `/demo`
- `/demo/client/*` *(the client demo is a sales / preview surface for
  restaurant owners and prospects)*

### 2. Public during development — internal-protected later

These routes are open today because Veroxa is in active development
and the team uses them for internal walkthroughs. **They must not
remain publicly accessible long term** — they expose Veroxa's
operating system and would dilute the product narrative if shown to
prospects:

- `/demo/team/*`
- `/demo/operator/*`
- `/demo/owner/*`

Future protection is planned in
[`INTERNAL_DEMO_PROTECTION_PLAN.md`](./INTERNAL_DEMO_PROTECTION_PLAN.md).
Options under consideration: preview-access PIN, owner-only internal
login, separate internal-demo domain, or environment-based
visibility.

### 3. Future real authenticated

These will require a real Supabase session and `user_profiles.role`
match. Today every one of them only renders the `RequireRole`
"Protected Route Preview" card:

- `/client/*`
- `/team/*`
- `/operator/*`
- `/owner/*`

## Why this split exists

- **The client demo is a sales asset.** Restaurant owners need to be
  able to walk through `/demo/client/*` without friction so they can
  understand what Veroxa will feel like.
- **Internal demos reveal how Veroxa operates.** Showing prospects
  the team queues, operator alerts, and owner KPIs blurs the
  product story and may surface workflow details we don't want
  public.
- **Real routes are the production surface.** Demo and real routes
  stay strictly separate so that real client data never appears
  inside `/demo/*`, and so prospects never accidentally land inside
  authenticated client data.

## Hard rules

- `/demo/client/*` and the internal demos must **never** touch real
  client data. They use static fixtures or the existing read-only
  Client Portal Supabase layer with anon `SELECT` only.
- Internal demo routes must remain visually identified as demos
  (every Team / Operator / Owner page already renders a
  `DemoOnlyBanner`).
- Future `/client/*`, `/team/*`, `/operator/*`, `/owner/*` routes
  must always be wrapped in `RequireRole`. Today they render via
  `RealRoutePlaceholder` (see `src/pages/real-route-placeholder.tsx`).
- No route protection — for demos or real routes — should be
  implemented until the `Real Auth V1` decision is taken (see
  [`NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md`](./NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md)).

## Source-of-truth files

- Future-real routes: [`src/lib/realRoutes.ts`](../src/lib/realRoutes.ts)
- Demo routes + visibility: [`src/lib/demoRoutes.ts`](../src/lib/demoRoutes.ts)
- Auth contract & role home paths: [`src/lib/auth/authContract.ts`](../src/lib/auth/authContract.ts)
- Full route architecture: [`ROUTE_ARCHITECTURE.md`](./ROUTE_ARCHITECTURE.md)
