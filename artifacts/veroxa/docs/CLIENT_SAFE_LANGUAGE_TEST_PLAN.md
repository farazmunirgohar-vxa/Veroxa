# Client-Safe Language Test Plan

## Purpose

The Client Portal can only show calm restaurant-partner language. Generated journey, weekly update, monthly report, and local visibility copy must not expose implementation details or internal operating terms.

## Denylist utility

The denylist lives in:

`src/domain/clientPortalJourney/languageSafety.ts`

It exports:

- `CLIENT_SAFE_COPY_DENYLIST`
- `findClientSafeLanguageViolations(value)`
- `isClientSafeLanguage(value)`
- `assertClientSafeLanguage(value)`

Current denylisted terms:

- OpenAI
- Supabase
- RLS
- fixture
- backend
- connector
- API
- approval queue
- risk level
- internal ID
- execution internals
- AI agent
- model output

## Functions to scan

When a lightweight test runner is added, create tests that call these functions for representative client IDs such as `demo-a`, `demo-b`, `demo-c`, and an empty/unknown client ID:

- `getClientProgressSummary(clientId)`
- `getClientPortalJourney(clientId)`
- `getClientNeedsFromYou(clientId)`
- `getClientRecentProgress(clientId)`
- `getClientVisibilityProgress(clientId)`
- `getClientNextSteps(clientId)`
- `generateClientWeeklyUpdate(clientId)`
- `generateClientMonthlyReport(clientId)`
- `getClientLocalVisibilityProgress(clientId)`

Expected result: `findClientSafeLanguageViolations(result)` returns an empty array for each generated payload.

## Suggested lightweight test shape

```ts
import {
  findClientSafeLanguageViolations,
  generateClientMonthlyReport,
  generateClientWeeklyUpdate,
  getClientLocalVisibilityProgress,
  getClientPortalJourney,
  getClientProgressSummary,
} from "@/domain/clientPortalJourney";

const CLIENT_IDS = ["demo-a", "demo-b", "demo-c", "unknown-client"];

for (const clientId of CLIENT_IDS) {
  for (const payload of [
    getClientPortalJourney(clientId),
    getClientProgressSummary(clientId),
    getClientLocalVisibilityProgress(clientId),
    generateClientWeeklyUpdate(clientId),
    generateClientMonthlyReport(clientId),
  ]) {
    expect(findClientSafeLanguageViolations(payload)).toEqual([]);
  }
}
```

## Manual verification until tests exist

Until the project has a test runner, reviewers should run:

```bash
rg -n "OpenAI|Supabase|RLS|fixture|backend|connector|API|approval queue|risk level|internal ID|execution internals|AI agent|model output" \
  artifacts/veroxa/src/pages/client-dashboard.tsx \
  artifacts/veroxa/src/pages/client-updates.tsx \
  artifacts/veroxa/src/pages/client-reports.tsx
```

The client pages should not contain those terms in rendered client-facing copy.

## Expected behavior

- Generated Client Portal copy should pass with zero denylist violations.
- Documentation may intentionally mention denylisted terms when explaining what clients must never see.
- Team-only pages may still use operational terms where appropriate.
