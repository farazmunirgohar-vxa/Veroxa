---
name: Approval-to-Execution safety gate
description: How the prepared-action approval/risk gate is enforced in the Veroxa app, and why it lives at the repository boundary.
---

# Approval-to-Execution safety gate

Prepared actions (`src/domain/preparedActions/`) carry a derived `riskLevel` and
`approvalRequirement`. These are computed by the rules engine (`rules.ts`) as the
single source of truth — fixtures and the store NEVER hardcode them; the store
seeds an action, then fills both fields by calling `getRiskLevel` /
`getApprovalRequirement`.

The gate is enforced at the **repository/store boundary**, not only in the UI:
- `markApproved` rejects a `client_confirmation_required` action unless it has
  first passed through `needs_client_confirmation` (the "Ask Client" step).
- `markQueuedForExecution` only succeeds when the action is already `approved`.
- The store treats `queued_for_execution` / `executed` / `archived` as immutable
  (no transitions out).

**Why:** a code review flagged that UI-only gating lets invalid transitions slip
through (approve-from-prepared on sensitive items, queue without approval,
regressions out of terminal states). Enforcing in the data layer makes the gate
real regardless of which surface calls it.

**How to apply:** when adding new transition surfaces or action types, route
through these repository mutators and extend the rules engine — do not let UI
components or fixtures decide approval/risk directly. The card mirrors these
invariants (e.g. it hides "Confirm & Approve" until the client has been asked) so
buttons never no-op, but the card is the mirror, not the enforcer.

## Multiple seed sources feed one gate

The queue accepts seeds from more than one producer (hand-written demo fixtures
**and** the rule-based Visibility Audit engine). Every producer emits
`ResolvedPreparedActionSeed`s that OMIT `riskLevel`/`approvalRequirement`; the
store derives them so the gate stays the single source of truth regardless of
source.

**Why:** a new producer that set its own risk/approval would bypass the gate.

**How to apply:** new producers (real audit sources, etc.) must emit seeds only
and never set risk/approval. Cap per-source volume (the audit uses a shared
`MAX_PREPARED_ACTIONS_PER_AUDIT`, applied in BOTH the engine's count and the
mapper output so they never diverge) so one noisy source can't flood the queue —
the source's own page can still show every finding.
