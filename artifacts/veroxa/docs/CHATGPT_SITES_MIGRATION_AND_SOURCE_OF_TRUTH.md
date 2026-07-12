# ChatGPT Sites Migration and Source-of-Truth

Status: active migration authority as of 2026-07-12.

## Locked direction

Veroxa is moving to the ChatGPT Sites application/deployment surface. This is not a separate demo project and must not become a second product definition.

- GitHub `main` remains the canonical source of truth for Veroxa product behavior, route contracts, operating memory, guardrails, and build direction.
- Codex remains the primary engineering workflow.
- ChatGPT Sites is the new primary application and deployment target being integrated.
- The existing Vercel deployment remains a temporary compatibility and rollback surface until Sites parity, GitHub sync, domain validation, and cutover are complete.
- `veroxasystems.com` must not be moved to an incomplete or visually polished but shallow application.
- The approved Sites visual direction is the presentation layer. It must preserve the existing Veroxa OS rather than replace it.

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

`AUTH_MODE` remains `placeholder`. `/api/pilot-access` remains the current compatibility login path until a separately approved Sites identity migration replaces it. Roles remain `client` and `team` only. Momo owner walkthrough and pilot activation remain blocked without explicit Faraz approval.

## Migration architecture

During migration, Veroxa has two layers with one source of truth:

- **Canonical product layer:** the existing GitHub Veroxa application, domain models, route contracts, docs, tests, and guardrails.
- **Sites delivery layer:** a Sites-compatible application shell that adopts the approved visual system and progressively reaches canonical route and behavior parity.

New product rules must be added to the canonical GitHub layer first or in the same PR as the Sites implementation. The Sites layer must not invent independent pricing, roles, restaurant facts, integrations, or operating logic.

## Domain cutover gate

Do not point `veroxasystems.com` to Sites until all of these are true:

- public Home, Audit, and Login routes are verified;
- Client and Team route separation is verified;
- the six grouped Momo Workspace routes are present;
- desktop and mobile navigation are verified;
- production build and Sites artifact validation pass;
- the integrated Sites source and migration direction are recorded in GitHub;
- access mode for the public website is explicitly approved;
- DNS and SSL validation are ready;
- a rollback path to the existing deployment is documented;
- no custom-domain preview credential fallback is exposed.

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
8. Approve public access, attach `veroxasystems.com`, validate DNS/SSL, and retain rollback.

## Innovation priorities

- Create a shared route-and-capability manifest so navigation, guards, docs, and RR checks derive from the same contract.
- Separate restaurant business truth from presentation components so confirmed facts can move safely across Client, Team, reports, and future integrations.
- Build an evidence ledger for every client-visible report statement: source, review state, attribution confidence, and release approval.
- Treat the Approval Queue as the operating spine connecting audit findings, business truth, media, content, reports, and future execution.
- Build adapters for Sites identity, D1/R2 or an approved external persistence provider only after the product contracts and migration gates are stable.

