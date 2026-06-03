# Veroxa Pre-Build Stability Checklist

Before any large Veroxa build, confirm these foundations stay intact:

## 1. Vercel deploy config

- Root `vercel.json` keeps `"framework": "vite"`.
- Root workspace build command remains `pnpm --filter @workspace/veroxa run build`.
- Output directory remains `artifacts/veroxa/dist/public`.
- Do not add Vercel Services or `experimentalServices`.

## 2. Temp login

- `AUTH_MODE` remains `placeholder` until production auth is explicitly approved.
- Client temp login reaches `/client/dashboard`.
- Team temp login reaches `/team/dashboard`.
- `/client/*` routes stay behind `ClientPortalGuard`.
- `/team/*` routes stay behind `InternalDemoGuard`.
- `/demo/client/*` routes stay public and do not require login.

## 3. Audit search

- `Mamadali`, `Mamdali`, and `Mamadali Kebab House` return a candidate or manual fallback.
- `Selda` and `Selda Mediterranean` return a candidate or manual fallback.
- No-result states become manual audit fallback, not a dead end.
- Search remains deterministic/local/manual only: no scraping, Google Places API, paid APIs, or production writes.

## 4. Public pricing

- Starter remains `$295/month`.
- Growth remains `$495/month` and includes TikTok support.
- Premium remains `$995/month` and inherits Growth with readiness-gated ads support.
- Pricing pages do not say `Most recommended` or `Most popular`.

## 5. Public safety

- No public guarantees for orders, profit, ROI, customers, revenue, walk-ins, or rankings.
- Public metadata remains polished Veroxa metadata.
- No Replit placeholder metadata such as `built on Replit` or `Update this description`.

## 6. SaaS safety

- Do not add production auth, storage, database/RLS migrations, payments, live AI, or publishing connectors unless explicitly approved.
- Keep current SaaS scaffolding as TypeScript-only boundaries until a reviewed production adapter phase is approved.
