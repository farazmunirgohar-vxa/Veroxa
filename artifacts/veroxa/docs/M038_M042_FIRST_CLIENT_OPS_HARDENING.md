# M038–M042 — First-Client Operating Flow Hardening

Date: 2026-05-30

## What changed

This pass connects the existing first-client workflow model across the client and team surfaces so the portal feels like one operating system instead of separate demo pages.

- Added pure workflow helper functions in `src/lib/workflows/workflowStatus.ts` for:
  - `getClientVisibleWorkflowItems`
  - `getClientActionNeededItems`
  - `getTeamTodayQueueItems`
  - `getTeamAlertWorkflowItems`
  - `getTeamReviewReadyItems`
  - `getTeamQueueOrHoldItems`
  - `getWorkflowSummaryCounts`
  - client-safe request help text and team next-step labels
- Updated Client Dashboard to render the "What Veroxa is working on" strip from shared `WorkflowItem` data.
- Updated Client Requests to show only workflow items that need client input, with calm priority language and client-safe ask copy.
- Updated Team Dashboard to use the same helper-derived workflow counts and cards for today’s priority work, review items, client follow-up, queue/hold work, and alerts.
- Rebuilt Team Work Queue around grouped `WorkflowItem` columns with local-only action buttons: "Mark reviewed", "Ask client", "Queue for later", and "Hold for later".
- Updated Team Alert Center to use workflow-derived alert items, show why each item matters, and point to existing team surfaces.
- Lightly aligned Team Media Review and Team Content Review copy so their local button decisions are clearly page-local demo review notes.

## Pages now consuming shared workflow helpers

- `src/pages/client-dashboard.tsx`
- `src/pages/client-requests.tsx`
- `src/pages/team-dashboard.tsx`
- `src/pages/team-work-queue.tsx`
- `src/pages/team-alert-center.tsx`
- `src/pages/team-media-review.tsx` uses `getTeamReviewReadyItems` for its media review list.

## What stayed demo/read-only

- No Supabase writes.
- No migrations.
- No storage uploads.
- No runtime AI calls.
- No publishing, Google, Meta, payments, or external API integrations.
- No auth mode or data mode changes.
- Team button decisions use local React state only and do not leave the page.
- Client-facing language remains calm and avoids internal system details.

## Safety checks

Changed TypeScript/TSX files were checked for forbidden runtime additions, including:

- `.insert(` / `.update(` / `.delete(` / `.upsert(`
- `.upload(`
- `fetch(`
- `FormData`
- `localStorage` / `sessionStorage`
- `openai` / `anthropic` / `gemini`
- Supabase write chains

Result: no matches in changed `.ts` / `.tsx` files.

## Verification

- `pnpm run typecheck` — PASS.
- `pnpm --filter @workspace/veroxa run typecheck` — PASS.
- `pnpm --filter @workspace/veroxa run build` — PASS. Vite emitted existing sourcemap/chunk-size warnings, but the build exited successfully.

## Suggested next steps

- Add a small shared local-decision component if more team review surfaces need the same four local actions.
- Connect future prepared actions into the same workflow helper layer once approval gates are stable.
- Keep the client workflow copy short and client-safe as the first real client flow becomes less demo-driven.
