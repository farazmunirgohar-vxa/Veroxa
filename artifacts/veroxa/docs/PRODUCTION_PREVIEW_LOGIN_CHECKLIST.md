# Real Login V1 / Pilot Portal Access Checklist

Status: Real Login V1 pilot-access checklist. This replaces public preview-login deployment language for the production/custom-domain experience. It does **not** activate secure production auth.

Authority: read [`ACTIVE_DOCS_INDEX.md`](./ACTIVE_DOCS_INDEX.md) first. `AUTH_MODE` remains `"placeholder"` until a separate owner-approved production-auth PR.

## Production/custom-domain rule

- `/login` must say **“Sign in to Veroxa”** and **“Access your Veroxa portal.”**
- Production/custom domains must not show preview/demo/review-login wording, public preview credentials, or fake/temporary portal language.
- Real Login V1 uses deterministic/manual pilot access records until production auth is explicitly implemented.
- Do not claim secure production auth, billing access, or automated account security exists while `AUTH_MODE` is still `"placeholder"`.

## Active pilot account records

Real Login V1 supports only two account destinations:

- **Momo House San Antonio** → Client Portal → `/client/dashboard`
- **Team Faraz** → Team/Internal Admin Portal → `/team/dashboard`

Environment-specific pilot credentials may be provided with:

- `VITE_VEROXA_PILOT_CLIENT_EMAIL`
- `VITE_VEROXA_PILOT_CLIENT_PASSWORD`
- `VITE_VEROXA_PILOT_TEAM_EMAIL`
- `VITE_VEROXA_PILOT_TEAM_PASSWORD`

Legacy `VITE_VEROXA_DEV_*` variables may still be read as a compatibility fallback for existing deployment settings, but UI/docs must refer to portal access or pilot access, not preview login.

## Portal and route guard rule

Only these portal classes are active:

- `/client/*` — guarded Client Portal surfaces.
- `/team/*` — guarded Team/Internal Admin Portal surfaces.

These public demo/preview surfaces must remain disabled/retired:

- `/demo`
- `/guided-demo`
- `/upload`
- `/demo/client/*`

Owner, Operator, Super Admin, generic Admin, and Execution portals remain parked/blocked.

## Pre-deploy confirmation

Before a production/custom-domain deploy, confirm:

- `AUTH_MODE` is still `"placeholder"` unless a separate owner-approved production-auth PR intentionally changes it.
- `/login` no longer contains preview/review/demo wording or public preview credentials.
- Momo House San Antonio signs into `/client/dashboard`.
- Team Faraz signs into `/team/dashboard`.
- Wrong credentials show a clean Veroxa portal-account error.
- Wrong-role sessions cannot view the other portal.
- No service-role key is present in frontend env.
- No Supabase migrations, database writes, storage uploads, live AI calls, platform connectors, payments, webhooks, cron/background jobs, automated publishing, or customer-visible automation were added.
