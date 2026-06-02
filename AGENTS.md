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

For the active five-phase pre-live roadmap, see `artifacts/veroxa/docs/VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md`.


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

Do not change pricing unless explicitly instructed by the user. The user’s newest explicit instruction overrides stale repo docs.

Current locked public pricing:

- Essential: $497/month
  - Google Business Profile optimization
  - Google Search SEO basics
  - Google Maps SEO basics
  - Facebook + Instagram presence management
  - Picture-based posting
  - Max 1 picture post per day
  - Platform-specific captions when applicable
  - Weekly updates
  - Monthly performance snapshot
  - Client Portal access
- Growth: $697/month
  - Everything in Essential
  - TikTok posting/management if applicable
  - Facebook/Instagram Reels
  - TikTok + Reels posting support using the photos and videos you provide
  - Reels optimization
  - Enhanced monthly report
- Premium: $997/month
  - Everything in Growth
  - Ads management after readiness
  - Google, Facebook, Instagram, and TikTok ads management
  - Max 1 post per day, depending on usable client-provided media
  - Platform-specific drafting/adaptation
  - Ad reporting
  - Ad spend is separate and paid directly by the restaurant

Global pricing rules:

- No contract.
- Cancel anytime.
- Google Optimization is included in all plans.
- Facebook + Instagram are included in all plans.
- Essential: max 1 picture post per day.
- Growth: adds TikTok + Reels posting support using the photos and videos the client provides.
- Premium: Growth-level posting support plus ads management readiness/support; posting remains max 1 post/day and ad spend is separate.
- Posting depends on usable client-provided media and may slow when usable media is unavailable.
- Premium requires 1+ month on Essential/Growth, Veroxa readiness assessment, client approval, and agreed ad budget.
- Ad spend is always separate and paid by the restaurant directly to the ad platform.
- Veroxa does not handle comments, DMs, inboxes, complaints, order questions, refunds, or customer-service conversations at launch.
- First clients receive 20% off for 12 months, then keep it as a loyalty discount only while continuously active; if they leave and later return, the 20% discount is no longer eligible.

## 6. Routing rules

Do not merge demo and login flows.

- Demo Preview -> /demo/client/dashboard
- Portal Access -> /login
- Login -> /login
- Client login -> /client/dashboard
- Team login -> /team/dashboard
- /demo/client/dashboard remains the only public demo preview
- /demo/team/* is deprecated/not active and must not be promoted
- /team/* remains a real Team/Internal Admin review route guarded by InternalDemoGuard until production auth is explicitly requested
- /client/* remains a real Client Portal review route until production auth is explicitly requested
- If a real portal section is incomplete, stay inside the real route and show “Still Building” rather than redirecting to demo

## 7. Core Veroxa OS flow

The target operating flow:

Veroxa audits -> Veroxa prepares exact action -> action enters Approval Queue -> Faraz approves / edits / skips / asks client -> Veroxa queues for later execution -> future connectors execute approved work -> client sees simple progress.

Do not build fake live execution. If connectors are not implemented, use calm language such as "Queue for later" or "Hold for later."

## 8. Google Maps / local search optimization is core

Google Maps optimization is not a side feature. It is a core restaurant customer-acquisition layer inside Veroxa.

Veroxa should help restaurants improve local search and Google Maps readiness through:

- Google Business Profile completeness
- accurate address, phone, category, hours, holiday hours, menu, ordering links, website links, and social links
- fresh food photos and videos
- Google updates/posts prepared for approval
- review reply drafts and review growth tasks
- local keyword and menu/catering visibility improvements
- profile freshness checks
- calls, directions, website clicks, and profile activity later when data is available

Current and future Google Maps work should feed the Approval Queue as prepared actions. Do not make live Google changes until explicit connector work is requested and approval gates are stable.

## 9. Client experience rules

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

## 10. Team experience rules

Team can see operational detail, but the Team portal must stay calm and action-focused.

Use terms like:

- Suggested next step
- Prepared action
- Visibility issue
- Google Maps visibility
- Ready for review
- Needs confirmation
- Queue for later
- Hold for later

Avoid making the Team portal feel like an AI lab, backend console, or strategy overload screen.

## 11. Approval and safety rules

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

## 12. Current built foundations

The repo currently includes foundations for:

- public website
- client/team portal foundations
- media submission/write adapter foundation
- read-only upload inbox with fixture fallback
- mobile-friendly Team review cards
- Daily Customer Opportunity Engine
- Approval-to-Execution Queue
- Visibility Audit Engine
- Google Maps / local visibility optimization foundation through visibility audit findings
- prepared actions feeding the Approval Queue
- client-safe helper foundations

## 13. High-risk changes requiring explicit permission

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

## 14. First-client goal

Build toward a semi-real first-client system before full automation.

Manual publishing is acceptable at first.
AI/automation should prepare work.
Faraz should be able to review from mobile or computer.
Restaurant partners should do the least possible work.

The priority is a working Restaurant Partner <-> Veroxa Team flow that helps restaurants become easier to find, easier to trust, easier to choose, and easier to return to.


## 15. First-5-client readiness benchmark

First 5 clients are the pre-launch readiness benchmark: healthy Essential, Essential with low media, Growth with reels content, Growth with inconsistent uploads, and a client eligible for Premium assessment. Build client-side readiness first; heavy Team/Internal Admin AI automation comes later.
