# Demo Content Coherence Guide

This guide documents how Veroxa's demo fixture data maintains
believable image-caption coherence across all demo pages.

---

## Why coherence matters

The demo is a trust artefact. A visitor watching a "Birria cheese-pull"
caption rendered alongside a latte image, or a "Cardamom Latte" post
paired with a kebab photo, loses confidence before any pricing page is
reached. Coherence is not a nice-to-have — it is part of the pitch.

---

## Demo clients and their cuisine families

| Client ID | Name                      | Cuisine family | Image food type |
|-----------|---------------------------|----------------|-----------------|
| `demo-a`  | Demo Grill House          | Middle-Eastern grill | `grill`, `mediterranean` |
| `demo-b`  | Demo Taco Bar             | Mexican street food  | `tacos`         |
| `demo-c`  | Demo Mediterranean Grill  | Mediterranean fine dining | `mediterranean`, `grill` |
| `demo-d`  | Demo Cafe                 | Café / bakery        | `cafe`, `brunch` |

---

## Image catalog metadata (demoImages.ts)

Every `DemoImage` in `demoImages.ts` carries optional metadata:

| Field | Purpose |
|-------|---------|
| `foodType` | Coarse cuisine family (see `DemoFoodType`). Defaults to `"generic"`. |
| `cuisineFit` | Which demo client IDs this image believably fits, or `"any"`. |
| `bestUseCases` | Caption / title keywords that make this a *good* match. |
| `avoidUseCases` | Caption / title keywords that make this a *bad* match. |

**Rule:** never add a new food image without setting `foodType`,
`cuisineFit`, and at least two `bestUseCases`.

---

## Content matching helper (demoContentMatching.ts)

`src/data/demo/demoContentMatching.ts` exports:

- **`pickImageForCaption(text, clientId?)`** — returns the single best
  `DemoImage` for a caption or title string under a given client.
  Uses a four-step waterfall: avoid → cuisine fit → keyword match → food-type rank.

- **`pickImagesForCaptions(texts[], clientId?)`** — batch version that
  tries to diversify images across a list (avoids showing the same
  image in consecutive slots).

Use these helpers everywhere a demo page needs to pair a thumbnail
with dynamic caption text, rather than cycling through `getDemoImagesByCategory("food")`.

---

## Pages that use the matcher

| Page | Pattern |
|------|---------|
| `client-calendar.tsx` | `pickImageForCaption(post.caption, "demo-a")` per row |
| `team-media-review.tsx` | `pickImageForCaption(item.title, "demo-a")` per card |

## Pages with static image assignments (no matcher needed)

| Page | Why static is fine |
|------|--------------------|
| `client-dashboard.tsx` | Fixed `weekMedia` / `upcomingSchedule` arrays with explicit IDs |
| `team-content-review.tsx` | Fixed `CAPTION_VARIANTS` with explicit image IDs per variant |
| `client-ai-draft-preview.tsx` | Shows user's own uploaded image or placeholder — no catalog image |

---

## Adding a new demo restaurant

1. Choose a `clientId` (e.g. `demo-e`).
2. Add at least two food images to `demoImages.ts` with appropriate
   `foodType` and `cuisineFit: ["demo-e"]`.
3. Add a `CLIENT_FOOD_TYPE_PREFERENCE["demo-e"]` entry in
   `demoContentMatching.ts`.
4. Use `pickImageForCaption(text, "demo-e")` in any new pages.

---

## What NOT to do

- Do not call `getDemoImagesByCategory("food")` and cycle by index
  in a page that displays captions — the captions and images will
  drift as the data changes.
- Do not add real client, restaurant, or customer photographs.
- Do not remove `demoOnly: true` from any image entry.

---

*Last updated: May 2026*
