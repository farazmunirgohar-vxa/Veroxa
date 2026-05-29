# AI Media Pipeline Plan (roadmap + guardrails)

**Status: planning / contracts / guardrails only. No OpenAI calls exist.**
This document defines the future AI caption + image enhancement workflow for
Veroxa and the security guardrails that must hold *before* any AI runtime code
is added. Nothing here activates AI, image editing, image generation, caption
generation, or any client-facing AI UI.

## 1. Future workflow (end to end)

1. **Client uploads media** through the client portal / restaurant upload key.
2. **Metadata write** — submission metadata is recorded (M023D, via the central
   write adapter; no file bytes).
3. **Team inbox reads real submissions** (M023E, read-only with fixture
   fallback).
4. **Storage upload** — actual image/video bytes uploaded to object storage
   (separate later milestone; not built yet).
5. **AI image analysis** — quality/usability assessment of the real image.
6. **AI caption drafts** — caption suggestions from image + metadata.
7. **AI image enhancement / editing** — corrective enhancement of real food
   photos (never misrepresentation — see §4).
8. **Team approval** — the team reviews original vs. enhanced vs. captions and
   selects/edits the approved version.
9. **Scheduling / publishing** — later milestone; out of scope here.

Each stage is additive and individually gated. No stage auto-advances to
publishing.

## 2. AI agents planned

- **Media Review Agent** — assesses image quality/usability, flags re-shoots.
- **Image Enhancement Agent** — corrective enhancement of real photos only.
- **Creative Variant Agent** — proposes alternative crops/treatments for team
  choice (drafts only).
- **Caption Agent** — drafts captions from image + metadata.
- **Brand Voice / Compliance Agent** — checks tone and flags risky claims
  (false health/halal/organic claims, invented promos, misleading edits).
- **Team Approval Gate** — the human checkpoint; nothing reaches a client or a
  channel without passing it.

## 3. Human accountability

- The **team is the final quality gate**. Every AI output is a draft.
- **AI drafts are never auto-posted.**
- **Clients never see raw AI output** or AI internals (scores, prompts,
  confidence, agent reasoning).
- **Operator / Owner** stay out of daily post approval — they engage only on a
  risk, complaint, or quality exception.

## 4. Food image ethics

- **Enhance real food; never misrepresent it.**
- No fake ingredients.
- No fake / exaggerated portion size.
- No false halal / organic / health claims.
- No invented promotions, prices, or offers.
- No misleading edits (swapping the dish, fabricating garnish, etc.).
- Enhancement is limited to faithful correction (lighting, white balance, crop,
  noise) of the actual photographed dish.

## 5. Security (OpenAI key handling)

- `OPENAI_API_KEY` is **server-side only**, stored in **Replit Secrets**.
- **Never** import or expose the key in frontend / client code.
- **Never** place the key in a `VITE_*` variable (those are bundled into the
  client and are public).
- **Never** commit the key to GitHub or any repo file.
- All future OpenAI calls must go through **server routes / functions only**
  (e.g. the API server artifact), never directly from the browser.
- The client may only ever receive the *approved, team-reviewed* result —
  never a direct AI response.

## 6. Future staged implementation

Each stage ships and is verified independently before the next begins.

- **Stage A** — server-only AI health/config check (key present? reachable?).
  No content generation.
- **Stage B** — team-only caption draft from metadata/text (no image yet).
- **Stage C** — storage upload (real file bytes to object storage).
- **Stage D** — image quality analysis on the uploaded image.
- **Stage E** — caption drafts from the actual image + metadata.
- **Stage F** — image enhancement / editing (faithful correction only).
- **Stage G** — team approval; the selected/edited version is saved.
- **Stage H** — scheduling / publishing (later).

## 7. Contracts

Optional, network-free TypeScript interfaces describing the future AI media
stages live in `src/lib/ai/aiMediaPipelineContracts.ts`. They are type-only
(no runtime, no OpenAI SDK, no network) and exist purely to give future AI work
a stable, documented shape. They are not wired into any page or call site.

## Constraints reaffirmed

No OpenAI runtime calls. No image editing/generation. No caption generation.
No client-facing AI UI. No API key exposure. No publishing, payments, auth,
or pricing changes introduced by this document.
