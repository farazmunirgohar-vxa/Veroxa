# Deployment Preview Login Notes

_Last updated: 2026-06-06 — A–Z cleanup alignment._

Preview login is a temporary review convenience, not production auth.

## Custom-domain behavior

- `localhost` and `.vercel.app` preview fallback can auto-enable preview login for safe review builds.
- **Custom domains require explicit Vercel env opt-in** with:
  - `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=true`
- Vite environment variables are build-time values, so **Vercel must redeploy after env changes** before the browser bundle reflects the setting.

## Optional explicit preview credentials

Vercel can set explicit preview credentials when needed:

- `VITE_VEROXA_DEV_CLIENT_EMAIL`
- `VITE_VEROXA_DEV_CLIENT_PASSWORD`
- `VITE_VEROXA_DEV_TEAM_EMAIL`
- `VITE_VEROXA_DEV_TEAM_PASSWORD`

## Hard disable

- `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=false` is the hard disable flag.
- Hard disable should be used when preview fallback should not appear, even on a domain that would otherwise be eligible.

## Production-auth boundary

- This is **not production auth**.
- Disable/remove preview fallback before real production auth.
- Do not treat preview credentials as customer accounts, billing accounts, or real access control.

## Production/custom-domain preview-login rule (2026-06-06)

Production/custom domains should set `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=false`. Fallback preview credentials are intended only for localhost, `127.0.0.1`, and `.vercel.app` review deployments unless a deployment explicitly opts in with `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=true` or supplies explicit environment credentials. `AUTH_MODE` remains `placeholder` until real-auth readiness is approved; do not treat preview credentials as production auth.

Preview deployments may use fallback preview credentials only for review.
