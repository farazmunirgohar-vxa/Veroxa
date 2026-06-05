# Next Big Build Readiness Notes — Post-PR70 RR Cleanup

## What PR #70 added

PR #70 built the 90% pre-paid/manual OS foundations: client readiness, weekly updates, monthly reports, launch add-ons, SOPs, readiness mapping, value-proof guardrails, and client portal readiness surfaces.

## What this cleanup fixed

This cleanup aligned the merged foundations before the next major build:

- Placeholder preview login now supports the intended Veroxa review flow while keeping `AUTH_MODE=placeholder`.
- The public header is simplified to centered **Veroxa** only; Home/Audit/Login remain available through page CTAs and routes, not top navigation.
- Client weekly updates and monthly reports now prefer loaded portal summaries before falling back to safe setup previews.
- Client dashboard states are separated between setup, demo/sample, and future loaded client data.
- Current onboarding uses **Complete Online Presence** as the active launch package and keeps Starter/Growth/Premium as historical/internal compatibility only.
- Request boundary counts use classification logic for loaded requests instead of hardcoded add-on/coming-soon zeros.
- Public/client copy was polished to stay premium, calm, manual/pre-live, and client-safe.
- Guardrails were strengthened for header, login, data-state, tier leakage, proof math, offer consistency, and Team deferral.

## Clean enough for the next big build

Veroxa is ready for RR to evaluate the next build plan because the core public/client/onboarding/reporting/request surfaces are cleaner, safer, and less demo-ish. The current system remains preview/manual/pre-live and intentionally avoids paid/live infrastructure.

## What must not be built yet

Do not build production auth, production database/storage writes, live AI, Google/Meta/TikTok/Yelp/YouTube APIs, publishing connectors, payments, checkout, subscriptions, webhooks, cron jobs, or automated customer-visible execution. Do not expand Team Portal complexity or add Owner/Operator/Super Admin/generic Admin/Execution dashboards.

## Recommended next big build focus

The next big build should focus on a dormant live-system blueprint and first-client execution pack: exact activation checklists, manual first-client operating steps, connector readiness interfaces, test harness planning, and RR review criteria. It should not activate paid/live systems yet.

## Before paid systems

Before any paid systems are connected, RR should review auth mode, data boundaries, request boundaries, proof-math containment, SOP readiness, manual execution gates, rollback plan, and whether Veroxa is at the intended pre-spending completeness level.

## A-Z review reminder

After Veroxa reaches about 80% complete pre-spending, Faraz will choose the A-Z review route before paid systems are activated.

## 2026-06-05 — PR72 hotfix/polish readiness note

- Preview login fallback is now limited to localhost, `127.0.0.1`, and `.vercel.app` preview deployments unless explicitly opted in through `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=true` or explicit preview credential env vars.
- Custom domains, including Veroxa-branded production/custom domains, should not depend on hardcoded fallback preview credentials. For a temporary review on a custom domain, set the explicit Vercel env opt-in and remove/disable it when review is complete.
- The next big build remains a dormant live-system blueprint / first-client execution pack. It should define activation checklists, manual execution steps, connector readiness interfaces, and test harness planning without activating paid/live systems.
- Veroxa remains preview/manual/pre-live. No production auth, storage, database writes, live AI, Google/Meta/Yelp/TikTok/YouTube APIs, publishing connectors, payments, webhooks, cron jobs, background jobs, or automated customer-visible execution were added.
- Team complexity remains deferred; do not expand Team Portal command-center features in the next build unless explicitly requested.
