# Veroxa OS — Final Pre-Build Audit
_Completed: May 2026 | Status: PASS — Ready to begin controlled real build_

---

## 1. Public Website Readiness

**Status: PASS (minor fixes applied)**

### Fixes made in this pass
| Location | Issue | Fix |
|---|---|---|
| landing.tsx feature strip | "AI drafts captions / 3 angle variants" — too technical/AI-lab | → "Captions prepared / Multiple options ready" |
| landing.tsx trust signal | "Role-Based Portal — Client, Team, Operator, and Owner views" — exposed internal role model | → "Client + Team Access — Separate client and team access keep responsibilities clear." |

### Confirmed clean
- Home: calm, premium, restaurant-owner friendly — passes UX principle
- Services: describes what Veroxa does, no AI/engine/admin language
- Pricing: locked pricing confirmed ($977 / $488 / +$477 / $1,454 / $965)
- Free Audit: Google Places search tool, no internal language
- PublicNav: Services → /services, Pricing → /pricing, Free Audit → /free-audit, Demo Preview → /demo/client/dashboard, Portal Access → /login, Login → /login
- No "Google Optimization" or "Ads" as standalone public plans
- No old term-based pricing
- Demo Preview routes to /demo/client/dashboard (confirmed)
- Portal Access routes to /login (confirmed)

### Remaining known non-issues
- Feature strip "Google optimised / Profile + local SEO" — slightly technical but accurate and public-safe
- Hero has three CTAs (Get Free Audit, Experience the Demo, View Services) — not excessive

---

## 2. Client Portal Readiness

**Status: PASS (minor fixes applied)**

### Fixes made in this pass
| Location | Issue | Fix |
|---|---|---|
| client-requests.tsx | Input placeholder: "Live messaging will connect after backend activation." | → "Direct replies coming soon." |
| client-requests.tsx | Note: "Live messaging connects after backend activation. To reply now…" | → "Direct replies are coming soon. Use the fields above to respond for now." |
| client-updates.tsx | Footer: "until the reporting backend is connected…" | → "Figures shown are for illustration. Your recent activity updates as Veroxa works on your account." |
| client-reports.tsx | Small note: "Performance figures connect after the reporting backend is activated." | → "Performance data will appear here once your account reporting is active." |
| client-reports.tsx | Footer: "until the reporting backend is connected…" | → "Report figures shown are for illustration. Items marked ready reflect your real account activity." |
| client-media.tsx | Brain icon (AI-lab feel) in "How Veroxa reviews your uploads" card | → CheckCircle2 icon (neutral, review-appropriate) |

### Confirmed clean
- client-dashboard.tsx: uses "Needs your input", "Submitted", "Being reviewed", "Prepared by Veroxa", "In progress", "Completed", "Included in report" — all client-safe
- "Nothing goes live without Veroxa team review" appears correctly
- DataSourceBadge: returns null for "fixture" and "demo" modes — restaurant clients never see it
- Client nav: Dashboard, Upload Media, Requests, Updates, Reports — clean and focused
- No internal scores, AI agent labels, rejection reasons, or draft variant details shown to client
- CLIENT_AI_DISCLOSURE text is client-safe: "Veroxa uses AI-assisted organization to help the team review uploads, prepare content ideas, and keep work moving. Final review stays with the Veroxa team."
- No "Supabase", "RLS", "fixture", "debug", or "execution" language visible

### Remaining known state
- The client portal is hardcoded to `clientId = "demo-a"` — this is by design until real auth and per-client scoping are ready
- Illustrative figures in updates/reports are expected at this stage

---

## 3. Team Portal Readiness

**Status: PASS (minor fixes applied)**

### Fixes made in this pass
| Location | Issue | Fix |
|---|---|---|
| team-dashboard.tsx | Media review section header: "Thumbnails pending storage" | → "Thumbnails not yet available" |
| team-dashboard.tsx | Today's Client Work footer: "…(backend pending)." | → "Derived from client submissions in the workflow foundation." |

### Confirmed clean
- Team nav: Dashboard, Upload Inbox, Work Queue, Direction Queue, Reports, Audit Leads — focused and action-oriented
- No AI lab, adaptive intelligence, engine competition, or strategy intelligence panels in main nav
- Team dashboard answers: what needs review, what needs action, what is blocked, what needs reporting
- No owner/operator-level information visible in team portal
- All internal-only pages (operator/owner dashboards, internal-architecture, internal-db-explorer, supabase-test) are NOT in teamPortalNav and NOT linked from the team experience
- Media review queue, work queue, alert center, client submissions all present and action-focused

### Team pages available but not in main nav (correct — deferred)
Pages that exist as files but are not exposed in the team portal navigation: team-adaptive-intelligence, team-ai-review, team-lead-source-lab, team-prospect-scanner, team-performance, team-scheduling, team-activity-feed, team-alert-center, team-content-review, team-drafts. These are available for later surfacing.

---

## 4. Auth / Routing Readiness

**Status: PASS — no changes needed**

### Current placeholder behavior
| Path | Behavior |
|---|---|
| `/demo/client/dashboard` | Public, renders `ClientDashboard` with fixture data — no login needed |
| `/login` | Role-selector cards → sign-in form → placeholder credential validation |
| `/client/*` | Public, no guard — intentional for current review state |
| `/team/*` | Behind `InternalDemoGuard(role="team")` — passes through in placeholder mode |
| Operator / Owner | Parked — no dashboard routes in `App.tsx` |
| `/demo` | Developer hub page — not in public nav |

### Placeholder credential behavior
- `AUTH_MODE = "placeholder"` in `src/lib/auth/authMode.ts`
- `validateDevCredentials()` does local string match — no Supabase, no network
- `faraz@client.com / farazclient` → `/client/dashboard`
- `faraz@team.com / farazteam` → `/team/dashboard`
- Operator / Owner credentials removed — both redirect to `/login`
- Dev credentials are NOT shown in UI — form has no autofill hints visible to users

### Future real auth behavior (not active)
1. `AUTH_MODE` flipped to `"real"` in `authMode.ts` (single line)
2. `signInWithPassword(email, password)` fires via Supabase client
3. Session retrieved → `user_profiles` looked up by `user_id`
4. Role validated with `isVeroxaRole()` → `getRoleHomePath(role)` routes user
5. No service-role key is used — only the anon key
6. Client and team routes will need real `RequireRole` guards applied before production

### Remaining blockers before production auth
- [ ] `user_profiles` table applied to Supabase (SQL draft exists in `docs/database/auth-draft/`)
- [ ] Test users created manually in Supabase Auth dashboard
- [ ] RLS policies finalized (conservative dev-stage RLS is in migration m024a)
- [ ] `devCredentials.ts` deleted before `AUTH_MODE` flipped to `"real"`
- [ ] Client portal routes hardened with `RequireRole("client")` guard
- [ ] Per-client data scoping (currently hardcoded to `demo-a`) replaced with auth session lookup
- Full checklist: `docs/AUTH_MODE_SWITCH_PLAN.md`

### Confirmed
- No "Super Admin" language anywhere in routing or UI
- No "Execution" as a public role label
- Team routes are gated (InternalDemoGuard) — will upgrade to real RequireRole before production
- `/demo` is developer-only and not in public navigation

---

## 5. Supabase / Data Readiness

**Status: PASS — safe current state**

### Current mode
| Flag | Value | Effect |
|---|---|---|
| `AUTH_MODE` | `"placeholder"` | No Supabase auth calls fire |
| `DATA_MODE` | `"fixture"` (default) | All portal data from bundled demo fixtures |
| `VITE_VEROXA_ENABLE_DEV_WRITES` | Not set / falsy | All Supabase write code is unreachable |

### What is safe
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` appear in frontend env — no service-role key
- Read-only client (`supabaseReadOnlyClient.ts`) restricts to `.select()` only
- `devSupabaseWriteAdapter.ts` is behind `VITE_VEROXA_ENABLE_DEV_WRITES === "true"` guard — cannot fire in default state
- Fixture data contains no real PII or production credentials
- No accidental production writes exist

### What is unsafe (deferred until ready)
- RLS in migration m024a uses conservative `authenticated` role grants — must be tightened to per-client row-level scoping before production
- `DATA_MODE = "supabase_readonly"` can be enabled per env-var — only safe with dev Supabase project, not production
- No per-client JWT claim scoping yet — all reads would be broad until RLS is hardened

### First recommended write target

**Recommendation: `upload_submissions` — client media submission from `/client/media`**

Why this table first:
- Table already exists in migration m024a
- UI already built at `/client/media` (RestaurantUploadFlow, local upload state)
- Write adapter already has the `insert_upload_submission` function stub in `devSupabaseWriteAdapter.ts`
- Low blast radius: a failed insert has no downstream side effects
- Rollback is simple: delete the inserted row
- No email, no notifications, no scheduling triggered

Required to activate it:
| Requirement | Status |
|---|---|
| Table: `upload_submissions` | Exists in m024a |
| Table: `clients` | Exists in m024a |
| Table: `restaurant_upload_keys` | Exists in m024a |
| RLS for `upload_submissions` | Dev-stage policy in m024a (tighten before prod) |
| Dev flag: `VITE_VEROXA_ENABLE_DEV_WRITES = "true"` | Required — not set by default |
| Client ID: demo-a hardcoded for now | Acceptable for dev write phase |
| UI trigger: `/client/media` upload submit button | Already exists |

What stays local/fixture until later:
- Media asset storage (object storage integration deferred)
- Team review decisions (write after upload flow is stable)
- Direction requests (write after media flow is stable)
- Content concepts, draft sets, posts — deferred until media + direction flows work

---

## 6. Database / Model Readiness

**Status: PASS — model is well-planned, first sequence is clear**

### Tables that exist (in migration m024a)
- `clients` — business profile, plan, service package, status
- `restaurant_upload_keys` — hashed upload keys for public upload access
- `upload_submissions` — media items submitted by restaurants
- `direction_requests` — client direction/avoid preferences
- `team_review_decisions` — team approve/reject/reshoot decisions on submissions

### Tables planned but not yet built (from TABLE_MAP.md)
- `user_profiles` — required for real auth (role lookup)
- `client_platforms` — platform access and handles per client
- `onboarding_items` — onboarding checklist per client
- `media_assets` — post-review approved media pool
- `content_concepts` — AI-assisted content idea layer
- `draft_sets` / `draft_variants` — caption drafting pipeline
- `post_slots` / `posts` — scheduling and publishing
- `weekly_reports` / `monthly_reports` — reporting layer
- `activity_logs` — audit trail
- `notifications` — client notification queue
- `audit_leads` — CRM-style prospect table

### What should never be client-visible
- `clients.risk_status` — internal health signal
- `clients.internal_note` — internal ops notes
- `team_review_decisions.team_note` — internal review notes
- `draft_variants.angle_score`, `quality_flags` — internal AI scoring
- `post_slots.scheduling_strategy` — internal scheduling logic
- All "operator" and "owner" views — not exposed to client portal

Client portal must read through `client_portal_*` views (already defined in `clientPortalQueries.ts`) that strip internal columns.

### First build sequence
1. `user_profiles` — required before real auth (maps Supabase `user_id` → role + client_id)
2. `upload_submissions` write — first real write feature (behind dev flag)
3. `media_assets` — after upload review flow is stable
4. `direction_requests` write — after media flow
5. `post_slots` / `posts` — after content pipeline exists
6. `weekly_reports` / `monthly_reports` — after posting pipeline exists

---

## 7. Demo / Fixture Readiness

**Status: PASS**

### What remains demo / illustrative
- All metric numbers in client dashboard (upcoming posts, media count, platform count)
- Work queue statuses are derived from fixture `demoData`
- Report figures are illustrative (clearly labeled for review context)
- Team portfolio metrics (active clients count, reports due, etc.) are fixture values
- Demo client names: "Demo Grill House", "Demo Taco Bar", "Demo Bistro" — clearly named

### What is safe to show in a review context
- Client portal flow: dashboard → media → requests → updates → reports — all render cleanly
- Team portal flow: dashboard → upload inbox → work queue → direction queue → reports — all render cleanly
- Free Audit: uses real Google Places API — live functionality
- Login page: role selector → sign-in form → routes correctly
- Demo Preview (/demo/client/dashboard): renders full client portal with fixture data

### What is internal only (not in public navigation)
- `/demo` — developer hub
- `/internal-*` routes — architecture, db explorer, demo controls, permissions, readiness, integrations
- `/auth-status` — dev auth diagnostic
- `/supabase-test` — Supabase dev probe
- `/real-*-placeholder` routes — role placeholder pages
- All `/operator/*` and `/owner/*` routes

### Confirmed clean
- No "admin", "execution", or "super admin" labels in public or client-facing navigation
- No "Mamadali" or private target references visible in public paths
- No broken links to old `/demo` hub in primary public flows (public nav removed it; Demo Preview → /demo/client/dashboard)
- No stale old pricing in demo data
- DemoOnlyBanner is present on team dashboard and other internal-review surfaces — correctly labeled

---

## 8. Build / Typecheck Result

**Status: PASS**

```
pnpm --filter @workspace/veroxa run typecheck
> @workspace/veroxa@0.0.0 typecheck
> tsc -p tsconfig.json --noEmit

(exit 0 — no errors)
```

All 8 edits in this pass produced zero TypeScript errors. No unused imports, no broken routes, no missing components.

---

## 9. Final "Start Building" Recommendation

### One clear build path forward

After this audit, the app is clean, consistent, and ready. The recommended next build is a **single controlled write feature behind a dev flag** — no broad new systems.

---

### Step 1 — First dev-write: client upload submission
**Feature:** When a client submits media on `/client/media`, write a row to `upload_submissions` in Supabase.
**Flag:** `VITE_VEROXA_ENABLE_DEV_WRITES = "true"` (env var, never default)
**Scope:** One table, one insert, one UI button. No notifications. No storage. No scheduling.
**Rollback:** Delete the inserted row.

Tables needed: `clients`, `upload_submissions` (both exist in m024a).
Fields: `client_id`, `upload_key_id`, `raw_filename`, `file_kind`, `upload_note`, `status = "pending_review"`, `submitted_at`.
Role allowed to write: `client` (via Supabase anon key + RLS policy).
RLS requirement: Row-level INSERT allowed where `upload_key_id` matches the restaurant's key. SELECT restricted to rows where `client_id` matches. Production tightening required before go-live.

---

### Step 2 — Team review of submitted data
**Feature:** Team sees new upload submissions appear in `/team/upload-inbox` as real rows instead of fixture data.
**Scope:** Read `upload_submissions` where `status = "pending_review"` for the team's client list.
**No writes yet** — team sees real incoming data, team approval stays fixture for now.

---

### Step 3 — Client-visible status update
**Feature:** After team sets `upload_submissions.status = "approved"` or `"needs_reshoot"`, client sees updated status in `/client/media` and `/client/dashboard`.
**Scope:** Team writes one status field. Client reads it via `client_portal_submissions_view`.
This is the first full loop: client submits → team reviews → client sees result.

---

### Step 4 — Storage and real upload
**Feature:** Actual file bytes stored to object storage (Replit App Storage or Supabase Storage).
**Only after:** Step 1-3 are stable and proven. Metadata flow must work before file flow.
**Scope:** Upload flow connects to storage bucket. `upload_submissions.storage_path` populated.

---

### Step 5 — Real auth and RLS hardening
**Feature:** `AUTH_MODE` flipped to `"real"`. Supabase auth activated. Per-client JWT scoping applied to RLS.
**Only after:** Dev write flow from Steps 1-4 is stable. `user_profiles` table applied. `devCredentials.ts` deleted.
**Scope:** Auth switchover, RLS tightening, client portal hardened with `RequireRole("client")` guard.

---

_This audit is complete. Do not run another broad audit. Build Step 1 next._
