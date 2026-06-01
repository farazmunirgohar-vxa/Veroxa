# React Query Adoption Plan

React Query is mounted in `App.tsx`, but most current Veroxa screens are fixture/local-session driven. Do not convert the whole app at once.

Safe next adoption order:

1. **Read-only portal summary queries** — wrap `useClientPortalData` reads after the client-safe view contract is stable. Preserve fixture fallback and placeholder auth behavior.
2. **Team queue reads** — use query keys by queue name and active client only after the workflow repository has a backend implementation.
3. **Free Audit lead review reads** — use React Query for team-only read refresh once prospect-facing copy remains language-filtered.

Rules:

- No production writes through React Query until write gates are explicitly approved.
- Keep fixture fallback working with no network configured.
- Query keys must not include private notes or internal IDs shown to clients.
- Mutations should be added only after approval and write-safety guardrails are extended.
