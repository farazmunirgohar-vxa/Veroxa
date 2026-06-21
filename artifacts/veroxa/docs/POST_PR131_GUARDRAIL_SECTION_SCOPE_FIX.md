# Post-PR131 Guardrail Section Scope Fix

GitHub PR #132 fixes a post-merge PR #131 guardrail weakness only.

PR #131 aligned the Current source-of-truth docs section and lower active override list after PR #130. Post-merge RR found that the PR #131 safety-marker checks searched the full `ACTIVE_DOCS_INDEX.md`, so older PR #130/PR #129 safety text could satisfy those checks even if the PR #131 block was weakened later.

PR #132 scopes those marker checks to the PR #131 section before checking PR #131 safety wording.

This PR does not change UI, runtime behavior, auth, credentials, Momo contact, publishing, integrations, AI behavior, database behavior, or activation state.

AUTH_MODE remains placeholder. `/api/pilot-access` remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval.
