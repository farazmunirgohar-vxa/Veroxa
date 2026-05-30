# M027A–M027C — Simplified Audit Inputs + Improved Accuracy + Confidence

## Purpose

Make the public Free Customer-Flow Readiness Audit easier for restaurant
owners by reducing required fields to four. Sharpen scoring and weak-spot
explanations so the audit works well from minimal inputs. Surface an
explicit audit-confidence level so readers understand how much signal
the preliminary report is based on.

## New required fields

- Restaurant Name
- City
- State
- Cuisine Type

## Optional links

- Google Business Profile link
- Website link
- Instagram link
- Facebook link
- TikTok link
- Menu / Ordering link
- Other link

## Why current goal was removed from the public free audit

Restaurant owners shouldn't have to articulate marketing goals to get
a useful preliminary signal. The audit now infers direction from
*missing links* and cuisine. `currentGoal` stays in the type as
optional context (used only if present by demo loaders, the team
queue, or future internal forms) but is never required publicly.

## How missing links become audit signals

- No Google link → Search Visibility + Google Maps + Reviews drop;
  weak-spot reframed as "Google / Maps visibility may be underbuilt."
- No website **and** no menu/ordering link → Action Path Clarity drops;
  weak-spot reframed as "Customer action path may be unclear."
- No Instagram / Facebook / TikTok → Social Reminder + Content drop;
  weak-spot reframed as "Social reminder system may be missing."
- Menu/Ordering link present → Action Path + Maps Conversion boost.
- Other link → small Review/Trust support; never heavily boosts score.

## Audit Confidence levels (new)

| Level | Trigger | Meaning |
|---|---|---|
| Basic | Few or no links | "Few links were provided, so this report focuses on likely weak spots from missing information." |
| Good | Google link + at least one of website/menu/social | "Several useful links were provided, so the audit can give more specific direction." |
| Strong | Google link + website/menu + at least 2 social links | "Multiple key links were provided, so the preliminary report has stronger signal." |

All confidence levels remain **preliminary**. The audit still does not
scrape or verify live platform data.

## Updated package logic

- `currentGoal` is fully optional.
- **Ads Management Only** — even stricter: total ≥ 85, Maps ≥ 15,
  Content ≥ 12, Action ≥ 12, **and** `currentGoal` explicitly
  mentions ads / paid traffic / campaign management. Never recommended
  when `currentGoal` is missing.
- **Complete + Ads Add-on** — gated on total ≥ 70, Content ≥ 11,
  Action ≥ 10, link count ≥ 4, **and** ads-leaning signal in
  `currentGoal` / `notes` / `otherUrl`. Recommended less often than
  before so it doesn't auto-fire just because foundation is decent.
- **Google Optimization** — when discovery/trust is the dominant gap
  (Search < 10, Maps < 10, Reviews < 5, or Action < 10 with social
  present) and social/content aren't clearly the main issue.
- **Complete Online Presence** — default when multiple categories
  are weak.

Locked rule: foundation comes before ads; weak spots decide the
package; the audit never auto-sells the most expensive plan.

## What remains future (not in this build)

- Live Google / social platform verification
- AI-assisted audit enhancement
- Audit PDF export
- Audit lead capture
- Audit score history per restaurant
- Manual team audit review queue

## Hard invariants honored

- No AI / no scraping / no Google or social platform APIs.
- No database writes / no storage upload / no FormData.
- No payments / no ads platform APIs.
- No new migration.
- No real restaurant seeded examples.
- Pricing unchanged; reads locked source of truth.
- AUTH_MODE=placeholder unchanged; DATA_MODE=fixture default unchanged.
- InternalDemoGuard intact. operator / owner not expanded beyond legacy-demo surfaces.
- Existing `/free-audit` route preserved.
