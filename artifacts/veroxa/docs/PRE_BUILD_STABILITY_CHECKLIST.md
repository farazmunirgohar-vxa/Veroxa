# Veroxa Pre-Build Stability Checklist
> Do not override current docs: read `ACTIVE_DOCS_INDEX.md` first. Any old pricing, role, auth, or automation language in this file is historical/deprecated unless the active docs index confirms it.


Before any large Veroxa build, read `CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md` and confirm these foundations stay intact:

## 1. GitHub, Sites, and recovery config

- GitHub `main` remains canonical; no live-only Sites change may become the lasting source of truth.
- `artifacts/veroxa-sites/.openai/hosting.json` retains the existing Sites project identity.
- The root pnpm workspace continues to exclude the isolated npm-based `artifacts/veroxa-sites` project.
- Sites changes pass `npm ci`, rendered-route/build/artifact tests, and lint from `artifacts/veroxa-sites`.
- `Build and deploy it` syncs the exact merged GitHub state before a Sites checkpoint and verifies both custom domains afterward.
- Vercel is retired. Root Vercel serverless handlers, Vercel status gates, and Vercel rollback instructions must remain absent from the active release path. Until the legacy Git integration is disconnected, the exact root `vercel.json` shutdown sentinel may contain only `$schema` plus `git.deploymentEnabled: false`; remove it after disconnection.
- GitHub `main` plus verified Sites checkpoints are the recovery path. Record the exact merged commit and Sites version for every production deployment.
- The canonical Vite application may continue to build for contract/regression coverage, but it is not a deployment or rollback surface.

## 2. Authentication boundaries

- Sites uses Supabase Auth with signed server sessions, active profile plus active Momo membership, RLS, and role-checked protected routes.
- Public Supabase account creation stays disabled; identities require supported Admin pre-provisioning plus Veroxa profile/membership provisioning.
- Approved Client login reaches `/client/dashboard`; no Momo Client identity is currently provisioned.
- Approved Team login reaches `/team/momo`; Faraz's protected route and password sign-in are verified.
- `/client/*`, `/team/*`, and `/account/security` remain protected server routes and must validate role plus active Momo membership before rendering.
- Secure-email-link recovery and `shouldCreateUser: false` remain intact. Hosted reauthentication and old-session revocation remain unverified and must not be claimed as complete.
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

## 2026-06-04 — Historical pre-paid strategy checklist addendum

This addendum preserves the free-first product strategy only. Its former Vercel rollback, placeholder-auth, and pre-live deployment instructions are retired and must not be used as current requirements.

- Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.
- Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.
- Active stack is ChatGPT-managed GitHub + Codex + ChatGPT Sites; Vercel and Replit are retired deployment paths.
- Active roles remain Client and Team. Owner/Operator are inactive and parked.
- The legacy Vite `AUTH_MODE = placeholder` implementation is historical/internal; Sites uses the production Supabase session boundary.
- Current pricing remains Complete Online Presence — $495/month. Starter $295, Growth $495, and Premium $995 are deprecated/archive-only.
- Legacy preview-only credential strings are retired from active operating guidance and must never be reused as production authentication.
- AI-ready but not connected and integration-ready but not connected are allowed; live AI/connectors/payments remain blocked. Sites Auth and the scoped Momo/Audit database foundation are active infrastructure, not external business activation.
- Restaurant Onboarding has a deployed production foundation; do not imply Momo is operationally complete until owner-confirmed evidence exists.
