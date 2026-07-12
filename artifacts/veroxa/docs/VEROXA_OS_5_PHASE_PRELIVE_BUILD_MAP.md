# Veroxa OS — 5-Phase Pre-Live Build Map
> Do not override current docs: read `ACTIVE_DOCS_INDEX.md` first. Any old pricing, role, auth, or automation language in this file is historical/deprecated unless the active docs index confirms it.


Status: completed historical pre-live build map. It remains useful for safety and architecture context, but it does not govern the current ChatGPT-managed Sites build. `ACTIVE_DOCS_INDEX.md`, `CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md`, and `CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md` are the current authorities.

## Current Status

- Phase 5 implementation now adds deterministic rule-based assistance, manual execution packs, client confirmation workflow helpers, internal customer opportunity scoring, and a pre-live launch gate in review mode.
- Veroxa is in **pre-live mode**.
- Legacy canonical surfaces retain **pre-live/review data**, while the Sites delivery layer is the real Veroxa application surface and must not be described as a separate demo product.
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

- **Complete Online Presence — $495/month** is the only active public offer.
- **New basic website +$95** and **missing Facebook/Instagram profile creation +$45/profile** are the launch add-ons.
- Starter $295, Growth $495, Premium $995, Local Presence, Full Presence, and old Complete Presence are historical/deprecated only.
- No contract
- Cancel anytime
- Up to 3 posts/updates per week, media dependent
- Yelp, TikTok, Reels/video, ads management, daily posting, automated publishing, and live integrations are coming soon/not included at launch
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

## 2026-06-03 pricing/profit-fit alignment

- Historical note: Starter $295/month, Growth $495/month, and Premium $995/month are deprecated/archive-only and are not active public pricing. Current public pricing is Complete Online Presence — $495/month.
- Growth is the main recommended package for strong-fit restaurants; Starter is the low-friction entry plan; Premium is selective and readiness-gated.
- Premium requires readiness assessment, client approval, and an agreed ad budget; ad spend is separate.
- Profit Fit Layer is internal/team-only and uses `requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30` with conservative defaults of $15 average ticket and 5% net margin.
- Online-influenced orders/actions include online orders, phone/order clicks, direction/address clicks that become visits, menu/order-link clicks, Google profile actions, customer mentions, social content-driven visits, and repeat-customer attention.
- Public/client surfaces must not promise orders, profit, ROI, customers, revenue, rankings, or exact order targets.
- This update does not mark production auth, migrations, storage, live AI, connectors, payments, or runtime SaaS wiring as built.
## Profit validation and online-influenced action layer (internal only)

Veroxa sells online presence publicly, but internally validates whether the work is becoming cost-justifiable through profitable online-influenced orders/actions. This is an internal operating model, not public/client-facing guarantee language.

- Starter internal 2-month proof standard: 20 online-influenced actions/day for right-fit restaurants.
- 2–3 months: service delivery plus cost justification through tracking setup, Google/Maps cleanup, best sellers, and order/contact paths.
- 6–9 months: profit progress should be visible through careful signal review, not service delivery volume alone.
- 12 months: online presence should be reviewed as a meaningful order channel when attribution confidence is strong enough.
- Tracking hierarchy: business outcome signals, conversion/action signals, attention signals, engagement signals, and execution signals.
- Attribution confidence must stay explicit: confirmed, strong signal, directional, owner reported, or unknown.
- Break-even progress and exact proof math are internal only and must not appear as public/client guarantees.

No runtime SaaS implementation is added by this layer: no production auth, database migrations, storage uploads, live AI, connectors, payments, or real client data writes.

## 2026-06-03 — Client Portal Full SaaS Foundation Phase 1 scaffold

- Phase 1 SaaS foundation scaffolding has been added as TypeScript contracts and guardrails only.
- `SaasDataMode`, future restaurant/account/user/media/request/action/report/activity domain models, repository interfaces, placeholder repository adapters, demo repository adapters, and a `RepositoryBundle` selector now exist.
- Activity log scaffolding exists through `ActivityLogRepository` contracts and preview helpers; no future write should ship without activity logging.
- Profit validation persistence hooks now include `ProfitValidationSnapshotRecord` for team/internal-only snapshot previews.
- Production DB/auth/storage is still not connected: no production auth, migrations, RLS policies, storage uploads, live AI, connectors, payments, or real client data writes are enabled.
- Demo fixture leakage is guarded with `assertNoDemoFixturesInAuthenticatedMode`; `/client/*` and `/team/*` cannot use demo/sample fixtures once authenticated real mode is enabled.
- A future production adapter requires RR approval before implementation or wiring.

## 2026-06-04 — Current Strategy Sync (superseded where noted by the 2026-07-12 protocol)

The five-phase map now operates under the current no-paid-infrastructure strategy: Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated. Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.

Current alignment markers:

- Active stack: ChatGPT-managed GitHub + Codex + ChatGPT Sites; Vercel is temporary rollback only and Replit is historical.
- Active roles: Client and Team. Owner/Operator are inactive and parked.
- `AUTH_MODE` remains `placeholder`.
- Current pricing: Complete Online Presence — $495/month. Starter $295, Growth $495, and Premium $995 are deprecated/archive-only.
- Legacy preview-only credential strings are retired from active operating guidance and must never be reused as production authentication.
- AI-ready but not connected workflows can be built now; real AI connects later only after the pre-paid gate.
- Integration-ready but not connected workflows can be planned now; paid/live providers connect later only after the pre-paid gate.
- Restaurant Onboarding is a known gap and should be added as a future preview/manual OS layer.
- PR #59 style is the ideal normal major build size around 3,000 meaningful changes across 20-30 files; justified big builds may approach 5,000 meaningful additions/deletions; no fake churn.
