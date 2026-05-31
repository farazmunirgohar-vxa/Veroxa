# Veroxa First-5 Launch Readiness + Guardrails

## Current public pricing

- Essential — $497/month
- Growth — $697/month
- Premium — $997/month

## Current package meaning

- Essential = Google Business Profile / Google Maps visibility support plus Facebook + Instagram picture posting.
- Growth = Essential plus TikTok + Reels / short-video support using restaurant-provided media.
- Premium = Growth-level posting support plus ads management readiness/support.
- Ad spend is separate and paid directly by the restaurant.
- Posting is media dependent and may slow when usable media is unavailable.
- All active plans are capped at max 1 post/day unless Faraz explicitly changes this later.

## Active roles and routes

Active roles:

1. Client / Restaurant Partner
2. Team / Internal Admin

Retired/inactive roles and surfaces:

- Operator
- Owner
- Retired/inactive: Super Admin
- Execution dashboard

Current routes:

- Public demo preview: `/demo/client/dashboard` only
- Real client review routes: `/client/*`
- Real team/internal admin review routes: `/team/*`

## First-5 launch benchmark

The first five readiness profiles are:

1. Healthy Essential client
2. Essential client with low media
3. Growth client with reels content
4. Growth client with inconsistent uploads
5. Client eligible for Premium assessment

## Build priority

1. Client Portal first-client readiness
2. Team/Internal Admin command center foundation
3. Guardrails and CI
4. Later: real auth, real storage, real AI, real publishing, payments

## Explicit non-goals in this pass

- No real AI integration
- No real posting integration
- No production storage/uploads
- No payments or checkout
- No destructive migrations

## Guardrail exemptions

Static guardrails allow historical/deprecated/legacy/retired/internal-only context when it is clearly labeled. Active public, Client Portal, Team/Internal Admin, login, and navigation surfaces must not use retired pricing, inactive roles, deprecated demo routes, customer-service claims, or posting volume above the locked cap.

## Legacy retained note

Legacy demo data, migration drafts, and historical planning docs may still mention retired roles or old package aliases. They are retained pending dependency audit and must not be promoted into active navigation, login destinations, public pricing, Client Portal copy, or Team/Internal Admin workflows.

## Real portal data boundary V2

Real `/client/*` and `/team/*` routes are wrapped by `RealPortalDataBoundary`, but the boundary must **not** hide the full page shell. It now provides a data-mode contract to portal pages so the route, sidebar, header, and safe UI can remain reachable while live account data is prepared.

Current real-route defaults:

- `isLiveDataConnected: false`
- `allowDemoFixtures: false`
- real Client Portal pages show calm empty/review states such as “Client Portal in review” and “Live account data is being prepared”
- real Team/Internal Admin pages show Faraz's solo-founder command-center shell without listing demo restaurants as active clients

First-5 fixtures are launch-readiness benchmarks only. If they appear in Team/Internal Admin, they must be labeled “Launch readiness benchmark,” “Not active client data,” and “Used to validate first 5 client scenarios.” They are not active real clients.

Public demo remains `/demo/client/dashboard` only. `/demo/*` routes are unaffected by `RealPortalDataBoundary` and may render sample portal data for the public preview.

## Client + Team Ready V1 operational records

The real portal operational spine now distinguishes four data categories:

1. **Public demo fixtures** — sample-only data for `/demo/client/dashboard` and public preview contexts.
2. **First-5 benchmark fixtures** — launch readiness validation profiles that must be labeled “not active client data.”
3. **Real portal review-mode operational records** — local, typed, non-demo records used by real `/client/*` and `/team/*` shells while live data is not connected.
4. **Future live production data** — the eventual Supabase/integration-backed replacement for the review-mode repository.

`RealPortalDataBoundary` V2 continues to render children and provides data-mode flags. Real portals default to `allowDemoFixtures: false` and `isLiveDataConnected: false`, so pages should use review-mode operational records or safe empty states. Public demo routes may still use public demo fixtures.

Team/Internal Admin is Faraz’s solo-founder command center for the first 1–10 clients. It may show operational detail, but it must remain calm, action-focused, and separate from First-5 benchmark rows.
