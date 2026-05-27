# First-Client Readiness Checklist (M021)

Honest snapshot of what is built vs. what is still required before
the first real client uses Veroxa in production.

## A. Already built

- Pricing model (Google Optimization, Complete Online Presence,
  Ads Add-on, Ads Management Only).
- Client Portal demo.
- Team Portal demo.
- Restaurant Upload Key flow + `/upload` page.
- Team Upload Inbox.
- Client Direction Center.
- Team Direction Queue.
- Rule-based Adaptive Intelligence preview.
- Weekly Strategy Snapshot.
- Supabase read-only foundation (opt-in via
  `VITE_VEROXA_DATA_MODE=supabase_readonly`).
- Shared local stores: `localUploadStore`, `localDirectionStore`.
- First-client TypeScript contracts (`firstClientContracts.ts`).
- Visibility rules helper (`visibilityRules.ts`).
- Write readiness helper (`writeReadiness.ts`, `WRITES_ENABLED=false`).

## B. Still local/demo only

- Uploads (metadata in `sessionStorage`, no real file storage).
- Direction submissions (metadata in `sessionStorage`).
- Team review actions (in-memory + session updates only).
- Adaptive memory (fixture).
- Reports / updates flow (fixture).

## C. Needed before real pilot

- Real upload storage (private bucket + signed URLs).
- `upload_submissions` writes.
- `restaurant_upload_keys` table + revocation flow.
- `direction_requests` writes.
- `team_review_decisions` writes.
- Basic client onboarding record (`clients` / `restaurants`).
- Client/team shared real data (RLS scoped).
- Basic manual admin override path.

## D. Needed before first paid client

- Basic reliability: error states, retry guidance, status pages.
- Backup / manual export path.
- Privacy notes + data handling page.
- Status / error handling that never leaks raw DB errors.
- Onboarding SOP (who does what, day 0–7).
- Client expectations document (what Veroxa does + does not do).
- Support process (how clients reach us, response SLA).

## E. Wait until after 1–3 clients

- Owner / Operator portal expansion.
- Real AI APIs (OpenAI / Anthropic / Gemini).
- Real publishing (Meta / Google posts / TikTok).
- Ads platform APIs.
- Payments / billing automation.
