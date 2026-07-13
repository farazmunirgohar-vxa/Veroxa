# ChatGPT Sites Migration and Source-of-Truth

Status: active migration and deployment authority as of 2026-07-12.

## Current production-foundation override

The original migration scope below remains useful history, but its statements that production identity, persistence, and protected portal routes are future work are superseded for source truth by `VEROXA_CURRENT_MILESTONE.md`. PR #141 is merged at `46d01c44f0411a4e870cd490d5bfcd8e58ee0e59`, its eight-migration data layer is applied, and its exact runtime source is deployed as verified Sites version 7. That deployed foundation implements Supabase-backed secure-email-link sessions, active Momo membership checks, forced RLS, durable audit intake, protected Client/Team routes, and all seven provider-neutral Momo operating systems.

The seven-system Momo foundation is deployed, but Momo is not 100% ready. Faraz's approved Gmail Team identity is confirmed, has signed in, has active Team/Momo access, and passed the authenticated Safari protected-route smoke. The current unmerged candidate adds approved-user password sign-in and protected password replacement; it is neither deployed nor activated. No Momo owner identity or owner-confirmed data is provisioned. Runtime AI, Meta, Google Business Profile, external SEO/social execution, publishing, visibility monitoring, Momo contact, and client activation are **inactive pending authorized access**. See `MOMO_100_READINESS_SEVEN_SYSTEM_CONTRACT.md` for the source/runtime/activation split.

## Locked direction

Veroxa now uses the ChatGPT Sites application/deployment surface. This is not a separate demo project and must not become a second product definition.

- GitHub `main` remains the canonical source of truth for Veroxa product behavior, route contracts, operating memory, guardrails, and build direction.
- ChatGPT is Faraz's primary planning, orchestration, GitHub, review, and deployment interface.
- Codex is the engineering capability ChatGPT invokes internally.
- ChatGPT Sites is the primary application and deployment surface.
- Vercel is retired. Sites is the sole deployment surface; GitHub `main` plus verified Sites checkpoints are the recovery path.
- `veroxasystems.com` and `www.veroxasystems.com` are attached to Sites with active provider and SSL status as last verified on 2026-07-13.
- The approved Sites visual direction is the presentation layer. It must preserve the existing Veroxa OS rather than replace it.
- `CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md` controls the build, green-merge, hold, RR, and deployment command meanings.

## ChatGPT-managed build, merge, and deployment workflow

Faraz and ChatGPT decide the next product outcome together. After Faraz authorizes the work, ChatGPT handles the normal Codex, GitHub, CI, RR, and Sites operations inside the connected workflow without requiring Faraz to copy a prompt into another product.

- `Build it` means implement the agreed scope, test it, create/update the pull request, repair CI and RR findings, and merge the exact reviewed head only after the green gate passes. It does not deploy Sites unless deployment was explicitly requested.
- `Build it, but hold for review` performs the same work through a verified green pull request, then stops without merge or deployment.
- `Build and deploy it` performs the green merge, synchronizes the exact merged GitHub state to Sites, runs Sites verification, creates a checkpoint deployment, and verifies live access plus custom-domain health.
- `RR` performs deep review and reasonable safe fixes but does not independently authorize merge, deployment, activation, or material scope expansion.

Green requires correct scope, applicable local checks, required GitHub checks, Sites checks when that layer changes, mergeability, an unchanged reviewed head commit, no unresolved actionable review thread or known critical/high-severity defect, and intact Veroxa safety and product guardrails. Re-check immediately before merge.

Pause for specific Faraz direction when scope materially expands into production auth/credentials, real customer data or privacy, destructive data or production migrations, billing/payments, external integrations or publishing, owner/client contact, business-truth or public-promise changes, DNS/domain-record changes, Momo activation/walkthrough, or a material product-direction change.

## Product surfaces that must survive the migration

1. Public flow: Home -> Audit -> Login.
2. Restaurant Partner / Client Portal.
3. Team Faraz / Internal Portal.
4. Momo Workspace grouped routes:
   - `/team/momo`
   - `/team/momo/work`
   - `/team/momo/intelligence`
   - `/team/momo/content-ai`
   - `/team/momo/reports`
   - `/team/momo/readiness`
5. Client onboarding, media, requests/messages, updates, reports, connections, and profile/business-truth review.
6. Approval gates, reporting honesty, restaurant matching safety, client-safe language, and the post-PR120 operating lock.

## Non-negotiable safety boundaries

The hosting migration does not authorize any of the following:

- production auth activation;
- credential creation;
- contacting Momo's House;
- external platform connections;
- Google, Meta, ordering, or publishing actions;
- runtime AI provider calls;
- database writes or storage activation;
- fake metrics, fake activity, fake reports, fake readiness, or fake integrations;
- public/client exposure of Team-only data;
- changing verified business truth without confirmation.

Deployed Sites version 7 uses secure-email-link Supabase authentication with active profile/membership enforcement. The current unmerged candidate adds approved-user password authentication and protected password replacement. Public signup remains disabled, and a fresh email-link session is the recovery path. The undeployed Vite `AUTH_MODE = placeholder` path is historical/internal and its root `/api/pilot-access` deployment adapter is retired. Roles remain `client` and `team` only. Momo owner walkthrough and pilot activation remain blocked without explicit Faraz approval.

## Migration architecture

During migration, Veroxa has two layers with one source of truth:

- **Canonical product layer:** the existing GitHub Veroxa application, domain models, route contracts, docs, tests, and guardrails.
- **Sites delivery layer:** a Sites-compatible application shell that adopts the approved visual system and progressively reaches canonical route and behavior parity.

New product rules must be added to the canonical GitHub layer first or in the same PR as the Sites implementation. The Sites layer must not invent independent pricing, roles, restaurant facts, integrations, or operating logic.

## Custom-domain state and stabilization gate

Faraz approved public Sites access and completed the Namecheap DNS changes. As last verified on 2026-07-12:

- the Sites project access mode is public;
- `veroxasystems.com` is active with active SSL and no reported domain error;
- `www.veroxasystems.com` is active with active SSL and no reported domain error;
- routine future Sites deployments use these existing domains and do not require new Namecheap records;
- Vercel is not a rollback path and no Vercel configuration or serverless handler belongs in the active repository.

Continue to protect the domain after cutover:

- keep public Home, Audit, and Login routes verified;
- keep Client and Team route boundaries honest;
- treat the publicly reachable Client and Team pages as non-sensitive pre-live shells until production identity/authorization is approved and implemented;
- keep desktop/mobile navigation, production build, rendered-route tests, lint, and Sites artifact validation green;
- keep every deployed product change synchronized with GitHub `main`;
- never expose production credentials, real client data, Team-sensitive data, or a custom-domain preview credential fallback;
- verify the live deployment, public access, both custom domains, SSL, and rollback state after each authorized production checkpoint.

## RR meaning after this migration

When Faraz asks for `RR`, perform a deep GitHub review beginning with:

1. `AGENTS.md`.
2. `ACTIVE_DOCS_INDEX.md`.
3. `VEROXA_LOCKED_OPERATING_MEMORY.md`.
4. This migration document.
5. `CURRENT_BUILD_STATUS.md`.
6. Current GitHub PR, CI, route, security, and guardrail state.
7. Current ChatGPT Sites parity, deployment, domain, and access state.

RR must identify and fix reasonable direction drift, doc drift, route drift, guardrail gaps, security issues, TypeScript/schema issues, CI failures, and Sites integration gaps. RR must not silently activate external systems or broaden real-world authority.

## Recommended migration sequence

1. Establish the real public, Client, and Team route skeleton in Sites using the approved visual system.
2. Add a route-parity contract and automated guardrail shared by GitHub memory/docs.
3. Port client onboarding, media, requests/messages, reports, connections, and profile behavior without fixture leakage.
4. Port the grouped Momo Workspace and safe internal action links.
5. Decide the Sites identity and persistence architecture in a separate approved PR.
6. Add real data adapters behind existing interfaces; do not rewrite product logic inside pages.
7. Complete security, mobile, accessibility, and browser verification.
8. Keep public access, both attached custom domains, DNS/SSL, GitHub/Sites parity, and the temporary rollback path verified through stabilization.

## Innovation priorities

- Create a shared route-and-capability manifest so navigation, guards, docs, and RR checks derive from the same contract.
- Separate restaurant business truth from presentation components so confirmed facts can move safely across Client, Team, reports, and future integrations.
- Build an evidence ledger for every client-visible report statement: source, review state, attribution confidence, and release approval.
- Treat the Approval Queue as the operating spine connecting audit findings, business truth, media, content, reports, and future execution.
- Build adapters for Sites identity, D1/R2 or an approved external persistence provider only after the product contracts and migration gates are stable.
