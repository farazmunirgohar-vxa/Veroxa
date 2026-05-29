# Approval-to-Execution OS — Foundation

This document describes the **Approval-to-Execution Queue foundation**: the layer
that turns Veroxa from a recommendation dashboard into an execution-capable
operating system. It is **foundation only** — types, domain logic, fixtures, the
Team approval queue UI, and the client-safe status layer. **Nothing here performs
real external execution.**

## The model in one line

> Audits / opportunities → Veroxa **prepares** an exact action → it appears in the
> **Team Approval Queue** → Faraz **approves / edits / asks the client / skips /
> queues for later** → Veroxa executes **later**, once the matching connector exists.

## Two roles

- **Restaurant Partner (Client)** — sees only calm, plain-language progress. Never
  sees AI, connectors, APIs, risk scores, action IDs, or internal mechanics.
- **Veroxa Team (Faraz)** — reviews and approves prepared actions in the queue, on
  mobile or desktop.

## What was built (foundation)

| Layer | Location |
| --- | --- |
| Domain types | `src/domain/preparedActions/types.ts` |
| Permission / risk rules | `src/domain/preparedActions/rules.ts` |
| Client-safe translation | `src/domain/preparedActions/clientSafe.ts` |
| Fixtures | `src/data/demo/demoPreparedActions.ts` |
| Local store + repository + hook | `src/lib/preparedActions/` |
| Review card | `src/components/PreparedActionCard.tsx` |
| Approval Queue page | `src/pages/team-approval-queue.tsx` (`/team/approval-queue`) |
| Dashboard surfacing | `src/pages/team-dashboard.tsx` ("Approvals ready") |

## The safety gate (most important part)

Every prepared action carries a derived `riskLevel` and `approvalRequirement`.
These come from `rules.ts` — a single source of truth — not from the fixtures:

- **Public-facing** (Google, social, website, review replies, customer pushes) →
  at least **team approval required**.
- **Sensitive business truth** (hours, prices, menu, offers, dietary/health
  claims, catering availability) → **client confirmation required** before any
  change.
- **Internal-only** (audits, internal follow-ups, keyword refinement) → no
  approval needed to keep internal; never auto-published.

`canExecuteWithoutApproval` is true **only** for internal-only actions. Anything
customer-visible or business-sensitive must pass through a human.

## Lifecycle

```
prepared / needs_review / needs_client_confirmation
        │  approve            │ ask client            │ skip
        ▼                     ▼                       ▼
     approved        needs_client_confirmation     skipped
        │ queue
        ▼
 queued_for_execution  ──(future, connector)──▶  executed
```

## Hard guardrails (what this foundation does NOT do)

- ❌ No live Google / Meta / website connectors. No posting, sending, or publishing.
- ❌ No OpenAI / model calls at runtime. No image generation. No Supabase Storage.
- ❌ No payments / production auth / Owner or Operator dashboards changed.
- ❌ No pricing change. Locked pricing is unchanged.
- ❌ Demo Preview (`/demo/client/dashboard`) and Login (`/login`) stay separate.
- ❌ Clients never see AI, internal terms, or the queue itself.

The store is **in-memory and local-only**: approving an action updates session
state so the queue re-renders. There are no network writes.

## Client-safe layer

`clientSafe.ts` translates internal state into reassuring, plain-language progress
(`getClientSafeActionStatus`, `getClientSafeActionSummary`, `shouldShowActionToClient`).
It is the foundation for future client-visible progress and is intentionally not
surfaced heavily in client UI yet.

## Recommended next step

Build the **SEO / Google / Website Audit Task Engine** that *produces* prepared
actions and feeds them into this queue — turning audit findings directly into
reviewable, approvable actions.
