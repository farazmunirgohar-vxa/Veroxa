# Future Backend Contract

> **Purpose.** Captures the future Supabase fields that the current
> simulated/rule-based build anticipates but does **not** yet persist. Nothing
> here is implemented as a real write today — these are the planned columns for
> when the backend is activated. See `CLIENT_TEAM_WORKFLOW_CONTRACT.md` for the
> client ↔ team work tables.

---

## 1. Lead → client onboarding handoff

Future fields linking a won Audit Lead to an active client. Today the handoff
is simulated locally (localStorage / session only) in Team Audit Leads — no
account is created and nothing is sent.

| Field | Type | Notes |
|-------|------|-------|
| `auditLeadId` | `uuid` | The originating audit lead. |
| `convertedClientId` | `uuid` | Set when the lead becomes an active client. |
| `onboardingStatus` | `text` | enum mirrors the local handoff stages. |
| `walkthroughScheduledAt` | `timestamptz` | Nullable. |
| `selectedPackage` | `text` | Recommended/selected package label. |
| `firstSevenDayFocus` | `text` | The first-7-days focus captured at handoff. |
| `humanReviewedAt` | `timestamptz` | Set when a human reviews the handoff. |

## 2. Reporting workflow

Future fields for AI-assisted reporting drafts. Today reporting drafts are
rule-based previews (or AI-assisted via `POST /api/ai/draft` when configured),
always human-verified before reaching a client.

| Field | Type | Notes |
|-------|------|-------|
| `reportType` | `text` | enum: `weekly`, `monthly`. |
| `sourceWorkItemIds` | `uuid[]` | The completed work items the draft is based on. |
| `aiDraftStatus` | `text` | Draft lifecycle status. |
| `aiDraftMode` | `text` | enum: `ai`, `rule_based_fallback`, `not_configured`, `error`. |
| `missingDataFlags` | `text[]` | Internal only — never shown to the client. |
| `humanVerificationStatus` | `text` | enum: `pending`, `verified`. |
| `approvedBy` | `uuid` | Team member who approved. |
| `approvedAt` | `timestamptz` | Nullable. |
| `clientVisibleAt` | `timestamptz` | When the report became client-visible. |

## 3. Invariants

- **No AI output is treated as final.** A human verifies every client-facing
  draft before it ships.
- `missingDataFlags` and other internal flags are never rendered on client
  surfaces.
- The current build adds no Supabase writes, storage, publishing,
  auto-messaging, payments, notifications, or new public routes. Audit V1 is
  preserved.
