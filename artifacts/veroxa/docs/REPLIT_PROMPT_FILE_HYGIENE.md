# Replit Prompt File Hygiene

> Status: historical Replit hygiene note only. The active stack is GitHub + Codex + Vercel; Replit is historical only. Keep this file only as an archive reminder not to commit pasted prompt artifacts.

## Rule

Do not commit pasted prompt files into the repo. This rule remains useful even though Replit is historical only.

## What to do before every GitHub/Codex checkpoint

1. Delete `attached_assets/Pasted-*.txt` if any exist.
2. Do not create or add any new `attached_assets/Pasted-*.txt` files.
3. `attached_assets/` should only contain real assets needed by the app (images, fonts, documents, ZIPs).

## What belongs where

- **Prompt text** → chat, not committed files.
- **Real assets** → `attached_assets/` only if the app needs them.
- **Docs and specs** → `docs/` or chat, never `attached_assets/Pasted-*.txt`.

## Why this matters

- Pasted prompt files clutter `git log`.
- They leak internal workflow details into the repo.
- GitHub/Codex reviews will flag them.
- They are not useful to anyone reading the code.

## Check before every future GitHub review

Run this and confirm zero output:

```bash
ls artifacts/veroxa/attached_assets/Pasted-*.txt 2>/dev/null
```

If any files exist, delete them before committing.
