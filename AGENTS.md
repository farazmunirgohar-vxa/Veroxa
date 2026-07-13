## 2026-07-12 — Current milestone and mandatory continuity update

- Read `artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md` first for the current scope, priority, verified state, and next build.
- Momo's House San Antonio is the only operational client and restaurant workspace for the current milestone.
- Team Faraz is Momo-focused. The only capability for non-client restaurants is the standalone, fully functional Restaurant Audit Center.
- An audited restaurant remains a Team-owned audit record or prospect and does not become an operational client unless Faraz separately and explicitly approves conversion.
- The current milestone is Momo's House San Antonio 100% readiness with maximum safe AI, automation, social handling, SEO, approved publishing, reporting, monitoring, and human approval control.
- After every build, update `VEROXA_CURRENT_MILESTONE.md`, `CURRENT_BUILD_STATUS.md`, relevant runtime/deployment truth, and Faraz's plain-language handoff. Update locked memory when durable scope, authority, or product direction changes. A build is not complete until this continuity update is done.
- Older instructions that defer Team Portal capability, prioritize broad public/client work, or use the earlier post-cutover route-parity sequence are superseded for this milestone. Historical multi-client prospecting applies only inside the Restaurant Audit Center and does not authorize another operational client.
- Current deployed baseline is PR #142 at `9a905c822f084fd2df5c9a2cb87c1a8286647e59`, verified as Sites version 8 with all eight production migrations applied. The current branch is reserved for planned PR #143, which is not opened and not merged; its ninth migration is not applied and its Sites candidate is not published. Approved-user password sign-in, secure-email-link recovery, active Momo membership authorization, RLS, durable audit intake, and protected portal routes are live; Faraz confirmed password sign-in. Hosted reauthentication and old-session revocation remain unverified, while Momo client identity/data, AI, external integrations, publishing, and activation remain gated.

## 2026-07-12 — ChatGPT-managed build, GitHub, and deployment protocol

- Faraz uses ChatGPT as the primary Veroxa command center. Faraz and ChatGPT decide the next outcome together; ChatGPT invokes Codex and connected GitHub/Sites tools internally. Do not require Faraz to copy prompts into a separate Codex, GitHub, Sites, terminal, or IDE window for routine work.
- Read `artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md` before planning, building, reviewing, merging, or deploying Veroxa.
- `Build it` authorizes the agreed branch, Codex implementation, tests, pull request, CI/RR fixes, and merge of the exact reviewed commit only after the green gate passes. It does not authorize a Sites deployment unless deployment was explicitly included.
- `Build it, but hold for review` stops at a verified green pull request and does not merge or deploy.
- `Build and deploy it` authorizes the green merge plus synchronization of the exact merged GitHub state to Sites, checkpoint deployment, and live/custom-domain verification.
- `RR` means deep review and reasonable safe fixes; `RR` alone does not authorize merge, deploy, activation, or scope expansion.
- GitHub `main` remains canonical. A GitHub merge and a Sites deployment are separate actions; do not leave live Sites behavior ahead of GitHub source of truth.
- Pause for specific Faraz direction when scope materially expands into production auth or credentials, real customer data/privacy, destructive data or production migrations, billing/payments, external integrations or publishing, owner/client contact, business-truth or public-promise changes, DNS/domain-record changes, Momo activation/walkthrough, or a material product-direction change.

## 2026-07-12 — ChatGPT Sites migration and RR source-of-truth lock

- Faraz explicitly approved building the real Veroxa application through ChatGPT Sites using the existing GitHub/Codex Veroxa OS as the core skeleton.
- This is not a new demo and must not replace Veroxa with a shallow visual prototype.
- GitHub `main` remains the canonical source of truth for product behavior, routes, operating memory, guardrails, and build direction.
- ChatGPT is Faraz's primary operating interface and invokes Codex as the engineering workflow.
- ChatGPT Sites is the primary application/deployment surface.
- Vercel is retired. ChatGPT Sites is Veroxa's sole deployment and hosting surface.
- Read `artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md` before changing hosting, routes, access, authentication, or the custom domain.
- `veroxasystems.com` and `www.veroxasystems.com` are attached with active SSL. Preserve GitHub/Sites parity, mobile/build validation, honest public-shell labeling, domain verification, and rollback after each authorized deployment.
- When Faraz asks for `RR`, perform a deep GitHub review plus ChatGPT Sites integration review. Fix reasonable code, docs, guardrail, CI, security, and direction drift without silently activating real-world systems.
- The Sites migration did not by itself authorize identities, credentials, customer data, external integrations, AI provider calls, publishing, or the Momo owner walkthrough. The later scoped Supabase release now provides production Team authentication and Momo/Audit persistence; no Momo client identity, owner-confirmed data, provider connection, publishing, or owner walkthrough is active.

## 2026-06-21 — Historical post-PR120 source-of-truth operating lock

This section records the retired Vite/Vercel state at PR #120. It does not override the current PR #142 Sites/Supabase baseline above.

- Current operating baseline: merged PR #120 — Momo Internal Dry Run + Go/No-Go Gate.
- PR #119 AI Draft Approval Queue is merged/completed.
- PR #120 Momo Internal Dry Run + Go/No-Go Gate is merged/completed.
- PR #121 was closed unmerged and is not active source-of-truth.
- PR #122 was closed/not used and is not active source-of-truth.
- Older Momo owner walkthrough and launch QA docs are historical/blocked references only unless Faraz explicitly reactivates them later.
- No future agent should assume the Momo owner walkthrough is approved.
- No future agent should assume activation comes next.
- No future agent should enable real auth, external integrations, publishing, AI provider calls, platform tokens, or real client accounts/data exposure unless a later prompt explicitly approves that exact scope.
- Historical markers only: “AUTH_MODE remains placeholder” and “/api/pilot-access remains active” described the retired Vite/Vercel path and are not current Sites requirements.
- Roles remain client/team only.
- Momo owner walkthrough remains blocked.
- No next activation PR is approved by default.
- Future real-world activation, real-auth activation, external platform setup, owner walkthrough, or real client accounts/data exposure requires separate explicit Faraz approval.

# Veroxa Agent Instructions

Current docs authority: read `artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md` first, then `artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md`, then `artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md`. Do not override the current milestone, active docs index, locked operating memory, `PRICING_SOURCE_OF_TRUTH.md`, or `CURRENT_BUILD_STATUS.md` with older current-looking docs or archived strategy notes.

## 2026-06-14 — Automation-first Momo pivot

- Faraz’s latest direction is automation-first before any Momo owner walkthrough: Veroxa should be live and automatic enough to operate with minimum human interference before Momo is walked through the owner experience.
- Do not assume or revive the old manual-first Momo walkthrough path unless Faraz explicitly says to use a manual-first walkthrough again. Older manual/pre-live walkthrough docs are historical/stale for the current Momo path.
- Automation may prepare and process internal Veroxa work, drafts, classifications, activity records, and Team review items.
- Public/customer-visible actions still require Veroxa/Faraz approval before anything goes live.
- Business-truth changes still require client confirmation before approval or execution, including hours, menu, prices, offers, links, sensitive claims, and complaint/reputation-impacting language.


## 2026-06-04 — 90% pre-paid OS final alignment

- Final public launch offer is still **Complete Online Presence — $495/month** with weekly updates, monthly online presence report, website alignment/refinement if access is provided, and portal request response/review/answer within 24 hours.
- **Yelp is coming soon / not included at launch**; TikTok, Reels/video content, ads management, daily posting, automated publishing, and live integrations are also coming soon / not included.
- Add-ons are **new basic website +$95** and **missing Facebook/Instagram social profile creation +$45/profile**. Yelp setup is not a launch add-on.
- First-client loyalty discount policy: **20% off for the first 12 months, then kept only while continuously active. If the client leaves and returns later, the discount no longer applies.** This is policy/copy only, not checkout/payment logic.
- Internal-only value proof: **$9,900/month** is the minimum online-influenced sales channel value baseline for a $495 client at 5% margin; healthy is $15k–$25k/month, strong is $25k+/month with clearer action signals. This is not extra new sales and must not appear on public/client pages.
- Team Portal complexity remains deferred. Current priority is public/client/onboarding/reporting/proof/request-facing 90% readiness before paid systems.
- No live auth, storage, AI, API writes, production database work, payments, publishing connectors, webhooks, cron jobs, or automated customer-visible execution were added; `AUTH_MODE` remains `placeholder`.
## 2026-06-04 — Final launch offer lock / Post-PR67 alignment

- One active public offer: **Complete Online Presence — $495/month**. Starter, Growth, Premium, Local Presence, Full Presence, old Complete Presence, $295, and $995 language are historical/internal only and must not be shown as active public pricing.
- Included at launch: Google Business Profile support, Google Maps/local visibility basics, Local SEO/search visibility basics, existing website alignment/refinement if access is provided, Facebook support, Instagram support, picture-based content support, up to 3 posts/updates per week (media dependent), weekly updates, monthly online presence report, Client Portal access, portal request response/review/answer within 24 hours, and Veroxa team review before anything goes live.
- **Yelp is coming soon / not included at launch**, along with TikTok, Reels/video content, ads management, daily posting, automated publishing, and live integrations.
- Add-ons: **new basic website +$95** and **missing social profile creation +$45/profile** for Facebook or Instagram. Yelp setup is coming soon, not a launch add-on.
- First-client loyalty discount policy: **20% off for the first 12 months, then kept only while continuously active. If the client leaves and returns later, the discount no longer applies.** This is not checkout/payment logic and must not confuse the main $495/month public offer.
- Website alignment/refinement included scope: name/address/phone, hours, menu/order/contact links, Google/Facebook/Instagram links, simple description refinement, basic local SEO wording, and small content corrections if access is provided. New basic website add-on scope is a simple mobile-friendly restaurant website with NAP/hours, menu/order/contact links, Google/Facebook/Instagram links, basic local SEO wording, and best-seller/service highlights. Not included: custom-coded website, advanced design, hosting/domain/email troubleshooting, online ordering setup, speed optimization, plugin troubleshooting, advanced technical SEO, unlimited pages/edits.
- Onboarding expectation acknowledgement must say: “I understand Veroxa does not handle...” customer-service replies, comments, DMs, inboxes, refunds, complaints, order questions, full custom website development, hosting/domain/email troubleshooting, Yelp/TikTok/Reels/Ads yet, or guaranteed orders/revenue/rankings/profit/ROI/growth; and “I agree the restaurant is responsible for...” usable media, business info confirmation, hours/menu/prices confirmation, existing offer/promotion confirmation, access when needed, customer conversations, and understanding that 24-hour response means review/answer/next step, not guaranteed completion.
- Weekly update means what Veroxa worked on, what was posted/prepared, what is pending, what media is needed, what the client needs to confirm, and what is next. Monthly report remains the deeper proof/reporting layer.
- Advanced Team OS complexity is later. Current focus is public/client/onboarding/reporting/proof/request-facing 90% before paid systems. Team surfaces should remain stable and action-focused; do not add complex Team command-center features unless explicitly requested.
- No live auth/storage/AI/connectors/payments/API writes, publishing, webhooks, cron jobs, production database work, or automated customer-visible execution are added or allowed in this alignment. `AUTH_MODE` remains `placeholder`.


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

The current active Veroxa build stack is ChatGPT-managed GitHub + Codex + ChatGPT Sites:

- ChatGPT is Faraz's primary operating and orchestration interface.
- GitHub `main` is the canonical source of truth.
- Codex is the engineering/build capability ChatGPT invokes internally.
- ChatGPT Sites is the primary application/deployment surface.
- Vercel is retired and must not be restored as a deployment or rollback path.
- Until the legacy Vercel Git integration is disconnected in its dashboard, the exact root shutdown sentinel may set only `git.deploymentEnabled: false`. It is not a runtime or rollback path; do not add any other Vercel configuration, and remove the sentinel after disconnection.
- Browser/manual QA is used for visual checks.

## 4. ChatGPT-managed build and merge workflow

For completed historical pre-live sequencing and safety context, see `artifacts/veroxa/docs/VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md`. It does not govern the current Sites roadmap.

Before implementing PR 100+ live automation work, read `artifacts/veroxa/docs/LIVE_AUTOMATION_V1_ARCHITECTURE.md`.

Before any large build, also run through `artifacts/veroxa/docs/PRE_BUILD_STABILITY_CHECKLIST.md` to protect the Sites hosting identity and source sync, auth boundaries, audit search, public pricing, metadata, and SaaS safety.

Command meanings and the complete green gate live in `artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md`:

- `Build it`: refresh current `main`, create a task branch, implement with Codex, test, open/update the PR, run RR, repair CI, re-check the exact reviewed head and mergeability, and merge only when green. After every build, update the milestone, build status, relevant runtime truth, and Faraz's plain-language handoff; update locked memory when a durable decision changes. Do not deploy Sites unless requested.
- `Build it, but hold for review`: complete the same engineering and verification work, then stop at the green PR without merge or deployment.
- `Build and deploy it`: complete the green merge, synchronize the exact merged GitHub source to Sites, run Sites verification, checkpoint/deploy, and verify access plus custom-domain health.
- `RR`: review and safely fix; do not infer merge or deployment authority from RR alone.

Green requires correct scope, applicable local tests/typecheck/lint/build and guardrails, successful required GitHub checks, Sites verification when Sites changes, a mergeable PR whose exact head is unchanged since final review, and no unresolved actionable review thread or known critical/high-severity defect. Never push directly to `main`.

## 5. Locked pricing

Do not change pricing unless explicitly instructed by the user. The user’s newest explicit instruction overrides stale repo docs.

Current locked public launch offer:

- Complete Online Presence: $495/month
  - Google Business Profile support
  - Google Maps/local visibility basics
  - Local SEO/search visibility basics
    - Existing website alignment/refinement if access is provided
  - Business info consistency across Google/website/socials
  - Facebook support
  - Instagram support
  - Picture-based content support
  - Up to 3 total posts/updates per week, media dependent
  - Simple captions
  - Basic content organization
  - Media guidance/reminders
  - Client Portal access
  - Portal request response/review/answer within 24 hours
  - Weekly updates
  - Monthly online presence report
  - Veroxa team review before anything goes live

No public demo promotion. Public flow is Home -> Audit -> Login. Do not promote public demo routes, public Client Demo CTAs, or a public Services/Pricing split as the main sales flow. Starter, Growth, Premium, Local Presence, Full Presence, and old Complete Presence are historical/deprecated/internal aliases only and must not appear as active public offers.

Coming soon / not included at launch: Yelp, TikTok support, Reels/video content support, ads management, daily posting, automated publishing, and live integrations.

Not included: comments, DMs, inboxes, customer-service replies, refunds, complaints, order questions, full website redesign/development, custom website builds beyond the +$95 basic website add-on, hosting/domain/email troubleshooting, advanced technical SEO, paid ad spend, or guaranteed orders/revenue/rankings/profit.

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

## 2026-06-04 — Current Veroxa OS sync markers (superseded where noted by the 2026-07-12 protocol)

- Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.
- Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.
- Active stack is ChatGPT-managed GitHub + Codex + ChatGPT Sites; Vercel and Replit deployment paths are retired/historical.
- Active roles remain Client and Team. Owner/Operator are inactive and parked, including Super Admin, generic Admin, and Execution roles.
- Veroxa is AI-ready but not connected: deterministic drafts and approval gates can be built now; live AI stays blocked until a future approved activation.
- Veroxa is integration-ready but not connected: adapter contracts and UI states can be planned now; production auth, storage, Google/Meta/TikTok APIs, payments, webhooks, cron jobs, and automated publishing stay blocked.
- Restaurant Onboarding is a known OS gap and should first be built in preview/manual mode.
- Current PR philosophy: PR #59 style is the ideal normal major build size around 3,000 meaningful changes across 20-30 files; justified big builds may approach 5,000 meaningful additions/deletions; hotfixes stay surgical; no fake churn.
- Legacy preview-only credential strings are retired from active operating guidance and must never be reused as production authentication.
- `AUTH_MODE` remains `placeholder` until production auth is explicitly approved after the pre-paid activation gate.
