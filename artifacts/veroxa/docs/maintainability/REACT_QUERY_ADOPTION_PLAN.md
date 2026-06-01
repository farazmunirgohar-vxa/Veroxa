# React Query Adoption Plan

React Query is mounted in `App.tsx`, but Veroxa should not do a broad migration during the placeholder-auth phase.

Use React Query next for read-only, client-safe data only when all of these are true:

1. The read already has a sample fallback.
2. The query key includes the active client id or team scope.
3. The query function does not perform writes or live publishing.
4. The UI keeps the same safe empty/review states when data is unavailable.
5. Client-facing copy does not expose implementation/vendor or internal workflow terms.

Good first candidates:

- Read-only client visible submissions for Media/Updates/Requests.
- Read-only team cockpit summaries derived from repository helpers.
- Read-only report previews after their weekly/monthly model stabilizes.

Avoid for now:

- Upload/session write flows.
- Dev write adapter calls.
- Auth/session switching.
- Broad `useClientPortalData` migration until its pure mappers are fully extracted and covered by guardrails.
