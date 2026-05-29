# Daily Customer Opportunity Engine (Stage 3)

A **rule-based, team-only** engine that suggests 1–3 "pushes" per client each day
to help bring more customers in. It is deterministic and dependency-light: no AI,
no model calls, no network, no posting. It is designed so the rules can later be
upgraded with an AI layer **without changing how the Team portal consumes the
result**.

## Where it lives

- `src/domain/dailyOpportunity/types.ts` — `DailyOpportunity`,
  `DailyOpportunityContext`, `OpportunityPriority`, `MealWindow`, priority order.
- `src/domain/dailyOpportunity/engine.ts` — the rules.
- `src/domain/dailyOpportunity/index.ts` — barrel.

Public API:

- `getDailyOpportunitiesForClient(clientId, ctx?)` → up to 3 opportunities for one
  client, strongest priority first.
- `getTodaysSuggestedPushes(ctx?, limit = 3)` → strongest opportunities across all
  demo clients, for the Team Dashboard "Today's Suggested Push" card.
- `getMealWindow(date)` → coarse service window.

`DailyOpportunityContext` accepts `{ now?: Date }`. Passing a fixed `now` makes the
output fully deterministic (important for tests and demos).

## Inputs (demo data)

- `getMediaRequirements(clientId)` — `photos.current` / `photos.target` → supply ratio.
- `getClientNotes(clientId)` — `bestSellers[0]` → the dish to lead with.
- `demoClientLifecycle` — `healthScore`, `mediaStatus` (Healthy/Low/Critical).
- `demoRestaurants` — the client list to aggregate over.
- `now` — meal window, weekend, and catering-lead-time (Thu/Fri) signals.

## Rules (ordered by importance, strongest signals win the 3 slots)

1. **Content supply** is the gating signal. `Critical` supply (or ratio < 0.35) →
   high-priority "Refresh the content shelf" with a client ask. `Low` (or ratio
   < 0.6) → medium "Spotlight the best seller" using existing media.
2. **Reviews / reputation** — health score < 70 → "Nudge happy guests for a
   review" (high if < 50).
3. **Time / day** — weekend → family-meal push; morning/lunch → lunch push;
   afternoon/dinner → dinner push.
4. **Catering** — Thu/Fri → weekend-trays reminder (lead time).
5. **Google freshness** — fill remaining slots when supply is `Healthy`.

Results are sorted by priority (high → medium → low) and capped at 3.

## How it surfaces

The Team Dashboard renders a "Today's Suggested Push" card (team-only). Each push
shows the restaurant, why it matters, the recommended next action, and — when
relevant — a plain-language ask to send to the client. Wording is calm and
client-safe; nothing here is shown to clients automatically.

## Guardrails honoured

- No OpenAI/AI runtime, no network, no posting, no writes.
- Team-only surface; clients are never shown these suggestions directly.
- Future AI upgrade can replace the rule bodies behind the same function
  signatures without touching the dashboard.
