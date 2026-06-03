> **2026-05-30 — Portal separation and first-5-client readiness lock**
>
> Current active routing is now: public demo only at `/demo/client/dashboard`, real Client Portal review routes under `/client/*`, and real Team/Internal Admin review routes under `/team/*`. Team Demo / `/demo/team/*` is deprecated/not active and must not be promoted by public pages or used as a login destination. Client-side readiness remains first; heavy Team/Internal Admin AI automation comes later. The first 5 real clients are the pre-launch readiness benchmark.
>
> **2026-05-30 — Current public Pricing page is the pricing truth**
>
> The surfaced public Pricing page now reflects the current locked public
> pricing truth:
>
> - Starter: **$295/mo**
> - Growth: **$495/mo**
> - Premium: **$995/mo**
>
> Older Complete Online Presence, founding-client, $977/$488/$477 pricing
> sections below are historical/deprecated only and are not current public
> pricing. Do not restore them unless the user explicitly requests it.

# Current Build Status


## Active build stack

The active Veroxa build stack is **GitHub + Codex + Vercel**.

- GitHub main is the source of truth.
- Codex is the primary engineering/build agent.
- Vercel is the deployment target.
- Browser/manual QA is used for visual checks.
- Replit-specific build workflow notes are historical only and are not part of the active build stack.

For the active five-phase pre-live roadmap, see [`VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md`](./VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md).


> **2026-05-29 — Historical/deprecated pricing correction + active route reduction**
>
> - Historical pricing note only: this section described a previous Complete Online Presence / founding-client model. It is now deprecated and not current public pricing.
> - Current correction: the public Pricing page now shows Starter, Growth, and Premium at $295/$495/$995. Do not restore the older Complete Online Presence + Ads add-on page model.
> - `google_optimization` and `ads_standalone` are intentionally retained in
>   `veroxaPricing.ts` (NOT deleted) because the internal Free Audit
>   recommendation engine and lead-scoring may still reference legacy IDs. They are
>   excluded from current public pricing display.
> - `App.tsx` reduced to a focused active route map:
>   Public (`/`, `/services`, `/pricing`, `/free-audit`, `/login`),
>   Demo preview (`/demo`, `/guided-demo`, `/upload`, `/demo/client/dashboard`),
>   Client Portal (`/client/dashboard|media|requests|updates|reports`),
>   Team Portal (`/team/dashboard|upload-inbox|work-queue|direction-queue|report-queue|audit-leads`).
> - All Owner and Operator imports and routes removed from active routing
>   (page files left on disk, parked — not deleted). Internal/demo operator,
>   owner, and team alias routes removed from active routing.
> - `clientPortalNav.ts` trimmed to 5 items; `teamPortalNav.ts` trimmed to 6.
> - `PublicNav` simplified: Services, Pricing, Free Audit, Demo Preview,
>   Portal Access (+ Login link and Get Free Audit button).
> - Typecheck passes: `pnpm --filter @workspace/veroxa run typecheck`.

> **2026-05-29 — Page Sprawl Stopped / Portal Consolidation**
>
> - No new page files created. No new routes added.
> - Veroxa consolidated around the existing Client Portal (`/client/*`)
>   and Team Portal (`/team/*`).
> - Stale `/demo/client/*` and `/demo/team/*` links in all in-scope pages
>   and shared components updated to the canonical real routes:
>   `client-dashboard`, `team-dashboard`, `team-work-queue`,
>   `team-upload-inbox`, `team-audit-leads`, `ExecutionIntelligencePanel`,
>   `LeadIntelligencePanel`.
> - Redundant "Upcoming content" section removed from `client-updates.tsx`
>   (static card restating what the "What Veroxa is working on for you"
>   section above it already covers from live data).
> - `aiAgentTypes.ts`, `automationTypes.ts`, `aiAgentPreviewEngine.ts`,
>   `automationPreviewEngine.ts`, `clientTeamWorkRepository.ts` — all
>   confirmed clean; no changes needed.
> - Future builds should prioritise internal engines and shared helpers
>   over new pages or new routes.
> - Owner and Operator remain completely hidden.
> - Typecheck passes: `pnpm --filter @workspace/veroxa run typecheck`.

> **2026-05-29 — Demo Preview and Veroxa OS Review Access Separated**
>
> - Demo Preview (`/demo`, `/demo/client/*`) remains the public sample
>   walkthrough — no login required, clearly labeled "Demo Preview / sample
>   data only".
> - Temporary login (`faraz@client.com / farazclient`, `faraz@team.com /
farazteam`) now routes to the active Veroxa OS review routes:
>   `/client/dashboard` and `/team/dashboard`.
> - All `/client/*` and `/team/*` routes are wired to the real page components.
>   `/demo/client/*` and `/demo/team/*` remain as compatibility aliases.
> - Nav items in `clientPortalNav.ts` and `teamPortalNav.ts` now point to
>   `/client/*` and `/team/*` (not `/demo/*`).
> - Demo access code removed from temp login (was already removed; confirmed).
> - `veroxa-preview` is not visible or required anywhere in temp login.
> - Client/Team portals do not show "sample data only" as the main label on the
>   temp-login experience — only the DemoHub page carries demo/sample branding.
> - Owner and Operator remain hidden and parked (no credentials, no nav links).
> - No Supabase auth, payments, publishing, notifications, or social APIs added.
> - `PublicNav` now shows "Demo Preview", "Client Portal", and "Team Portal".
> - Typecheck passes: `pnpm --filter @workspace/veroxa run typecheck`.

> **2026-05-29 — Execution Intelligence Engine + Growth Flywheel**
>
> - **Engines** — `src/lib/executionIntelligence/*`
>   (`executionScoringEngine`, `retentionRiskEngine`, `clientSuccessFitEngine`,
>   `executionLearningSignals`) + `src/lib/growthFlywheel/*`. Rule-based,
>   deterministic, local, production-shaped. Mirrors the Lead Intelligence
>   patterns: Lead brings clients, Execution retains them, both feed each other.
> - **Lead engine link** — `selfImprovingLeadEngine` now optionally consumes
>   execution outcomes and exposes `retentionInformedTargeting`.
> - **Team UI** — `ExecutionIntelligencePanel` (summary strip, health list,
>   Engine Competition) on the dashboard + work queue; risk detail is team-only.
> - **Client UI** — `ClientExecutionReinforcement` calm, blame-free sections on
>   the client dashboard, media, requests, and reports pages (no fake metrics,
>   no guarantees).
> - **Validation** — `pnpm --filter @workspace/veroxa run typecheck` passes.
> - See `EXECUTION_INTELLIGENCE_ENGINE.md` and `VEROXA_GROWTH_FLYWHEEL.md`.

> **2026-05-29 — Restaurant Content Intelligence Pipeline**
>
> - **Engine** — `src/lib/content/restaurantContentIntelligence.ts` +
>   `src/lib/content/customerMomentTypes.ts` turn one upload into layered
>   reasoning (restaurant knowledge → media understanding → customer moment →
>   content angle → caption drafts → platform/schedule → claim/risk → team
>   recommendation). Rule-based, deterministic, safe fallback. Captions are
>   gated: three strategic drafts (reach/craving, trust/story, action/visit)
>   only when media/context passes; otherwise "Needs client context before
>   caption drafting." + a clarification question.
> - **Team UI** — Upload Inbox, Work Queue, and Dashboard surface the full
>   reasoning via `ContentIntelligencePanel` (`ContentIntelligenceInboxList`,
>   `ContentIntelligenceDraftsList`, `ContentIntelligenceSummaryStrip`).
> - **Client UI** — Media/Updates stay simple (plain statuses + short context
>   request); no scores, agents, angles, or risk flags reach clients.
> - **Boundaries** — no publishing/social/auto-message/payments/notifications/
>   fake imagery/guarantees/invented menu-offer claims. Human approval always
>   required. Any real model stays server-side only. See
>   `RESTAURANT_CONTENT_INTELLIGENCE_PIPELINE.md`.

> **2026-05-29 — Real workflow foundation: production-shaped data model + repository, Client/Team pages wired, preview language reframed**
>
> - **Workflow foundation** — `src/lib/workflow/*` adds a production-shaped
>   `WorkflowItem`, lifecycle/client-safe/internal status derivation, activity
>   timeline, a repository, and a swappable storage layer (temporary browser
>   persistence, backend pending). Pages call the repository only. See
>   `REAL_WORKFLOW_FOUNDATION.md`.
> - **Client portal** — media submission, dashboard, updates timeline,
>   clarification responses, and report-ready views are repo-driven.
> - **Team portal** — a shared `TeamWorkflowPanel` drives the dashboard, upload
>   inbox, work queue, direction queue, and report queue with lifecycle actions.
> - **Language** — "simulator/demo/preview/local-only" reframed to "real
>   workflow foundation / backend pending / human approval required" across the
>   active client + team surfaces. AI remains rule-based with no external actions.
>
> **2026-05-29 — AI agents + automation foundation: structured outputs, automation preview, portal surfacing**
>
> - **Structured AI agent contracts** (BUILD 1) — `src/lib/ai/aiAgentTypes.ts`
>   adds the `AiAgentOutput` envelope so every agent returns a structure, not
>   just text: output category, confidence level, source inputs, output
>   summary, recommended next action, `humanApprovalRequired`, approval gate,
>   categorized risk flags, and automation readiness. All additive — existing
>   exports untouched. SOP model updated with the structured-output rule.
> - **Operationally useful agents** (BUILD 2) — `aiAgentPreviewEngine.ts` adds
>   structured helpers (media review, content angle, caption draft, schedule
>   recommendation, report draft, categorized risk flags, next best action).
>   Rule-based / fixture only; existing engine exports reused, nothing removed.
> - **Automation preview engine** (BUILD 3) — new `src/lib/automation/`
>   (`automationTypes.ts`, `automationPreviewEngine.ts`) previews 8 rule-based
>   workflows. No external actions — every run is prepared, gated, and labelled
>   with the future integration it would need. See
>   `docs/AI_AGENT_AUTOMATION_BLUEPRINT.md`.
> - **Team portal surfacing** (BUILD 4) — team dashboard gets a next-best-action
>   banner and automation snapshot strip; upload inbox, report queue, work
>   queue, and audit leads show confidence, readiness, next actions, and risk
>   flags. Full internal detail allowed for the team.
> - **Client portal kept simple** (BUILD 5) — client dashboard adds a calm,
>   client-safe automation disclosure line alongside the existing AI workflow
>   note. No raw scores, no internal AI/automation mechanics on client surfaces.
> - **Docs + guardrails** (BUILD 6) — new `VEROXA_QUALITY_GUARDRAILS.md`;
>   `FUTURE_BACKEND_CONTRACT.md` documents the planned `ai_agent_outputs`,
>   `automation_runs`, `approval_gates`, `human_reviews`, `task_events`,
>   `external_integration_logs`, and `client_visible_statuses` tables. No
>   Supabase writes, publishing, social APIs, auto-messaging, payments,
>   notifications, or new public routes. Audit V1, auth, and Owner/Operator
>   portals untouched.

> **2026-05-29 — Five OS upgrades: safe AI draft endpoint, lead handoff, content draft pipeline, scheduling prep, reporting drafts**
>
> - **Safe AI draft endpoint** — `POST /api/ai/draft` added server-side. The
>   `OPENAI_API_KEY` is read only on the server and never exposed to the
>   browser. Every response carries a `mode`: `ai`, `rule_based_fallback`,
>   `not_configured`, or `error`. A deterministic rule-based fallback is baked
>   in, so the UI degrades gracefully when AI is not configured. Frontend
>   helper `src/lib/ai/aiDraftClient.ts` never throws into the UI. See
>   `docs/AI_DRAFT_ENDPOINT_CONTRACT.md`.
> - **Audit Lead → onboarding handoff** (BUILD 2) — Team Audit Leads detail
>   panel adds a simulated onboarding handoff (local/session only, no account
>   created, nothing sent) with a checklist and stage advance, plus an
>   AI-assisted lead summary (server-or-fallback). Disabled while the demo
>   seed is showing.
> - **AI-assisted content draft pipeline** (BUILD 3) — deterministic
>   `contentDraftPreviewEngine.ts` drives a content draft lifecycle
>   (media received → AI angle → caption draft → team review → approved for
>   schedule / needs context / not recommended). Wired into Team Upload Inbox,
>   Team Work Queue (compact), and Client Media (client-safe statuses only —
>   no raw scores). Caption-draft safety rules enforced in the engine.
> - **Scheduling / publishing-prep queue** (BUILD 4) — `schedulePreviewEngine.ts`
>   prepares slots and readiness only. No real publishing, no social APIs, no
>   auto-posting. Team Work Queue shows scheduling prep; Client Updates shows a
>   calm "Upcoming content" status.
> - **AI-assisted reporting drafts** (BUILD 5) — Team Report Queue adds a
>   "Generate report draft" action (AI endpoint if configured, rule-based
>   otherwise) showing source work items, missing-data flags, AI draft mode,
>   and human verification. Client Reports shows calm plain-language status
>   only — no internal missing-data flags.
> - Required AI labels used throughout: "AI-assisted draft," "AI-prepared
>   suggestion," "Team review required" / "human verification required."
> - No Supabase writes, no storage, no publishing, no auto-messaging, no
>   payments, no notifications, no new public routes, no Owner/Operator work.
>   Audit V1 preserved. App Testing intentionally not run; typecheck only.
> - Typecheck: pass.

> **2026-05-29 — AI-first SOP layer polished and standardized across Client + Team**
>
> - **Client dashboard** — added a calm empty state ("Nothing needed from you
>   right now") that shows when no client action is outstanding, complementing
>   the existing "Action needed from you" callout.
> - **Team Direction Queue** — the "awaiting clarification" card now shows an
>   AI-prepared suggested clarification question plus a recommended next team
>   action per item, labelled "Team review required" with the team AI
>   disclosure. New deterministic `previewClarificationPrompt` helper in
>   `aiAgentPreviewEngine.ts` derives the question from the submission type
>   (or its existing `requestedClientAction`).
> - **Docs** — `CLIENT_TEAM_WORKFLOW_CONTRACT.md` documents the future
>   AI-first SOP persistence fields (`report_draft_status`, `ai_draft_summary`,
>   `missing_data_flags`, `human_verified_at`, `client_visible_status`) as
>   planned nullable columns with the "unverified draft never ships" invariant.
>   `AI_FIRST_SOP_MODEL.md` adds the execution lifecycle mapping
>   (submission status → team work status → AI agent status → client-safe label).
> - Still simulated/rule-based only. Humans approve all client-facing work. No
>   real OpenAI/Supabase writes, publishing, auto-messaging, payments,
>   notifications, storage, or new routes. Audit V1 preserved.
> - Typecheck: pass.

> **2026-05-28 — AI-first SOP preview layer added across Client and Team portals**
>
> - New `src/lib/ai/aiAgentTypes.ts` defines the shared vocabulary: 8 agent
>   names (Media Review, Content Strategist, Caption Draft, Scheduling
>   Recommendation, Client Update, Reporting Draft, Risk/Blocker, Team
>   Operator Assistant), 5 workflow statuses (`ready`,
>   `needs_human_review`, `approved`, `blocked`, `manual_review_needed`),
>   and the client-facing simple labels (`Uploaded`, `Being reviewed`,
>   `Needs your input`, `Prepared by Veroxa`, `Included in report`).
> - New `src/lib/ai/aiAgentPreviewEngine.ts` is the rule-based, deterministic
>   preview engine. No live model calls, no network, no Supabase, no
>   writes. Same input always produces the same output (stable hash over
>   submission ids) so demo screenshots don't drift. Designed so a real
>   model call can slot in behind the same interfaces later.
> - **Client pages** show calm, non-technical AI-assisted workflow surfaces:
>   - `client-dashboard.tsx` — adds the client-safe AI workflow disclosure
>     card with the five simple status badges.
>   - `client-media.tsx` — adds an AI media review preview explaining the
>     three client-visible outcomes (AI-prepared / needs team review /
>     needs client context) plus the 3–5/week upload guidance.
>   - `client-updates.tsx` — adds a compact weekly preview (reviewed /
>     being prepared / needed from you / next planned action) derived
>     from `clientTeamWorkRepository` via the engine's `previewClientUpdate`.
>   - `client-reports.tsx` — adds a "Report draft status" card with
>     `AI-assisted draft prepared` + `Team review needed` badges and the
>     placeholder-safe metrics-not-connected line.
> - **Team pages** show more operational detail:
>   - `team-dashboard.tsx` — adds the AI Operator Assistant panel: ready
>     for approval / blocked / client input needed / AI-prepared drafts
>     counters, a top recommendation, and live risk flags from
>     `previewRiskFlags`.
>   - `team-work-queue.tsx` — adds an AI suggestions card showing the top
>     4 active items with suggested angle, recommended next action,
>     workflow status badge, and risk flag if any.
>   - `team-upload-inbox.tsx` — adds the AI Media Review preview with
>     quality score + label, recommended usage (use now / save for later /
>     needs context / not recommended), suggested angle, and short note.
>   - `team-report-queue.tsx` — adds AI report drafts preview (weekly +
>     monthly) above the kanban tabs, with missing-data flags and the
>     "human verification required" badge.
> - New `docs/AI_FIRST_SOP_MODEL.md` documents the operating principle,
>   what AI can/cannot do, human approval rules, client-safe explanation,
>   team SOP flow, AI agent vocabulary, and capacity guidance (Manual 3–5
>   / AI-assisted 6–10 / Mature AI-first 8–12 clients per employee).
> - AI agents are **simulated and rule-based only.** Humans remain the
>   final approval layer for anything client-facing. No real OpenAI calls,
>   Supabase writes, publishing, auto-messaging, storage, payments,
>   notifications, or Owner/Operator work added. Audit V1 preserved.
> - Typecheck: pass.

> **2026-05-28 — Audit scoring calibrated: stricter, more meaningful, owner-friendly**
>
> - Scoring bases lowered so missing signals produce a meaningfully lower score.
> - Live scan signals (`websiteFound`, `menuLinkFound`, `orderLinkFound`, `contactPathFound`,
>   `discoveredSocialLinks`, `selectedPlaceId`) now feed into `scoreAuditCategories` as
>   "effective signals" — confirming a website or menu via scan raises the score the same
>   as a manually provided link would.
> - Score targets:
>   - 90–100: Strong Online Consistency (multiple confirmed signals across all areas)
>   - 80–89: Strong Foundation (most signals present, some room to improve)
>   - 70–79: Good Foundation, Needs Consistency (decent presence, clear improvement opportunities)
>   - 60–69: Moderate Opportunity (usable presence, notable gaps)
>   - 50–59: Major Opportunity (several important signals missing or unconfirmed)
>   - Below 50: Limited Public Signals — rare; only for major missing basics
> - A restaurant with Google + website + 1 social + strong cuisine (Momo House profile)
>   scores approximately 70–75, not 78+ as before.
> - Grade descriptions rewritten to be owner-friendly and consultative throughout.
> - No harsh words (bad, poor, failing, critical failure) in any public-facing string.
> - Live lookup, Client/Team login cleanup, and Owner/Operator parked state preserved.
> - Typecheck: pass.

> **2026-05-28 — Free Audit report compressed for owner-friendly first view**
>
> - Report restructured from 17 flat sections to 10 focused items.
> - Primary cards (always visible): header, "What Veroxa would fix first," top 3 opportunities,
>   recommended package, compact 30-day phase strip, walkthrough form, disclaimer.
> - Collapsed sections (native `<details>`): full signal breakdown (6 grouped section groups
>   - confidence strip), what Veroxa can/cannot do + expected timeline.
> - Removed: customer-flow explanation, category breakdown, where-veroxa-fits, top growth
>   opportunities, adaptive learning, self-improving system, 30-day bullet details.
> - AUDIT_DISCLAIMER shortened to one concise sentence.
> - Typecheck: pass.

> **2026-05-28 — Login/routing cleanup: Operator/Owner hidden, demo access code removed, Client/Team login streamlined**
>
> - Operator and Owner portals hidden from all active product flow and login choices.
> - Current active portals are Client and Team only.
> - Demo access code (`veroxa-preview`) removed from the normal email/password login flow.
>   `InternalDemoGuard` in placeholder mode now auto-grants Team portal access without requiring
>   a code. Operator/Owner routes show a "Parked — this area is parked for the current build"
>   message with a link back to login; portal content is not exposed.
> - Login page now shows only Client and Team portal cards. Operator and Owner cards removed.
>   `<code>` route path display removed from cards. Badges removed. Footer note updated.
>   Success message updated from "preview" to "portal" language.
> - Login routes: `faraz@client.com` / `farazclient` → Client Portal;
>   `faraz@team.com` / `farazteam` → Team Portal.
>   Operator/Owner credentials removed from `devCredentials.ts`.
> - Placeholder/dev auth remains only. No Supabase auth, no production users, no backend writes,
>   no storage, no payments, no publishing, no notifications.
> - No Owner/Operator page files deleted.
> - Free Audit, Client Portal, and Team Portal unaffected.
> - Typecheck: pass.

> **2026-05-28 — Touch-up pass: fake image removal, report hierarchy, repetition reduction**
>
> - `client-updates.tsx`: removed `FOOD_IMGS` demo food-photo strip; replaced with neutral icon placeholder cells. Disclaimer updated to "Post thumbnails will appear here once your restaurant's media is connected."
> - `client-dashboard.tsx`: removed `DemoImageCard` + `getDemoImage` usage from "This week's media" and "Upcoming content" sections. Media cards now use icon + title/subtitle/status; schedule strip uses `CalendarDays` icon rows. No food images remain in the client portal.
> - `team-dashboard.tsx`: removed `DemoImageCard` + `getDemoImage` from "Media review queue" section. Replaced with icon-based cards using `StatusBadge` for status tone.
> - `free-audit.tsx`: (a) moved "Top 3 daily customer opportunities" card to appear immediately after the Audit Signal Summary strip — before the detailed Growth Report Sections — so owners see key findings without scrolling; (b) removed the `whatItMeans` render block from each Growth Report Section card to eliminate repetition with `whyItMatters`; `currentSignal`, `whyItMatters`, and `veroxaRecommendation` remain.
> - Typecheck: pass.

> **2026-05-28 — T4–T7: Growth report rewrite, live signals, confidence strip, lead badges, 3-phase plan**
>
> **T4 — Free-audit page wiring**
>
> - Hero description updated: removed "Find your restaurant in the demo search" and the stale
>   "This audit does not scrape or verify live platform data yet" italic note. Replaced with
>   accurate live/preview language ("When live lookup is configured, Veroxa searches Google
>   directly and scans the website for key signals. When not configured, a preview fallback is
>   shown so you can continue.")
> - `sectionIcon` map extended with `veroxa_needs` → CheckCircle2 icon.
> - `whatItMeans` field now renders between `currentSignal` and `whyItMatters` in every growth
>   section card (conditional — only when present).
> - Audit Signal Summary card added after the report header card: 5-column grid showing Google
>   profile, Website, Menu/order, Social, and Audit mode — each with live-confirmed / scanned /
>   link-provided / not-confirmed status in emerald or muted colour.
>
> **T5 — Lenient language sweep + live signals in scoring**
>
> - `generateGrowthReportSections` in `auditScoring.ts` fully rewritten (12 sections):
>   - New live-signal variables derived from `restaurantSource`, `websiteFound`, `menuLinkFound`,
>     `orderLinkFound`, `reservationLinkFound`, `contactPathFound`, `discoveredSocialLinks`,
>     `selectedPlaceId`, `businessStatus`. All optional — fixture/manual mode works unchanged.
>   - `whatItMeans` field populated on all 12 sections.
>   - 12th section `veroxa_needs` added: what Veroxa needs from the restaurant (photos, menu
>     link, specials, story details, platform access).
>   - Language is consultative throughout — no "weak", "poor", "critical", "underbuilt" anywhere
>     in public-facing strings. Audit mode label shown in identity section.
>   - `discoveredSocialLinks` used in social/content sections and the fix_first summary line.
> - `formatThirtyDayPlan` in `auditReportFormatter.ts` updated to 3-phase titles:
>   - Week 1: First 7 days — Foundation
>   - Week 2: First 30 days — Content Rhythm
>   - Week 3: First 30 days — Google + Reminder System
>   - Week 4: Ongoing — Weekly System
>
> **T6 — Lead handoff improvements (team-audit-leads)**
>
> - Lead list card now shows a badge strip when `selectedRestaurant` data is present:
>   - Source badge: Live (emerald) for `google_places`, Preview (muted) for `fixture`, Manual (sky).
>   - Found-status badges: Website found, Menu/order found, Social links found — each shown only
>     when the signal is true / non-empty.
>   - AI draft available badge (primary colour) when `aiDraftAvailable === true`.
>
> **Typecheck:** `pnpm --filter @workspace/veroxa run typecheck` — passes clean.
> **API key note:** `GOOGLE_PLACES_API_KEY` is set server-side but the API returns 403 —
> user must enable "Places API (New)" + billing in Google Cloud Console. Not a code issue.
> All audit flows work in preview/fixture mode without a live key.

> **2026-05-28 — Live restaurant discovery: all-strategy run + corroboration ranking (Free Audit)**
>
> - Live restaurant discovery now runs all search strategies before
>   returning results. No early exit on first weak strategy; raw candidates
>   are collected from every strategy, then merged and deduped by `placeId`.
> - Strategy list aligned: `broad_name_city_state`,
>   `name_restaurant_city_state`, `name_food_city_state`,
>   `name_near_city_state`, `name_only_location_biased` (when bias
>   available), `name_only`, `name_cafe_city_state`,
>   `name_place_city_state`, `name_business_city_state`. Places Autocomplete
>   (New) still runs as the first discovery pass.
> - Dedupe now tracks `foundByStrategies[]` per placeId — the set of
>   strategies that surfaced the same place. Added as a tie-breaker in
>   ranking so corroborated places (e.g. surfaced by both Autocomplete and
>   a Text Search) rank above one-hit candidates with equal name/city/
>   state/food/rating scores.
> - San Antonio/TX location bias remains in place via `getCityBias()`
>   helper. Framework is extensible — Austin, Houston, Dallas, LA, Chicago,
>   NYC, Miami pre-seeded.
> - UI diagnostics now show three counts: `Strategies tried: X · Candidates
checked: Y · Displayed: Z`. No API key or raw Google error bodies.
> - Lower-confidence candidates remain visible: "Likely live match" /
>   "Possible live match" / "Low-confidence live match" badges.
> - Cuisine remains not required. No scraping, no API key exposure, no
>   Supabase writes. Owner/Operator portals remain parked. Manual continue
>   still works.

> **2026-05-28 — Live restaurant discovery: broader fallback strategies + safe diagnostics (Free Audit)**
>
> - Live restaurant discovery now shows plausible lower-confidence matches.
>   Short or ambiguous names like "Selda" are handled with broader fallback
>   strategies: `name_restaurant_only`, `name_cafe_only`,
>   `name_city_state_abbr` (explicit two-letter abbr), `name_state_only`.
>   All candidates are returned regardless of food-type classification; food
>   candidates ranked higher but non-food candidates not hidden.
> - Safe search diagnostics added to API response: `totalRawCandidates`
>   (pre-dedup), `totalDisplayedCandidates` (post-dedup + cap),
>   `fallbackReason` (human-readable note when broader strategies were used),
>   `searchMode: "live_google"`. No API key, no raw Google error bodies.
> - UI search result messaging updated:
>   - All-low-confidence candidates → "We found possible matches. Please
>     select the correct restaurant or continue manually."
>   - Broader strategies used → "We broadened the search to find more
>     possible matches."
>   - Normal → "Live Google lookup found possible matches."
>   - Empty state → "No live match found yet. Try a shorter name, alternate
>     spelling, or continue manually."
>   - Tip: "Some restaurants appear under a different Google listing name."
> - Small collapsed debug line added below mode note: "Search strategies
>   tried: X · Candidates checked: Y" — does not expose technical errors.
> - Cuisine remains not required. No scraping, no API key exposure, no
>   Supabase writes. Manual continue remains available.

> **2026-05-28 — Multi-strategy live restaurant discovery added (Free Audit)**
>
> - Live restaurant discovery now runs Places Autocomplete (New) and up to
>   five Text Search strategies in a single pass, merging and deduplicating
>   by `placeId` before ranking. Searching "Selda" + "San Antonio" + "TX"
>   should now return plausible real candidates even when Google does not
>   classify the business as type `restaurant`.
> - San Antonio/TX location bias added (lat 29.4241, lng -98.4936, radius
>   50 km). Bias applied to both Autocomplete and Text Search requests.
>   Framework is extensible — Austin, Houston, Dallas, LA, Chicago, NYC,
>   Miami are also pre-seeded. Returns to no-bias gracefully for unknown
>   cities.
> - Autocomplete (New) uses `places:autocomplete` endpoint with
>   `includedRegionCodes: ["us"]`, field mask
>   `suggestions.placePrediction.placeId/text/structuredFormat`, top-5
>   predictions converted to candidates (no per-prediction Details call at
>   search time).
> - Text Search strategies (in order, early-exit replaced by parallel run):
>   `broad_name_city_state`, `name_restaurant_city_state`,
>   `name_food_city_state`, `name_near_city_state`, `name_location_biased`.
>   No `includedType` restriction.
> - Dedup: best (richest) version of each `placeId` kept when the same
>   place appears from multiple strategies.
> - Up to 12 candidates returned. Ranking: name similarity → city in
>   address → state in address → food-related type → rating presence.
> - Non-sensitive diagnostics: `strategiesTried` string array and
>   `candidateCount` returned in search response. No API key or raw errors.
> - UI candidate badge: "Live Google match" (high confidence) /
>   "Possible live match" (medium/low). Preview fallback remains
>   "Preview fallback result."
> - Cuisine remains not required. No scraping, no API key in frontend,
>   no Supabase writes, no Owner/Operator pages touched.

> **2026-05-28 — Live restaurant search recall improved (Free Audit)**
>
> - Search no longer depends on `includedType: "restaurant"`. The first
>   attempt uses a broad `${name} ${city} ${state}` text query with no
>   type restriction.
> - Four sequential fallback strategies added (stopping at the first that
>   returns candidates):
>   1. `broad_name_city_state` — name + city + state, no type filter
>   2. `name_restaurant_city_state` — adds the word "restaurant"
>   3. `name_food_city_state` — adds the word "food"
>   4. `name_near_city_state` — "near city, state" phrasing
> - Result filtering: candidates are accepted if their `primaryType` or
>   `types` array includes any food-related type (restaurant, cafe,
>   bakery, bar, meal_takeaway, meal_delivery, mediterranean_restaurant,
>   mexican_restaurant, turkish_restaurant, fast_food_restaurant,
>   pizza_restaurant, sandwich_shop, and ~25 more). Lower-confidence
>   candidates are kept rather than discarded when they are the best
>   available result.
> - Ranking: name similarity → city in address → state in address →
>   food-related type → rating/review count presence.
> - Non-sensitive `searchStrategy` field returned in the response
>   (`broad_name_city_state` | `name_restaurant_city_state` |
>   `name_food_city_state` | `name_near_city_state` | `exhausted`). No
>   API key or raw Google errors exposed.
> - UI messages updated:
>   - Live match returned on first attempt → "Live Google lookup found
>     possible matches."
>   - Live match returned on a broader attempt → "We broadened the
>     search to find more possible matches."
>   - No live match at all → "No exact live match found yet — you can
>     still continue manually and Veroxa can review it." + tip: "try
>     the main word only, e.g. 'Selda' instead of full name."
>   - Results header now reads "Possible matches — select the one that
>     looks right" and includes tip text when live mode.
> - Cuisine remains not required. No new scraping, no API key exposure,
>   no Supabase writes. No Owner/Operator pages touched.

> **2026-05-28 — Live Audit Lookup V1 added (Free Audit acquisition milestone)**
>
> - The `/free-audit` flow now connects to a real Google Places lookup when
>   `GOOGLE_PLACES_API_KEY` is configured server-side, with a graceful
>   preview fallback when it is not. Server-only routes:
>   `POST /api/audit/search-restaurants` and
>   `POST /api/audit/restaurant-details` in
>   `artifacts/api-server/src/routes/auditLive.ts`.
> - New server libs (`artifacts/api-server/src/lib/`):
>   - `googlePlaces.ts` — Places API v1 Text Search + Place Details with
>     explicit field masks, safe error handling, and a structured
>     `{ mode: "live" | "not_configured" | "error", ... }` response shape.
>   - `webPresenceScanner.ts` — opt-in scan of the restaurant's own website
>     only (no third-party domains), 350 KB / 10 s limits, extracts menu,
>     ordering, reservation, contact path, and Instagram/Facebook/TikTok
>     link signals.
> - Client helper `artifacts/veroxa/src/lib/audit/liveAuditClient.ts`
>   exports `searchLiveRestaurantCandidates` and
>   `getLiveRestaurantDetails` — both always return a structured
>   `{ mode, ... }` value and never throw into the UI.
> - Free Audit page (`pages/free-audit.tsx`):
>   - Cuisine is no longer required to find or generate an audit; if left
>     blank, it is recorded as "Restaurant / Food — category not verified."
>   - The "Load a demo example" strip is removed. Live results are clearly
>     labeled "Live Google result"; fallback results are labeled "Preview
>     fallback result" with an explanatory note when live is unavailable
>     or not configured.
>   - Selecting a live candidate fetches details and runs the own-website
>     scan; the selected card shows phone, rating, website, Google Maps
>     link, and found-status badges for menu / order / contact / Instagram
>     / Facebook links.
> - Lead snapshot (`leadTypes.ts` `AuditLeadSelectedRestaurant`) now
>   carries optional live fields: placeId, source (`google_places` /
>   `fixture` / `manual`), phone, rating, website, Google Maps URL,
>   business status, discovered menu/social links, found-status flags,
>   scan confidence, and AI-draft availability. `localAuditLeadStore`
>   already passes the snapshot through unchanged.
> - Team Audit Leads (`pages/team-audit-leads.tsx`) selected lead detail
>   panel adds an "Audit lead context" block with Source (Live / Preview /
>   Manual) badge, AI draft Yes/No badge, address, phone, rating, and
>   found-status badges (Website / Menu link / Order link / Contact path /
>   Social links).
> - Lenient public-facing language: `auditScoring.ts` and
>   `auditPackageRecommendation.ts` swap "weak / poor / fix the weak
>   foundation" for "can be strengthened / underused / strengthen the
>   foundation first" in the publicly rendered strings. Internal scoring
>   thresholds and grade IDs are unchanged.
> - Auth remains placeholder, data mode remains `fixture` / `demo`. No
>   backend writes were added; live lookups read from Google only.

> **2026-05-28 — AI Audit Report Assistant V1 added**
>
> - New optional AI panel on `/free-audit`: button "Generate AI-assisted
>   summary" turns the existing rule-based Veroxa Restaurant Growth Report
>   into an owner-friendly DRAFT. The rule-based report remains the source
>   of truth and is always rendered.
> - Server-side only: `OPENAI_API_KEY` is read from environment variables /
>   Vercel environment variables / local env inside `artifacts/api-server/src/lib/aiAuditAssistant.ts`
>   and is never exposed to the browser. Route: `POST /api/audit/ai-draft`
>   (`artifacts/api-server/src/routes/auditAi.ts`).
> - Response shape: `{ mode: "ai" | "not_configured" | "error", aiDraft: {
executiveSummary, topOpportunities[], veroxaFixPlan,
manualReviewNeeded[], ownerFriendlyClosing } | null, message? }`.
>   Missing key → `not_configured` with copy: "AI summary is not
>   configured yet. The rule-based report is still available." Raw OpenAI
>   errors are never forwarded to the client.
> - Prompt rules (system prompt): use ONLY the provided audit signals,
>   never invent metrics / rankings / ad spend / revenue / reviews /
>   verification, never guarantee outcomes, preserve uncertainty,
>   separate found / not found / manual review needed, consultative
>   lenient tone, draft for human review, no access to ChatGPT history.
> - Client helper: `src/lib/audit/aiAuditClient.ts` exports
>   `buildAiAuditDraftPayload(report)` and
>   `generateAiAuditDraftClient(payload)`. Handles missing / error
>   states gracefully — never throws into the UI.
> - UI panel is clearly labeled "AI-assisted draft — review before
>   sharing" with the safety line: "This draft is generated from the
>   audit signals shown above. It may need human review before being
>   shared with a restaurant owner." Draft is not auto-saved, not
>   auto-sent, not published.
> - Guardrails unchanged: AUTH_MODE=placeholder, DATA_MODE=fixture,
>   VEROXA_DATA_SOURCE_MODE=demo. No publishing, no client messaging,
>   no payments, no Supabase writes, no storage uploads, no DB
>   migrations, no notifications. Owner/Operator/Client/Team portal
>   pages untouched.

> **2026-05-28 — Client ↔ Team Workflow backend-readiness batch finalized**
>
> - `clientTeamWorkRepository` (`src/lib/repositories/clientTeamWorkRepository.ts`)
>   is now the single normalized source of truth for client↔team work on
>   both portals.
> - Auth remains placeholder, data mode remains `fixture` / `demo`. No
>   backend writes, no Supabase, no network, no AI, no publishing, no
>   notifications, no storage. Demo IDs only.

> **2026-05-28 — Temporary role-based dev login preview added**
>
> - Login routes: `faraz@client.com` / `farazclient` → Client Portal;
>   `faraz@team.com` / `farazteam` → Team Portal.
> - Guardrails: AUTH=placeholder, DATA=fixture, VEROXA_DATA_SOURCE_MODE=demo.
>   No real Supabase auth, no production users, no backend writes.

> **2026-05-29 — Lead Intelligence + Outreach Engine foundation added**
>
> - New rule-based engine in `src/lib/leadIntelligence/`: per-lead
>   conversion-opportunity score, segment, top reasons, recommended sales
>   angle, public-only contact-path checklist, cautious outreach drafts
>   (email / follow-up / call opener / voicemail / walk-in / meeting agenda),
>   and a lead → audit → onboarding next-step playbook.
> - Surfaces: full panel on Team Audit Leads; summary strip on Team
>   Dashboard; lead-gen task list on Team Work Queue (separate from the
>   client work pipeline).
> - Optional AI rewrite via `POST /api/ai/draft` (new draft types
>   `lead_outreach_email`, `lead_follow_up_email`, `lead_call_script`,
>   `lead_meeting_agenda`); deterministic rule-based fallback when AI is
>   unconfigured. `OPENAI_API_KEY` server-side only.
> - Guardrails: human review required, no auto-send/call/text, no private
>   scraping, no payments/notifications, no confirmed-spend claims, no vendor
>   insults, no guarantees. Free Audit V1 untouched; Owner/Operator parked.
>   See `LEAD_INTELLIGENCE_OUTREACH_ENGINE.md` and
>   `OUTREACH_COMPLIANCE_GUARDRAILS.md`.

> **2026-05-29 — Self-improving lead engine added**
>
> - Learning layer on top of the lead engine: logged outreach outcomes →
>   cautious signals. New modules in `src/lib/leadIntelligence/`:
>   `leadOutcomeTypes.ts`, `localLeadOutcomeStore.ts` (localStorage
>   `veroxa.lead_outcomes.v1`), `leadObjectionPatterns.ts`,
>   `leadLearningSignals.ts`, `leadPrioritizationEngine.ts`,
>   `selfImprovingLeadEngine.ts`.
> - Extended `ConversionOpportunityScore` with food-visual potential, audit
>   strength, and decision-maker access dimensions. Outreach drafts now carry
>   a segment angle id for outcome tracking; contact-path quality scoring added.
> - Surfaces: per-lead prioritization block + outcome tracking controls on Team
>   Audit Leads (no Send); `LeadLearningPanel` + prioritised lead-gen tasks on
>   the Team Dashboard.
> - Anti-overfit: score adjustments bounded (±10), applied only past a minimum
>   sample, damped while emerging, and labelled by confidence ("Still learning —
>   early signals"). Patterns are signals, not rules; a human always decides.
> - Guardrails unchanged: outcome logging contacts no one, no auto-send/call/
>   text, public/audit data only, no confirmed-spend claims, no guarantees.
>   See `SELF_IMPROVING_LEAD_ENGINE.md`.

---

## 2026-05-30 RR strategy sync note

- Current public packages remain Starter ($295/month), Growth ($495/month), and Premium ($995/month).
- Growth must not be labeled popular-badge until real client data supports that claim.
- Growth wording should position Growth as the main recommended package for serious online presence, with up to 1 post/day depending on usable media.
- Service boundary: Veroxa does not handle comments, DMs, inboxes, complaints, order questions, refunds, or customer-service conversations at launch.
- Media dependency: posting depends on usable client-provided media and may slow when usable media is unavailable.
- Posting limits: Starter allows up to 3 posts/week; Growth is the main package with up to 1 post/day using client-provided media; Premium follows the same max 1 post/day public posting cap and adds ads management readiness/support with ad spend separate.
- Premium requires a Veroxa readiness assessment, client approval, and an agreed ad budget.
- First-client discount: 20% off for 12 months, then loyalty discount only while continuously active; lost if the client leaves and later returns.
- Build order remains client side first. Team/Internal Admin heavy AI automation comes after client-side clarity and should later become the command center for media review assist, caption drafting, Google/SEO/Maps tasks, reporting generation, Premium readiness checklist, client risk flags, workload tracking, and Pakistan team handoff after 10 clients.

## Full SaaS Foundation design reference

For the next Full SaaS Foundation design and guardrail plan, see `CLIENT_PORTAL_FULL_SAAS_FOUNDATION_DESIGN.md`. Current build status remains pre-live/review-mode; production SaaS runtime still requires RR-approved implementation.

## 2026-06-03 pricing/profit-fit alignment

- Active public pricing is Starter $295/month, Growth $495/month, and Premium $995/month.
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

## 2026-06-03 — Client Portal Full SaaS Foundation Phase 2 account/data-flow buildout

- Built the deterministic account activation model for demo-only, prospect review, onboarding, client portal ready, team review ready, active manual service, paused, canceled, and archived states.
- Built normalized client portal page state and team portal repository state models so UI surfaces can read through repository/data-mode boundaries instead of mixing demo and real-route behavior.
- Expanded repository contracts and placeholder/demo adapters with client dashboard, media, request, update, report, team repository, activity preview, account activation summary, and profit validation snapshot methods.
- Updated client portal pages to show richer repository-driven demo states while keeping real guarded routes in premium, client-safe setup states.
- Updated team portal surfaces to show account/data-mode visibility, demo-vs-placeholder labels, activity log preview status, and internal profit validation snapshot previews.
- Integrated non-persisted activity log previews and internal-only profit validation snapshot previews without production writes.
- Production runtime is still not connected: no production auth enablement, database tables, migrations, RLS policies, storage uploads, payments, live AI, or publishing integrations were added.
- Next recommended phase: RR-approved production adapter design and test harness planning before any real auth/database/storage wiring.

## 2026-06-03 — Phase 5 Pre-Live Manual Execution Center

- Added a deterministic pre-live Manual Execution Center for Faraz under the guarded Team Portal at `/team/manual-execution`.
- Added typed manual execution packs, copy/paste pack building, client confirmation workflow helpers, manual publishing tracker previews, and launch-gate signals.
- Lightly surfaced manual execution readiness on Team Dashboard, Team Work Queue, and First-Client Readiness.
- Added manual execution guardrails and documentation; this build does not connect production auth, storage uploads, live AI, platform connectors, payments, automated publishing, or real client data.
