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

## 2026-06-04 — Pre-paid strategy checklist addendum

Before any large build, confirm the current strategy remains intact:

- Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.
- Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.
- Active stack remains GitHub + Codex + Vercel; Replit is historical only.
- Active roles remain Client and Team. Owner/Operator are inactive and parked.
- `AUTH_MODE` remains `placeholder`.
- Current pricing remains Starter $295, Growth $495, Premium $995.
- Preview credentials remain [client@veroxa.com](mailto:client@veroxa.com) / farazclient and [team@veroxa.com](mailto:team@veroxa.com) / farazteam.
- AI-ready but not connected and integration-ready but not connected are allowed; live AI/connectors/payments/storage/auth remain blocked.
- Restaurant Onboarding is a known gap; do not imply it is production-complete until built.
