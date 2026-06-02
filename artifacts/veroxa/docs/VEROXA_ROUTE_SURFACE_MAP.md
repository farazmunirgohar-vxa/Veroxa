# Veroxa Route & Surface Map

This map documents the current Veroxa route surfaces for pre-live demo/review mode. It is descriptive only and does not change routing behavior.

Global route-surface boundaries:

- `/demo/client/*` is public sample data.
- `/client/*` is guarded review mode.
- `/team/*` is guarded internal mode.
- No live AI.
- No live uploads.
- No live publishing.
- No payments.
- No real client data.

## Public Website

Routes:

- `/`
- `/services`
- `/pricing`
- `/free-audit`
- `/login`
- `/demo`
- `/guided-demo`
- `/upload`

**Purpose:** Explain Veroxa, present the locked offer, provide public preview/intake paths, and route users toward demo or portal access.

**Access level:** Public.

**Data mode:** Public copy, demo/review data, local/session browser state where applicable.

**Expected visibility:** Prospective restaurants, first-client review, Faraz, and collaborators reviewing the public experience.

**Restricted visibility:** No internal team queue data, no real client data, no credentials, no backend implementation details.

**Future integration status:** Future live integrations remain blocked; no live AI, no live uploads, no live publishing, no payments, and no real client data.

## Public Client Demo

Routes:

- `/demo/client/dashboard`
- `/demo/client/media`
- `/demo/client/updates`
- `/demo/client/requests`
- `/demo/client/reports`

**Purpose:** Show a public sample of the Restaurant Partner / Client experience without requiring login.

**Access level:** Public demo.

**Data mode:** `/demo/client/*` is public sample data.

**Expected visibility:** Prospective restaurants and reviewers who need to understand the client-side Veroxa experience.

**Restricted visibility:** No real client portal data, no internal team logic, no backend/AI/internal terms, no private restaurant details.

**Future integration status:** Future live integrations remain blocked; no live AI, no live uploads, no live publishing, no payments, and no real client data.

## Guarded Client Portal

Routes:

- `/client/dashboard`
- `/client/media`
- `/client/updates`
- `/client/requests`
- `/client/reports`

**Purpose:** Provide the guarded client review-mode portal surface for future Restaurant Partner use while production auth and real data remain gated.

**Access level:** Guarded client review mode.

**Data mode:** `/client/*` is guarded review mode.

**Expected visibility:** Authorized preview/review client access only through the current guard model.

**Restricted visibility:** No public access, no real client data leak, no internal team-only details, no implication that production auth is active.

**Future integration status:** Future live integrations remain blocked; no live AI, no live uploads, no live publishing, no payments, and no real client data.

## Guarded Team Portal

Routes:

- `/team/dashboard`
- `/team/approval-queue`
- `/team/visibility-audit`
- `/team/first-client-readiness`
- `/team/upload-inbox`
- `/team/work-queue`
- `/team/direction-queue`
- `/team/report-queue`
- `/team/audit-leads`

**Purpose:** Provide Faraz with the guarded internal review-mode control surface for queues, approvals, readiness, and manual first-client operations.

**Access level:** Guarded internal mode.

**Data mode:** `/team/*` is guarded internal mode.

**Expected visibility:** Veroxa Team / Faraz through the current team guard model.

**Restricted visibility:** No public access, no client access, no Owner/Operator workflows, no super-admin console, no fake live execution.

**Future integration status:** Future live integrations remain blocked; no live AI, no live uploads, no live publishing, no payments, and no real client data.
