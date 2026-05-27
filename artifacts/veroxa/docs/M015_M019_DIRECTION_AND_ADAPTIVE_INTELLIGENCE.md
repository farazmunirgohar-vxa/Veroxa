# M015–M019 — Client Direction, Team Direction Queue, Rule-Based Adaptive Intelligence, Shared Local Upload Store, Weekly Strategy Snapshot

Status: demo/local only. No real AI, no DB writes, no storage uploads,
no publishing, no ads APIs, no payments. Owner / Operator portals are
**not** expanded in this pass.

## Principle

**Client Direction, Veroxa Execution.**

Restaurants guide priorities ("push catering this weekend", "we are
slow on Tuesdays", "don't post the old menu"). Veroxa interprets,
reviews, schedules, and executes. Clients never get direct posting or
campaign control.

## What landed

### M015 — Client Direction Center
- Route: `/demo/client/direction`
- Data: `src/data/direction/demoClientDirection.ts`
  (types `DirectionFocus`, `DirectionChannel`, `DirectionUrgency`,
  `DirectionStatus`, `DirectionRequest`, plus 6 sample requests for
  `demo-a`).
- Page: `src/pages/client-direction-center.tsx`
  - Focus / Channel / Note / Urgency form
  - Local submit creates a `DIR-DEMO-xxx` confirmation
  - "Recent direction" list (local + fixture)
  - Sidebar with Weekly Strategy Snapshot + 2 adaptive cards
- Nav: "Direction Center" added to client portal.
- Dashboard CTA: "What should Veroxa focus on this week?" card.

### M016 — Team Direction Review Queue
- Route: `/demo/team/direction-queue` (`InternalDemoGuard role="team"`).
- Page: `src/pages/team-direction-queue.tsx`
  - Grouped by Urgent / Content / Google / Ads / Avoid / Completed
  - Per-card: restaurant, focus, channel, urgency, timing, status,
    suggested team action, note
  - Local-only buttons: Mark Interpreted, Send to Content Plan,
    Send to Google Action, Send to Ads Planning, Mark Completed
- Nav: "Direction Queue" added to team portal.
- Cross-link added to `team-work-queue.tsx`.

### M017 — Rule-Based Adaptive Intelligence Layer
- Engine: `src/lib/intelligence/adaptiveRules.ts`
  - Inputs: direction requests, upload submissions, workflow items,
    optional adaptive memory
  - Output: ranked `AdaptiveRecommendation[]` with confidence,
    source signals, suggested team action, client-safe summary
  - Recommendation types: `content_focus`, `media_request`,
    `google_action`, `ads_direction`, `schedule_priority`,
    `avoid_action`, `team_priority`
  - Rules fire on lunch / slow days / catering / avoid items /
    Google focus / ads goal / weekend / use-next media /
    prep videos / atmosphere uploads / low supply / urgent
    client-action workflow items
- Memory fixture: `src/data/intelligence/demoAdaptiveMemory.ts`
- Component: `src/components/intelligence/AdaptiveRecommendationCard.tsx`
  (client vs team audience)
- Page: `src/pages/team-adaptive-intelligence.tsx`
  (`/demo/team/adaptive-intelligence`, team-guarded)

Deterministic and labeled "Rule-Based Intelligence Preview". **No
external AI provider** (OpenAI / Anthropic / Gemini) is imported or
called.

### M018 — Shared Local Demo Upload Store
- `src/lib/uploadKeys/localUploadStore.ts`
- sessionStorage-backed, key `veroxa.demo.localUploads.v1`
- Metadata only (id, restaurantId, restaurantName, category,
  priority, note, fileLabel, fileKind, submittedAtLabel, status,
  demoOnly). **No file blobs, no base64, no PII.**
- `RestaurantUploadFlow.handleSubmitDemo` now writes a metadata
  record on submit.
- `team-upload-inbox.tsx` reads fixture + local store, updates the
  right source on action, and has a "Clear session uploads" button.
- `client-media.tsx` shows a "Recent uploads from this session" card.

### M019 — Weekly Strategy Snapshot
- Component: `src/components/intelligence/WeeklyStrategySnapshot.tsx`
- Used on:
  - Client Dashboard (audience=client) — friendly language, "Open
    Direction Center" CTA
  - Team Adaptive Intelligence page (audience=team)
- Reads the same rule-based recommendations as M017.

## Human control rule

Rules recommend → Team approves → Veroxa executes. Nothing publishes,
posts, sends notifications, or launches campaigns from these screens.

## What is NOT connected

- No real AI provider (OpenAI / Anthropic / Gemini).
- No database writes (no insert / update / delete / upsert).
- No Supabase Storage uploads.
- No publishing APIs (Meta / Instagram / TikTok / Google).
- No ad platform APIs.
- No Stripe / payment integration.
- No new `supabase/migrations/*` files.

## Future real implementation outline

- `direction_requests` table (clientId, focus, channel, urgency,
  note, status, timestamps, audit).
- `upload_submissions` + `media_assets` tables backing the real
  upload flow.
- `performance_metrics` tables for posts / reach / clicks / Google
  insights, populated by integrations.
- `adaptive_recommendations` table fed by an AI provider behind a
  human approval workflow (rules remain as a deterministic floor).
- Restaurant Upload Key remains scoped to upload submissions only —
  it must never unlock Team / Owner / Operator access.

## Invariants verified this pass

- `AUTH_MODE=placeholder` (unchanged).
- `VITE_VEROXA_DATA_MODE` default `fixture` (unchanged).
- `InternalDemoGuard` still wraps every team route (direction queue
  and adaptive intelligence included).
- Pricing untouched.
- Owner / Operator portals not expanded.
- No `attached_assets/Pasted-*.txt` committed; `.gitignore` still
  blocks them.
