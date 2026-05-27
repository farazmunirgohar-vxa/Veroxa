# M009 + M010 + M011 — First-Client Operating Flow

_Combined milestone landed 2026-05-27 in `artifacts/veroxa`._

This pass introduces the **shared client-team workflow model** and
wires it into the Client and Team portals so the first real client
can be operated end-to-end against a coherent, demo-only data model.

## Hard invariants (re-confirmed)

- No writes, no uploads, no AI calls, no publishing, no payments,
  no migrations.
- `AUTH_MODE` remains **placeholder** (no real auth flip).
- `DATA_MODE` default stays **fixture**; M007/M008 read-only adapter
  paths and `<DataSourceBadge />` UX are unchanged.
- Pricing tiers unchanged: `$477 / $977 / $977 / $1,497` (no edits
  to `src/data/pricing/*` or `lib/billing/*`).
- `InternalDemoGuard` is **not** bypassed.
- No service-role keys, no Supabase storage upload calls, no
  `.insert / .update / .delete / .upsert / .upload` on the new
  surface.
- Fixture fallback remains active everywhere.
- No `Pasted-*.txt` committed.
- Owner / Operator portals are **out of scope** for this pass.

## What landed

### M009 — Client + Team workflow foundation

New files:

- `src/data/workflows/clientTeamWorkflow.ts` — shared `WorkflowItem`
  model (`stage`, `type`, `priority`, `dueLabel`, `clientId`) and a
  12-item demo fixture for the first client (Demo Grill House,
  `demo-a`). Audience-appropriate display strings are **not** stored
  on the item — they are derived at render time from `stage` via
  `workflowStatus.ts` so the client and team vocabularies cannot
  drift out of sync.
- `src/lib/workflows/workflowStatus.ts` — pure label / tone / sort /
  group utilities:
  - `getClientStatusLabel`, `getTeamStatusLabel`
  - `getWorkflowTone`, `isClientActionNeeded`, `isTeamActionNeeded`
  - `sortWorkflowItems` (priority + actionability + stable id)
  - `groupWorkflowItemsForTeam` → 5 columns: **Media Review**,
    **Draft Needed**, **Review Ready**, **Scheduling**, **Client
    Action Needed**.
- `src/components/workflows/`
  - `WorkflowStatusBadge.tsx`
  - `WorkflowItemCard.tsx` (`mode="client" | "team"`, optional local
    `actions[]`)
  - `WorkflowColumn.tsx`

The two label vocabularies live side-by-side so the same row reads
differently per audience:

| Stage                 | Client label             | Team label                          |
| --------------------- | ------------------------ | ----------------------------------- |
| `media_review_needed` | Being reviewed           | Review uploaded media               |
| `media_accepted`      | Approved for content     | Accepted — ready for draft          |
| `needs_better_photo`  | Needs a better photo     | Request better photo from client    |
| `draft_needed`        | We're writing your post  | Draft needed                        |
| `draft_ready`         | Draft being reviewed     | Draft ready for team review         |
| `scheduled`           | Scheduled                | Scheduled                           |
| `needs_client_action` | Waiting on you           | Client action needed                |

Wiring:

- **Client Dashboard** — new "What Veroxa is working on" section,
  rendering the 5 highest-priority workflow items in `client` mode.
- **Client Requests** — new "Action needed from you" card derived
  from workflow items whose stage is `needs_better_photo` or
  `needs_client_action`. Friendly labels only.
- **Team Dashboard** — new "Today's Client Work" snapshot rendering
  the 6 highest-priority items in `team` mode with a deep link to
  the work queue.
- **Team Work Queue** — rebuilt around `groupWorkflowItemsForTeam`.
  The page now renders the 5 actionable columns instead of a flat
  `demoWorkQueue` grid. (The legacy `demoWorkQueue` fixture remains
  in `data/demoData.ts` and is still consumed by the team dashboard
  side card — unchanged, intentionally.)

### M010 — Client media intake polish

- Demo-only **"Submit to Veroxa Team — Demo"** callout appears in
  `client-media.tsx` once any file has been picked in the local
  preview. The button is `disabled` and has explanatory copy that
  no upload is performed.
- Existing rule-based "Restaurant Media Guidance" engine, local
  file picker, clear button, and reactive "Content Supply Snapshot"
  from prior milestones are unchanged.

No new upload code paths. No `fetch`, no `FormData`, no Supabase
Storage call. File metadata stays in component state and is never
serialized off the page.

### M011 — Team review actions (local state only)

- **`team-media-review.tsx`** — the existing Accept / Needs Better
  Photo / Use Later buttons are now wired to a local
  `Record<id, LocalDecision>` `useState`. A new summary tile row
  (`Pending`, `Accepted today`, `Needs reshoot`, `Saved for later`)
  reacts live to those decisions. Decisions never leave the
  component — no fetch, no mutation, no event emission, no client
  notification.
- **`team-content-review.tsx`** — the three caption-variant cards
  now have **Mark Draft Ready**, **Send to Review**, **Mark
  Scheduled** buttons backed by a local decision map, with a
  decision pill that updates per variant. Same demo-only contract.
- **`team-alert-center.tsx`** — unchanged in this pass. Severity
  tone / category tone / sort already match the workflow's tone
  model; refactoring it to consume `WorkflowItem` directly is
  deferred to a later milestone to keep the diff scoped.

### Rename: `MAMADALI_DEMO_CLIENT_ID` → `DEFAULT_DEMO_CLIENT_ID`

The lingering client-name constant was renamed to a neutral
`DEFAULT_DEMO_CLIENT_ID` across:

- `lib/supabase/clientPortalQueries.ts` (source; old name kept as a
  `@deprecated` alias for one cycle for any downstream code we
  don't see)
- `lib/supabase/index.ts` (only the new name is re-exported)
- `lib/supabase/supabaseHealth.ts`
- `lib/data/supabaseReadOnlyData.ts`
- `hooks/useClientPortalData.ts`
- `pages/supabase-test.tsx`

The UUID value (`00000000-0000-0000-0000-000000000001`) is
unchanged, so behavior and any seeded Supabase row continue to
work identically. Search the repo for the new name; the old
deprecated alias should not be relied on for new code.

## What did **not** change

- Pricing tiers, billing surfaces, the pricing source-of-truth doc.
- M007 `DATA_MODE` switch / M008 read-only adapter / fixture
  fallback semantics / `<DataSourceBadge />` placement.
- `InternalDemoGuard` and any auth gating.
- Owner Portal, Operator Portal, Internal demo pages.
- Existing demo content engines (`recommendNextPost`,
  `EvidenceRecommendationCard`, `DemoSchedulePreview`,
  `DemoFlowTimeline`, restaurant media guidance).

## Verification

- `pnpm --filter @workspace/veroxa run typecheck` — clean.
- Safety audit grep over new files for
  `service_role`, `.insert(`, `.update(`, `.delete(`, `.upsert(`,
  `.upload(`, `openai`, `anthropic`, `gemini`, `migration` — empty.
- No `Pasted-*.txt` present in repo (`.gitignore` already blocks them).

## Suggested follow-ups (not in this pass)

- Refactor `team-alert-center.tsx` to consume `WorkflowItem` directly
  for items whose category is `Media` / `Onboarding`.
- Add a real action handler on `WorkflowItemCard` actions that, in
  a future write-enabled milestone, mutates a server-side workflow
  row and reuses the same label vocabulary.
- Remove the deprecated `MAMADALI_DEMO_CLIENT_ID` alias once a full
  repo grep confirms no external consumer references it.
