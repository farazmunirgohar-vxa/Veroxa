# Veroxa Sites Application

This directory is the GitHub-synchronized ChatGPT Sites delivery layer for Veroxa.

It is not a demo, a second product definition, or a replacement for the canonical Veroxa OS in `artifacts/veroxa`.

## Source-of-truth relationship

- `artifacts/veroxa` remains the canonical product layer: routes, domain contracts, Client and Team behavior, Momo operating logic, guardrails, and historical implementation.
- `artifacts/veroxa-sites` is the Sites-compatible delivery layer: the approved visual system, public route shell, Client Portal shell, Team Faraz shell, and Sites deployment packaging.
- `artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md` controls migration and domain decisions.
- New product rules must enter the canonical layer first or in the same PR as their Sites implementation.

## Current route slice

Public:

- `/`
- `/free-audit`
- `/login`

Client:

- `/client/dashboard`
- `/client/onboarding`
- `/client/media`
- `/client/reports`
- `/client/services`

Team Faraz / Momo Workspace:

- `/team/momo`
- `/team/momo/work`
- `/team/momo/intelligence`
- `/team/momo/content-ai`
- `/team/momo/reports`
- `/team/momo/readiness`

## Current safety state

- Pre-live only.
- Owner-restricted Sites access remains in place.
- No production credentials or public client accounts.
- No database or upload persistence.
- No external platform connections or publishing.
- No runtime AI provider calls.
- No Momo owner walkthrough or pilot activation.
- Session-only interactions are labeled honestly.

## Local verification

From this directory:

```bash
npm ci
npm test
npm run lint
```

The build must produce a valid Sites Worker artifact and every migration-critical route must return HTML with Veroxa identity.

## Domain rule

Do not attach or redirect `veroxasystems.com` until the domain cutover gate in `CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md` is complete and Faraz has explicitly approved public access.

