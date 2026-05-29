# Content & Scheduling Pipeline

> **Purpose.** Describes the AI-assisted content draft pipeline and the
> scheduling / publishing-prep flow. The current build is **scheduling prep
> only** — there is no real publishing, no social APIs, and no auto-posting.

---

## 1. End-to-end flow

1. Client uploads media (or submits a request).
2. AI suggests a content angle.
3. AI drafts a caption.
4. AI recommends a slot (scheduling prep only).
5. Team reviews and approves.
6. A future publishing connector posts **after backend activation**.

Today, steps 2–4 are deterministic previews from the rule-based engines.
Step 6 does not exist yet.

## 2. Content draft lifecycle

Defined in `src/lib/content/contentDraftTypes.ts`, computed by
`contentDraftPreviewEngine.ts` (deterministic — same input always produces
the same output):

- `media_received`
- `ai_angle_prepared`
- `caption_draft_ready`
- `team_review_needed`
- `approved_for_schedule`
- `needs_client_context`
- `not_recommended`

### Surfaces

- **Team Upload Inbox** — full preview: AI media review label, suggested
  content angle, caption draft status, recommended usage, needs-context flag,
  team-review-required badge. Optional "Generate caption draft" action.
- **Team Work Queue** — compact preview: content angle, short caption preview,
  next human action, approval status.
- **Client Media** — client-safe statuses only (`Uploaded`, `Being reviewed`,
  `Needs your input`, `Prepared by Veroxa`). No raw AI scores. When context is
  needed: "Veroxa needs a short note about this item before using it."

### Caption-draft safety (enforced in the engine)

- No medical/health claims.
- No fake discount/special unless provided.
- No halal/authentic/family-owned claim unless provided or client confirms.
- No guaranteed results.
- No invented menu items.

## 3. Scheduling / publishing-prep

Defined in `src/lib/scheduling/schedulePreviewTypes.ts`, computed by
`schedulePreviewEngine.ts`.

- Prepares recommended slots and readiness state only.
- **No real publishing, no social APIs, no auto-posting, no notifications.**
- **Team Work Queue** shows a scheduling-prep card.
- **Client Updates** shows a calm "Upcoming content" status. Avoid exact
  promises unless a fixture has an exact slot — prefer "Veroxa is preparing
  upcoming content." / "Next content window is being planned."

## 4. Current build boundaries

- No Supabase writes, no storage, no publishing, no auto-messaging, no
  payments, no notifications, no new public routes.
- Everything is fixture / rule-based / local. Humans approve all
  client-facing work.
