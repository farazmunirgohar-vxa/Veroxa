# Visibility Audit Engine — Focused Test Plan

The current Veroxa workspace has typecheck/build scripts but no dedicated unit-test
runner for the app. Until a test runner is added, this document is the focused
verification plan for the fixture/rule-based Visibility Audit Engine and its
Approval Queue handoff.

## Scope and guardrails

- Fixture/rule-based only; no Google, Meta, website, CMS, OpenAI, storage, auth,
  payment, or publishing integrations.
- Team-only audit review; Restaurant Partner/client surfaces receive only calm,
  client-safe progress language.
- The mapper emits prepared-action seeds only. The prepared-action rules engine
  remains the single source of truth for risk and approval requirements.

## Test cases

### 1. Rule engine produces expected findings

**Given** a demo audit input with stale Google updates, unanswered reviews, weak
local wording, and stale social content.

**Expect** `runVisibilityAudit(input)` to return:

- Findings sorted by severity (`urgent`/`high` before `medium`, before `low`).
- Category summaries with the top severity per category.
- A deterministic score and headline.
- All findings visible on the Team Visibility Audit page, even if not all become
  prepared actions.

### 2. Sensitive findings require client confirmation centrally

**Given** findings for holiday hours, menu/best-seller changes, catering
availability, offers/discounts/prices, halal/organic/health claims, serious
complaint responses, or any unverified business truth.

**Expect** the finding recommendation to carry `requiresClientConfirmation: true`
when the rule knows the action depends on restaurant-owned facts.

**And expect** after the seed enters `preparedActionStore`, central prepared-action
rules derive:

- `approvalRequirement === "client_confirmation_required"`
- `riskLevel === "sensitive"`

The mapper must not set either field directly.

### 3. Local SEO findings stay internal

**Given** a local-search wording finding.

**Expect** the prepared action seed to use:

- `channel === "seo"`
- `type === "seo_keyword_update"`
- `executionMode === "internal_only"`

**And expect** this never appears as a fake public post, website edit, or live
customer-facing action.

### 4. Per-audit cap prevents Approval Queue flooding

**Given** an audit result with more actionable findings than the cap.

**Expect** `generatePreparedActionsFromVisibilityAudit(result)` to:

- Emit at most `MAX_PREPARED_ACTIONS_PER_AUDIT` seeds.
- Preserve severity-prioritized order from the audit result.
- Deduplicate repeated `(client, channel, type, title)` action signatures.
- Still leave all findings available for display on `/team/visibility-audit`.

### 5. Client-safe language avoids internal terms

**Given** any visibility audit result.

**Expect** `getClientSafeVisibilityFinding` and
`getClientSafeVisibilitySummary` output to avoid:

- Score, severity, raw finding IDs, source names, risk labels, approval labels.
- API, connector, crawler, AI, model, backend, debug, or execution wording.

**Acceptable examples** include:

- “Veroxa is preparing a Google visibility update.”
- “Veroxa is improving local search wording.”
- “Veroxa needs confirmation before updating business details.”
- “Veroxa is preparing a review response or review-growth step.”

## Future implementation plan

When the app adds a lightweight test runner, add focused domain tests around:

1. `runVisibilityAudit` fixture inputs and finding ordering.
2. `visibilityFindingToPreparedAction` seed shape and absence of risk/approval fields.
3. `preparedActionStore` derivation of sensitive approval requirements.
4. `generatePreparedActionsFromVisibilityAudit` cap and deduplication behavior.
5. Client-safe helper output scanned against a denylist of internal terms.
