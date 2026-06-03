# Full 5-Phase Veroxa OS RR / Product Audit

Audit date: 2026-06-02

Branch: `codex/full-5-phase-veroxa-os-rr-audit`

Scope: audit-only review after Phase 1 through Phase 5 and Founder OS alignment cleanup. This document intentionally does not add features, routes, auth, storage, integrations, pricing changes, or UI redesigns.

## 1. Executive verdict

**WATCH — Veroxa is ready for a disciplined Full SaaS Foundation planning phase, but not ready to turn on Full SaaS runtime systems yet.**

The current repository shows a strong pre-live Veroxa OS foundation:

- Public positioning is mostly aligned to “easier to find, easier to trust, and easier to choose.”
- Pricing is locked to Starter `$295`, Growth `$495`, and Premium `$995` across the pricing source and active public pricing surfaces.
- Public, client, demo, and team route separation is guarded.
- The Team / Founder OS is now more central than the Client Portal and supports Faraz-first review decisions.
- Phase 5 deterministic automation helpers are intentionally rule-based, review-mode, and manual-execution oriented.
- Guardrail and verification coverage is broad and currently passes when the required Corepack workaround is used in this environment.

However, Full SaaS Foundation should not start by wiring live systems immediately. The next safest build phase should be a **Full SaaS Foundation Design + Guardrail Prep phase** that creates the production auth/data/security architecture and tests before enabling production writes or real customer data.

### Readiness labels

- **PASS:** Pre-live product story, public boundaries, pricing, route separation, client-safe copy, Team OS review posture, deterministic helper model, and existing verification suite.
- **WATCH:** Real portal routes are guarded but still operate in placeholder/review mode; many future pages exist as inventoried but unrouted files; build output logs sourcemap warnings even though build exits successfully.
- **FIX BEFORE NEXT ERA:** Add SaaS-era guardrails before production auth/storage/data writes: route isolation assertions, RLS/security test plan, real-client-data language scan, fixture/sample leakage scan, connector activation gates, and account-state/billing-state checks.
- **BLOCKER:** The local repository has no `origin` remote configured, so `git pull origin main` could not be completed. This blocks proof that the audit branch was based on latest GitHub `main` inside this environment. Also, direct `pnpm` commands fail in this environment because Corepack attempts to download `pnpm@10.26.1` through a blocked proxy; the documented `COREPACK_ENABLE_PROJECT_SPEC=0` workaround passes.

## 2. Current Veroxa status

**PASS — Current state is a strong pre-live operating system, not a live SaaS product.**

Observed state:

- Veroxa is organized around two active roles: Restaurant Partner / Client and Veroxa Team / Faraz.
- Owner / Operator dashboards remain parked and should stay parked unless explicitly requested.
- The app has public website routes, public demo routes, guarded Client Portal routes, and guarded Team Portal routes.
- Real `/client/*` and `/team/*` routes are separated from public demo routes and are wrapped in guards and a real-portal data boundary.
- Public demo pages can show sample data; real portal pages should stay in review/empty/benchmark states until live account data is connected.
- Phase 5 helpers prepare deterministic suggestions and manual execution packs; they do not publish, call live AI, write platform data, or fabricate metrics.

**WATCH — Status language remains pre-live.** The system is usable for first-client walkthroughs and internal review, but it is not production SaaS. Full SaaS Foundation still requires production auth, database schema, RLS/security model, storage, persistence, account isolation, audit logs, and integration safety.

## 3. What is complete

**PASS — Completed foundations observed.**

1. **Public website foundation:** Homepage, Services, Pricing, Free Audit, Demo Hub, public nav, and footer are present and routed.
2. **Pricing source of truth:** `veroxaPricing.ts` centralizes locked plan prices, no-contract language, ad-spend separation, Premium readiness requirements, posting limits, and customer-service boundaries.
3. **Route separation:** Public routes, public client demo routes, guarded client routes, and guarded team routes are present in `App.tsx`.
4. **Client Portal pre-live surface:** Client Dashboard, Media, Requests, Updates, and Reports are present with client-safe language and review-mode data boundaries.
5. **Team / Founder OS surface:** Team Dashboard, Upload Inbox, Work Queue, Direction Queue, Report Queue, Approval Queue, Visibility Audit, Audit Leads, and First-Client Readiness are present.
6. **Opportunity Engine foundation:** Audit scoring, internal lead scoring, lead intelligence, visibility audit, first-client readiness, and customer-opportunity scoring concepts exist and are Team-side/internal.
7. **Rule-based automation foundation:** Caption templates, brand voice checks, manual scheduling suggestions, report draft building, manual execution packs, confirmation workflow, customer opportunity scoring, and team alerts are implemented as deterministic helpers.
8. **Guardrail suite:** Route smoke, route inventory, business guardrails, client product language, team cockpit, first-client readiness, public cleanup, pricing drift, docs/model alignment, pilot positioning, media lifecycle, API security, and dev auth/write safety checks exist.
9. **CI workflows:** `ci.yml` and `veroxa-verify.yml` run typecheck/build/guardrail checks on PRs and main pushes.

## 4. What is strong

**PASS — Product model clarity is the strongest part of the current system.**

- The repo-level operating model consistently says Veroxa OS is for Faraz first, with the Founder/Team OS as the brain and the Client Portal as a supporting module.
- Google Maps / local visibility is treated as core rather than an add-on.
- The system avoids fake live execution by using “review,” “approval,” “hold,” “queue,” and manual execution language.
- The client-side portal is calm and avoids obvious internal system language in active client pages according to the guardrail suite.
- Team pages surface “what Faraz should open first” instead of behaving like a generic analytics dashboard.
- Pricing guardrails are strong and automated.
- Route inventory is unusually helpful because it distinguishes active routed pages from future planned, internal debug, and legacy quarantined pages.
- The deterministic automation helpers are reusable building blocks for a future SaaS system because they are pure rule functions that can later sit behind authenticated service logic.

## 5. Issues found

### BLOCKER — Pull latest could not be completed

`git pull origin main` failed because this local checkout has no configured `origin` remote. The audit branch was created from the current local branch instead.

Minimal fix: configure the GitHub remote for this checkout, then re-run `git fetch origin main` / `git pull origin main` before merging or using this audit as final source-of-truth.

### WATCH — Direct pnpm commands fail without workaround in this environment

Every direct `pnpm ...` verification command attempted to use Corepack to download `pnpm@10.26.1` and failed behind a proxy with `Proxy response (403) !== 200 when HTTP Tunneling`. The task-provided workaround, `COREPACK_ENABLE_PROJECT_SPEC=0`, succeeded for all required checks.

Minimal fix: align Corepack/pnpm setup in the execution environment so direct `pnpm` can run without network download attempts, or document the workaround for this environment.

### WATCH — Build succeeds but emits sourcemap warnings

The Veroxa build succeeds, but Vite reports sourcemap warning messages for several UI files (`tooltip.tsx`, `label.tsx`, `progress.tsx`, `sheet.tsx`). These are not failing checks, but they should be cleaned up before production hardening if they obscure real build diagnostics.

### FIX BEFORE NEXT ERA — Full SaaS guardrails are not yet sufficient

The current guardrails are strong for pre-live review mode. They are not enough for production SaaS data/account isolation. Before enabling Full SaaS Foundation runtime behavior, add guardrails for:

- Real portal fixture/sample leakage.
- Production auth route behavior.
- Client account isolation.
- RLS/security policy presence and test coverage.
- Storage upload activation gates.
- Write-operation logging and rollback safety.
- Future connector activation gates.
- Public/client guarantee scans that include generated content and report outputs.

## 6. Risks found

### WATCH — Future pages exist and are inventoried but not active

The route inventory reports many future planned and internal/debug files. This is acceptable now because active routing remains contained, but it increases future drift risk if a page is accidentally routed before its language and data model are hardened.

### WATCH — Public demo and real portal reuse the same page components

This is efficient and currently guarded by `RealPortalDataBoundary`, but it creates a future SaaS risk: real `/client/*` and `/team/*` routes must not inherit sample data behavior when production accounts are introduced.

### WATCH — Lead/Audit intelligence can become overconfident if not gated

Audit Leads and lead intelligence are valuable for Faraz, but future data sources and outreach helpers need strict “human review required” and “not confirmed spend/results” boundaries. This is especially important where score-like internal signals could influence sales conversations.

### FIX BEFORE NEXT ERA — Persistence model is absent

Client requests, media, reports, account states, activity logs, approval decisions, and execution states still need a production persistence model. Until that exists, the system remains pre-live/review-mode.

### FIX BEFORE NEXT ERA — Billing/account-state model is not ready

Pricing is locked, but there is not yet a SaaS account lifecycle with trial/demo/client status, active plan, discount eligibility, Premium readiness state, billing state, cancellation state, or inactive state enforced by code.

## 7. Public site audit

### Homepage

**PASS**

- Positioning aligns with restaurants becoming easier to find, trust, choose, and return to.
- Homepage boundaries explicitly avoid magic growth guarantees and clarify that rankings, revenue, walk-ins, and new customers depend on restaurant and market factors.
- It states Veroxa does not handle comments, DMs, inboxes, refunds, complaints, order questions, or customer-service conversations at launch.
- CTAs are safe: Free Audit, Client Demo, and Pricing routes.

**WATCH**

- “Easy to return to” appears alongside the locked phrase. This is not a problem; it strengthens retention positioning. The exact public positioning should still remain anchored to “find / trust / choose.”

### Services

**PASS**

- Services correctly center Google Business Profile, Google Search, Google Maps, social consistency, media rhythm, reports, and Premium ads readiness.
- It avoids guaranteed growth language.
- Premium ads readiness is clearly gated by assessment, client approval, and budget.
- Launch exclusions are explicit.

**WATCH**

- Future SaaS should ensure service descriptions remain plan-aware as real account state is introduced.

### Pricing

**PASS**

- Starter, Growth, and Premium are locked at `$295`, `$495`, and `$995`.
- No contract / cancel anytime is present.
- Ad spend is separate.
- Premium requires readiness assessment, client approval, and agreed ad budget.
- Comments/DMs/customer-service boundaries are clear.
- FAQ explicitly rejects guaranteed rankings, revenue, walk-ins, or specific new-customer counts.

### Demo Hub and public nav/footer

**PASS**

- Public demo entry is separated from login/portal access.
- Public nav does not promote deprecated team demo routes.
- Footer reinforces calm public navigation and does not expose internal team surfaces.

### First-client public conversation readiness

**PASS / WATCH**

The public site is conversation-ready for first-client review, but before paid acquisition it should get manual browser smoke testing and real copy review on mobile. No feature build is required for that; it is a QA/readiness task.

## 8. Free Audit audit

**PASS**

- Free Audit avoids fake live Google/API claims and includes explicit non-guarantee / review-mode language.
- Audit recommendations map to current active packages rather than invented plans.
- The audit scoring/formatter logic is deterministic and suitable for pre-live review.
- The page supports first-client sales conversations by identifying readiness and package fit without claiming live platform lookups.

**WATCH**

- When future live lookups are added, the Free Audit must distinguish user-entered data, verified data, and platform-fetched data.
- Audit outputs should keep internal opportunity targets out of public/client-facing copy.

## 9. Client Portal audit

### Client Dashboard

**PASS**

- The client dashboard is calm and status-oriented.
- It supports pre-live demo walkthroughs without exposing internal system details.
- Real portal data boundaries prevent sample restaurant data from being treated as active account data in real `/client/*` routes.

### Client Media

**PASS**

- Media flow explains submission/review/status without claiming real storage uploads.
- Language stays client-safe and avoids internal terms based on the passing client product language check.
- Media dependency is clear enough for pre-live: usable client-provided media controls posting pace.

**WATCH**

- Before Full SaaS, media needs actual storage, upload lifecycle, moderation status, file ownership, restaurant/account isolation, deletion/retention policy, and activity logging.

### Client Requests

**PASS**

- Request flow feels like simple client direction rather than a backend ticket system.
- Statuses such as received/in review/handled/waiting-for-you are client-safe.
- It supports business-truth confirmation workflows without exposing internal approval logic.

**WATCH**

- Persistence and notification rules are missing for real clients.

### Client Updates

**PASS**

- Updates avoid fake live metrics and focus on understandable progress.
- They are suitable for client walkthroughs.

### Client Reports

**PASS**

- Weekly/monthly report sections exist.
- Guardrails check against fake percentage/ranking/revenue claims.
- Reports avoid pretending unverified outcomes exist.

**FIX BEFORE NEXT ERA**

- Reports need a source-of-truth data model before becoming production client-visible reports.

### Public Client Demo equivalents

**PASS**

- Public client demo routes exist under `/demo/client/*` and remain separate from `/client/*`.
- Demo mode can show sample data; real portals should not.

## 10. Team / Founder OS audit

### Team Dashboard

**PASS**

- Team Dashboard acts like a Founder OS cockpit with “Today’s Veroxa Work,” “Start here,” “Today at a glance,” and clear work buckets.
- It tells Faraz what to open first instead of showing generic dashboard clutter.
- Team cockpit guardrail passed.

### Upload Inbox

**PASS**

- Upload Inbox supports manual review of media and prevents live storage claims.
- It helps Faraz identify usable, blocked, duplicate, or client-input-needed media.

**WATCH**

- It remains fixture/review-mode until real storage and account isolation are introduced.

### Work Queue

**PASS**

- Work Queue supports “prepared / review / manual execution” thinking.
- It helps avoid fake live execution.

### Direction Queue

**PASS**

- Direction Queue is important and correctly supports business-truth confirmation before public use.
- It protects hours, menu, pricing, offers, dietary claims, and sensitive complaint-related work.

### Report Queue

**PASS**

- Report Queue avoids fake metrics by framing report work around verified/manual progress and reviewed work.

### Approval Queue

**PASS**

- Approval Queue preserves Faraz approval before customer-visible work.
- Prepared actions can be approved, held, skipped, or sent back for client confirmation.

### Visibility Audit

**PASS**

- Visibility Audit supports findability, trust, and choice through Google/local readiness checks.
- It correctly routes prepared visibility actions into review rather than live Google changes.

### Audit Leads

**PASS / WATCH**

- Audit Leads supports right-fit restaurant identification and internal lead scoring.
- It helps evaluate opportunity, weaknesses, and outreach posture.
- It clearly uses fictional/demo lead data in review mode.

**WATCH**

- Before real outreach or CRM-like persistence, add stronger controls around data source verification, consent/contact policy, manual send requirements, and internal score exposure.

### First-Client Readiness

**PASS**

- First-Client Readiness honestly separates demo walkthrough readiness, feedback conversation readiness, and paid-client readiness.
- It keeps blocked live integrations visible.

## 11. Restaurant Opportunity Engine audit

**PASS — The Opportunity Engine is present and directionally aligned.**

Observed components:

- Public audit scoring and report formatting.
- Internal lead scoring.
- Lead intelligence scoring and outreach draft helpers.
- Visibility audit findings.
- Rule-based customer opportunity scoring.
- Team alerts tied to media health, approvals, reports, visibility issues, Premium readiness, business-truth confirmation, held items, and inactive accounts.

Strengths:

- Supports good-fit vs bad-fit thinking.
- Centers findability, trust, choice, best-seller visibility, media freshness, Google/local readiness, client cooperation, and blockers.
- Keeps scores internal and action-oriented.

**WATCH**

- The internal target of moving good-fit restaurants toward 3–5 daily customer opportunities remains internal-only in docs/strategy. Guardrails should continue scanning public/client pages for this language as SaaS content expands.

**FIX BEFORE NEXT ERA**

- Define a production domain model for lead, prospect, client, account, audit, opportunity score, recommendation, approval, execution, and report records before data persistence begins.

## 12. Rule-based automation audit

**PASS — Deterministic and safe for pre-live review.**

Reviewed helper areas:

- `reviewMediaRules`
- `captionDraftTemplates`
- `checkBrandVoiceRules`
- `suggestManualSchedule`
- `buildRuleBasedReportDraft`
- `buildManualExecutionPack`
- `getClientConfirmationWorkflow`
- `scoreCustomerOpportunity`
- `buildTeamAlerts`

Findings:

- Helpers are deterministic and do not call live AI.
- They avoid storage, publishing integrations, messages, and metrics fabrication.
- Brand voice checks flag guarantee language, sensitive claims, aggressive complaint language, ranking claims, fake automation claims, pricing/offer claims, and unapproved dietary/health claims.
- Caption templates include confirmation requirements and risk notes.
- Manual schedule suggestions remain manual and do not imply publishing.
- Report drafts include only reviewed/verified-style progress and client needs.
- Customer opportunity scoring is internal and not suitable for direct public/client exposure.
- Business-truth changes are confirmation-gated.

**WATCH**

- Future AI integration should wrap these deterministic rules as pre/post safety checks rather than replacing them.

**FIX BEFORE NEXT ERA**

- Add unit tests for all rule helper edge cases, especially guarantee claims, dietary claims, ads readiness, customer-service boundaries, and business-truth confirmation.

## 13. Manual execution audit

**PASS**

Manual execution posture is aligned:

- Prepared work does not imply live publishing.
- Faraz approval is preserved.
- Client confirmation is required where business truth is involved.
- Manual execution packs include a checklist and report inclusion note.
- Reporting is tied to actual manual follow-through.

**WATCH**

- Before production, define manual execution state transitions: prepared, needs client confirmation, approved, manually completed, included in report, held, skipped, failed, and archived.

**FIX BEFORE NEXT ERA**

- Add persistence and audit logs for each manual execution decision before any real client work is tracked in-app.

## 14. Guardrail / CI audit

### Guardrails

**PASS**

Current guardrails cover:

- Required route presence.
- Route inventory / unrouted page classification.
- Public/client/team portal separation.
- Pricing drift.
- Business service boundaries.
- Client-safe language and fake live claims.
- Public cleanup.
- Team cockpit clutter/drift.
- First-client readiness and launch boundaries.
- Docs/model alignment.
- API security and dev auth/write safety.
- Pilot positioning.
- Media lifecycle labels.

### CI workflows

**PASS / WATCH**

- `ci.yml` runs typecheck, build, demo route guardrail, pricing drift, portal separation, business guardrails, and first-client readiness.
- `veroxa-verify.yml` runs typecheck and full `verify:veroxa`.
- Both workflows run on PRs and pushes to `main`.

**WATCH**

- CI prepares `pnpm@10.12.1`, and root `package.json` is now aligned to `pnpm@10.12.1` to reduce Corepack/environment-specific version confusion.

### Guardrails to add before Full SaaS Foundation

**FIX BEFORE NEXT ERA**

1. Production auth route behavior guardrail.
2. Client/team account isolation guardrail.
3. Fixture/sample leakage guardrail for real routes.
4. RLS/security migration presence guardrail once migrations begin.
5. Storage upload/write gate guardrail.
6. Activity-log required-on-write guardrail.
7. Connector activation gate guardrail.
8. Real report source attribution guardrail.
9. Generated content safety guardrail if AI is added.
10. Billing/account-state guardrail for plan, discount, active/canceled/inactive status.

## 15. Full SaaS Foundation readiness gaps

**FIX BEFORE NEXT ERA — Required before real SaaS runtime.**

### Production auth

Needed:

- Production auth provider selection and implementation plan.
- Client and team login flows with session handling.
- Password reset / invitation / account recovery flows.
- Role and permission model limited to active roles unless new roles are explicitly approved.

### Client accounts and team account

Needed:

- Restaurant account record.
- Client user record(s).
- Faraz/team user record.
- Account ownership and access model.
- Account lifecycle state: demo, prospect, onboarding, active, paused, canceled, inactive.

### Database schema

Needed records:

- Accounts/restaurants.
- Users/memberships.
- Plans/pricing/account state.
- Media assets and media statuses.
- Client requests/direction.
- Prepared actions.
- Approvals and holds.
- Manual execution events.
- Reports.
- Activity logs.
- Audit/visibility findings.
- Opportunity scores/internal lead intelligence.

### RLS/security model

Needed:

- Client can only access own restaurant/account data.
- Team can access operational data according to role.
- No public access to real client records.
- Service role usage restricted to server-only contexts.
- Tests for cross-client isolation.

### Real media storage

Needed:

- Upload flow.
- File metadata.
- Account-scoped buckets/paths.
- Signed URLs or equivalent access policy.
- File validation and size/type limits.
- Deletion/retention policy.
- “Submitted / Needs review / Approved / Held / Included in report” lifecycle.

### Persistence

Needed:

- Client requests persistence.
- Client updates persistence.
- Reports persistence.
- Approval decisions persistence.
- Manual execution status persistence.
- Activity logs.

### Admin/team controls

Needed:

- Faraz can view accounts, switch accounts, review work, approve/hold/ask client, and track manual execution.
- No Owner/Operator dashboards unless explicitly requested.

### Billing-ready account states

Needed:

- Plan assignment.
- First-client discount eligibility and continuity rules.
- Premium readiness and approved ad budget state.
- Active/canceled/paused/inactive lifecycle.
- Billing integration can remain future, but account-state model should be ready.

### Future AI integration safety

Needed:

- AI call approval gates.
- Prompt/output logging policy.
- Generated content safety checks.
- Business-truth confirmation enforcement.
- Public/client guarantee scanning.
- Human approval before any customer-visible output.

### Future Google/Meta/TikTok integration safety

Needed:

- Connector activation gates.
- Account-level consent and credentials model.
- Dry-run mode.
- Approval-to-execution mapping.
- Error/rollback/failure status.
- No automatic budget changes.
- Manual override and audit log.

## 16. Recommended fixes before next era

1. **BLOCKER:** Configure `origin` remote and re-run pull/fetch before this audit is treated as latest-main verified.
2. **RESOLVED TOOLING ALIGNMENT:** Root `packageManager` and CI Corepack preparation are aligned to `pnpm@10.12.1`; continue using direct pnpm verification where supported by the environment.
3. **FIX BEFORE NEXT ERA:** Add SaaS-era security/data guardrails before production auth/storage/database work begins.
4. **FIX BEFORE NEXT ERA:** Create a production domain model document for accounts, users, roles, media, requests, approvals, actions, reports, activity logs, plans, discounts, and account states.
5. **FIX BEFORE NEXT ERA:** Add rule-based automation unit tests before AI or connector expansion.
6. **WATCH:** Clean build sourcemap warnings if they start hiding real production build diagnostics.
7. **WATCH:** Keep future planned and internal/debug pages unrouted until each passes active-surface guardrails.

## 17. Recommended next build phase

**Recommended next phase: Client Portal Full SaaS Foundation — Design, Security Model, and Guardrail Prep.**

Do not start by wiring production auth, storage, or database writes. The next prompt should ask for:

1. A SaaS Foundation architecture document.
2. A route/data boundary plan for real `/client/*` and `/team/*` accounts.
3. A production auth/account/RLS schema proposal.
4. A storage/media lifecycle proposal.
5. A persistence model for client requests, reports, prepared actions, approvals, manual execution, and activity logs.
6. New guardrail scripts that fail if real routes use sample fixtures or if writes exist without account isolation/audit logs.
7. A migration/test plan, but no production migrations unless explicitly approved.

Suggested prompt title:

`Design Client Portal Full SaaS Foundation guardrails and data model — no production wiring yet`

## 18. Commands run and results

### Required execution order commands

| Command | Result | Notes |
| --- | --- | --- |
| `git pull origin main` | **BLOCKER / failed** | No `origin` remote is configured in this checkout. |
| `git checkout -b codex/full-5-phase-veroxa-os-rr-audit` | **PASS** | Branch created from current local branch. |

### Initial Stage 1 verification

Direct `pnpm` commands failed due Corepack/proxy download failure. Each required command was retried with `COREPACK_ENABLE_PROJECT_SPEC=0` per task instructions.

| Command | Direct result | Workaround result |
| --- | --- | --- |
| `pnpm run typecheck` | **WATCH / failed** Corepack proxy download | **PASS** with `COREPACK_ENABLE_PROJECT_SPEC=0 pnpm run typecheck` |
| `pnpm run verify:veroxa` | **WATCH / failed** Corepack proxy download | **PASS** with `COREPACK_ENABLE_PROJECT_SPEC=0 pnpm run verify:veroxa` |
| `pnpm --filter @workspace/scripts run check-route-smoke` | **WATCH / failed** Corepack proxy download | **PASS** with workaround |
| `pnpm --filter @workspace/scripts run check-route-inventory` | **WATCH / failed** Corepack proxy download | **PASS** with workaround |
| `pnpm --filter @workspace/scripts run check-business-guardrails` | **WATCH / failed** Corepack proxy download | **PASS** with workaround |
| `pnpm --filter @workspace/scripts run check-client-product-language` | **WATCH / failed** Corepack proxy download | **PASS** with workaround |
| `pnpm --filter @workspace/scripts run check-team-cockpit` | **WATCH / failed** Corepack proxy download | **PASS** with workaround |
| `pnpm --filter @workspace/scripts run check-first-client-readiness` | **WATCH / failed** Corepack proxy download | **PASS** with workaround |
| `pnpm --filter @workspace/scripts run check-public-cleanup` | **WATCH / failed** Corepack proxy download | **PASS** with workaround |
| `pnpm --filter @workspace/scripts run check-pricing-drift` | **WATCH / failed** Corepack proxy download | **PASS** with workaround |
| `pnpm --filter @workspace/scripts run check-docs-model-alignment` | **WATCH / failed** Corepack proxy download | **PASS** with workaround |
| `pnpm --filter @workspace/veroxa run build` | **WATCH / failed** Corepack proxy download | **PASS** with workaround; build emitted non-fatal sourcemap warnings |

### Post-document verification

Direct `pnpm` commands again failed due the same Corepack/proxy download issue. Each post-document command passed with `COREPACK_ENABLE_PROJECT_SPEC=0`.

| Command | Direct result | Workaround result |
| --- | --- | --- |
| `pnpm run typecheck` | **WATCH / failed** Corepack proxy download | **PASS** with `COREPACK_ENABLE_PROJECT_SPEC=0 pnpm run typecheck` |
| `pnpm run verify:veroxa` | **WATCH / failed** Corepack proxy download | **PASS** with `COREPACK_ENABLE_PROJECT_SPEC=0 pnpm run verify:veroxa` |
| `pnpm --filter @workspace/scripts run check-docs-model-alignment` | **WATCH / failed** Corepack proxy download | **PASS** with workaround |
| `pnpm --filter @workspace/veroxa run build` | **WATCH / failed** Corepack proxy download | **PASS** with workaround; build emitted non-fatal sourcemap warnings |

## 19. Open questions

1. Should the next phase explicitly be split into **Design/Guardrails** and then **Implementation**, or should one PR include both architecture docs and the first non-production schema scaffolding?
2. Which auth provider should Veroxa use for production SaaS Foundation?
3. Should Faraz/team account control remain a single team role for launch, or should limited internal sub-roles be designed but not activated?
4. What database platform and migration workflow should be treated as source of truth for Full SaaS Foundation?
5. What is the required retention/deletion policy for client-uploaded media?
6. What is the minimum acceptable activity log for first paid clients?
7. Should first-client discount eligibility be modeled before billing integration, or only documented until payments are added?
8. What external connector should be planned first after SaaS Foundation: Google Business Profile, Meta, TikTok, or none until manual execution is proven?
9. Should generated report text be fully deterministic at first, or can AI-assisted drafts be introduced only after the SaaS guardrails exist?
10. What exact manual browser smoke path should be required before Full SaaS Foundation begins?

## SaaS foundation follow-up reference

For the next Full SaaS Foundation design and guardrail plan, see `CLIENT_PORTAL_FULL_SAAS_FOUNDATION_DESIGN.md`. This is a design/control reference only and does not mark production SaaS runtime, production auth, migrations, storage, live AI, connectors, or payments as built.

## 2026-06-03 pricing/profit-fit alignment

- Active public pricing is Starter $295/month, Growth $495/month, and Premium $995/month.
- Growth is the main recommended package for strong-fit restaurants; Starter is the low-friction entry plan; Premium is selective and readiness-gated.
- Premium requires readiness assessment, client approval, and an agreed ad budget; ad spend is separate.
- Profit Fit Layer is internal/team-only and uses `requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30` with conservative defaults of $15 average ticket and 5% net margin.
- Online-influenced orders/actions include online orders, phone/order clicks, direction/address clicks that become visits, menu/order-link clicks, Google profile actions, customer mentions, social content-driven visits, and repeat-customer attention.
- Public/client surfaces must not promise orders, profit, ROI, customers, revenue, rankings, or exact order targets.
- This update does not mark production auth, migrations, storage, live AI, connectors, payments, or runtime SaaS wiring as built.
