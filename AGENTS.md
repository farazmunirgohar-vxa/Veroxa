# Veroxa Agent Instructions

This file is the repo-level operating guide for Codex and any coding agent working on Veroxa. If a task prompt conflicts with this file, follow the user's newest explicit instruction. Otherwise, treat this file as the locked Veroxa working model.

## 1. Product identity

Veroxa is an AI-assisted, automation-powered restaurant online presence and customer-growth operating system.

It is not just a website, portal, content scheduler, or traditional marketing agency dashboard.

The restaurant partner should experience Veroxa as simple, premium, calm, and low-effort. Veroxa should do the maximum practical work behind the scenes.

## 1A. Founder OS strategy

Veroxa OS is for Faraz first: the Founder/Team OS is the brain, while the Client Portal and Team Portal are supporting modules that help Faraz review, approve, and communicate work calmly. The Restaurant Opportunity Engine is central; Veroxa exists to help Faraz identify right-fit restaurants and create customer opportunity lift, not chase posting volume.

Public positioning stays: “We help restaurants become easier to find, easier to trust, and easier to choose.” Internally, the target is helping good-fit restaurants realistically move toward 3–5 daily customer opportunities in 60–90 days, but this is never public/client-facing guarantee language. Good-fit restaurants include those already paying more for weak results, weak communication, unclear reporting, or inconsistent execution. Bad-fit restaurants should be rejected or delayed.

## 2. Current active roles

Active roles today:

1. Restaurant Partner / Client
2. Veroxa Team / Faraz

Team currently means Faraz. The system is being built so Faraz can handle most human review from mobile or computer.

Owner and Operator are parked unless explicitly requested by the user. Do not build Owner/Operator dashboards or workflows unless the user specifically asks.

## 3. Current active build stack

The current active Veroxa build stack is GitHub + Codex + Vercel:

- GitHub main is the source of truth.
- Codex is the primary engineering/build agent.
- Vercel is the deployment target.
- Browser/manual QA is used for visual checks.

## 4. Default Codex workflow

For the active five-phase pre-live roadmap, see `artifacts/veroxa/docs/VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md`.

Before any large build, also run through `artifacts/veroxa/docs/PRE_BUILD_STABILITY_CHECKLIST.md` to protect Vercel config, temp login, audit search, public pricing, public metadata, and SaaS safety.

Every Codex prompt should begin conceptually with:

Pull latest origin/main before making any new changes.

Create a branch for the task.

Read the prompt completely and carefully before making changes.
Understand all stages of the full prompt.
Plan the work before editing.
Stage and build each component of the prompt in order.
Do not skip stages.
Do not rush ahead into features not requested.

For Codex:

- Pull latest origin/main before making any new changes.
- Create a branch for the task.
- Do not push directly to main.
- Open a PR when finished.

## 5. Locked pricing

Do not change pricing unless explicitly instructed by the user. The user’s newest explicit instruction overrides stale repo docs.

Current locked public launch offer:

- Complete Online Presence: $495/month
  - Google Business Profile support
  - Google Maps/local visibility basics
  - Local SEO/search visibility basics
  - Yelp business profile alignment/refinement
  - Basic website alignment/refinement if access is provided
  - Business info consistency across Google/Yelp/website/socials
  - Facebook support
  - Instagram support
  - Picture-based content support
  - Up to 3 total posts/updates per week, media dependent
  - Simple captions
  - Basic content organization
  - Media guidance/reminders
  - Client Portal access
  - Portal request response/review/answer within 24 hours
  - Monthly online presence report
  - Veroxa team review before anything goes live

No public demo promotion. Public flow is Home -> Audit -> Login. Do not promote public demo routes, public Client Demo CTAs, or a public Services/Pricing split as the main sales flow. Starter, Growth, Premium, Local Presence, Full Presence, and old Complete Presence are historical/deprecated/internal aliases only and must not appear as active public offers.

Coming soon / not included at launch: TikTok support, Reels/video content support, ads management, daily posting, automated publishing, and live integrations.

Not included: comments, DMs, inboxes, customer-service replies, refunds, complaints, order questions, full website redesign/development, custom website builds, hosting/domain/email troubleshooting, advanced technical SEO, paid ad spend, or guaranteed orders/revenue/rankings/profit.

Global launch rules:

- No contract.
- Cancel anytime.
- Ad spend is always separate and paid by the restaurant directly to the ad platform if future ads are approved.
- Posting depends on usable client-provided media and may slow when usable media is unavailable.
- Portal requests are the normal routine communication channel; Veroxa responds/reviews/answers within 24 hours, but this is not a completion promise.
- No routine text/call workflow for normal service requests.
- Veroxa does not invent discounts, BOGO offers, price cuts, lower prices, or new promotions. If a restaurant already has an offer/promotion, Veroxa may ask the client to confirm exact details before preparing public copy.
- No public/client-facing guarantee language for orders, profit, ROI, customers, revenue, rankings, walk-ins, or growth.
- Build Veroxa to about 90% complete in preview/manual/pre-live mode before paying for outside/live systems; future paid systems should plug into prepared interfaces.

## 5A. Profit Fit Layer

The Restaurant Opportunity Engine must include an internal-only Profit Fit Layer. Veroxa sells online presence publicly, but internally Veroxa must evaluate whether a restaurant can realistically create profitable online-influenced orders/actions through better online presence.

Internal break-even formula:

`requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30`

Default conservative assumptions: $15 average ticket, 5% net margin, 30 days/month. Online-influenced actions/orders include online orders, phone clicks that become orders, direction/address clicks that become visits, menu/order-link clicks, Google profile actions, customer mentions such as “I saw you online,” social content that drives ordering/visits, and repeat-customer attention driven by online presence.

Profit Fit language and exact break-even order math are team/internal only. Do not expose exact targets to public/client pages, and do not say Veroxa makes restaurants profitable.

## 5B. Profit validation and online-influenced action layer

Veroxa sells online presence publicly, but internally validates whether the work is becoming cost-justifiable through profitable online-influenced orders/actions. This is internal only and is not public/client-facing guarantee language.

- Starter internal 2-month proof standard: 20 online-influenced actions/day for right-fit restaurants.
- 2–3 months: service delivery plus cost justification through tracking setup, Google/Maps cleanup, best sellers, and order/contact paths.
- 6–9 months: profit progress should be visible through careful signal review, not service delivery volume alone.
- 12 months: online presence should be reviewed as a meaningful order channel when attribution confidence is strong enough.
- Tracking hierarchy: business outcome signals, conversion/action signals, attention signals, engagement signals, and execution signals.
- Attribution confidence must stay explicit: confirmed, strong signal, directional, owner reported, or unknown.
- Break-even progress and exact proof math are internal only and must not appear as public/client guarantees.

## 6. Routing rules

Do not merge demo and login flows.

- Demo Preview -> /demo/client/dashboard
- Portal Access -> /login
- Login -> /login
- Client login -> /client/dashboard
- Team login -> /team/dashboard
- /demo/client/dashboard remains the only public demo preview
- /demo/team/\* is deprecated/not active and must not be promoted
- /team/\* remains a real Team/Internal Admin review route guarded by InternalDemoGuard until production auth is explicitly requested
- /client/\* remains a real Client Portal review route until production auth is explicitly requested
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

First 5 clients are the pre-launch readiness benchmark: healthy Starter, Starter with low media, Growth with strong media/cooperation, Growth with inconsistent uploads, and a client eligible for Premium assessment. Build client-side readiness first; heavy Team/Internal Admin AI automation comes later.

## 16. Full SaaS Foundation design control

For the next Full SaaS Foundation design and guardrail plan, see `artifacts/veroxa/docs/CLIENT_PORTAL_FULL_SAAS_FOUNDATION_DESIGN.md`. This reference does not mark production SaaS as built; production auth, migrations, storage uploads, live AI, connectors, and payments still require explicit RR-approved implementation work.

## 17. Client Portal Full SaaS Foundation Phase 1 scaffold

Phase 1 SaaS foundation scaffolding is present as TypeScript-only contracts and safety boundaries. `artifacts/veroxa/src/domain/saas/` contains `SaasDataMode`, account/user/restaurant models, repository contracts, placeholder repository and demo repository adapters, a `RepositoryBundle` selector, activity log scaffolding, and `ProfitValidationSnapshotRecord` hooks. This is not production SaaS runtime: production DB/auth/storage is still not connected, demo fixture leakage is guarded, and any future production adapter requires RR approval before implementation or wiring.

## 2026-06-03 — Client Portal Full SaaS Foundation Phase 2 account/data-flow buildout

- Built the deterministic account activation model for demo-only, prospect review, onboarding, client portal ready, team review ready, active manual service, paused, canceled, and archived states.
- Built normalized client portal page state and team portal repository state models so UI surfaces can read through repository/data-mode boundaries instead of mixing demo and real-route behavior.
- Expanded repository contracts and placeholder/demo adapters with client dashboard, media, request, update, report, team repository, activity preview, account activation summary, and profit validation snapshot methods.
- Updated client portal pages to show richer repository-driven demo states while keeping real guarded routes in premium, client-safe setup states.
- Updated team portal surfaces to show account/data-mode visibility, demo-vs-placeholder labels, activity log preview status, and internal profit validation snapshot previews.
- Integrated non-persisted activity log previews and internal-only profit validation snapshot previews without production writes.
- Production runtime is still not connected: no production auth enablement, database tables, migrations, RLS policies, storage uploads, payments, live AI, or publishing integrations were added.
- Next recommended phase: RR-approved production adapter design and test harness planning before any real auth/database/storage wiring.

## 2026-06-04 — Current Veroxa OS sync markers

- Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.
- Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.
- Active stack remains GitHub + Codex + Vercel; Replit is historical only.
- Active roles remain Client and Team. Owner/Operator are inactive and parked, including Super Admin, generic Admin, and Execution roles.
- Veroxa is AI-ready but not connected: deterministic drafts and approval gates can be built now; live AI stays blocked until a future approved activation.
- Veroxa is integration-ready but not connected: adapter contracts and UI states can be planned now; production auth, storage, Google/Meta/TikTok APIs, payments, webhooks, cron jobs, and automated publishing stay blocked.
- Restaurant Onboarding is a known OS gap and should first be built in preview/manual mode.
- Current PR philosophy: PR #59 style is the ideal normal major build size around 3,000 meaningful changes across 20-30 files; justified big builds may approach 5,000 meaningful additions/deletions; hotfixes stay surgical; no fake churn.
- Current preview credentials: [faraz@client.com](mailto:faraz@client.com) / farazclient and [faraz@team.com](mailto:faraz@team.com) / farazteam.
- `AUTH_MODE` remains `placeholder` until production auth is explicitly approved after the pre-paid activation gate.
