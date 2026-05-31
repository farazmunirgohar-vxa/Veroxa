# Veroxa Pricing — Source of Truth

Last updated: 2026-05-30

This document is authoritative for the current locked Veroxa pricing model. All
UI copy, demo fixtures, engine logic, and docs that mention current plan price
values must agree with this file and with the runtime source of truth at
`artifacts/veroxa/src/data/pricing/veroxaPricing.ts`.

---

## Current active public plans

### Essential — $497/month

- Google Business Profile optimization
- Google Search SEO basics
- Google Maps SEO basics
- Facebook + Instagram presence management
- Picture-based posting
- Max 1 picture post per day
- Platform-specific captions when applicable
- Weekly updates
- Monthly performance snapshot
- Client Portal access

### Growth — $697/month

- Everything in Essential
- TikTok posting/management if applicable
- Facebook/Instagram Reels
- TikTok + Reels posting support using the photos and videos you provide
- Reels optimization
- Enhanced monthly report

### Premium — $997/month

- Everything in Growth
- Ads management after readiness
- Google ads
- Facebook ads
- Instagram ads
- TikTok ads
- Max 1 post per day, depending on usable client-provided media
- Platform-specific drafting/adaptation
- Ad reporting
- Ad spend is separate and paid directly by the restaurant

---

## Current global pricing rules

- No contract.
- Cancel anytime.
- Google Optimization is included in all plans.
- Facebook + Instagram are included in all plans.
- Essential: max 1 picture post per day.
- Growth: adds TikTok + Reels posting support using the photos and videos the client provides.
- Premium: Growth-level posting support plus ads management readiness/support; posting remains max 1 post/day and ad spend is separate.
- Posting depends on usable client-provided media and may slow when usable media is unavailable.
- Ads management starts at Premium only after readiness.
- Ad spend is always separate and paid by the restaurant directly to the ad platform.

---

## Service boundary at launch

Veroxa manages posting, captions, page consistency, Google visibility, online
presence, media guidance, weekly updates, monthly snapshots/reports, Premium
readiness assessment, and ads management only after readiness.

Veroxa does **not** handle comments, DMs, inbox messages, complaints, order
questions, refunds, sensitive customer replies, or customer-service
conversations at launch. The restaurant remains responsible for comments,
messages, DMs, orders, complaints, refunds, and customer-service conversations.

---

## Media dependency

Posting depends on usable client-provided media. If usable media runs low,
Veroxa can guide/remind the restaurant, but posting may slow until new usable
media is provided. Veroxa does not create real restaurant media from nothing.
No professional filming is included unless separately arranged in the future.

---

## Premium eligibility and readiness

Premium requires at least 1 month on Essential or Growth and is not available
immediately by default. Premium becomes eligible only after that first month, a
Veroxa readiness assessment by phone, Zoom, or in person, client approval, and
an agreed ad budget. Ads should not be recommended until the restaurant
foundation is ready.

---

## First-client / loyalty discount policy

First clients receive 20% off for the first 12 months. After 12 months, the 20%
discount converts into a loyalty discount only while the client remains
continuously active. If the client cancels, leaves, stops service, and later
returns, the 20% discount is no longer eligible.

Approximate discounted monthly prices:

- Essential: $398/mo
- Growth: $558/mo
- Premium: $798/mo

---

## Internal compatibility package IDs

The Free Audit and internal lead-scoring logic may still use older package IDs
for compatibility. Those IDs are not current public pricing and should map to
current public plans for customer-facing labels and prices.

| Legacy/internal package ID | Current public display |
| -------------------------- | ---------------------- |
| `google_optimization`      | Essential — $497/mo    |
| `complete_online_presence` | Growth — $697/mo       |
| `complete_plus_ads`        | Premium — $997/mo      |
| `ads_management_only`      | Premium — $997/mo      |

---

## Service-plan schema follow-up before real data

The existing `supabase/migrations/20260601000000_m024a_first_client_metadata_schema.sql`
file still contains legacy `service_plan` values (`google_optimization`,
`complete_online_presence`, `ads_management_only`, `complete_plus_ads`). Do not
rewrite that applied/sensitive migration destructively in routine pricing-copy
work. Before any real client data is used, a deliberate migration should align
`service_plan` to active slugs (`essential`, `growth`, `premium`) while
preserving legacy aliases only where needed for compatibility.

---

## Ad spend

Ad spend is always separate and is paid by the restaurant directly to the ad
platform (Google, Meta, TikTok). Veroxa manages the advertising system when ads
management is included and readiness is approved. The restaurant controls and
pays the actual ad budget. No Veroxa plan includes ad spend.

---

## Deprecated / historical pricing — not current

The previous Complete Online Presence / founding-client model is historical and
not current active public pricing. Do not use these old values in active public
copy, active plan config, or Free Audit display pricing:

- Complete Online Presence at $977/month
- Founding first-year pricing at $488/month
- Ads Management add-on at +$477/month
- Complete Online Presence + Ads at $1,454/month standard
- Founding Complete Online Presence + Ads at $965/month

These references may remain only in clearly labeled deprecated/history notes.

---

## What must NOT appear as current public pricing

- Complete Online Presence as the only public plan
- Founding-client pricing as an active offer
- Ads Management as a separate +$477 active add-on
- Google Optimization as a standalone public plan
- Ads Management Only as a standalone public plan
- Any claim that ad spend is included in a Veroxa plan
- Any package labeled popular-badge before real client data supports it
