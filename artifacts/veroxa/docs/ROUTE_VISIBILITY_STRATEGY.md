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

## Update — Authenticated Demo Routing V1

- `/demo/client/*` **remains public** (sales preview, anon read only).
- `/demo/team/*`, `/demo/operator/*`, `/demo/owner/*` are now
  **login-gated** via `InternalDemoGuard` in `App.tsx`.
  - Unauthenticated → "Login required" screen with link to `/login`.
  - Wrong role → "Wrong portal" screen with link to correct demo home.
  - Correct role → page renders normally.
- Public website (`/`, `/demo` hub) **no longer advertises** Team,
  Operator, or Owner demo portals.
  - `/demo` (Demo Hub) shows Client Portal only + login note for
    internal portals.
  - Landing page routes demo traffic to `/demo`, which now self-limits.
- Login page still lists all four role cards (this is the sign-in
  entry point) with badge labels: "Public Preview" for client,
  "Login Required" for team/operator/owner.
- Hard rule on the last bullet (no protection until Real Auth V1 decision)
  **superseded**: decision was taken, `InternalDemoGuard` is now in place.

## Update — Public Website Structure V1

Route visibility map (public surface):

| Route | Visibility | Purpose |
|-------|-----------|---------|
| `/` | Public | Introduction homepage |
| `/services` | Public | Services explanation |
| `/pricing` | Public | Pricing explanation |
| `/demo` | Public | Client Portal experience entry |
| `/demo/client/*` | Public | Client Portal preview |
| `/login` | Public | Role-based sign in |
| `/demo/team/*` | Login-gated (role=team) | Internal demo |
| `/demo/operator/*` | Login-gated (role=operator) | Internal demo |
| `/demo/owner/*` | Login-gated (role=owner) | Internal demo |

Rules:
- Public pages link only to `/`, `/services`, `/pricing`, `/demo`,
  `/demo/client/dashboard`, and `/login`.
- No public page advertises Team, Operator, or Owner demo portals.
- Login page may show all four role cards as it is the access entry point.
