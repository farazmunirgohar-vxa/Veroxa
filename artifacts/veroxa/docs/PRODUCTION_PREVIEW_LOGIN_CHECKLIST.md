# Production Preview Login Checklist

Status: preview-login deployment checklist only. This does **not** activate production auth.

Authority: read [`ACTIVE_DOCS_INDEX.md`](./ACTIVE_DOCS_INDEX.md) first. `AUTH_MODE` remains `"placeholder"` until a separate owner-approved real-auth PR.

## Production/custom-domain rule

- Production/custom domains should set `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=false`.
- Vercel env changes require a redeploy before the app behavior changes.
- No billing, paid client access, or real client access should rely on preview credentials.

## Preview credential rule

Preview credentials are not production auth. They exist only to review the placeholder Client and Team portals before real auth is approved.

Fallback preview login should only be used for:

- `localhost`
- `127.0.0.1`
- `.vercel.app` review deployments

Any other hostname should only use preview login if explicitly opted in by the owner for a temporary review.

## Env credential rule

Explicit Vercel review credentials may be used for review deployments only:

- `VITE_VEROXA_DEV_CLIENT_EMAIL`
- `VITE_VEROXA_DEV_CLIENT_PASSWORD`
- `VITE_VEROXA_DEV_TEAM_EMAIL`
- `VITE_VEROXA_DEV_TEAM_PASSWORD`
- `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN`

Do not expose credentials in public docs except the approved preview-only fallback already present in dev credential docs. Do not use these credentials as proof that production auth, billing, client access, or account security is ready.

## Pre-deploy confirmation

Before a production/custom-domain deploy, confirm:

- `AUTH_MODE` is still `"placeholder"` unless a separate owner-approved PR intentionally changes it.
- `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=false` on production/custom domains.
- No service-role key is present in frontend env.
- No Supabase migrations, database writes, storage uploads, live AI calls, platform connectors, payments, webhooks, cron/background jobs, or automated publishing were added as part of preview login.
- `/login` copy makes clear that preview credentials are for review access only.

## If preview login is accidentally exposed

1. Set `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=false`.
2. Redeploy Vercel.
3. Confirm fallback credentials no longer work on the production/custom domain.
4. Keep `AUTH_MODE="placeholder"` unless a real-auth PR has already been approved.
5. Document the incident and the redeploy confirmation.
