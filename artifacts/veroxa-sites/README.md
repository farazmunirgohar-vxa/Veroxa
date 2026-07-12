# Veroxa Sites Application

This directory is the GitHub-synchronized ChatGPT Sites delivery layer for Veroxa.

It is not a demo, a second product definition, or a replacement for the canonical Veroxa OS in `artifacts/veroxa`.

## Source-of-truth relationship

- `artifacts/veroxa` remains the canonical product layer: routes, domain contracts, Client and Team behavior, Momo operating logic, guardrails, and historical implementation.
- `artifacts/veroxa-sites` is the Sites-compatible delivery layer: the approved visual system, public route shell, Client Portal shell, Team Faraz shell, and Sites deployment packaging.
- `artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md` controls build, hold, RR, green merge, and deployment command meanings.
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
- Sites access is public.
- Client and Team routes are non-sensitive pre-live visual shells, not secure production accounts or owner-restricted application areas.
- Do not place real client data or Team-sensitive data in these routes until approved production identity and authorization are implemented and verified.
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

## GitHub-to-Sites release rule

- GitHub `main` is canonical.
- `Build it` may merge an agreed PR after the green gate, but does not deploy Sites unless deployment was requested.
- `Build and deploy it` requires the exact merged GitHub source to be synchronized here, then tested, checkpointed, deployed, and verified.
- The current Sites setup does not automatically deploy every GitHub merge.
- Never edit or deploy a lasting live-only change without reconciling it to GitHub source of truth.

## Domain state

Faraz approved public access and completed the Namecheap cutover. As last verified on 2026-07-12, `veroxasystems.com` and `www.veroxasystems.com` are attached to Sites with active provider and SSL status and no reported domain error. Future authorized checkpoints retain these domains without routine Namecheap changes. Verify public access, both domains, SSL, and rollback health after each production checkpoint.
