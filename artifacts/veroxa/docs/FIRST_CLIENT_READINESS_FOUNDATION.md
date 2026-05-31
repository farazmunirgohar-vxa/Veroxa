# First-Client Readiness Foundation

## Purpose

This document defines the operating foundation for taking Veroxa from polished review-mode product into the first 1–5 restaurant clients without pretending the system is fully automated or production-integrated.

For the first 1–5 clients, Veroxa is a semi-manual operating system with real tracking and strict review gates, not a fully automated publishing platform.

The goal is simple: the restaurant partner sees a calm portal, Faraz has enough workflow visibility to run the account manually, and nothing public/customer-visible goes live without Veroxa team review.

## First-client operating model

- Real Client Portal surfaces under `/client/*` show account status, media needs, requests, updates, and reports.
- Real Team Portal surfaces under `/team/*` give Faraz the operational queues needed to review media, prepared work, reports, visibility tasks, and client follow-up.
- Manual execution is acceptable and expected for the first clients.
- Prepared work can be tracked before future connectors exist.
- Business-truth changes require client confirmation before approval or execution.
- Public/customer-visible actions require Veroxa team review.

## What is safe now

- Public pages can explain Veroxa without promoting inactive roles.
- `/demo/client/dashboard` remains the only public demo preview.
- `/client/*` routes are real Client Portal review routes with safe empty/review states.
- `/team/*` routes are guarded Team Portal review routes for Faraz.
- Pricing is locked to Essential, Growth, and Premium.
- Posting expectations are capped at max 1 post/day across active plans, depending on usable client-provided media.
- Premium readiness can be assessed without implying ads are active or increasing the posting cap.

## What remains manual

- Publishing to Google, Facebook, Instagram, TikTok, or websites.
- Final review of captions, profile updates, reports, visibility actions, and client requests.
- Client confirmation for hours, holiday hours, menu details, prices, offers, catering, dietary/religious claims, and sensitive complaint-adjacent responses.
- Reporting interpretation until verified account data is connected.
- Media quality review and decisions about whether supplied media is usable.

## What must not be automated yet

- Production auth changes or real auth activation.
- Storage uploads.
- Supabase migrations or RLS changes.
- Runtime OpenAI calls.
- Google Business Profile, Meta, TikTok, or website publishing integrations.
- Payments, checkout, or ad-budget changes.
- Public/customer-visible publishing.
- Replies to DMs, comments, inboxes, complaints, refunds, or order questions.

## First 1–5 client benchmark

The first-client foundation should support these benchmark scenarios:

1. Healthy Essential client.
2. Essential client with low media.
3. Growth client with Reels content.
4. Growth client with inconsistent uploads.
5. Client eligible for Premium assessment.

These benchmarks are readiness scenarios only. They must not invent revenue, clicks, rankings, walk-ins, follower growth, review growth, or ad results.

## Client portal readiness checklist

- Dashboard has safe empty/review states.
- Media page clearly explains usable-media dependency.
- Requests page supports simple client input.
- Updates page avoids fake metrics and public automation claims.
- Reports page separates completed work from work still in review.
- Client-facing language avoids internal implementation terms.

## Team portal readiness checklist

- Upload Inbox exists for media review.
- Approval Queue exists for prepared action review.
- Report Queue exists for report review.
- Work queues keep action language calm and operational.
- Team sees enough context to manually run first accounts.
- Team surfaces do not become an engineering console or automation lab.

## Media workflow readiness checklist

- Posting depends on usable client-provided media.
- Low media supply is handled with calm requests, not false posting promises.
- Growth support for TikTok and Reels uses provided photos and videos.
- Media that needs more context can be held for later.
- No workflow implies content goes live automatically.

## Data readiness checklist

- Live account data can be described as being prepared.
- Demo/sample data is not treated as active client data.
- Reports and updates avoid fake performance metrics.
- Internal IDs and implementation terms stay out of client-visible copy.
- Future data connections remain gated by separate production-readiness work.

## Report/update readiness checklist

- Reports summarize verified work completed and work still in review.
- Updates use client-safe labels such as Prepared by Veroxa, Needs your input, and Included in report.
- Reports do not imply ad results before ads are approved and active.
- Reports do not imply Veroxa handles customer-service conversations.

## Approval gate checklist

- Public/customer-visible actions require Veroxa team review.
- Business-truth changes require client confirmation.
- Sensitive claims are never automatic.
- Ad budget and ad readiness decisions require explicit client approval.
- Manual execution remains acceptable until future connectors are built and separately approved.

## Launch gate

Before the first client is treated as launch-ready, the following must be true:

- Pricing alignment guardrails pass.
- Role and route separation guardrails pass.
- Client Portal safe states are ready.
- Team Portal operating queues are ready for Faraz.
- Media dependency is clear.
- Report/update surfaces avoid fake metrics.
- Approval gates are preserved.
- Business-truth confirmation is preserved.
- No automatic publishing claim appears in active surfaces.

## Future phases after this PR

- Add tests around readiness domain helpers if the checklist becomes dynamic.
- Add first-client account setup runbooks after Faraz chooses the first restaurant.
- Add real auth only in a separate approved production-auth pass.
- Add storage uploads only in a separate approved media-storage pass.
- Add connector/publishing integrations only after approval gates are stable.
- Add verified reporting data only after the data source and client-safe interpretation rules are approved.
