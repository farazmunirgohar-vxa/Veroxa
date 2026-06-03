# Veroxa OS — 5-Phase Pre-Live Build Map

This document is the master source of truth for the Veroxa OS pre-live build cycle. It protects the repository from roadmap drift before any future live integrations are approved.

## Current Status

- Phase 5 implementation now adds deterministic rule-based assistance, manual execution packs, client confirmation workflow helpers, internal customer opportunity scoring, and a pre-live launch gate in review mode.
- Veroxa is in **pre-live mode**.
- Product surfaces are in **demo/review mode**.
- Authentication is still **placeholder auth** for preview/review access, not production authentication.
- Current surfaces use **demo/review data**, not real client operating data.
- Live integrations are blocked until explicit future approval from Faraz.

## Founder OS Alignment

- Veroxa OS is for Faraz first; the Founder/Team OS is the brain.
- The Client Portal and Team Portal are supporting modules, not the product strategy by themselves.
- The Restaurant Opportunity Engine is central: identify right-fit restaurants and create customer opportunity lift instead of optimizing for posting volume.
- Public positioning stays: “We help restaurants become easier to find, easier to trust, and easier to choose.”
- Internal target: help good-fit restaurants move toward 3–5 daily customer opportunities in 60–90 days. This is internal planning language only and never a public/client guarantee.
- Strong-fit restaurants may already pay more for weak results, weak communication, unclear reporting, or inconsistent execution. Bad-fit restaurants should be rejected or delayed.

## Active Roles

The active roles are:

- **Restaurant Partner / Client**
- **Veroxa Team / Faraz**

## Parked Roles

The parked roles are:

- Owner
- Operator
- Super Admin
- Generic Admin
- Execution roles

These roles are inactive and must not be rebuilt unless Faraz explicitly requests them.

## Route Groups

The current route groups are:

- **Public Website**
- **Public Client Demo**
- **Guarded Client Portal**
- **Guarded Team Portal**

See [`VEROXA_ROUTE_SURFACE_MAP.md`](./VEROXA_ROUTE_SURFACE_MAP.md) for the route-level surface map.

## Pricing

Locked public pricing and launch boundaries:

- **Essential — $497/month**
- **Growth — $697/month**
- **Premium — $997/month**
- No contract
- Cancel anytime
- Max 1 post/day depending on usable client-provided media
- Ad spend separate
- Premium requires readiness assessment, client approval, and agreed ad budget
- Veroxa does not handle comments, DMs, refunds, complaints, order issues, or customer-service conversations at launch

## Pre-Live Build Principle

Build as much as possible using deterministic logic, demo/review data, browser state, session state, prepared actions, manual workflows, internal queues, and guardrails before introducing live integrations.

## Hard Blocked Work

The following work is blocked during the pre-live cycle unless Faraz explicitly approves it in a future prompt:

- Production auth
- Supabase RLS migrations
- Real client data
- Cloud storage
- Live AI
- Google APIs
- Meta APIs
- TikTok APIs
- Payments
- Automated execution
- Owner/Operator dashboards

## Five Phases

The pre-live cycle has exactly these five phases:

1. Phase 1 — Control Tower + QA Foundation
2. Phase 2 — Public Website + Free Audit Readiness
3. Phase 3 — Client Portal Pre-Live Completion
4. Phase 4 — Team Portal + Internal Workflow Completion
5. Phase 5 — Rule-Based Automation + Manual Execution Launch Gate

### Phase 1 — Control Tower + QA Foundation

**Purpose:** Create the operating map, route map, QA checklist, first-client simulation rules, and doc/model guardrails.

**Allowed work:**

- Docs
- Guardrails
- QA checklists
- Route/surface maps
- Simulation policy
- Current-state cross-references

**Forbidden work:**

- Product feature changes
- UI redesign
- Production integrations

**Exit criteria:**

- Build map exists
- Route map exists
- Manual QA checklist upgraded
- First-client simulation policy exists
- Docs/model guardrail protects the new docs
- CI remains green

### Phase 2 — Public Website + Free Audit Readiness

**Purpose:** Make the public website and Free Audit flow trustworthy, current, and aligned with the locked Veroxa offer.

**Allowed work:**

- Homepage clarity pass
- Services page refinement
- Pricing trust pass
- Free Audit intake polish
- Free Audit recommendation safety
- Public trust/boundaries section

**Forbidden work:**

- Live Google search
- Real audit APIs
- CRM integrations
- Payment collection
- Fake guarantees

**Exit criteria:**

- Public site explains Veroxa clearly
- Pricing is correct
- Free Audit is safe and honest
- No public page implies fake live capabilities

### Phase 3 — Client Portal Pre-Live Completion

**Purpose:** Make the Client Portal feel complete for a first restaurant partner in demo/review mode.

**Allowed work:**

- Client Dashboard polish
- Client Media upload flow polish without real storage
- Client Media library organization
- Request Center polish
- Updates polish
- Reports polish
- Onboarding preview
- Content guidance screen
- Client mobile pass
- Client-safe language guardrails

**Forbidden work:**

- Real file storage
- Real client data
- Production auth
- Live AI
- Auto-sent client messages

**Exit criteria:**

- Client can understand exactly how to use Veroxa
- Client-side language is premium and safe
- Demo/review mode is honest
- No live capability is implied

### Phase 4 — Team Portal + Internal Workflow Completion

**Purpose:** Make the Team Portal operational enough for Faraz to run first clients manually.

**Allowed work:**

- Team Dashboard Today View final pass
- Upload Inbox polish
- Work Queue polish
- Direction Queue polish
- Report Queue polish
- Approval Queue polish
- Visibility Audit polish
- Audit Leads polish
- First-Client Readiness final pass
- Team mobile pass

**Forbidden work:**

- Live publishing
- Live storage
- Live AI
- Google/Meta/TikTok connectors
- Owner/Operator dashboards
- Automated customer-visible execution

**Exit criteria:**

- Faraz can see what to review, approve, queue, ask client, or hold
- Team side is calm and action-focused
- Internal queues support manual first-client operations
- No fake execution is shown

### Phase 5 — Rule-Based Automation + Manual Execution Launch Gate

**Purpose:** Build deterministic assistance and manual execution tracking before live AI/storage/connectors.

**Allowed work:**

- Rule-based media review assist
- Rule-based caption/draft templates
- Brand voice guard
- Scheduling suggestion engine
- Report draft builder
- Alert/risk engine
- Copy/paste execution pack
- Manual publishing tracker
- Client confirmation workflow
- Pre-live launch gate

**Forbidden work:**

- OpenAI runtime calls
- Cloud storage
- Direct platform publishing
- Google/Meta/TikTok API calls
- Payments
- Automated public/customer-visible changes

**Exit criteria:**

- Veroxa can prepare work manually and safely
- Faraz has review/approval controls
- Client confirmation workflow protects business-truth changes
- Pre-live launch gate confirms readiness before future live integrations

## Usage Rules

- One phase per prompt
- RR after every PR
- Do not skip phases
- Do not build future phases early
- Newest Faraz instruction + `AGENTS.md` + this build map are authority sources
- Future live integrations require explicit approval
- If a future prompt conflicts with this build map, stop and clarify before building

## Full SaaS Foundation design reference

For the next Full SaaS Foundation design and guardrail plan, see `CLIENT_PORTAL_FULL_SAAS_FOUNDATION_DESIGN.md`. The pre-live build map remains review-mode until a later RR-approved runtime phase enables production SaaS behavior.
