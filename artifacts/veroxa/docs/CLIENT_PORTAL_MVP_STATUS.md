# Client Portal MVP Status

_Last verified: 2026-05-30_

## Foundation status

The Client Portal MVP is in a guarded foundation state. The active runtime roles are only:

- Restaurant Partner / Client
- Veroxa Team

Operator and Owner dashboards/workflows remain parked and are not active portal roles.

## Guarded routes

`/client/*` routes are wrapped by `ClientPortalGuard`:

- In placeholder mode, client routes remain open for local review with sample data.
- In real-auth mode, unauthenticated users see a safe login-required state.
- In real-auth mode, team users see a wrong-portal state with a link to `/team/dashboard`.
- In real-auth mode, client users without a resolved `clientId` see a safe account setup/support-needed state.
- In real-auth mode, client users with a valid `clientId` can render the Client Portal.

`/team/*` routes remain guarded by `InternalDemoGuard`.

## Demo and sample-data behavior

The public demo remains open:

- `/demo`
- `/demo/client/dashboard`

`AUTH_MODE` remains `"placeholder"` by default. Placeholder/demo mode still uses safe sample data for local review. The development/sample banner is intentionally shown in placeholder mode and hidden in real-auth mode.

## Client data access status

Client portal reads use the `client_portal_*` view helpers. The portal must not read client base tables directly from client-facing pages.

When real auth is enabled and a client session has a `clientId`, client portal reads use the session client id. Public demo and placeholder review routes continue to use the safe demo client id.

## Route registry status

`demoRoutes.ts` is aligned to the active routes in `App.tsx` for intentional public demo/client/team routes. The route checker currently reports no gaps and no stale active entries.

Historical Operator/Owner demo route entries are not active and should not be reintroduced unless explicitly requested.

## Not included in this MVP foundation

This pass did not add or change:

- pricing
- production auth default mode
- storage uploads
- publishing integrations
- payment flows
- real AI runtime calls
- service-role keys

## Remaining production blockers

Before production auth is enabled, Veroxa still needs:

- real-auth QA with provisioned test client/team users
- confirmed `user_profiles` rows with correct client/team role assignments
- verified client ids for restaurant accounts
- browser smoke testing in real-auth mode
- later storage/server milestone for actual file bytes and production-safe upload handling
