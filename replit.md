# Veroxa Growth OS

Veroxa is a restaurant-partner SaaS that manages online presence, content, local visibility, and reporting for restaurant clients.

## Run & Operate

- `pnpm --filter @workspace/veroxa run dev` — run the Veroxa web app (primary artifact)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string; `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + wouter (routing) + Tailwind CSS + shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/veroxa/` — primary web app (React + Vite)
  - `src/pages/` — all page components; `client-*` = Client Portal, `team-*` = Team Portal
  - `src/domain/clientPortalJourney/` — client-safe domain model (types, helpers, repository, reports)
  - `src/domain/visibilityAudit/` — local-visibility audit engine
  - `src/components/client/` — reusable client-portal UI components
  - `src/lib/` — repositories, workflow, clientPortalNav, clientPortalContext
  - `src/data/` — demo fixtures (pricing, clients, workflows, upload keys)
- `artifacts/api-server/` — Express API server
- `lib/` — shared workspace packages
- `src/data/pricing/veroxaPricing.ts` — canonical pricing constants (do not change from UI)

## Architecture decisions

- **Client-safe language gate**: `domain/clientPortalJourney/languageSafety.ts` enforces a denylist of internal terms (OpenAI, Supabase, API, risk level, etc.) so generated client copy never leaks internals.
- **Two-portal design**: `/client/*` for restaurant partners, `/team/*` for the Veroxa internal team. `/demo/client/dashboard` is a public-preview alias of the client dashboard.
- **Domain-driven client model**: All client-facing data is assembled through `getClientPortalJourney(clientId)` in the repository, which merges workflow items, prepared actions, visibility audit, and reports into clean `ClientJourneyItem` objects.
- **Local/demo-first**: Client pages are fully functional with demo data (`demo-a` client) before any real Supabase account is connected. The `useActiveClientPortalContext` hook bridges real vs. demo.
- **No invented metrics**: Reports and updates show only honest, plain-language summaries of actual workflow activity — no fake revenue, rankings, or walk-in counts.

## Product

- **Public pages**: Landing, Services, Pricing (three-tier: Essential $497 / Growth $697 / Premium $997), Free Audit, guided Demo
- **Client Portal** (`/client/*`): Dashboard, Upload Media, Requests (incl. send-a-note form), Updates, Reports — all client-safe, no backend jargon
- **Team Portal** (`/team/*`): Internal dashboards, approval queues, media review, visibility audit tools, content pipeline
- **Demo Preview**: `/demo/client/dashboard` — public, no login required

## User preferences

- Pricing page is the source of truth for public pricing; do not change amounts from the UI unless explicitly asked.
- Keep client-facing copy calm, plain, and blame-free. Use `assertClientSafeLanguage()` on generated report/update strings.
- Google visibility work must use approved wording: "Google profile freshness", "local visibility", "visibility update", "review response" — never "Maps API", "crawler", "score", or "rank guarantee".
- No contract language, no founding-client pricing, no 50%-off language on the public pricing page.

## Gotchas

- **Never call `pnpm dev` at the workspace root** — artifacts need `PORT` and `BASE_PATH` env vars wired by the workflow system.
- **Typecheck with `pnpm --filter @workspace/veroxa run typecheck`**, not `build` (build requires workflow-provided env vars).
- `veroxaPricing.ts` is a backend constant file; pricing page imports were replaced with inline plan constants — do not re-import from there in `pricing.tsx`.
- `SHOWCASE_ID = "demo-a"` is used throughout client pages as the local demo client ID. It is not a UUID and must not be sent to Supabase FKs.
- The `createWorkflowItem()` helper in `lib/workflow/workflowRepository.ts` is the standard way to create local workflow entries from client pages; the `veroxaWriteAdapter` handles optional opportunistic DB writes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Client portal domain: `src/domain/clientPortalJourney/index.ts` exports everything pages need
- Client portal nav: `src/lib/clientPortalNav.ts`
- Demo client data: `src/data/workflows/clientTeamWorkflow.ts`
