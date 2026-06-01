---
name: Veroxa placeholder client guard
description: Why client route guards must gate clientId on AUTH_MODE, and how demo client routes stay public.
---

# Placeholder client sessions have no clientId

In placeholder auth mode, a logged-in **client** session carries `clientId = null`
(set in `placeholderSession.ts`). A real (Supabase) client session resolves a real
`clientId`.

**Rule:** Any guard protecting `/client/*` must require a *client session* in both
modes, but require a non-null `clientId` **only when `AUTH_MODE === "real"`**
(e.g. `realClientReady = AUTH_MODE === "real" ? Boolean(session.clientId) : true`).

**Why:** A naive `role !== "client" || !clientId` check traps logged-in placeholder
clients in the "Account setup needed" state because their clientId is always null.
Gating clientId on AUTH_MODE keeps placeholder login working today and preserves the
real-auth requirement for later.

**How to apply:** `ClientPortalGuard.tsx` flow is loading → unauthenticated →
team(wrong portal) → client+realClientReady. Never short-circuit with an
`AUTH_MODE === "placeholder"` open bypass — `check-portal-separation.ts` forbids the
`AUTH_MODE === "placeholder" ... return <>{children}</>` pattern in both
ClientPortalGuard and InternalDemoGuard.

# Demo client routes are public and unguarded

`/demo/client/*` routes (dashboard, media, updates, requests, reports) are registered
in `App.tsx` as plain `component=` routes — **no** ClientPortalGuard, **no**
RealPortalDataBoundary. They still show fixtures because `RealPortalDataBoundary`'s
default context is `demoMode` (allowDemoFixtures: true) and `useActiveClientPortalContext`
returns the demo client id on any `/demo/` location. Keep real `/client/*` wrapped by
guard + data boundary; keep `/demo/client/*` unwrapped.

`PortalLayout.getSafePortalHref` rewrites `/client/X` → `/demo/client/X` while inside
`/demo/client`, so demo nav never crosses into the login-gated real portal.
