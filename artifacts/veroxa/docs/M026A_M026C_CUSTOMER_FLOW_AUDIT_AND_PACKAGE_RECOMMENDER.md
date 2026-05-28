# M026A–M026C — Free Customer-Flow Readiness Audit + Package Recommender + Positioning Polish

## Purpose

Add a public, restaurant-facing Free Customer-Flow Readiness Audit tool that
generates a preliminary score, weak spots, customer-flow explanation, package
recommendation, and 30-day plan — entirely from user-provided information.
No AI, no scraping, no Google/social platform APIs, no database writes, no
storage upload.

## Public route

- `/free-audit` → `src/pages/free-audit.tsx`

## Input fields

Required:
- `restaurantName`, `city`, `state`, `cuisineType`, `currentGoal`

Optional:
- `googleListingUrl`, `websiteUrl`, `instagramUrl`, `facebookUrl`, `tiktokUrl`,
  `biggestProblem`, `notes`

## Scoring model (rule-based, total 100)

| Category | Max |
|---|---|
| Search Visibility Readiness | 20 |
| Google Maps Conversion Readiness | 20 |
| Social Reminder System | 15 |
| Content Persuasion Quality | 15 |
| Action Path Clarity | 15 |
| Review & Trust Strength | 10 |
| Growth Leverage Opportunity | 5 |

Signals:
- Missing Google listing → lowers Search Visibility + Google Maps + Reviews.
- Missing website → lowers Action Path Clarity + adds pressure to Search.
- Missing social channels → lowers Social Reminder System and Content.
- Strong cuisine/story terms (halal, Uzbek, Nepali, momo, Mediterranean,
  Turkish, Middle Eastern, bakery, dessert, catering, grill, kabob/kebab,
  shawarma, family platter) → raises Content Persuasion.
- Current-goal keywords (lunch, catering, dinner, Google, reviews,
  visibility, social, consistency, campaign, ads) → matched into opportunities.

Grades:
- 85–100 Strong Customer-Flow Foundation
- 70–84 Good Foundation, Missed Consistency
- 50–69 Clear Customer-Flow Gap
- 30–49 Underbuilt Online System
- 0–29 Foundational Visibility Problem

## Customer-flow readiness philosophy

Visibility → Trust → Reminder → Action → Retention.

Veroxa improves the *online conditions and daily opportunities* that
influence customer flow. Veroxa does **not** guarantee exact customer
influx, sales, food/service quality, location, parking, pricing,
competition, customer preferences, staff cooperation, ad budget,
platform algorithm changes, or instant results.

## Package recommendation logic (M026B)

Locked rule: weak spots decide the package. Foundation comes before ads.
The audit does not automatically sell the most expensive package.

Pricing is read from `@/data/pricing/veroxaPricing` (single source of
truth, owner-locked).

Order of evaluation:
1. **Ads Management Only** — only when total ≥ 80, Maps ≥ 15, Content ≥ 12,
   Action ≥ 12, and current goal mentions ads/paid traffic/campaign management.
2. **Complete + Ads Add-on** — only when total ≥ 65, Content ≥ 11, Action ≥ 10,
   and current goal mentions ads/paid traffic/campaign/catering/lunch traffic/
   dinner traffic/event/faster growth.
3. **Google Optimization** — when discovery + trust is the dominant gap
   (Search < 10, Maps < 10, Reviews < 5, or Action < 10 with social present),
   and social/content are not clearly the main issue.
4. **Complete Online Presence** — default when multiple categories are weak.

`whyNotAdsYet` is surfaced whenever the foundation is weak (Search < 14,
Maps < 14, Content < 10, or Action < 10) and the recommendation is not an
ads-leaning package.

## What the audit does NOT show

- First-client fit
- Close probability
- Owner cooperation score
- Ability to pay
- Internal sales notes
- Case study potential
- Live Google/social data
- Guaranteed customer increases

## What Veroxa can improve

Google profile freshness, Google photos and posts, search-friendly content,
social media consistency, caption quality, content variety, posting schedule,
customer reminders, review response support, menu/special visibility,
campaign structure, weekly recommendations, reporting clarity.

## What Veroxa cannot guarantee

Exact customers, exact sales, food quality, service quality, location,
parking, pricing, competition, customer preferences, staff cooperation,
ad budget size, platform algorithm changes, instant results.

## Expected timeline of impact

- **First 2 weeks** — cleaner foundation, content organization, consistency.
- **First 30 days** — better visibility signals, more profile/social
  activity, first learning data.
- **60–90 days** — clearer patterns across content, dishes, Google
  engagement, review/trust signals.
- **3–6 months** — stronger presence, clearer customer-flow patterns,
  refined campaigns, better repeat visibility.

## Adaptive learning explanation

"Veroxa does not treat this audit as a one-time report. The audit becomes
the starting point. As Veroxa works, the system learns from uploads,
direction, content decisions, Google activity, social performance, review
signals, and results. Every week, those signals help Veroxa make better
recommendations."

## Disclaimer

"This preliminary audit is based on provided information and visible
online signals. It is not a guarantee of increased customers. A full
Veroxa audit includes manual review of Google Business Profile, social
platforms, content quality, reviews, menu clarity, customer action paths,
and local competition."

## Hard invariants honored

- Rule-based only — no AI integration.
- No scraping.
- No Google / Instagram / Facebook / TikTok APIs.
- No database writes.
- No storage upload.
- No new migration.
- No payment/checkout/ads platforms.
- No real restaurant seeded examples — only Demo Grill House, Demo Momo
  Kitchen, Demo Mediterranean Table.
- Pricing unchanged; read from locked source of truth.
- `AUTH_MODE=placeholder` unchanged; `DATA_MODE=fixture` default unchanged.
- Owner/Operator portals not expanded.
- InternalDemoGuard intact.

## M026C — Team Direction Queue polish

- Banner wording updated to be accurate after M025B:
  "Demo/dev only — team status updates save locally first. Dev database
  saving only runs when explicitly enabled. No publishing or ads launch
  from this page."
- Status mapping consistency:
  - Mark Interpreted → `interpreted`
  - Send to Content Plan → `planned`
  - Send to Google Action → `planned`
  - Send to Ads Planning → `planned`
  - Mark Completed → `completed`
- No new status values introduced.

## Future upgrades (not in this build)

- AI-assisted audit scoring
- Automatic Google / social platform checks
- Audit lead capture (save submissions as leads)
- Audit-to-client conversion flow
- Audit report PDF export
- Team audit review queue
- Audit score history over time
- Live Google/social integrations
