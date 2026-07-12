# Veroxa Pre-Build Stability Checklist
> Do not override current docs: read `ACTIVE_DOCS_INDEX.md` first. Any old pricing, role, auth, or automation language in this file is historical/deprecated unless the active docs index confirms it.


Before any large Veroxa build, read `CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md` and confirm these foundations stay intact:

## 1. GitHub, Sites, and rollback config

- GitHub `main` remains canonical; no live-only Sites change may become the lasting source of truth.
- `artifacts/veroxa-sites/.openai/hosting.json` retains the existing Sites project identity.
- The root pnpm workspace continues to exclude the isolated npm-based `artifacts/veroxa-sites` project.
- Sites changes pass `npm ci`, rendered-route/build/artifact tests, and lint from `artifacts/veroxa-sites`.
- `Build and deploy it` syncs the exact merged GitHub state before a Sites checkpoint and verifies both custom domains afterward.
- Vercel remains rollback only; keep its existing compatibility configuration intact until stabilization is explicitly complete.
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
- Public Sites Client and Team routes are non-sensitive pre-live shells only; do not describe them as secure/owner-restricted or introduce real client/Team-sensitive data before production identity and authorization exist.

## 3. Audit search

- `Mamadali`, `Mamdali`, and `Mamadali Kebab House` return a candidate or manual fallback.
- `Selda` and `Selda Mediterranean` return a candidate or manual fallback.
- No-result states become manual audit fallback, not a dead end.
- Search remains deterministic/local/manual only: no scraping, Google Places API, paid APIs, or production writes.

## 4. Public pricing

- The only active public offer is **Complete Online Presence — $495/month**.
- Starter $295, Growth $495, Premium $995, Local Presence, Full Presence, and old Complete Presence language remain historical/deprecated only.
- Yelp, TikTok, Reels/video content, ads management, daily posting, automated publishing, and live integrations remain coming soon/not included at launch.
- Launch add-ons remain new basic website `+$95` and missing Facebook/Instagram profile creation `+$45/profile`.
- Pricing pages must not revive retired tier comparisons or imply guaranteed results.

## 5. Public safety

- No public guarantees for orders, profit, ROI, customers, revenue, walk-ins, or rankings.
- Public metadata remains polished Veroxa metadata.
- No Replit placeholder metadata such as `built on Replit` or `Update this description`.

## 6. SaaS safety

- Do not add production auth, storage, database/RLS migrations, payments, live AI, or publishing connectors unless explicitly approved.
- Keep current SaaS scaffolding as TypeScript-only boundaries until a reviewed production adapter phase is approved.

## 2026-06-04 — Pre-paid strategy checklist addendum (superseded where noted by the 2026-07-12 protocol)

Before any large build, confirm the current strategy remains intact:

- Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.
- Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.
- Active stack is ChatGPT-managed GitHub + Codex + ChatGPT Sites; Vercel is temporary rollback only and Replit is historical.
- Active roles remain Client and Team. Owner/Operator are inactive and parked.
- `AUTH_MODE` remains `placeholder`.
- Current pricing remains Complete Online Presence — $495/month. Starter $295, Growth $495, and Premium $995 are deprecated/archive-only.
- Legacy preview-only credential strings are retired from active operating guidance and must never be reused as production authentication.
- AI-ready but not connected and integration-ready but not connected are allowed; live AI/connectors/payments/storage/auth remain blocked.
- Restaurant Onboarding is a known gap; do not imply it is production-complete until built.
