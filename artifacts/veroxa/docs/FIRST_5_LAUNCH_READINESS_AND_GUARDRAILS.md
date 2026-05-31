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
