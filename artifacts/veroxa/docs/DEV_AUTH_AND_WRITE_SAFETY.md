# Dev Auth and Write Safety

Status: active preview-safety containment.

## Placeholder auth is preview-only

`AUTH_MODE` remains `"placeholder"` for current review builds. Placeholder auth is not production auth and must not be treated as a real user system.

Before `AUTH_MODE` can become `"real"`:

1. Remove the placeholder credential branch from `src/pages/login.tsx`.
2. Remove or replace `src/lib/auth/devCredentials.ts` with a no-op stub.
3. Confirm Supabase auth and `user_profiles` setup are complete.
4. Confirm no service-role key can enter the frontend bundle.

## Dev credentials are env-only

The placeholder matcher reads credentials only from Vite env:

- `VITE_VEROXA_DEV_CLIENT_EMAIL`
- `VITE_VEROXA_DEV_CLIENT_PASSWORD`
- `VITE_VEROXA_DEV_TEAM_EMAIL`
- `VITE_VEROXA_DEV_TEAM_PASSWORD`

If any credential pair is missing, that placeholder login simply does not match. Credentials are not printed and are not embedded in source.

## Dev writes are disabled by default

The write mode resolves to disabled unless all of these are true:

- `VITE_VEROXA_ENABLE_DEV_WRITES="true"`
- `VITE_VEROXA_DEV_WRITE_ENV="dev"`
- the app is not a production build (`import.meta.env.PROD` is false)

Production builds always resolve dev writes to disabled, even if `VITE_VEROXA_ENABLE_DEV_WRITES` is accidentally set to `"true"`.

## Still not connected to production writes

The current dev write path is only for dev Supabase metadata review. It does not add storage uploads, publishing, payment, production auth, or service-role access.
