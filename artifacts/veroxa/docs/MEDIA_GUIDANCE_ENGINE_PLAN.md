# Restaurant Media Guidance Engine — Plan

> **Docs only.** The guidance engine is **rule-based and static today.**
> No AI provider is connected. No persistence. No uploads. No writes.
> The data lives in `src/lib/mediaGuidance.ts` and is read by demo
> pages only.

## Purpose

- Help restaurant owners know **exactly** what photos and videos to
  capture each week.
- Reduce client confusion ("what should I send you?") by giving
  concrete, type-specific recommendations.
- Improve incoming content quality so the Veroxa team has better raw
  material to work with.
- Improve Google Business Profile photo quality (storefront, menu,
  interior, popular dish, staff).
- Give the Veroxa team a baseline to compare actual uploads against in
  the future Guidance Match flow.

## Current implementation (V1 — demo)

- Rule-based, static guidance only.
- Source of truth: [`src/lib/mediaGuidance.ts`](../src/lib/mediaGuidance.ts).
- Displayed on `/demo/client/media` via a "Restaurant Media Guidance"
  card. Restaurant type selection is **local React state only**.
- Referenced on `/demo/client/onboarding` next to the cuisine field
  with a forward-looking helper note. **No cross-page state is
  shared.**
- Previewed on `/demo/team/media-review` as a static "Guidance Match"
  card (Grill flame shot → matches halal grill, Family platter → good
  for weekend promo, Storefront → good for Google, blurry prep →
  needs better lighting).
- **No AI API.** No OpenAI / Anthropic / Gemini / OpenRouter calls.
- **No uploads.** No `fetch`, no `FormData`, no Supabase Storage.
- **No database writes.** No insert / update / delete / upsert.

## Future V1.5 — Onboarding-driven, still rule-based

- Persist the selected cuisine / restaurant type after real onboarding
  writes ship (see `docs/FIRST_WRITE_SURFACE_PLAN.md` Priority 3).
- Read that value back from `onboarding_items.answer_payload` and use
  it to pick the right rule set automatically — no UI dropdown
  required for clients.
- Surface a derived **weekly capture plan** in both the Client Media
  page and (optionally) the Team Tasks queue, so the team knows what
  the client has been asked to capture.

## Future V2 — AI-assisted guidance

Inputs (one or more):

- Restaurant type / cuisine from onboarding.
- Past media quality (approval / reshoot ratios).
- Performance data (which categories drove the most reach / saves).
- Google visibility goals (missing GBP categories).
- Upcoming holidays / events.
- Underused menu items the client wants to push.

Output: a refined weekly capture plan + per-shot rationale.

This is built on top of the existing rule set — the rule set
remains the safe fallback when AI is unavailable or rejected by an
operator.

## Future V3 — Active media agent

- AI / media agent detects missing content categories vs the plan.
- Prompts the client automatically:
  > "Please upload 2 grill shots and 1 storefront photo this week."
- Operator can adjust recommendations or pause prompts per client.
- Notifications go through the future notification system (not yet
  built — see `docs/SAFETY_AUDIT_CHECKLIST.md`).

## Restaurant examples covered today

| Key | Label |
| --- | --- |
| `halal_grill`        | Halal Grill / Kebab Restaurant |
| `bakery`             | Bakery |
| `donut_shop`         | Donut Shop |
| `pizza`              | Pizza Restaurant |
| `burger`             | Burger Restaurant |
| `coffee_shop`        | Coffee Shop / Café |
| `fine_dining`        | Fine Dining |
| `food_truck`         | Food Truck |
| `mexican`            | Mexican Restaurant |
| `mediterranean`      | Mediterranean Restaurant |
| `asian`              | Asian Restaurant |
| `dessert_shop`       | Dessert Shop |
| `general_restaurant` | General Restaurant (catch-all fallback) |

## Safety / ethics principles

- Guidance must be **realistic for busy restaurant owners.** No
  professional-photography demands.
- Recommend a small number of shots per week — quality and consistency
  over volume.
- AI-driven recommendations (V2+) require **human oversight**: an
  operator must be able to see and adjust what is being asked of
  the client.
- Automated client prompts (V3) require the notification system to
  exist first.
- Honesty: never suggest content categories the restaurant cannot
  reasonably produce (e.g. no "live-action food truck" prompt for a
  fine-dining venue).

## Cross-references

- [`AI_AGENT_ARCHITECTURE_PLAN.md`](./AI_AGENT_ARCHITECTURE_PLAN.md) —
  Media Review Agent will use this engine as one input.
- [`CLIENT_DATA_MAPPING.md`](./CLIENT_DATA_MAPPING.md) — cuisine /
  restaurant type from onboarding will eventually drive guidance.
- [`GOOGLE_SEO_GBP_PLAN.md`](./GOOGLE_SEO_GBP_PLAN.md) — GBP shot
  categories overlap with the engine's `googleSpecificShots`.
- [`database/media-draft/003_media_guidance_profile_draft.md`](./database/media-draft/003_media_guidance_profile_draft.md)
  — future-table planning for persisted per-client guidance profiles.
