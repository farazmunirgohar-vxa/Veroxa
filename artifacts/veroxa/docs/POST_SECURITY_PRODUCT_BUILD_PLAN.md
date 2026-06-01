# Post-Security Product Build Plan

Status: plan only. Do not begin large product feature work until the P0/P1/P2 containment changes are reviewed.

## Stage 1 — Re-check active surfaces after containment

- Confirm Client Dashboard still feels simple, premium, and client-safe.
- Confirm public website and demo flows are not cluttered.
- Keep routing separation intact: demo preview stays `/demo/client/dashboard`; portal access stays `/login`.

## Stage 2 — Client media lifecycle

- Media page buckets: Uploaded / Ready / Posted.
- Media item detail tracker: Uploaded → Reviewed → Ready → Scheduled → Posted.
- Keep all language calm and client-safe.
- Do not add storage upload or live publishing without an explicit future task.

## Stage 3 — Client direction and progress

- Optional media direction from client to Veroxa.
- Updates as account/media progress rather than implementation details.
- Requests page feeds a team review queue.

## Stage 4 — Reports

- Weekly Reports and Monthly Reports surfaces.
- Use real/approved data only; do not invent metrics.
- Keep reports lightweight until production data connectors exist.

## Stage 5 — Team cockpit simplification

- Simplify Team Portal toward a powerful engine with a simple steering wheel.
- Keep Approval Queue, Visibility Audit, Upload Inbox, Work Queue, Direction Queue, Reports, Audit Leads, and readiness work intentional.
- Avoid AI-lab, backend-console, or raw-internals presentation.
