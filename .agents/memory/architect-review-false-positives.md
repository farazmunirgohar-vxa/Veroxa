---
name: architect review false positives
description: The architect/code-review subagent can report "scope creep" or unrelated changes that are not in your working tree — verify against git before acting.
---

The `architect` (code_review) subagent, when given `includeGitDiff: true`, sometimes
reports findings about files/changes that are NOT in the actual unstaged working tree —
e.g. flagging "scope creep" from pricing/content edits, or changes to a file you never
touched.

**Why:** It appears to blend committed history / broader repo state into its view of
"this change", so it attributes pre-existing committed code to the current pass.

**How to apply:** Before acting on an architect finding that implies you changed files
outside your task, confirm against `git --no-optional-locks status --short` and
`git --no-optional-locks diff --stat HEAD`. Only act on findings that match your real
diff. Its concrete, file-specific findings (e.g. a broken link in a file you did edit)
are usually accurate and worth fixing; its broad "scope creep / rollback unrelated
changes" claims need verification first.
