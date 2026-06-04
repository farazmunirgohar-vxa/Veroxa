# Public Demo and Preview Login

## Purpose

This document defines the safe public/demo access model for Veroxa while the app remains in placeholder preview mode.

Veroxa is not using production authentication, storage, live AI, live platform APIs, payments, or automated publishing in this stage. The public Client Demo and placeholder login exist only so Faraz, reviewers, and early restaurant partners can understand the portal experience before live systems are approved.

## Preview login credentials

Placeholder preview access uses the following visible review credentials:

- Client: `client@veroxa.com` / `farazclient`
- Team: `team@veroxa.com` / `farazteam`

Expected placeholder routing:

- `client@veroxa.com` / `farazclient` routes to `/client/dashboard`.
- `team@veroxa.com` / `farazteam` routes to `/team/dashboard`.
- Wrong credentials fail.

These are preview-only credentials. They are not real users, not production secrets, and do not create or write database records.

## What placeholder login means

Placeholder login means Veroxa is still using `AUTH_MODE = "placeholder"` and a local preview credential matcher. It exists only to review protected Client and Team Portal shells safely.

Placeholder login does not mean:

- production authentication is active
- real users exist
- Supabase auth is provisioned
- account records are being written
- uploads are stored
- publishing systems are connected
- payment or billing systems exist

Production auth, storage, database migrations, RLS policies, live AI, external APIs, payments, webhooks, cron jobs, and automated publishing all remain out of scope until explicitly approved in a separate build.

## What public Client Demo means

The public Client Demo route is:

- `/demo/client/dashboard`

It is public and does not require login. It should explain the Veroxa client workflow with premium, honest preview language.

Required Client Demo language markers:

- “Demo Preview — example restaurant workspace”
- “This preview shows how Veroxa organizes media, requests, updates, and reports.”
- “Real client data is not connected in this preview.”
- “Nothing goes live without Veroxa team review.”

The Client Demo should feel calm and useful for a restaurant owner, but it must not look like a live client account.

## What is not live

The public demo and preview portals must not imply any of the following are live:

- production auth
- storage uploads
- live AI/OpenAI runtime calls
- Google Business Profile APIs
- Meta, TikTok, YouTube, or social publishing APIs
- payments, checkout, subscriptions, or billing
- webhooks, cron jobs, or background jobs
- automated public/customer-visible execution
- real client data writes

Manual preparation and review language is allowed. Live execution language is not.

## What remains protected

These real portal routes remain protected by the current placeholder guard architecture:

- `/client/dashboard`
- `/client/media`
- `/client/requests`
- `/client/updates`
- `/client/reports`
- `/team/dashboard`
- `/team/manual-execution`
- `/team/first-client-readiness`
- other active `/team/*` review routes

The public Client Demo is separate from the real Client Portal. Demo preview routes must not be merged with login flows.

## Services page purpose

The Services page explains what Veroxa does for restaurants. It should be educational and operational, not transactional.

The Services page should focus on:

- Google Business Profile / Google Maps / local visibility support
- social content consistency using client-provided media
- media guidance
- content preparation and Veroxa team review
- weekly updates
- monthly reporting
- Client Portal workflow
- Premium ads readiness/support as a service layer only
- service boundaries at launch

The Services page must not show plan prices or a pricing-card comparison grid.

## Pricing page purpose

The Pricing page explains what Veroxa costs and what each plan includes.

Current locked public pricing:

- Starter: `$295/month`
- Growth: `$495/month`
- Premium: `$995/month`

Pricing page boundaries:

- no contract
- cancel anytime
- ad spend separate
- posting depends on usable client-provided media
- Starter capped at up to 3 posts/week depending on usable media
- Growth and Premium capped at up to 1 post/day depending on usable media
- Premium requires readiness assessment, client approval, and agreed ad budget

The Pricing page should stay plan-centered and should not duplicate the full Services page explanation.

## Client Demo language rules

Client/public surfaces should not expose technical or internal terms such as:

- fixture
- backend
- raw score
- RLS
- Supabase
- connector
- API
- internal risk
- profit math

Use client-safe language instead:

- Prepared by Veroxa
- In review
- Veroxa team review
- Needs your input
- Visibility update
- Prepared action
- Included in report
- More content needed
- Nothing goes live without Veroxa team review
