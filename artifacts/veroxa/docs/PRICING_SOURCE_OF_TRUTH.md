# Veroxa Pricing — Source of Truth

Last updated: 2026-05-30

This document is authoritative for the current locked Veroxa pricing model. All
UI copy, demo fixtures, engine logic, and docs that mention current plan price
values must agree with this file and with the runtime source of truth at
`artifacts/veroxa/src/data/pricing/veroxaPricing.ts`.

---

## Current active public plans

### Essential — $497/month

- Google Optimization
- Facebook + Instagram picture posting
- Basic captions
- Weekly updates
- Monthly performance snapshot
- Client Portal access

### Growth — $697/month

- Everything in Essential
- Reels / short-form content support
- TikTok posting/management if applicable
- Enhanced monthly report

### Premium — $997/month

- Everything in Growth
- Facebook/Instagram ads management
- Google Ads management
- Campaign setup and monitoring
- Monthly ad performance report
- Ad spend is separate and paid directly by the restaurant

---

## Current global pricing rules

- No contract.
- Cancel anytime.
- Google Optimization is included in all plans.
- Facebook + Instagram are included in all plans.
- Maximum 1 post per day.
- Posting depends on usable client-provided media.
- Reels / short-form content support starts at Growth.
- Ads management starts at Premium.
- Ad spend is always separate and paid by the restaurant directly to the ad platform.

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

## Ad spend

Ad spend is always separate and is paid by the restaurant directly to the ad
platform (Google, Meta, TikTok). Veroxa manages the advertising system when ads
management is included. The restaurant controls and pays the actual ad budget.
No Veroxa plan includes ad spend.

---

## Posting and media dependency

Current plan pricing assumes a maximum of 1 post per day. Posting depends on
usable client-provided media. Veroxa may guide the restaurant on what to submit,
but the plan does not imply unlimited posting or automatic posting when usable
media is unavailable.

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
