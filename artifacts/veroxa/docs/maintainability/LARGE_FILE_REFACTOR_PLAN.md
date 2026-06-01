# Large File Refactor Plan

Replit flagged `free-audit.tsx` and `team-audit-leads.tsx` as large. Do not split them aggressively without a focused QA pass.

Safe future extraction order:

1. Extract presentational cards with no state and no side effects.
2. Extract copy/data constants only after public-language guardrails cover them.
3. Extract form sections from `free-audit.tsx` only with a before/after submission-flow check.
4. Extract table/list rows from `team-audit-leads.tsx` only with a before/after lead review check.

Avoid changing scoring, safety filtering, dev bypass, or prospect-facing copy generation during a visual component split.
