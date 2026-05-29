---
name: Veroxa build containment rules
description: How the "controlled real-build" constraints map onto the existing Veroxa repo, and the read/write safety conventions.
---

# Veroxa controlled-build containment

The recurring task constraints ("no file storage/bytes, no Supabase Storage, no
OpenAI/AI runtime calls, no publishing/payments, no production auth, no
Owner/Operator dashboards, no UI redesign, no pricing changes") are constraints
on **new work in the current step**, not a description of the repo's current
state.

**Why:** the api-server artifact already contains committed runtime AI/network
code (e.g. OpenAI draft routes, an audit assistant, Google Places + web-presence
scanners). A code review with `includeGitDiff` will explore the whole repo and
flag these as "out of scope AI/network" even though they predate your change and
are not in your diff.

**How to apply:** before acting on a review finding about out-of-scope files, run
`git --no-optional-locks status --short` and confirm the file is actually in your
uncommitted diff. Do not delete pre-existing code you were not asked to touch
("nothing more, nothing less").

## Read/write safety conventions (data layer)

- Writes: pages must import only the central `veroxaWriteAdapter`
  (`src/lib/data/writeAdapter.ts`) — never `devSupabaseWriteAdapter` or
  `getSupabaseClient` directly. The adapter alone decides enabled vs. disabled
  (gated on `VITE_VEROXA_ENABLE_DEV_WRITES === "true"`). Local/demo flow is the
  source of truth; the adapter call is opportunistic and swallows errors.
- A real client UUID for dev writes comes from `getDevClientIdFromEnv()`
  (validated `VITE_VEROXA_DEV_CLIENT_ID`); skip the write when absent (the
  `demo-a` style ids are not UUIDs and FK-fail).
- Reads: use the anon read-only handle `getReadOnlySupabaseClient()`
  (select-only, no service-role key), gated on `DATA_MODE === "supabase_readonly"`
  (`VITE_VEROXA_DATA_MODE`). Adapters must never throw — missing env / RLS block /
  empty / error must resolve to a fixture fallback.
- **Fixtures are a true fallback:** when a live read succeeds, show live data
  (plus genuine session data) and drop the demo fixtures; only fall back to
  fixtures when the live read does not succeed.
