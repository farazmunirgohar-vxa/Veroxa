# Client ↔ Team Communication Loop (Stage 2)

The two-role model has exactly two human roles:

- **Restaurant Partner (Client)** — the restaurant owner/operator. Submits media,
  answers simple questions, sees calm progress.
- **Veroxa Team (Faraz)** — runs the work: reviews uploads, prepares content,
  posts, reports, and asks the client for input when needed.

There are no Owner/Operator dashboards in this model and no AI surfaces shown to
clients. The loop below is intentionally simple and already backed by the
existing workflow foundation — this stage documents it rather than rebuilding it.

## Source of truth

The loop runs on the existing workflow foundation. Do not invent a parallel
vocabulary:

- `src/lib/workflow/workflowTypes.ts` — `WorkflowLifecycleStatus`,
  `ClientVisibleStatus`, `InternalTeamStatus`, `WorkflowItemType`.
- `src/lib/workflow/workflowStatus.ts` — `deriveClientVisibleStatus(...)` and
  `deriveInternalTeamStatus(...)` map one lifecycle status into the two audiences.
- `src/lib/repositories` → `clientTeamWorkRepository` — read helpers, including
  `getTeamWorkCommunicationSummary()` (new / needs-clarification / blocked counts),
  `getTeamReadyWorkItems()`, `getTeamInProgressWorkItems()`, `getClientSubmissions()`.

## Two views of one item

Every work item has a single underlying lifecycle status, surfaced two ways:

| Audience | Helper | Tone |
| --- | --- | --- |
| Client | `deriveClientVisibleStatus` | Calm, plain, encouraging. No internal mechanics. |
| Team | `deriveInternalTeamStatus` | Operational — what to do next. |

### What the client sees

- Simple progress ("We're working on it", "Ready for your input", "Posted").
- Friendly, blame-free asks ("Could you send a few quick photos of your X?").
- Their own submissions and their status.

### What the client never sees

- Internal queue names, raw IDs, or pipeline stages.
- AI / model / automation language or any "agent" framing.
- Backend, database, Supabase, RLS, or dev-mode wording.
- Other restaurants' data.

## The loop, step by step

1. **Client submits** media or a direction note (Upload page / portal).
2. **Team triages** in the Upload Inbox: Mark In Review → Accept for Content →
   (or) Needs Better Photo → (or) Save for Later.
3. **If the team needs input**, it surfaces as a calm client-facing clarification
   (`WorkflowClarifications` on `/client/requests`). The client responds in plain
   language; no external messages/notifications are sent in this build.
4. **Team prepares + posts** content (Work Queue), then **reports** progress.
5. **Client sees** honest progress and completed work — performance numbers stay
   blank until a reporting backend is connected (no invented metrics).

## Refinement made in this stage

Triage wording in the inbox now states the next action in plain language
(`Suggested next: …`) rather than internal status codes, and re-shoot requests are
described as "comes back to the restaurant as a simple action on their portal".
No new status enum values were added — the existing mappers already cover the
client-visible cases.

## Future (not built here)

- AI assist for the **team only** (drafting, tagging) behind the existing
  rule-based preview surfaces — never exposed to clients.
- Real reporting metrics once a reporting backend is connected.
- Mobile-first team review (see `MOBILE_TEAM_REVIEW_MODEL.md`).
