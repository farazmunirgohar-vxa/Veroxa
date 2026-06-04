# Manual Execution Center

## Purpose

The Manual Execution Center is the Phase 5 pre-live command center for Faraz to run the first 1–5 restaurant clients manually before live integrations exist.

It turns prepared review/demo work into copy/paste-ready execution packs, confirmation prompts, manual checklist steps, and launch-readiness signals while keeping the product honest about the current state.

## What it does

- Creates deterministic Manual Execution Packs from review/demo workflow inputs.
- Shows what is ready to copy, what needs client confirmation, what needs more media/context, and what should be held for later.
- Provides a plain-text copy/paste execution block for Faraz.
- Shows client-safe confirmation request drafts for business-truth details.
- Shows a manual publishing tracker preview.
- Feeds manual execution readiness into the first-client launch gate.

## What it does not do

- No auto-posting.
- No live AI runtime call.
- No storage upload.
- No production auth.
- No Google, Meta, TikTok, YouTube, or publishing APIs.
- No payments, checkout, billing, subscriptions, or invoices.
- No client-visible execution without Veroxa team review.
- No proof upload, screenshot upload, webhook, cron job, or background job.

## Why this exists before live integrations

The first-client operating model is intentionally manual. Veroxa can prepare and organize work, but Faraz still reviews, confirms, copies, posts, logs, and reports manually until future integration work is explicitly approved.

This lets Veroxa feel like an operating system without pretending production connectors, live data, storage, payments, or automated publishing are active.

## Human approval rules

Public or customer-visible work requires Veroxa team review. Prepared packs are not execution authority. They are review aids for Faraz.

Manual packs should use calm team language such as:

- Team review required
- Manual execution only
- Ready to copy
- Hold for later
- More media needed
- No automatic publishing

## Client confirmation rules

Client confirmation is required before manual execution when a pack touches business-truth details, including:

- Hours or holiday hours
- Menu items
- Prices
- Discounts, specials, or offers
- Catering availability
- Halal, organic, health, or similar claims
- Serious complaint responses
- Ad budget or Premium readiness
- Any unclear restaurant factual claim

Client-facing drafts stay simple and safe. They do not mention AI, backend, raw scores, automation internals, risk logic, connectors, APIs, or internal IDs.

Confirmed items should move out of confirmation-hold behavior and continue to Veroxa team review before manual execution.

## Copy/paste execution pack rules

Each execution pack should include:

- Client / restaurant
- Platform
- What to do manually
- Caption or update copy
- Suggested media
- Suggested timing
- Whether client confirmation is required
- Items to verify before posting
- Manual log checklist
- A clear note that the pack is prepared work and does not publish anything automatically

## Manual publishing tracker rules

The tracker is a preview checklist only. It may describe:

- Prepared
- Team reviewed
- Client confirmed if required
- Copied manually
- Posted manually later
- Logged manually later
- Included in report later

It must not claim live execution, create proof uploads, link to external publishing, or persist real publishing state.

## Future integration boundary

Future production auth, storage uploads, live AI, Google/Meta/TikTok connectors, payments, background jobs, and automated customer-visible execution require explicit approval and separate implementation guardrails. This Phase 5 layer is pre-live/manual execution support only.
