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

## 2. Authentication boundaries by delivery surface

- The Vite/Vercel rollback keeps `AUTH_MODE = placeholder` and `/api/pilot-access` until a separate rollback-auth migration is approved.
- The primary Sites delivery layer uses Supabase Auth with signed server sessions, active profile plus active Momo membership, RLS, and role-checked protected routes.
- Public Supabase account creation stays disabled; identities require supported Admin pre-provisioning plus Veroxa profile/membership provisioning.
- Client temp login reaches `/client/dashboard`.
- Team temp login reaches `/team/dashboard`.
- `/client/*` routes stay behind `ClientPortalGuard`.
- `/team/*` routes stay behind `InternalDemoGuard`.
- `/demo/client/*` routes stay public and do not require login.
- Public marketing and audit-intake routes remain anonymous. Sites Client and Team routes redirect guests, enforce role and active membership on the server, refresh session cookies, and never render fixture operational claims.

## 3. Audit search

- `Mamadali`, `Mamdali`, and `Mamadali Kebab House` return a candidate or manual fallback.
- `Selda` and `Selda Mediterranean` return a candidate or manual fallback.
- No-result states become manual audit fallback, not a dead end.
- Preliminary scoring remains deterministic/local/manual: no scraping, Google Places API, or paid APIs. A separately consented walkthrough request may write through signed Audit Center intake and must never create an operational client.

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

- Production auth, versioned Momo storage, database/RLS migrations, and Audit Center persistence are approved only for the locked Momo/Audit scope in `VEROXA_CURRENT_MILESTONE.md`.
- Do not broaden operational tenancy, add payments, live AI, external platform connections, or publishing connectors without the applicable approval and zero-new-spend review.

## 2026-06-04 — Pre-paid strategy checklist addendum (superseded where noted by the 2026-07-12 protocol)

Before any large build, confirm the current strategy remains intact:

- Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.
- Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.
- Active stack is ChatGPT-managed GitHub + Codex + ChatGPT Sites; Vercel is temporary rollback only and Replit is historical.
- Active roles remain Client and Team. Owner/Operator are inactive and parked.
- `AUTH_MODE` remains `placeholder` for Vite/Vercel rollback; Sites uses the production Supabase session boundary.
- Current pricing remains Complete Online Presence — $495/month. Starter $295, Growth $495, and Premium $995 are deprecated/archive-only.
- Legacy preview-only credential strings are retired from active operating guidance and must never be reused as production authentication.
- AI-ready but not connected and integration-ready but not connected are allowed; live AI/connectors/payments remain blocked. Sites Auth and the scoped Momo/Audit database foundation are active infrastructure, not external business activation.
- Restaurant Onboarding is a known gap; do not imply it is production-complete until built.
