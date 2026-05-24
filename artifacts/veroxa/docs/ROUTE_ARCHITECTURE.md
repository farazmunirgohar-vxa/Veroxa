# Route Architecture

> **Single map of every URL Veroxa exposes today and intends to
> expose later.** Visibility rules live in
> [`ROUTE_VISIBILITY_STRATEGY.md`](./ROUTE_VISIBILITY_STRATEGY.md).
> Source-of-truth code lives in
> [`src/lib/realRoutes.ts`](../src/lib/realRoutes.ts) and
> [`src/lib/demoRoutes.ts`](../src/lib/demoRoutes.ts).

## Public routes

- `/` — marketing landing.
- `/login` — placeholder login (no real session is created).
- `/demo` — demo hub.

## Client demo routes — public sales / client preview

- `/demo/client` — client portal index.
- `/demo/client/dashboard`
- `/demo/client/calendar`
- `/demo/client/google`
- `/demo/client/reports`
- `/demo/client/updates`
- `/demo/client/onboarding`
- `/demo/client/media`

Safe for prospects to walk through. Uses the read-only Supabase
Client Portal layer (anon `SELECT` only) with a static fallback.

## Internal demo routes — public during development only

> Documented as **`internal_demo_protect_later`** in
> [`src/lib/demoRoutes.ts`](../src/lib/demoRoutes.ts). Hide behind
> login / preview access before any serious public launch — see
> [`INTERNAL_DEMO_PROTECTION_PLAN.md`](./INTERNAL_DEMO_PROTECTION_PLAN.md).

Team:

- `/demo/team` (index)
- `/demo/team/tasks`
- `/demo/team/media-review`
- `/demo/team/ai-review`
- `/demo/team/drafts`
- `/demo/team/scheduling`

Operator:

- `/demo/operator` (index)
- `/demo/operator/overview`
- `/demo/operator/alerts`
- `/demo/operator/client-health`
- `/demo/operator/failed-posts`
- `/demo/operator/report-approvals`

Owner:

- `/demo/owner` (index)
- `/demo/owner/dashboard`
- `/demo/owner/revenue`
- `/demo/owner/client-health`
- `/demo/owner/alerts`
- `/demo/owner/settings`

All carry a `DemoOnlyBanner` and use static fixtures only.

## Future real routes — auth-required

> Today wrapped in `RealRoutePlaceholder` →
> `RequireRole`. Always render the "Protected Route Preview" card
> because placeholder auth is unauthenticated.

- `/client/*` (`client` role)
- `/team/*` (`team` role)
- `/operator/*` (`operator` role)
- `/owner/*` (`owner` role)

## Rules

- `/demo/client/*` may remain public as a sales preview.
- `/demo/team/*`, `/demo/operator/*`, and `/demo/owner/*` **should
  not remain public long-term.**
- Internal demo routes must **not expose real client data.**
- Future real routes will **require real auth** later.
- Role home paths are defined in
  [`src/lib/auth/authContract.ts`](../src/lib/auth/authContract.ts)
  (`ROLE_HOME_PATH` / `getRoleHomePath`).
- Real routes today only render the protected route preview card.
- Wrong-role behavior (e.g. team user landing on `/client/*`) is
  **not implemented yet** — the placeholder is unauthenticated for
  everyone.
- **No real sessions exist yet.**

## Demo → future real route mapping

| Demo route                       | Future real route         |
| -------------------------------- | ------------------------- |
| `/demo/client/dashboard`         | `/client/dashboard`       |
| `/demo/client/onboarding`        | `/client/onboarding`      |
| `/demo/client/media`             | `/client/media`           |
| `/demo/client/calendar`          | `/client/calendar`        |
| `/demo/client/reports`           | `/client/reports`         |
| `/demo/team/tasks`               | `/team/tasks`             |
| `/demo/team/media-review`        | `/team/media-review`      |
| `/demo/team/drafts`              | `/team/drafts`            |
| `/demo/team/scheduling`          | `/team/scheduling`        |
| `/demo/operator/overview`        | `/operator/overview`      |
| `/demo/operator/alerts`          | `/operator/alerts`        |
| `/demo/operator/report-approvals`| `/operator/report-approvals` |
| `/demo/owner/dashboard`          | `/owner/dashboard`        |
| `/demo/owner/revenue`            | `/owner/revenue`          |
| `/demo/owner/client-health`      | `/owner/client-health`    |

Demo-only surfaces (no real-route counterpart yet) include
`/demo/client/google`, `/demo/client/updates`, `/demo/team/ai-review`,
`/demo/operator/client-health`, `/demo/operator/failed-posts`,
`/demo/owner/alerts`, `/demo/owner/settings`. These represent
workflows that exist for planning but are not part of the first real
MVP.
