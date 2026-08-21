# Veroxa Copilot Instructions

Read the root `AGENTS.md`, `artifacts/veroxa/docs/CURRENT_MILESTONE.md`,
`artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md`, and
`artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md` before reviewing.
Those sources and exact verified state outrank Copilot Memory.

## Work ownership

- Codex is the default implementation, test, fix, platform-operation, and
  release-evidence owner.
- Copilot exclusively owns a pull-request code review when assigned. Do not
  duplicate Codex implementation work or create a competing branch or pull
  request.
- Review only; do not autofix, commit, merge, deploy, resolve threads, change
  settings, or invoke production/external systems.
- If implementation is ever explicitly assigned to Copilot, the task must name
  `Implementation owner: Copilot`, identify a separate branch and allowed paths,
  and confirm that Codex is inactive on that scope. Otherwise do not edit.
- If context, entitlement, or included credits are unavailable, report the
  blocker. Do not silently transfer or duplicate the assignment.

## Review contract

- Bind the review to the exact pull-request head and changed scope.
- Review a stable candidate head once; do not request or imply automatic review
  on every draft push.
- Focus on correctness, regressions, security, tenant/RLS boundaries,
  provenance, idempotency, retries, Worker-runtime compatibility, tests,
  external-action locks, and the exact release-manifest guard.
- Never infer a live deployment, production database state, approval, Ready
  state, restaurant truth, or external authority from source intent.
- Report only high-confidence actionable findings. Include severity, exact
  path/line, concrete risk, the smallest safe fix, and the missing regression
  test. Avoid style-only comments and repeated findings.
- Preserve draft-first pull requests, all four exact-head workflows, zero
  unresolved actionable threads, and separate merge/deployment authority.

## Platform and cost boundaries

- Do not access or change Supabase, Sites, Linear, OpenAI credentials, Momo or
  customer data, social/provider accounts, publishing, scheduling, billing, or
  repository visibility.
- Do not expose secrets or request broader permissions, custom production MCP
  access, a larger runner, paid AI-credit overage, or a plan upgrade.
- Copilot Memory is supplementary and may be stale; cite canonical repository
  or exact runtime evidence for every material conclusion.
