# First-Client Operating Suite V1

## Purpose

The First-Client Operating Suite is a pre-live Team Portal operating layer for running the first 1–5 restaurant clients manually. It extends the Manual Execution Center into a broader service lifecycle: onboarding readiness, media rhythm, client handoff, weekly update drafting, monthly report drafting, client confirmation needs, service health review, and manual execution linkage.

The suite is built for Faraz first. It helps Veroxa feel closer to a real operating system while remaining honest that the current system is still manual, deterministic, local/demo/review-mode, and not connected to production integrations.

## What it does

- Models deterministic first-client lifecycle snapshots for five benchmark client types.
- Shows a guarded Team Portal route at `/team/first-client-ops`.
- Groups benchmark snapshots into a lifecycle board for onboarding, media, content preparation, confirmation, manual execution, weekly updates, monthly reports, and at-risk/blocked states.
- Builds team-facing weekly update drafts.
- Builds client-safe weekly update drafts.
- Builds team-facing monthly report draft notes.
- Builds client-safe monthly report drafts.
- Builds client handoff material Faraz can copy manually if approved.
- Links first-client snapshots to the Manual Execution Center, Work Queue, Report Queue, Team Dashboard, and First-Client Readiness page.
- Adds one lightweight client-safe dashboard reflection: what Veroxa may need from the restaurant this week.

## What it does not do

- Does not add production auth.
- Does not change `AUTH_MODE` away from `placeholder`.
- Does not create Supabase migrations, RLS policies, production database tables, or real client data writes.
- Does not add storage uploads.
- Does not call live AI or OpenAI at runtime.
- Does not add Google, Meta, TikTok, YouTube, website/CMS, or other publishing connectors.
- Does not add payments, checkout, subscriptions, Stripe, billing, webhooks, cron jobs, background jobs, or scheduled jobs.
- Does not send messages, notifications, email, SMS, WhatsApp, or reports.
- Does not automatically post or execute anything publicly.
- Does not expose internal profit-fit math on client/public surfaces.
- Does not imply guaranteed revenue, orders, rankings, walk-ins, profit, ROI, or customer growth.

## Lifecycle stages

The domain models these lifecycle stages:

- `prospect_review`
- `onboarding_needed`
- `onboarding_in_progress`
- `media_collection_needed`
- `content_preparation`
- `client_confirmation_needed`
- `ready_for_manual_execution`
- `manually_executed`
- `weekly_update_due`
- `monthly_report_due`
- `at_risk`
- `paused`
- `review_complete`

The lifecycle engine is deterministic. It evaluates onboarding gaps, media supply, client confirmation needs, manual execution readiness, weekly update due state, monthly report due state, service pause state, and service health. It does not read live account data.

## Benchmark snapshots

The suite includes five deterministic review/demo benchmark snapshots:

1. Starter healthy benchmark.
2. Starter low-media benchmark.
3. Growth media-ready benchmark.
4. Growth inconsistent-upload benchmark.
5. Premium readiness benchmark.

These are not active paying clients. They are operating benchmarks for first-client readiness review and pre-live walkthroughs.

## Onboarding readiness rules

Onboarding readiness tracks:

- Business name.
- Address.
- Phone.
- Website.
- Google Business Profile link.
- Instagram, Facebook, and TikTok links if available.
- Menu link or menu images.
- Ordering link.
- Top menu items.
- Best sellers.
- Brand tone notes.
- Whether media guidance has been given.
- Posting preferences.
- Premium readiness notes only when relevant.
- Missing items.
- Items requiring confirmation.

Business-truth changes remain confirmation-gated. Hours, holiday hours, menu details, pricing, discounts, offers, catering availability, religious/dietary claims, and sensitive public claims must be confirmed before public-facing work is prepared or used.

## Media rhythm rules

Media rhythm tracks:

- Usable media count.
- Low-quality media count.
- Missing media count.
- Last media upload label.
- Next media request.
- Content supply status.
- Whether posting should slow because usable media is unavailable.

The media rhythm engine is intentionally conservative. If usable media is low or blocked, Veroxa should slow the posting rhythm and ask for usable media instead of pretending a full cadence is available.

## Weekly update draft rules

Team weekly update drafts include:

- What Veroxa prepared this week.
- What is ready for manual execution.
- What needs client confirmation.
- What media is needed.
- What was held for later.
- What will be reviewed next.
- Internal blockers and warnings.

Client-safe weekly update drafts include:

- What Veroxa is working on.
- What Veroxa needs from the restaurant.
- The next planned focus.
- Draft-only language.

Weekly updates are not sent. The suite produces prepared text only.

## Monthly report draft rules

Team monthly report drafts include:

- Work completed.
- Prepared manual execution packs.
- Media supply notes.
- Visibility/profile cleanup notes.
- Client confirmation delays.
- Report data limitations.
- Next-month recommendation.
- Internal service health.
- Internal-only profit validation note when appropriate and only for team review.

Client-safe monthly report drafts include:

- Plain-language progress summary.
- Work completed.
- What needs client input.
- What Veroxa recommends next.
- Media guidance.
- Draft-only language.

Monthly report drafts do not include fake metrics, fake charts, unverified ranking claims, revenue claims, order claims, ROI claims, or internal profit math.

## Client handoff rules

The client handoff engine prepares:

- Onboarding checklist.
- Client-safe welcome note draft.
- Media request draft.
- First-week setup checklist.
- Business-truth confirmation checklist.
- Internal team setup checklist.
- Service start readiness label.

The welcome note explains that Veroxa prepares online presence work for team review, the restaurant should provide usable media, Veroxa may ask for confirmation before using business details, and nothing goes live without Veroxa team review.

The engine does not send messages, create accounts, create auth users, create database records, or contact the restaurant automatically.

## Manual execution linkage

The suite links to the Manual Execution Center instead of replacing it. Manual Execution remains the copy/review/hold surface for prepared work. The suite adds status context, related first-client snapshot labels, service health, and next action language.

No live publishing is introduced. If future connectors are approved, the approval gates and manual safety language must remain intact before any customer-visible action can execute.

## Client-safe language rules

Client surfaces must stay simple and premium. They may say:

- Prepared by Veroxa.
- In review.
- Veroxa team review.
- Needs your input.
- Visibility update.
- Prepared action.
- Included in report.
- More content needed.
- Nothing goes live without Veroxa team review.

Client surfaces must not expose implementation/internal language such as backend terms, raw scores, fixture labels, internal risk logic, OpenAI, Supabase, RLS, connector, API, or internal profit math.

## Future integration boundary

Future production work still requires explicit approval before implementation:

- Production auth.
- Production database adapters, migrations, and RLS.
- Real storage uploads.
- Live AI calls.
- Publishing connectors.
- Payment/billing systems.
- Webhooks, cron jobs, background jobs, or scheduled jobs.
- Automated customer-visible execution.

## First-paid-client limitation

The suite is useful for pre-live walkthroughs, feedback conversations, and first-client operating design. It does not make Veroxa fully production-ready for a first paid client by itself. A first paid client remains blocked by future approved production SaaS foundation work, including auth, storage, live data, payments, and integrations.


## Detailed manual operating runbook


This runbook exists so Faraz can operate the first 1–5 clients consistently from mobile or desktop without pretending production automation exists. Each item is intended for manual review and copy-by-team use only.


### Stage runbook: `prospect_review`

- **Purpose:** Warm lead or possible right-fit restaurant before setup work begins.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Stage runbook: `onboarding_needed`

- **Purpose:** Restaurant has not provided enough business truth for service start.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Stage runbook: `onboarding_in_progress`

- **Purpose:** Most setup items are present but confirmation or small gaps remain.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Stage runbook: `media_collection_needed`

- **Purpose:** Usable media is too thin for the intended service rhythm.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Stage runbook: `content_preparation`

- **Purpose:** Inputs are good enough for Veroxa to prepare review work.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Stage runbook: `client_confirmation_needed`

- **Purpose:** A business-truth item needs restaurant confirmation before public-facing use.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Stage runbook: `ready_for_manual_execution`

- **Purpose:** A prepared action can be reviewed and copied manually by Faraz if approved.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Stage runbook: `manually_executed`

- **Purpose:** Manual completion can be reflected later as a preview/log note only.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Stage runbook: `weekly_update_due`

- **Purpose:** A simple weekly update draft should be prepared for review.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Stage runbook: `monthly_report_due`

- **Purpose:** A monthly report draft should be prepared from verified context only.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Stage runbook: `at_risk`

- **Purpose:** Service rhythm is blocked, urgent, or not calm enough to continue normally.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Stage runbook: `paused`

- **Purpose:** Service is intentionally held.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Stage runbook: `review_complete`

- **Purpose:** No immediate action is due beyond regular review.
- **Primary owner:** Veroxa Team / Faraz.
- **Client-facing posture:** calm, simple, and low-effort.
- **Execution posture:** manual review only; do not publish, send, schedule, or sync from this stage.
- **Data posture:** deterministic local/review snapshot; do not treat benchmark data as live client data.
- **First check:** confirm whether business details, media, client confirmation, or manual execution readiness is the true blocker.
- **Second check:** confirm the next action can be explained without implementation or internal system language.
- **Third check:** confirm the action does not require production auth, storage, live metrics, or platform connector work.
- **Team note pattern:** state the exact blocker, the safest next step, and whether work should be held for later.
- **Client-safe note pattern:** ask for one simple input or explain that Veroxa is reviewing the next step.
- **Do not say:** anything that sounds like guaranteed orders, guaranteed growth, guaranteed ranking improvement, or automated posting.
- **Do not expose:** internal scoring, implementation tools, raw risk logic, production data assumptions, or profit-fit math.
- **If media is weak:** slow the rhythm and request usable photos instead of stretching low-quality media.
- **If business truth is unclear:** ask for confirmation before preparing anything public-facing.
- **If Premium is involved:** keep it assessment-only until readiness, client approval, and ad budget boundaries are confirmed.
- **If report language is needed:** summarize prepared work, client input needs, and limitations without fake numbers.
- **If weekly update language is needed:** keep it short, premium, and draft-only.
- **If manual execution is ready:** move Faraz to the Manual Execution Center for copy/review workflow.
- **If manual execution is blocked:** document the blocker and avoid presenting the action as ready.
- **If service health is caution:** reduce noise and choose the smallest client or team action that removes friction.
- **If service health is urgent:** stop cadence assumptions and resolve setup/media/confirmation blockers first.
- **If service is paused:** do not create new client-facing commitments.
- **Mobile review target:** Faraz should be able to identify the next action in under one minute.
- **Desktop review target:** Faraz should be able to inspect drafts, blockers, and handoff copy without opening multiple unrelated pages.
- **Audit trail posture:** this is preview/review context only until future persistence is approved.
- **Manual QA:** confirm the selected benchmark card, details panel, draft labels, and linkage cards remain visible.
- **Regression QA:** confirm no client page uses team-only stage names or internal health labels.
- **Exit condition:** the next state is clearer, safer, and still manual/review-only.

### Benchmark scenario runbook: Starter healthy benchmark

- **Package posture:** Starter.
- **Operating posture:** Healthy media and onboarding, ready for manual execution and weekly update review.
- **How to use this benchmark:** treat it as a walkthrough sample for service design, not as a paying client record.
- **Dashboard expectation:** it should contribute to First-Client Ops counts without making the dashboard noisy.
- **Work Queue expectation:** it may produce one top next action if it is among the highest-priority snapshots.
- **Report Queue expectation:** it may appear as report-ready only when context is sufficient and limitations are clear.
- **Manual Execution expectation:** it should link to the suite for context but must not replace manual copy/review flow.
- **Readiness expectation:** it should help explain whether first 1–5 manual service is walkthrough-ready.
- **Client Portal expectation:** only a small, simple client-safe reflection may appear.
- **Weekly team draft check:** prepared work, ready-for-manual items, confirmation needs, media needs, hold-for-later notes, next review focus, and internal blockers are present.
- **Weekly client draft check:** working-on, need-from-you, next-focus, and draft-only language are present.
- **Monthly team draft check:** work completed, manual packs, media notes, visibility/profile cleanup notes, confirmation delays, data limitations, recommendation, and service health are present.
- **Monthly client draft check:** progress summary, completed work, input needs, recommendation, media guidance, and draft-only label are present.
- **Handoff check:** welcome note, media request, first-week checklist, business-truth checklist, internal setup checklist, and readiness label are present.
- **Safety check:** no message is sent and no account is created.
- **Safety check:** no public update is posted or scheduled.
- **Safety check:** no live metric is invented.
- **Safety check:** no ranking, revenue, order, walk-in, profit, ROI, or customer outcome is guaranteed.
- **Safety check:** no internal profit-fit math is shown to clients.
- **Safety check:** no implementation/tooling language appears on client surfaces.
- **Media check:** if the benchmark has low media, the next action should request usable media and slow cadence assumptions.
- **Confirmation check:** if the benchmark needs confirmation, business-truth confirmation should outrank public-facing work.
- **Premium check:** if the benchmark is Premium assessment, readiness and approval language must remain conditional.
- **Manual execution check:** if ready, the action should say review/copy manually only if approved.
- **Report check:** if monthly report is due, the report should stay draft-only and limitation-aware.
- **Weekly check:** if weekly update is due, the update should stay draft-only and simple.
- **Service health check:** the status should help Faraz choose the next safe action, not create alarm noise.
- **Client-safe summary check:** the client summary should be short enough to fit inside a small portal card.
- **Team summary check:** the team summary may include operational detail but should still be action-focused.
- **Mobile QA:** selected detail should remain readable after choosing this benchmark from the board.
- **Desktop QA:** the draft cards should remain scannable without becoming a wall of text.
- **Future boundary:** any move from benchmark to real client data requires approved production SaaS foundation work.

### Benchmark scenario runbook: Starter low-media benchmark

- **Package posture:** Starter.
- **Operating posture:** Setup is mostly clear but media is too thin for a normal rhythm.
- **How to use this benchmark:** treat it as a walkthrough sample for service design, not as a paying client record.
- **Dashboard expectation:** it should contribute to First-Client Ops counts without making the dashboard noisy.
- **Work Queue expectation:** it may produce one top next action if it is among the highest-priority snapshots.
- **Report Queue expectation:** it may appear as report-ready only when context is sufficient and limitations are clear.
- **Manual Execution expectation:** it should link to the suite for context but must not replace manual copy/review flow.
- **Readiness expectation:** it should help explain whether first 1–5 manual service is walkthrough-ready.
- **Client Portal expectation:** only a small, simple client-safe reflection may appear.
- **Weekly team draft check:** prepared work, ready-for-manual items, confirmation needs, media needs, hold-for-later notes, next review focus, and internal blockers are present.
- **Weekly client draft check:** working-on, need-from-you, next-focus, and draft-only language are present.
- **Monthly team draft check:** work completed, manual packs, media notes, visibility/profile cleanup notes, confirmation delays, data limitations, recommendation, and service health are present.
- **Monthly client draft check:** progress summary, completed work, input needs, recommendation, media guidance, and draft-only label are present.
- **Handoff check:** welcome note, media request, first-week checklist, business-truth checklist, internal setup checklist, and readiness label are present.
- **Safety check:** no message is sent and no account is created.
- **Safety check:** no public update is posted or scheduled.
- **Safety check:** no live metric is invented.
- **Safety check:** no ranking, revenue, order, walk-in, profit, ROI, or customer outcome is guaranteed.
- **Safety check:** no internal profit-fit math is shown to clients.
- **Safety check:** no implementation/tooling language appears on client surfaces.
- **Media check:** if the benchmark has low media, the next action should request usable media and slow cadence assumptions.
- **Confirmation check:** if the benchmark needs confirmation, business-truth confirmation should outrank public-facing work.
- **Premium check:** if the benchmark is Premium assessment, readiness and approval language must remain conditional.
- **Manual execution check:** if ready, the action should say review/copy manually only if approved.
- **Report check:** if monthly report is due, the report should stay draft-only and limitation-aware.
- **Weekly check:** if weekly update is due, the update should stay draft-only and simple.
- **Service health check:** the status should help Faraz choose the next safe action, not create alarm noise.
- **Client-safe summary check:** the client summary should be short enough to fit inside a small portal card.
- **Team summary check:** the team summary may include operational detail but should still be action-focused.
- **Mobile QA:** selected detail should remain readable after choosing this benchmark from the board.
- **Desktop QA:** the draft cards should remain scannable without becoming a wall of text.
- **Future boundary:** any move from benchmark to real client data requires approved production SaaS foundation work.

### Benchmark scenario runbook: Growth media-ready benchmark

- **Package posture:** Growth.
- **Operating posture:** Strong media/cooperation with monthly report draft readiness.
- **How to use this benchmark:** treat it as a walkthrough sample for service design, not as a paying client record.
- **Dashboard expectation:** it should contribute to First-Client Ops counts without making the dashboard noisy.
- **Work Queue expectation:** it may produce one top next action if it is among the highest-priority snapshots.
- **Report Queue expectation:** it may appear as report-ready only when context is sufficient and limitations are clear.
- **Manual Execution expectation:** it should link to the suite for context but must not replace manual copy/review flow.
- **Readiness expectation:** it should help explain whether first 1–5 manual service is walkthrough-ready.
- **Client Portal expectation:** only a small, simple client-safe reflection may appear.
- **Weekly team draft check:** prepared work, ready-for-manual items, confirmation needs, media needs, hold-for-later notes, next review focus, and internal blockers are present.
- **Weekly client draft check:** working-on, need-from-you, next-focus, and draft-only language are present.
- **Monthly team draft check:** work completed, manual packs, media notes, visibility/profile cleanup notes, confirmation delays, data limitations, recommendation, and service health are present.
- **Monthly client draft check:** progress summary, completed work, input needs, recommendation, media guidance, and draft-only label are present.
- **Handoff check:** welcome note, media request, first-week checklist, business-truth checklist, internal setup checklist, and readiness label are present.
- **Safety check:** no message is sent and no account is created.
- **Safety check:** no public update is posted or scheduled.
- **Safety check:** no live metric is invented.
- **Safety check:** no ranking, revenue, order, walk-in, profit, ROI, or customer outcome is guaranteed.
- **Safety check:** no internal profit-fit math is shown to clients.
- **Safety check:** no implementation/tooling language appears on client surfaces.
- **Media check:** if the benchmark has low media, the next action should request usable media and slow cadence assumptions.
- **Confirmation check:** if the benchmark needs confirmation, business-truth confirmation should outrank public-facing work.
- **Premium check:** if the benchmark is Premium assessment, readiness and approval language must remain conditional.
- **Manual execution check:** if ready, the action should say review/copy manually only if approved.
- **Report check:** if monthly report is due, the report should stay draft-only and limitation-aware.
- **Weekly check:** if weekly update is due, the update should stay draft-only and simple.
- **Service health check:** the status should help Faraz choose the next safe action, not create alarm noise.
- **Client-safe summary check:** the client summary should be short enough to fit inside a small portal card.
- **Team summary check:** the team summary may include operational detail but should still be action-focused.
- **Mobile QA:** selected detail should remain readable after choosing this benchmark from the board.
- **Desktop QA:** the draft cards should remain scannable without becoming a wall of text.
- **Future boundary:** any move from benchmark to real client data requires approved production SaaS foundation work.

### Benchmark scenario runbook: Growth inconsistent-upload benchmark

- **Package posture:** Growth.
- **Operating posture:** Inconsistent media plus a confirmation blocker.
- **How to use this benchmark:** treat it as a walkthrough sample for service design, not as a paying client record.
- **Dashboard expectation:** it should contribute to First-Client Ops counts without making the dashboard noisy.
- **Work Queue expectation:** it may produce one top next action if it is among the highest-priority snapshots.
- **Report Queue expectation:** it may appear as report-ready only when context is sufficient and limitations are clear.
- **Manual Execution expectation:** it should link to the suite for context but must not replace manual copy/review flow.
- **Readiness expectation:** it should help explain whether first 1–5 manual service is walkthrough-ready.
- **Client Portal expectation:** only a small, simple client-safe reflection may appear.
- **Weekly team draft check:** prepared work, ready-for-manual items, confirmation needs, media needs, hold-for-later notes, next review focus, and internal blockers are present.
- **Weekly client draft check:** working-on, need-from-you, next-focus, and draft-only language are present.
- **Monthly team draft check:** work completed, manual packs, media notes, visibility/profile cleanup notes, confirmation delays, data limitations, recommendation, and service health are present.
- **Monthly client draft check:** progress summary, completed work, input needs, recommendation, media guidance, and draft-only label are present.
- **Handoff check:** welcome note, media request, first-week checklist, business-truth checklist, internal setup checklist, and readiness label are present.
- **Safety check:** no message is sent and no account is created.
- **Safety check:** no public update is posted or scheduled.
- **Safety check:** no live metric is invented.
- **Safety check:** no ranking, revenue, order, walk-in, profit, ROI, or customer outcome is guaranteed.
- **Safety check:** no internal profit-fit math is shown to clients.
- **Safety check:** no implementation/tooling language appears on client surfaces.
- **Media check:** if the benchmark has low media, the next action should request usable media and slow cadence assumptions.
- **Confirmation check:** if the benchmark needs confirmation, business-truth confirmation should outrank public-facing work.
- **Premium check:** if the benchmark is Premium assessment, readiness and approval language must remain conditional.
- **Manual execution check:** if ready, the action should say review/copy manually only if approved.
- **Report check:** if monthly report is due, the report should stay draft-only and limitation-aware.
- **Weekly check:** if weekly update is due, the update should stay draft-only and simple.
- **Service health check:** the status should help Faraz choose the next safe action, not create alarm noise.
- **Client-safe summary check:** the client summary should be short enough to fit inside a small portal card.
- **Team summary check:** the team summary may include operational detail but should still be action-focused.
- **Mobile QA:** selected detail should remain readable after choosing this benchmark from the board.
- **Desktop QA:** the draft cards should remain scannable without becoming a wall of text.
- **Future boundary:** any move from benchmark to real client data requires approved production SaaS foundation work.

### Benchmark scenario runbook: Premium readiness benchmark

- **Package posture:** Premium assessment.
- **Operating posture:** Potential advanced support conversation, but assessment-only.
- **How to use this benchmark:** treat it as a walkthrough sample for service design, not as a paying client record.
- **Dashboard expectation:** it should contribute to First-Client Ops counts without making the dashboard noisy.
- **Work Queue expectation:** it may produce one top next action if it is among the highest-priority snapshots.
- **Report Queue expectation:** it may appear as report-ready only when context is sufficient and limitations are clear.
- **Manual Execution expectation:** it should link to the suite for context but must not replace manual copy/review flow.
- **Readiness expectation:** it should help explain whether first 1–5 manual service is walkthrough-ready.
- **Client Portal expectation:** only a small, simple client-safe reflection may appear.
- **Weekly team draft check:** prepared work, ready-for-manual items, confirmation needs, media needs, hold-for-later notes, next review focus, and internal blockers are present.
- **Weekly client draft check:** working-on, need-from-you, next-focus, and draft-only language are present.
- **Monthly team draft check:** work completed, manual packs, media notes, visibility/profile cleanup notes, confirmation delays, data limitations, recommendation, and service health are present.
- **Monthly client draft check:** progress summary, completed work, input needs, recommendation, media guidance, and draft-only label are present.
- **Handoff check:** welcome note, media request, first-week checklist, business-truth checklist, internal setup checklist, and readiness label are present.
- **Safety check:** no message is sent and no account is created.
- **Safety check:** no public update is posted or scheduled.
- **Safety check:** no live metric is invented.
- **Safety check:** no ranking, revenue, order, walk-in, profit, ROI, or customer outcome is guaranteed.
- **Safety check:** no internal profit-fit math is shown to clients.
- **Safety check:** no implementation/tooling language appears on client surfaces.
- **Media check:** if the benchmark has low media, the next action should request usable media and slow cadence assumptions.
- **Confirmation check:** if the benchmark needs confirmation, business-truth confirmation should outrank public-facing work.
- **Premium check:** if the benchmark is Premium assessment, readiness and approval language must remain conditional.
- **Manual execution check:** if ready, the action should say review/copy manually only if approved.
- **Report check:** if monthly report is due, the report should stay draft-only and limitation-aware.
- **Weekly check:** if weekly update is due, the update should stay draft-only and simple.
- **Service health check:** the status should help Faraz choose the next safe action, not create alarm noise.
- **Client-safe summary check:** the client summary should be short enough to fit inside a small portal card.
- **Team summary check:** the team summary may include operational detail but should still be action-focused.
- **Mobile QA:** selected detail should remain readable after choosing this benchmark from the board.
- **Desktop QA:** the draft cards should remain scannable without becoming a wall of text.
- **Future boundary:** any move from benchmark to real client data requires approved production SaaS foundation work.

## Manual QA checklist for PR reviewers

1. Visit `/team/first-client-ops` as the team role and confirm the guarded page renders.
2. Confirm an unauthenticated visitor cannot access the Team Portal route.
3. Confirm a client role cannot access the Team Portal route.
4. Confirm the lifecycle board uses the five benchmark snapshots and does not call them paying clients.
5. Confirm the selected detail panel updates when a benchmark card is selected.
6. Confirm onboarding readiness shows completed items, missing items, confirmation items, and next setup action.
7. Confirm media rhythm shows usable media, low-quality media, missing media, last upload label, next media request, and slowdown status.
8. Confirm weekly update card shows team draft and client-safe draft.
9. Confirm weekly update card includes draft-only language and does not imply sending.
10. Confirm monthly report card shows team notes and client-safe draft.
11. Confirm monthly report card includes draft-only language and does not imply publishing.
12. Confirm handoff card says copy manually if approved.
13. Confirm handoff card does not send email, SMS, WhatsApp, or portal notification.
14. Confirm linkage card routes to Manual Execution, Work Queue, Report Queue, and First-Client Readiness.
15. Confirm Team Dashboard First-Client Ops summary is compact and not noisy.
16. Confirm Team Work Queue shows only top next actions and links back to the suite.
17. Confirm Team Report Queue shows report-ready vs needs-context counts and no fake metrics.
18. Confirm First-Client Readiness shows operating suite readiness counts and future production blockers.
19. Confirm Client Dashboard includes only the small client-safe “what Veroxa may need” card.
20. Confirm Client Updates and Reports remain simple and do not expose internal lifecycle boards.
21. Confirm Manual Execution Center still works and is not replaced.
22. Confirm Manual Execution Center shows related first-client ops context only as a supplement.
23. Confirm no public pricing changed.
24. Confirm `AUTH_MODE` remains `placeholder`.
25. Confirm Vercel configuration files were not changed.
26. Confirm no production auth, storage, live AI, platform publishing, payment, webhook, cron, or scheduled-job work was added.

## Client-safe copy audit prompts

- Copy audit 1: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 2: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 3: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 4: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 5: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 6: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 7: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 8: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 9: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 10: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 11: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 12: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 13: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 14: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 15: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 16: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 17: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 18: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 19: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 20: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 21: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 22: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 23: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 24: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 25: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 26: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 27: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 28: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 29: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 30: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 31: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 32: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 33: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 34: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 35: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 36: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 37: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 38: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 39: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 40: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 41: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 42: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 43: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 44: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 45: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 46: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 47: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 48: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 49: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 50: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 51: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 52: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 53: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 54: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 55: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 56: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 57: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 58: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 59: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 60: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 61: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 62: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 63: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 64: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 65: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 66: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 67: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 68: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 69: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 70: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 71: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 72: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 73: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 74: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 75: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 76: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 77: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 78: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 79: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.
- Copy audit 80: client-facing text should be understandable without knowing Veroxa internal systems, should ask for at most one clear restaurant input when possible, and should avoid performance promises.

## Team operating audit prompts

- Team audit 1: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 2: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 3: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 4: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 5: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 6: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 7: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 8: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 9: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 10: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 11: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 12: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 13: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 14: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 15: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 16: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 17: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 18: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 19: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 20: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 21: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 22: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 23: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 24: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 25: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 26: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 27: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 28: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 29: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 30: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 31: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 32: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 33: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 34: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 35: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 36: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 37: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 38: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 39: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 40: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 41: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 42: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 43: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 44: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 45: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 46: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 47: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 48: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 49: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 50: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 51: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 52: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 53: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 54: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 55: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 56: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 57: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 58: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 59: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 60: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 61: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 62: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 63: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 64: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 65: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 66: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 67: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 68: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 69: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 70: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 71: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 72: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 73: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 74: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 75: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 76: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 77: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 78: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 79: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.
- Team audit 80: team-facing text should identify blocker, next action, manual/review boundary, confirmation need, media dependency, and whether the item should be held for later.

## Future build backlog boundaries

- Future boundary — production auth: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — real account provisioning: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — database adapter: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — storage upload flow: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — live AI preparation: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — Google Business Profile connector: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — Meta publishing connector: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — short-form video connector: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — payments and billing: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — webhooks: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — background jobs: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — scheduled reporting: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — automated public execution: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — persistent activity log: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — real metrics ingestion: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — client notification delivery: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — manual completion persistence: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — report publication workflow: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — premium approval workflow: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.
- Future boundary — ad budget readiness workflow: requires explicit approval, separate design review, guardrails, and tests before implementation. It is not part of First-Client Operating Suite V1.


## First five client operating worksheets


### Worksheet: Starter healthy

- **Service posture:** Use this worksheet to review Starter healthy without treating the benchmark as a real client.
- **Primary action:** weekly update review
- **Secondary action:** manual execution copy review
- **Client input:** light media refresh
- **Team follow-up:** monthly limitation note
- **Onboarding review:** Confirm business identity, address, phone, website, local profile link, menu/order path, top items, best sellers, tone, media guidance, and posting preferences.
- **Media review:** Count usable media, weak media, missing media, last upload label, next media ask, and slowdown need.
- **Manual execution review:** Decide whether a pack is ready, queued, held, blocked, or completed as a preview only.
- **Weekly update review:** Draft only; include prepared work, client input need, and next focus.
- **Monthly report review:** Draft only; include completed work, limitations, client input, next recommendation, and media guidance.
- **Confirmation review:** Identify hours, menu, offer, price, discount, claim, catering, or Premium approval details that require restaurant confirmation.
- **Service health review:** Choose healthy, caution, urgent, blocked, paused, or review-needed based on the smallest honest blocker.
- **Client-safe summary review:** Keep the summary short, calm, and free of internal terms.
- **Team summary review:** Include operational detail only when it helps Faraz decide the next action.
- **Hold condition:** Hold anything that needs confirmation, better media, platform access, or future production systems.
- **Move-forward condition:** Move forward only when the next step remains manual, reviewed, and safe.
- **Report limitation:** Say no connected data is available when relevant; do not invent numbers.
- **Premium limitation:** Premium remains assessment-only until readiness, client approval, and agreed budget are explicit.
- **QA route:** Check `/team/first-client-ops` and any linked Team route touched by this worksheet.
- **Regression concern:** Client Portal must not inherit team-only board, health, blocker, or internal wording.

### Worksheet: Starter low media

- **Service posture:** Use this worksheet to review Starter low media without treating the benchmark as a real client.
- **Primary action:** media request
- **Secondary action:** hold posting rhythm
- **Client input:** client-friendly explanation
- **Team follow-up:** next upload review
- **Onboarding review:** Confirm business identity, address, phone, website, local profile link, menu/order path, top items, best sellers, tone, media guidance, and posting preferences.
- **Media review:** Count usable media, weak media, missing media, last upload label, next media ask, and slowdown need.
- **Manual execution review:** Decide whether a pack is ready, queued, held, blocked, or completed as a preview only.
- **Weekly update review:** Draft only; include prepared work, client input need, and next focus.
- **Monthly report review:** Draft only; include completed work, limitations, client input, next recommendation, and media guidance.
- **Confirmation review:** Identify hours, menu, offer, price, discount, claim, catering, or Premium approval details that require restaurant confirmation.
- **Service health review:** Choose healthy, caution, urgent, blocked, paused, or review-needed based on the smallest honest blocker.
- **Client-safe summary review:** Keep the summary short, calm, and free of internal terms.
- **Team summary review:** Include operational detail only when it helps Faraz decide the next action.
- **Hold condition:** Hold anything that needs confirmation, better media, platform access, or future production systems.
- **Move-forward condition:** Move forward only when the next step remains manual, reviewed, and safe.
- **Report limitation:** Say no connected data is available when relevant; do not invent numbers.
- **Premium limitation:** Premium remains assessment-only until readiness, client approval, and agreed budget are explicit.
- **QA route:** Check `/team/first-client-ops` and any linked Team route touched by this worksheet.
- **Regression concern:** Client Portal must not inherit team-only board, health, blocker, or internal wording.

### Worksheet: Growth media-ready

- **Service posture:** Use this worksheet to review Growth media-ready without treating the benchmark as a real client.
- **Primary action:** monthly report draft
- **Secondary action:** manual pack preparation
- **Client input:** visibility cleanup review
- **Team follow-up:** next month focus
- **Onboarding review:** Confirm business identity, address, phone, website, local profile link, menu/order path, top items, best sellers, tone, media guidance, and posting preferences.
- **Media review:** Count usable media, weak media, missing media, last upload label, next media ask, and slowdown need.
- **Manual execution review:** Decide whether a pack is ready, queued, held, blocked, or completed as a preview only.
- **Weekly update review:** Draft only; include prepared work, client input need, and next focus.
- **Monthly report review:** Draft only; include completed work, limitations, client input, next recommendation, and media guidance.
- **Confirmation review:** Identify hours, menu, offer, price, discount, claim, catering, or Premium approval details that require restaurant confirmation.
- **Service health review:** Choose healthy, caution, urgent, blocked, paused, or review-needed based on the smallest honest blocker.
- **Client-safe summary review:** Keep the summary short, calm, and free of internal terms.
- **Team summary review:** Include operational detail only when it helps Faraz decide the next action.
- **Hold condition:** Hold anything that needs confirmation, better media, platform access, or future production systems.
- **Move-forward condition:** Move forward only when the next step remains manual, reviewed, and safe.
- **Report limitation:** Say no connected data is available when relevant; do not invent numbers.
- **Premium limitation:** Premium remains assessment-only until readiness, client approval, and agreed budget are explicit.
- **QA route:** Check `/team/first-client-ops` and any linked Team route touched by this worksheet.
- **Regression concern:** Client Portal must not inherit team-only board, health, blocker, or internal wording.

### Worksheet: Growth inconsistent uploads

- **Service posture:** Use this worksheet to review Growth inconsistent uploads without treating the benchmark as a real client.
- **Primary action:** business detail confirmation
- **Secondary action:** media rhythm reset
- **Client input:** weekly update caution
- **Team follow-up:** hold-for-later review
- **Onboarding review:** Confirm business identity, address, phone, website, local profile link, menu/order path, top items, best sellers, tone, media guidance, and posting preferences.
- **Media review:** Count usable media, weak media, missing media, last upload label, next media ask, and slowdown need.
- **Manual execution review:** Decide whether a pack is ready, queued, held, blocked, or completed as a preview only.
- **Weekly update review:** Draft only; include prepared work, client input need, and next focus.
- **Monthly report review:** Draft only; include completed work, limitations, client input, next recommendation, and media guidance.
- **Confirmation review:** Identify hours, menu, offer, price, discount, claim, catering, or Premium approval details that require restaurant confirmation.
- **Service health review:** Choose healthy, caution, urgent, blocked, paused, or review-needed based on the smallest honest blocker.
- **Client-safe summary review:** Keep the summary short, calm, and free of internal terms.
- **Team summary review:** Include operational detail only when it helps Faraz decide the next action.
- **Hold condition:** Hold anything that needs confirmation, better media, platform access, or future production systems.
- **Move-forward condition:** Move forward only when the next step remains manual, reviewed, and safe.
- **Report limitation:** Say no connected data is available when relevant; do not invent numbers.
- **Premium limitation:** Premium remains assessment-only until readiness, client approval, and agreed budget are explicit.
- **QA route:** Check `/team/first-client-ops` and any linked Team route touched by this worksheet.
- **Regression concern:** Client Portal must not inherit team-only board, health, blocker, or internal wording.

### Worksheet: Premium assessment

- **Service posture:** Use this worksheet to review Premium assessment without treating the benchmark as a real client.
- **Primary action:** readiness review
- **Secondary action:** approval boundary
- **Client input:** ad budget boundary
- **Team follow-up:** advanced support hold
- **Onboarding review:** Confirm business identity, address, phone, website, local profile link, menu/order path, top items, best sellers, tone, media guidance, and posting preferences.
- **Media review:** Count usable media, weak media, missing media, last upload label, next media ask, and slowdown need.
- **Manual execution review:** Decide whether a pack is ready, queued, held, blocked, or completed as a preview only.
- **Weekly update review:** Draft only; include prepared work, client input need, and next focus.
- **Monthly report review:** Draft only; include completed work, limitations, client input, next recommendation, and media guidance.
- **Confirmation review:** Identify hours, menu, offer, price, discount, claim, catering, or Premium approval details that require restaurant confirmation.
- **Service health review:** Choose healthy, caution, urgent, blocked, paused, or review-needed based on the smallest honest blocker.
- **Client-safe summary review:** Keep the summary short, calm, and free of internal terms.
- **Team summary review:** Include operational detail only when it helps Faraz decide the next action.
- **Hold condition:** Hold anything that needs confirmation, better media, platform access, or future production systems.
- **Move-forward condition:** Move forward only when the next step remains manual, reviewed, and safe.
- **Report limitation:** Say no connected data is available when relevant; do not invent numbers.
- **Premium limitation:** Premium remains assessment-only until readiness, client approval, and agreed budget are explicit.
- **QA route:** Check `/team/first-client-ops` and any linked Team route touched by this worksheet.
- **Regression concern:** Client Portal must not inherit team-only board, health, blocker, or internal wording.

## Route-by-route reviewer notes


### Reviewer route: `/team/first-client-ops`
- Check 1: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 2: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 3: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 4: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 5: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 6: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 7: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 8: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 9: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 10: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 11: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 12: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 13: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 14: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 15: Primary suite page with lifecycle board, selected details, draft cards, handoff card, and linkage card. Confirm guardrails, language, and manual/pre-live posture remain intact.

### Reviewer route: `/team/dashboard`
- Check 1: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 2: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 3: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 4: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 5: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 6: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 7: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 8: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 9: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 10: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 11: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 12: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 13: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 14: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 15: Compact operating summary only; should not become a second lifecycle board. Confirm guardrails, language, and manual/pre-live posture remain intact.

### Reviewer route: `/team/work-queue`
- Check 1: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 2: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 3: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 4: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 5: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 6: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 7: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 8: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 9: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 10: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 11: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 12: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 13: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 14: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 15: Top next-actions only; no duplicate manual execution center. Confirm guardrails, language, and manual/pre-live posture remain intact.

### Reviewer route: `/team/report-queue`
- Check 1: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 2: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 3: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 4: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 5: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 6: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 7: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 8: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 9: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 10: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 11: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 12: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 13: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 14: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 15: Report readiness preview only; no fake metrics. Confirm guardrails, language, and manual/pre-live posture remain intact.

### Reviewer route: `/team/manual-execution`
- Check 1: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 2: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 3: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 4: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 5: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 6: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 7: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 8: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 9: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 10: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 11: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 12: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 13: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 14: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 15: Related context only; copy/review workflow remains primary. Confirm guardrails, language, and manual/pre-live posture remain intact.

### Reviewer route: `/team/first-client-readiness`
- Check 1: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 2: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 3: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 4: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 5: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 6: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 7: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 8: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 9: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 10: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 11: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 12: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 13: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 14: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 15: Readiness counts and honest future production blockers. Confirm guardrails, language, and manual/pre-live posture remain intact.

### Reviewer route: `/client/dashboard`
- Check 1: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 2: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 3: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 4: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 5: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 6: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 7: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 8: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 9: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 10: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 11: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 12: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 13: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 14: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 15: One small client-safe card only. Confirm guardrails, language, and manual/pre-live posture remain intact.

### Reviewer route: `/client/updates`
- Check 1: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 2: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 3: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 4: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 5: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 6: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 7: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 8: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 9: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 10: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 11: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 12: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 13: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 14: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 15: Should remain simple and not expose internal lifecycle logic. Confirm guardrails, language, and manual/pre-live posture remain intact.

### Reviewer route: `/client/reports`
- Check 1: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 2: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 3: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 4: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 5: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 6: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 7: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 8: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 9: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 10: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 11: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 12: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 13: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 14: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 15: Should remain simple and not expose internal report builder logic. Confirm guardrails, language, and manual/pre-live posture remain intact.

### Reviewer route: `/login`
- Check 1: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 2: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 3: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 4: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 5: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 6: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 7: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 8: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 9: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 10: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 11: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 12: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 13: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 14: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 15: Portal Access remains the entry point; demo routes remain separate. Confirm guardrails, language, and manual/pre-live posture remain intact.

### Reviewer route: `/demo/client/dashboard`
- Check 1: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 2: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 3: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 4: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 5: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 6: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 7: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 8: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 9: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 10: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 11: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 12: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 13: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 14: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.
- Check 15: Public demo remains sample preview; it must not become team ops. Confirm guardrails, language, and manual/pre-live posture remain intact.

## Guardrail maintenance checklist

- Guardrail maintenance item 1: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 2: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 3: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 4: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 5: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 6: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 7: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 8: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 9: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 10: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 11: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 12: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 13: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 14: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 15: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 16: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 17: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 18: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 19: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 20: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 21: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 22: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 23: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 24: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 25: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 26: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 27: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 28: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 29: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 30: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 31: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 32: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 33: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 34: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 35: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 36: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 37: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 38: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 39: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 40: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 41: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 42: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 43: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 44: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 45: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 46: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 47: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 48: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 49: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 50: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 51: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 52: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 53: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 54: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 55: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 56: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 57: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 58: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 59: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 60: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 61: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 62: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 63: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 64: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 65: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 66: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 67: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 68: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 69: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 70: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 71: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 72: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 73: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 74: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 75: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 76: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 77: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 78: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 79: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 80: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 81: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 82: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 83: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 84: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 85: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 86: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 87: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 88: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 89: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 90: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 91: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 92: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 93: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 94: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 95: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 96: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 97: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 98: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 99: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 100: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 101: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 102: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 103: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 104: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 105: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 106: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 107: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 108: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 109: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 110: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 111: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 112: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 113: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 114: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 115: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 116: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 117: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 118: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 119: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 120: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 121: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 122: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 123: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 124: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 125: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 126: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 127: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 128: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 129: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 130: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 131: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 132: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 133: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 134: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 135: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 136: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 137: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 138: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 139: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 140: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 141: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 142: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 143: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 144: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 145: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 146: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 147: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 148: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 149: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.
- Guardrail maintenance item 150: if future code changes alter first-client lifecycle, weekly drafts, monthly drafts, handoff copy, pricing, auth mode, parked roles, or manual execution boundaries, update a deterministic assertion before merging.


## Launch conversation checklist

- Launch conversation item 1: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 2: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 3: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 4: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 5: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 6: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 7: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 8: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 9: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 10: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 11: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 12: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 13: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 14: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 15: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 16: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 17: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 18: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 19: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 20: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 21: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 22: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 23: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 24: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 25: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 26: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 27: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 28: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 29: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 30: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 31: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 32: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 33: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 34: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 35: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 36: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 37: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 38: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 39: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 40: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 41: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 42: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 43: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 44: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 45: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 46: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 47: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 48: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 49: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 50: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 51: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 52: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 53: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 54: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 55: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 56: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 57: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 58: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 59: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 60: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 61: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 62: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 63: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 64: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 65: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 66: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 67: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 68: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 69: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 70: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 71: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 72: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 73: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 74: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 75: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 76: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 77: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 78: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 79: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 80: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 81: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 82: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 83: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 84: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 85: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 86: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 87: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 88: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 89: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 90: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 91: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 92: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 93: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 94: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 95: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 96: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 97: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 98: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 99: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 100: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 101: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 102: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 103: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 104: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 105: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 106: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 107: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 108: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 109: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 110: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 111: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 112: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 113: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 114: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 115: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 116: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 117: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 118: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 119: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 120: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 121: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 122: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 123: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 124: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 125: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 126: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 127: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 128: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 129: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 130: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 131: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 132: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 133: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 134: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 135: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 136: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 137: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 138: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 139: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 140: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 141: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 142: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 143: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 144: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 145: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 146: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 147: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 148: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 149: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 150: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 151: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 152: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 153: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 154: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 155: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 156: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 157: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 158: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 159: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 160: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 161: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 162: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 163: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 164: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 165: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 166: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 167: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 168: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 169: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 170: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 171: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 172: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 173: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 174: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 175: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 176: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 177: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 178: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 179: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
- Launch conversation item 180: explain the suite as a manual, review-mode operating layer for onboarding, media, weekly updates, monthly reports, handoff, and manual execution; do not describe it as live automation or production SaaS.
