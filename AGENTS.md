# Veroxa Agent Instructions

This file is the repo-level operating guide for Codex, Replit Agent, and any coding agent working on Veroxa. If a task prompt conflicts with this file, follow the user's newest explicit instruction. Otherwise, treat this file as the locked Veroxa working model.

## 1. Product identity

Veroxa is an AI-assisted, automation-powered restaurant online presence and customer-growth operating system.

It is not just a website, portal, content scheduler, or traditional marketing agency dashboard.

The restaurant partner should experience Veroxa as simple, premium, calm, and low-effort. Veroxa should do the maximum practical work behind the scenes.

## 2. Current active roles

Active roles today:

1. Restaurant Partner / Client
2. Veroxa Team / Faraz

Team currently means Faraz. The system is being built so Faraz can handle most human review from mobile or computer.

Owner and Operator are parked unless explicitly requested by the user. Do not build Owner/Operator dashboards or workflows unless the user specifically asks.

## 3. Current builder/subscription reality

The user's current builder setup:

- Replit Plus-style building capacity with full-power builds available, but no assumed parallel agent builds.
- GPT Pro / Codex capability is available and should be used for senior engineering review, hardening, domain logic, tests, and PRs.
- GitHub main is the source of truth.

Use Replit mainly for visible/product builds, app UI, portal flows, staged feature builds, and preview iteration.

Use Codex mainly for senior engineering, architecture review, hardening, type safety, tests/test plans, backend/domain logic, PRs, and future production-grade integrations.

## 4. Default builder workflow

Every Replit or Codex prompt should begin conceptually with:

Pull latest origin/main before making any new changes.

Read the prompt completely and carefully before making changes.
Understand all stages of the full prompt.
Plan the work before editing.
Stage and build each component of the prompt in order.
Do not skip stages.
Do not rush ahead into features not requested.

For Codex:

- Create a branch for the task.
- Do not push directly to main.
- Open a draft PR when finished.

For Replit:

- Pull latest main before building.
- Build the staged prompt.
- Push to GitHub when finished.

## 5. Locked pricing

Do not change pricing unless explicitly instructed by the user.

Locked pricing:

- Complete Online Presence: $977/month
- Founding first year: $488/month
- Ads Management Add-on: +$477/month
- Complete Online Presence + Ads: $1,454/month standard
- Founding Complete Online Presence + Ads: $965/month
- Ad spend is always separate and paid by the restaurant directly to the ad platform.

Google Optimization and Ads Standalone are retired/hidden from public sale unless the user explicitly says otherwise.

## 6. Routing rules

Do not merge demo and login flows.

- Demo Preview -> /demo/client/dashboard
- Portal Access -> /login
- Login -> /login
- /demo/client/dashboard remains public preview
- /team/* remains guarded by InternalDemoGuard until production auth is explicitly requested
- /client/* remains current review/demo route until production auth is explicitly requested

## 7. Core Veroxa OS flow

The target operating flow:

Veroxa audits -> Veroxa prepares exact action -> action enters Approval Queue -> Faraz approves / edits / skips / asks client -> Veroxa queues for later execution -> future connectors execute approved work -> client sees simple progress.

Do not build fake live execution. If connectors are not implemented, use calm language such as "Queue for later" or "Hold for later."

## 8. Client experience rules

Clients should not see:

- AI agent internals
- OpenAI
- Supabase
- RLS
- fixture
- backend
- connector
- API
- raw scoring
- internal risk/approval logic
- internal IDs
- execution internals

Use client-safe language:

- Prepared by Veroxa
- In review
- Veroxa team review
- Needs your input
- Visibility update
- Prepared action
- Included in report
- More content needed
- Nothing goes live without Veroxa team review

## 9. Team experience rules

Team can see operational detail, but the Team portal must stay calm and action-focused.

Use terms like:

- Suggested next step
- Prepared action
- Visibility issue
- Ready for review
- Needs confirmation
- Queue for later
- Hold for later

Avoid making the Team portal feel like an AI lab, backend console, or strategy overload screen.

## 10. Approval and safety rules

Internal analysis/audits can be automatic.

Public or customer-visible actions require Faraz approval.

Business-truth changes require client confirmation before approval/execution, including:

- hours
- holiday hours
- menu changes
- prices
- discounts
- offers
- catering availability
- halal/organic/health claims
- serious complaint responses

Never automatic:

- ad budget changes
- public sensitive claims
- deleting reviews/comments/content
- legal/health guarantees
- unverified religious/dietary claims
- aggressive complaint responses

## 11. Current built foundations

The repo currently includes foundations for:

- public website
- client/team portal foundations
- media submission/write adapter foundation
- read-only upload inbox with fixture fallback
- mobile-friendly Team review cards
- Daily Customer Opportunity Engine
- Approval-to-Execution Queue
- Visibility Audit Engine
- prepared actions feeding the Approval Queue
- client-safe helper foundations

## 12. High-risk changes requiring explicit permission

Do not add unless explicitly requested:

- production auth
- Supabase RLS changes/migrations
- storage uploads
- OpenAI runtime calls
- image generation/editing
- Google Business Profile APIs
- Meta/social publishing APIs
- website/CMS write integrations
- payments/checkout
- ads budget changes
- Owner/Operator dashboards

## 13. First-client goal

Build toward a semi-real first-client system before full automation.

Manual publishing is acceptable at first.
AI/automation should prepare work.
Faraz should be able to review from mobile or computer.
Restaurant partners should do the least possible work.

The priority is a working Restaurant Partner <-> Veroxa Team flow that helps restaurants become easier to find, easier to trust, easier to choose, and easier to return to.