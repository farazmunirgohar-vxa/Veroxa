# Veroxa Workflow State Machines — Planning

> **Update (2026-05-29).** The core lifecycle is now implemented in code via
> `src/lib/workflow/*` (`WorkflowLifecycleStatus` + status derivation) behind a
> repository and a swappable storage layer (temporary browser persistence,
> backend pending). See `REAL_WORKFLOW_FOUNDATION.md`. The states below remain
> the target for real writes, RLS, and `audit_logs` once the backend ships.

> **Planning only (original).** No cloud writes exist anywhere in the frontend.
> These states describe the **future** shape of the data once real writes, real
> RLS, and `audit_logs` ship.

For each machine: states, allowed transitions, which role can perform
each transition (later), the audit action name to write, and whether
the transition is targeted for V1, V2, or later.

---

## Media Asset Review

**States:** `new` · `needs_review` · `approved` · `needs_better_quality`
· `rejected` · `archived`

| From → To | Role | Audit action | Version |
| --- | --- | --- | --- |
| `new` → `needs_review` | system (on upload) | `media.review_started` | V1 |
| `needs_review` → `approved` | team / operator | `media.approved` | V1 |
| `needs_review` → `needs_better_quality` | team / operator | `media.flagged_quality` | V1 |
| `needs_review` → `rejected` | operator | `media.rejected` | V1 |
| `approved` → `archived` | operator / owner | `media.archived` | V2 |
| `rejected` → `archived` | operator | `media.archived` | V2 |

---

## Content Concept

**States:** `draft` · `ready_for_review` · `approved` · `rejected` ·
`archived`

| From → To | Role | Audit action | Version |
| --- | --- | --- | --- |
| `draft` → `ready_for_review` | team | `concept.submit_for_review` | V1 |
| `ready_for_review` → `approved` | operator | `concept.approve` | V1 |
| `ready_for_review` → `rejected` | operator | `concept.reject` | V1 |
| `approved` → `archived` | operator | `concept.archive` | V2 |

---

## Draft Variant

**States:** `draft` · `ready_for_review` · `operator_approved` ·
`rejected` · `selected_for_post`

| From → To | Role | Audit action | Version |
| --- | --- | --- | --- |
| `draft` → `ready_for_review` | team | `draft.submit_for_review` | V1 |
| `ready_for_review` → `operator_approved` | operator | `draft.operator_approve` | V1 |
| `ready_for_review` → `rejected` | operator | `draft.reject` | V1 |
| `operator_approved` → `selected_for_post` | team / operator | `draft.select_for_post` | V1 |

---

## Post

**States:** `draft` · `ready_for_review` · `approved` ·
`ready_to_schedule` · `scheduled` · `blocked` · `published` · `failed`
· `archived`

| From → To | Role | Audit action | Version |
| --- | --- | --- | --- |
| `draft` → `ready_for_review` | team | `post.submit_for_review` | V1 |
| `ready_for_review` → `approved` | operator | `post.approve` | V1 |
| `approved` → `ready_to_schedule` | team | `post.mark_ready_to_schedule` | V1 |
| `ready_to_schedule` → `scheduled` | team / operator | `post.schedule` | V2 |
| `scheduled` → `published` | publishing integration | `post.published` | V3 |
| `scheduled` → `failed` | publishing integration | `post.failed` | V3 |
| any → `blocked` | system / operator | `post.blocked` | V2 |
| `failed` → `ready_to_schedule` | operator | `post.retry` | V3 |
| `published` → `archived` | operator | `post.archive` | later |

**V1 = manual workflow only.** Direct platform publishing is **V3**;
see `docs/SOCIAL_PUBLISHING_PLAN.md`.

---

## Post Slot

**States:** `open` · `reserved` · `scheduled` · `missed` · `released`

| From → To | Role | Audit action | Version |
| --- | --- | --- | --- |
| `open` → `reserved` | team | `slot.reserve` | V2 |
| `reserved` → `scheduled` | team / operator | `slot.assign_post` | V2 |
| `scheduled` → `missed` | system (window passed) | `slot.missed` | V2 |
| `reserved` → `released` | team / operator | `slot.release` | V2 |
| `scheduled` → `released` | operator | `slot.release` | V2 |

---

## Weekly Report

**States:** `drafting` · `ready_for_operator` · `needs_revision` ·
`approved` · `published_to_client`

| From → To | Role | Audit action | Version |
| --- | --- | --- | --- |
| `drafting` → `ready_for_operator` | team | `weekly_report.submit` | V1 |
| `ready_for_operator` → `needs_revision` | operator | `weekly_report.request_changes` | V1 |
| `ready_for_operator` → `approved` | operator | `weekly_report.approve` | V1 |
| `approved` → `published_to_client` | operator | `weekly_report.publish_to_client` | V1 |
| `needs_revision` → `ready_for_operator` | team | `weekly_report.resubmit` | V1 |

---

## Monthly Report

Same shape as Weekly Report. Audit actions: `monthly_report.submit`,
`monthly_report.request_changes`, `monthly_report.approve`,
`monthly_report.publish_to_client`, `monthly_report.resubmit`.

---

## Onboarding Item

**States:** `not_started` · `in_progress` · `completed` ·
`needs_review` · `approved`

| From → To | Role | Audit action | Version |
| --- | --- | --- | --- |
| `not_started` → `in_progress` | client | `onboarding.start` | V1 |
| `in_progress` → `completed` | client | `onboarding.mark_complete` | V1 |
| `completed` → `needs_review` | system (auto on submit) | `onboarding.review_request` | V1 |
| `needs_review` → `approved` | operator | `onboarding.approve` | V1 |
| `needs_review` → `in_progress` | operator (kickback) | `onboarding.request_changes` | V1 |

---

## Notes

- **No transition code exists.** All transitions above are described as
  the eventual write surface plus audit row, not as implemented
  functions.
- Each transition must write a matching `audit_logs` row when wired up
  (see `docs/database/write-draft/002_audit_log_draft.sql`).
- "Role" labels describe **future** RLS-gated permissions; today every
  page is either static demo or read-only Client Portal data.
