# Momo Portal Fix Release — 2026-08-12

Status: deployed and verified.

## What changed

- Momo remains the authority for owner truth. Team can request factual corrections, SEO improvements, missing evidence, outdated information, compliance clarification, or operational changes, but cannot approve or apply owner confirmations.
- Team and Momo now share a tenant-scoped Requests and Messages loop with structured reason categories, linked confirmation context, affected surface, suggested correction, sender role, and visible pending/response state.
- Team prefill saves are labeled and persisted as prefill only; they never become owner truth without Momo confirmation.
- Team data reads fail closed with a section-specific error instead of showing cached or sample records. The missing authenticated read grants for the current content-AI fields were repaired.
- Mobile decision cards now stack safely so actions and explanatory copy are not clipped.

## Release evidence

- Production deployment: https://veroxa-client-experience.fgohar1.chatgpt.site
- Sites release: version 46
- Quality gates: 432 tests passed, lint passed, production build passed, and `git diff --check` passed.
- Supabase migrations applied and verified:
  - `20260812041824_momo_owner_request_contract_v1.sql`
  - `20260812042031_momo_team_content_ai_read_grants_v1.sql`
- Private request and message tables remain RPC-only; direct authenticated table reads remain unavailable.
- External provider writes, review replies, website writes, scheduling, posting, and owner contact remain locked.

## Verification boundary

The public route rendered in preview and the protected Team route correctly redirected to login. No authenticated owner or provider action was executed during verification.
