# Veroxa — Build Status

**Date:** May 23, 2026
**Milestone:** Routed Portal Demo + Live Client Read Layer

---

## Client Portal

- Status: **routed pages live**
- Routes:
  - `/demo/client` → Dashboard (alias)
  - `/demo/client/dashboard`
  - `/demo/client/calendar`
  - `/demo/client/google`
  - `/demo/client/reports`
  - `/demo/client/updates`
- Data: **read-only Supabase via `useClientPortalData`** (8 parallel queries: client, platforms, media assets, posts, post slots, weekly reports, monthly reports, draft variants)
- Fallback: **static demo data** kicks in automatically if Supabase env vars are missing or any query fails
- No auth, no uploads, no writes, no AI, no publishing, no automation

## Team Portal

- Status: **routed pages live**
- Routes:
  - `/demo/team` → My Tasks (alias)
  - `/demo/team/tasks`
  - `/demo/team/media-review`
  - `/demo/team/ai-review`
  - `/demo/team/drafts`
  - `/demo/team/scheduling`
- Data: **static demo data only** (from `lib/demo-data`)
- No Supabase wiring, no auth, no uploads, no writes, no AI, no publishing

## Operator Portal

- Status: **routed pages live**
- Routes:
  - `/demo/operator` → Overview (alias)
  - `/demo/operator/overview`
  - `/demo/operator/alerts`
  - `/demo/operator/client-health`
  - `/demo/operator/failed-posts`
  - `/demo/operator/report-approvals`
- Data: **static demo data only**
- No Supabase wiring, no auth, no writes, no AI

## Owner Portal

- Status: **routed pages live**
- Routes:
  - `/demo/owner` → Dashboard (alias)
  - `/demo/owner/dashboard`
  - `/demo/owner/revenue`
  - `/demo/owner/client-health`
  - `/demo/owner/alerts`
  - `/demo/owner/settings` (placeholder "coming soon" card)
- Data: **static demo data only**
- No Supabase wiring, no auth, no writes, no AI

---

## Supabase

- **Dev database:** created manually in the Supabase dev project
- **Migrations:** applied manually from `docs/database/migrations-draft/`
- **Seeds:** applied manually from `docs/database/seeds-draft/` (including 007 draft variant wiring with trigger bypass)
- **RLS:** dev read policies applied from `docs/database/rls-draft/001_dev_read_policies.sql`
- **Client Portal read layer:** working — all 8 queries succeed when env vars are present
- **Secrets:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` expected as Replit Secrets; missing → graceful fallback to static demo
- **Service role key:** never used; anon key only

---

## Not built yet

- Real authentication (login, sessions, user accounts)
- Real user/account model
- Media uploads
- Team actions (claim task, mark complete, approve draft, etc.)
- Approval workflows (caption review, media review, monthly report sign-off)
- Publishing integrations (Instagram, Facebook, TikTok, etc.)
- AI integrations (caption generation, media review, brand voice — all current AI sections are simulated previews)
- Google Business Profile integration
- Production RLS policies
- Write paths of any kind (insert / update / delete / upsert)
- Webhooks, queues, schedulers
- Email / notification delivery
- Multi-tenant routing

---

## Next recommended phase

**Auth Architecture Planning + Login UI Shell only.**

Specifically:

- Decide auth provider and session model (Supabase Auth vs. external IdP)
- Decide tenant / role model (client, team member, operator, owner)
- Build a login UI shell with no real auth wired up yet (a non-functional sign-in page)
- Plan how RLS policies will scope by tenant/role in a follow-up phase
- Do **not** wire real auth, real sessions, real writes, real uploads, AI, or publishing in that phase

---

## Build commands

- `pnpm --filter @workspace/veroxa run typecheck` — typecheck (last run: passing)
- `pnpm --filter @workspace/veroxa run build` — production build (needs workflow-provided `PORT` / `BASE_PATH`; typecheck is the canonical local verification)
- App workflow: `artifacts/veroxa: web` — running
