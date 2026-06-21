## Historical/blocked reference only — not active launch or walkthrough guide

Do not use this document as an active launch guide or active owner walkthrough guide. Momo owner walkthrough remains blocked. No activation or owner outreach is approved. Future owner walkthrough requires separate explicit Faraz approval. Current active source-of-truth is the post-PR120 dry-run/go-no-go state: merged PR #120 — Momo Internal Dry Run + Go/No-Go Gate.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval.

# Momo Pilot Launch QA Checklist

Status: historical/blocked reference only. This preserved launch QA checklist is not active and must not be used to start a walkthrough or pilot unless Faraz explicitly reactivates that scope later.

This historical checklist originally answered a pre-live launch question; it is preserved only for context and must not be treated as current readiness guidance.

## A. Deployment / environment setup

- [ ] API server is deployed and reachable.
- [ ] Frontend is deployed and reachable.
- [ ] `VITE_VEROXA_PILOT_ACCESS_ENDPOINT` points to the correct deployed `POST /api/pilot-access` endpoint.
- [ ] `VEROXA_PILOT_MOMO_HOUSE_PASSWORD` is configured server-side only.
- [ ] `VEROXA_PILOT_TEAM_FARAZ_PASSWORD` is configured server-side only.
- [ ] `VEROXA_TRUST_PROXY` is unset or `false` unless explicitly configured safely for the deployed proxy path.
- [ ] CORS allows the deployed frontend domain and does not open unnecessary origins.
- [ ] No pilot password appears in frontend source, browser-intended docs, or build output.
- [ ] `AUTH_MODE` remains placeholder/manual pilot access unless a later approved production-auth PR changes it.

## B. Login QA

- [ ] Momo House pilot login works.
- [ ] Momo House routes to `/client/dashboard`.
- [ ] Team Faraz pilot login works.
- [ ] Team Faraz routes to `/team/dashboard`.
- [ ] Wrong password shows a clean, owner-safe error.
- [ ] Missing pilot endpoint shows safe “portal access not configured” behavior.
- [ ] Stale preview sessions are rejected.
- [ ] Retired demo/preview credentials do not work.
- [ ] Public preview-login wording does not appear on `/login`.
- [ ] `/demo`, `/guided-demo`, `/upload`, and `/demo/client/*` stay retired.

## C. Audit QA

- [ ] Free Audit loads on mobile.
- [ ] Audit V2 generates for Momo House.
- [ ] Audit hero is short, premium, and owner-friendly.
- [ ] Top 3 opportunities are unique.
- [ ] Restaurant Growth Insights appears.
- [ ] Content Sustainability describes Momo House’s narrow momo menu as manageable.
- [ ] Full Signal Breakdown is collapsed by default.
- [ ] Source Notes are collapsed by default.
- [ ] No expansion-opportunity language appears yet.
- [ ] No sales, customer, revenue, ranking, profit, ROI, walk-in, or growth guarantees appear.
- [ ] Free Audit remains honest that walkthrough requests are stored locally in the browser and portal lead capture is not connected yet.

## D. Client Portal QA

- [ ] Client Home loads after Momo House login at `/client/dashboard`.
- [ ] Primary client navigation shows exactly Home, Media, Messages, Reports, Connections, and Profile.
- [ ] Primary client navigation does not show Dashboard, Onboarding, Updates, or Requests.
- [ ] Home clearly answers what Veroxa has done, what Veroxa needs from Momo House, and what Veroxa is currently doing.
- [ ] Media clearly shows specific photos/videos Veroxa needs next and does not claim fake upload success.
- [ ] Messages uses Inbox, Sent, and New Message language rather than ticket/request language.
- [ ] Reports contains Weekly Updates and Monthly Reports without fake metrics.
- [ ] Connections tracks only Meta Business Suite and Google Business Profile.
- [ ] Profile allows owner review/correction and uses Save Changes for Veroxa Review.
- [ ] Owner can clearly see what to confirm next.
- [ ] Owner can clearly see what Veroxa already knows.
- [ ] Owner can clearly see what access Veroxa needs.
- [ ] Owner can clearly see what photos/videos to upload or send next.
- [ ] No internal-only jargon appears in client-facing copy.
- [ ] No empty/demo/sample/preview language appears in active owner-facing copy.
- [ ] Mobile layout is readable.

## E. Team Portal QA

- [ ] Team dashboard loads after Team Faraz login.
- [ ] Team Faraz can find Momo House pilot status quickly.
- [ ] Team Faraz can see the pilot access/login status note.
- [ ] Team Faraz can see audit status.
- [ ] Team Faraz can see onboarding status.
- [ ] Team Faraz can see owner verification needed.
- [ ] Team Faraz can see access blockers.
- [ ] Team Faraz can see media/content intake status.
- [ ] Team Faraz can see what to do in the first 7 days.
- [ ] Team Faraz can see what to do in the first 30 days.
- [ ] Team copy does not imply live automation, live integrations, live publishing, storage uploads, or payments are connected.

## F. Final owner walkthrough QA

- [ ] Faraz can explain what Veroxa is in one simple sentence.
- [ ] Faraz can show the Free Audit.
- [ ] Faraz can show the Client Portal.
- [ ] Faraz can explain what Momo House needs to confirm.
- [ ] Faraz can explain what Veroxa will do first.
- [ ] Faraz can explain what is manual/pilot-only right now.
- [ ] Faraz can explain that nothing goes live without the right access and review.
- [ ] Faraz can avoid overpromising results.
- [ ] Faraz can clearly say Veroxa does not guarantee sales, customers, revenue, rankings, profit, ROI, walk-ins, or growth.

## Required verification commands

Run these before the pilot walkthrough PR is merged:

```bash
pnpm run typecheck
pnpm --filter @workspace/api-server run test:pilot-access
pnpm --filter @workspace/api-server run test:scan-url-safety
pnpm run verify:veroxa
pnpm --filter @workspace/veroxa run build
pnpm --filter @workspace/veroxa run test:e2e
```

## Remaining manual deployment checks

These cannot be fully proven from local code alone and must be checked in the deployed environment:

- API server URL and CORS configuration.
- Frontend environment variable value for `VITE_VEROXA_PILOT_ACCESS_ENDPOINT`.
- Server-only secret configuration for both pilot passwords.
- Deployed build output password scan.
- Mobile walkthrough on the production/custom-domain frontend.


## 2026-06-13 — Momo CP-V1 live pilot readiness

- CP-V1 primary nav remains exactly Home, Media, Messages, Reports, Connections, Profile.
- `/client/requests` is a hidden guarded alias to Messages.
- `/client/updates` is a hidden guarded alias to Reports.
- `/client/onboarding` is a hidden guarded alias to the Profile setup-review experience.
- `/api/pilot-access` is the Vercel serverless pilot-login endpoint; SPA rewrites must not swallow `/api/*`.
- Manual/pre-live boundaries remain locked: no production auth, database writes, storage uploads, live integrations, OAuth, live AI, payments, publishing, cron jobs, fake metrics, fake upload success, or fake message delivery.
