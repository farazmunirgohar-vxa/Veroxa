# Veroxa OS — Locked Operating Model
> Do not override current docs: read `ACTIVE_DOCS_INDEX.md` first. Any old pricing, role, auth, or automation language in this file is historical/deprecated unless the active docs index confirms it.


This document captures the current locked Veroxa OS direction. It is intended for Faraz, Codex, and future coding agents.

## 1. Correct platform reality

The active Veroxa build stack is **GitHub + Codex + ChatGPT Sites**, with Vercel retained temporarily for migration compatibility and rollback:

- **GitHub main** is the source of truth.
- **Codex** is the primary engineering/build agent for engineering, architecture review, hardening, PRs, and tests.
- **ChatGPT Sites** is the new application/deployment target being integrated.
- **Vercel** remains a temporary fallback until verified Sites and `veroxasystems.com` cutover.
- **Browser/manual QA** is used for visual checks.
- **Supabase** is connected as the future app/data backend, but production writes/auth/storage/RLS must remain staged and intentional.
- **OpenAI Platform** is connected for future server-side AI work, but no frontend key exposure and no runtime AI calls unless explicitly requested.

## 2. Product identity

Veroxa is an AI-assisted, automation-powered restaurant online presence and customer-growth operating system.

Veroxa is not just:

- a website
- a client portal
- a dashboard
- a content scheduler
- a traditional marketing agency

Veroxa is becoming a system that helps restaurants become:

- easier to find
- easier to trust
- easier to choose
- easier to return to

The restaurant partner should feel that Veroxa is handling the online presence without making them manage another complicated system.

## 3. Current active operating model

Active roles today:

1. **Restaurant Partner / Client**
2. **Veroxa Team / Faraz**

Owner and Operator roles are parked until explicitly requested.

The restaurant partner gives minimal, meaningful input:

- access
- media when available
- important business changes
- confirmation for sensitive business truth
- corrections when needed

Veroxa does the maximum practical work:

- audits
- strategy
- prepared actions
- content ideas
- visibility tasks
- review response drafts
- Google/profile tasks
- website/SEO recommendations
- reports and updates
- client reminders

## 4. Core OS flow

The locked Veroxa OS flow:

**Veroxa audits -> Veroxa prepares exact action -> action enters Approval Queue -> Faraz approves / edits / skips / asks client -> Veroxa queues for later execution -> future connectors execute approved work -> restaurant partner sees simple progress.**

The system should not merely recommend work. It should prepare work.

Examples:

- Not: "Update Google profile."
- Yes: "Google visibility update prepared. Review and queue for later."

- Not: "Reply to reviews."
- Yes: "Review reply prepared. Approve, edit, or skip."

- Not: "Website needs SEO."
- Yes: "Local search wording prepared. Hold for later or request client confirmation."

## 5. Current built foundations

The repo currently includes these major Veroxa foundations:

- public website foundation
- locked pricing source of truth
- Demo Preview separated from Portal Access/Login
- client portal foundation
- team portal foundation
- client media submission foundation
- central write adapter pattern
- team Upload Inbox with read-only/fallback foundation
- mobile-friendly team review card foundation
- Daily Customer Opportunity Engine
- Approval-to-Execution Queue
- Visibility Audit Engine
- prepared actions feeding the Approval Queue
- client-safe helper foundations
- Codex hardening workflow through draft PRs

## 6. Approval Queue as the central engine

The Approval Queue is the center of Veroxa OS.

Current and future prepared-action sources should feed the queue:

- Visibility Audit Engine
- Daily Customer Opportunity Engine
- Google/Profile Agent
- SEO Keyword Agent
- Review Growth Agent
- Social Content Agent
- Website Audit Agent
- Menu/Catering Visibility Agent
- Client Reminder Agent
- Weekly Update Agent
- Monthly Report Agent
- future AI caption/image agents

The queue should stay calm, useful, mobile-friendly, and action-focused.

## 7. Client experience rule

The client should not see the machine.

Clients should not see:

- AI agent internals
- OpenAI
- Supabase
- RLS
- fixture/demo terminology
- backend/debug language
- connector/API language
- raw scoring
- internal risk levels
- internal IDs
- approval logic
- draft variants that are not ready

Clients should see:

- Submitted
- In review
- Prepared by Veroxa
- Veroxa team review
- Needs your input
- Visibility update
- More content needed
- Included in report
- Completed

## 8. Team experience rule

Team means Faraz right now.

The Team portal should help Faraz answer:

- What needs attention today?
- What media/client submissions came in?
- What prepared actions need approval?
- What visibility issues need review?
- What customer-growth opportunity should be pushed?
- What client needs follow-up?
- What report/update is due?

The Team portal should be usable on both mobile and computer:

- mobile = fast review and approval
- desktop = deeper review and setup

The Team portal should not feel like an AI lab, backend console, or giant agency operations dashboard.

## 9. Approval and safety rules

Internal analysis can be automatic:

- audits
- keyword analysis
- content classification
- visibility findings
- internal task creation
- draft preparation

Faraz approval is required before public/customer-visible action:

- Google posts
- social posts
- review replies
- website copy changes
- client reminders
- weekly updates
- monthly reports

Client confirmation is required before business-truth changes:

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
- unverified sensitive claims
- deleting reviews/comments/content
- legal/health guarantees
- unverified religious/dietary claims
- aggressive complaint responses

## 10. AI and automation direction

AI should be used to reduce work for Faraz and the restaurant partner.

Future AI should prepare:

- captions
- Google updates
- review replies
- website copy
- local SEO wording
- weekly updates
- monthly reports
- client reminders
- image quality notes
- image enhancements later

AI output should be treated as a draft until reviewed.

The client should usually experience AI output only as "Prepared by Veroxa."

## 11. Build cadence

Use Codex for:

- engineering/build work
- source-of-truth updates
- architecture review
- type safety
- domain logic hardening
- tests/test plans
- backend architecture
- PR cleanup
- future Supabase/RLS work when explicitly approved
- future server-side AI architecture when explicitly approved
- future connector architecture when explicitly approved

Use Vercel as the deployment target and use browser/manual QA for visual checks.

Recommended cadence:

1. Codex creates a task branch from the latest source-of-truth state.
2. Codex builds, reviews, hardens, and tests the staged change.
3. Codex opens a PR.
4. Faraz/ChatGPT review PR.
5. Merge if safe.
6. Vercel deploys from the configured GitHub flow.

## 12. High-risk areas

Do not build these unless explicitly requested:

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

## 13. First-client target

The first-client target is a semi-real, high-trust system before full automation.

Manual publishing is acceptable at first.

The important first-client flow is:

1. restaurant gives access / submits media
2. Veroxa audits visibility
3. Veroxa prepares actions
4. Faraz reviews from mobile or computer
5. Veroxa tracks status and reports progress
6. client sees simple updates and low-effort requests

Full connector execution comes later.

## 14. Near-term roadmap

Next controlled layers:

1. Codex hardening for Visibility Audit Engine.
2. Add AGENTS.md / keep agent instructions current.
3. Team review status write-back behind dev flag.
4. Client-visible status update after Team action.
5. Server-side AI health/config check.
6. AI text drafts for captions, Google posts, review replies, and updates.
7. Storage/image workflow.
8. Execution connectors for Google/social/website/reviews after approval gates are stable.

## 15. Locked summary

Veroxa should do the most work possible for restaurant partners.

The restaurant partner should not manage the system.

Faraz should approve prepared work from mobile or computer.

## Veroxa should become the restaurant's quiet, AI-assisted growth operating system: simple outside, powerful inside.

## 15. 2026-05-30 locked package and build-order sync

Current public packages remain Essential ($497/month), Growth ($697/month), and Premium ($997/month). Growth must not be labeled popular-badge until real client data supports that claim.

Use precise package language:

- Essential: Google Business Profile optimization, Google Search/Maps SEO basics, Facebook + Instagram presence management, picture-based posting, max 1 picture post/day, weekly updates, monthly snapshot, and Client Portal access.
- Growth: everything in Essential plus TikTok + Reels posting support using the photos and videos the client provides, Reels optimization, and enhanced monthly report.
- Premium: everything in Growth plus ads management after readiness, platform-specific drafting/adaptation, and ad reporting. Posting remains max 1 post/day, and ad spend is separate.

Premium is eligible only after at least 1 month on Essential or Growth, a Veroxa readiness assessment by phone, Zoom, or in person, client approval, and an agreed ad budget. Ads should not be recommended until the restaurant foundation is ready.

Veroxa manages posting, captions, page consistency, Google visibility, online presence, media guidance, weekly updates, monthly snapshots/reports, Premium readiness assessment, and ads management only after readiness. Veroxa does not handle comments, DMs, inboxes, complaints, order questions, refunds, or customer-service conversations at launch.

Posting depends on usable client-provided media and may slow when usable media is unavailable. Veroxa does not create real restaurant media from nothing, and professional filming is not included unless separately arranged in the future.

First clients receive 20% off for the first 12 months. After 12 months, the 20% discount converts into a loyalty discount only while the client remains continuously active. If the client leaves and later returns, the 20% discount is no longer eligible.

Build order remains client side first. Team/Internal Admin heavy AI automation comes after client-side clarity. Future Team Portal should become the AI/automation command center and support media review assist, caption drafting, Google/SEO/Maps task engine, reporting generator, Premium readiness checklist, client risk flags, workload tracking, and Pakistan team handoff after 10 clients.

## 12. Portal separation and launch-readiness order

Current active routing is locked as follows:

- Public demo preview: `/demo/client/dashboard` only.
- Client Portal real review routes: `/client/*`, with login landing on `/client/dashboard`.
- Team/Internal Admin real review routes: `/team/*`, with login landing on `/team/dashboard`.
- Team Demo / `/demo/team/*` is deprecated/not active and must not be promoted publicly or used as a login destination.

If a real Client or Team Portal section is incomplete, it should stay inside the real route and show calm “Still Building” language. It should not redirect to a demo route or call the real route a demo.

Client-side launch readiness comes first. Team/Internal Admin heavy AI automation comes later, after the real client portal backbone is safe enough for the first 5 clients.

The first 5 clients are the pre-launch readiness benchmark:

1. Healthy Essential client.
2. Essential client with low media.
3. Growth client with reels content.
4. Growth client with inconsistent uploads.
5. Client eligible for Premium assessment.

## 2026-06-04 — Locked current strategy addendum

Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated. Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.

Current locked markers:

- Active stack: GitHub + Codex + Vercel. Replit is historical only.
- Active roles: Client and Team. Owner/Operator are inactive and parked.
- `AUTH_MODE` remains `placeholder`.
- Historical/deprecated pricing note: Starter $295, Growth $495, and Premium $995 are not active public pricing. Current pricing is Complete Online Presence — $495/month.
- Preview credentials remain [faraz@client.com](mailto:faraz@client.com) / farazclient and [faraz@team.com](mailto:faraz@team.com) / farazteam.
- Veroxa remains AI-ready but not connected and integration-ready but not connected until a future approved activation.
- Restaurant Onboarding is a known missing layer and future priority.
- Paid infrastructure remains blocked until the Pre-Paid Activation Gate is satisfied.
- PR #59 style is the ideal normal major build size around 3,000 meaningful changes across 20-30 files; justified big builds may approach 5,000 meaningful additions/deletions; no fake churn.
