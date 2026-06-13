# Momo Live Pilot Readiness — Real Login V1 / CP-V1

Status: current live-pilot checklist for Momo House San Antonio. Manual/pre-live boundaries remain locked: `AUTH_MODE` stays `placeholder`; no Supabase auth, production auth, database writes, storage uploads, OAuth, live Google/Meta integrations, live AI, payments, publishing, cron jobs, fake metrics, fake upload success, or fake message delivery are added.

## CP-V1 route and nav lock

Primary Client Portal navigation remains exactly: **Home, Media, Messages, Reports, Connections, Profile**.

Hidden guarded compatibility aliases:

- `/client/requests` renders Messages.
- `/client/updates` renders Reports.
- `/client/onboarding` renders the Profile setup-review experience.

## Vercel env vars

Server-only environment variables, set in Vercel Environment Variables and never with a `VITE_` prefix:

- `VEROXA_PILOT_MOMO_HOUSE_PASSWORD`
- `VEROXA_PILOT_TEAM_FARAZ_PASSWORD`

Frontend build env var:

- `VITE_VEROXA_PILOT_ACCESS_ENDPOINT=/api/pilot-access`

The frontend now safely defaults to `/api/pilot-access` when the VITE endpoint is not set. `VITE_` variables are exposed to the browser bundle, so passwords must never use `VITE_`. Redeploy after env changes. Rotate passwords by changing the Vercel env var, redeploying, and sharing the new value only out-of-band.

## Endpoint behavior

`/api/pilot-access` accepts POST JSON with `email` and `password`. Valid pilot logins return only safe metadata: `ok`, `accountId`, `email`, and `role`. Wrong passwords return a safe failure. Missing password env vars disable successful login without returning secrets or stack traces. GET/non-POST requests are rejected safely. Rate limiting is conservative in-memory best-effort for Vercel serverless; it does not provide distributed durable rate limiting because no storage/database is connected.

## Manual login QA checklist

1. Go to `/login`.
2. Login as `momo@veroxa.app` with the Vercel value of `VEROXA_PILOT_MOMO_HOUSE_PASSWORD`.
3. Confirm redirect to `/client/dashboard`.
4. Click through Home, Media, Messages, Reports, Connections, and Profile.
5. Confirm primary nav does not show Dashboard, Onboarding, Updates, or Requests.
6. Test `/client/requests` and confirm it behaves as Messages.
7. Test `/client/updates` and confirm it behaves as Reports.
8. Test `/client/onboarding` and confirm it behaves as Profile setup review.
9. Try a wrong password and confirm safe failure.
10. Try direct `/client/dashboard` logged out and confirm login-required safe state.
11. Login as `faraz@veroxa.app` with the Vercel value of `VEROXA_PILOT_TEAM_FARAZ_PASSWORD` and confirm `/team/dashboard`.
12. Confirm the team account cannot view the client portal incorrectly.
13. Confirm the Momo account cannot view the team portal incorrectly.

## Owner walkthrough script

Show first: login, Home, Needed From You, Media Needed, Messages, Reports, Connections, and Profile.

Say:

- “This is your review-mode client portal.”
- “Nothing goes live without Veroxa review.”
- “This is where we track what is done, what we need from you, and what we are doing next.”

Do not say:

- Do not claim live uploads.
- Do not claim live messages are delivered.
- Do not claim Meta/Google are connected.
- Do not claim reports include live metrics yet.
- Do not claim automatic publishing.

Ask Momo to confirm business hours, menu/order link, catering availability, Meta access, Google Business Profile manager access, fresh food photos/videos, and any profile corrections.

## Rollback / emergency disable

To disable pilot login quickly, remove or blank `VEROXA_PILOT_MOMO_HOUSE_PASSWORD` and `VEROXA_PILOT_TEAM_FARAZ_PASSWORD`, then redeploy. To rotate Momo, change `VEROXA_PILOT_MOMO_HOUSE_PASSWORD`, redeploy, and share only out-of-band. To rotate Team, change `VEROXA_PILOT_TEAM_FARAZ_PASSWORD` and redeploy. Safe failure should show no stack trace, no secret leak, no crash loop, and no successful login.
