/**
 * demoContentMatching.ts
 *
 * Helpers for picking a *believable* demo image given a caption,
 * a content title, or a client id. The goal is visual coherence
 * across the demo: a "lamb shoulder" caption should not be shown
 * with a latte image, and a Demo Cafe post should not be shown
 * with a taco image.
 *
 * DEMO ONLY — pure keyword matching against the catalog metadata
 * in `demoImages.ts`. No AI, no API, no persistence.
 *
 * See `docs/DEMO_CONTENT_COHERENCE_GUIDE.md` for the why and how.
 */

import {
  demoImages,
  getDemoImagesByCategory,
  type DemoCuisineFit,
  type DemoImage,
} from "./demoImages";

/** Client → preferred food types, in priority order. */
const CLIENT_FOOD_TYPE_PREFERENCE: Record<DemoCuisineFit, string[]> = {
  "demo-a": ["grill", "mediterranean", "generic"],
  "demo-b": ["tacos", "generic"],
  "demo-c": ["mediterranean", "grill", "generic"],
  "demo-d": ["cafe", "brunch", "generic"],
  any: ["generic"],
};

/** Normalize free text for keyword matching. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ");
}

/** True if any keyword in `keywords` appears as a token in `text`. */
function anyMatch(text: string, keywords: readonly string[] | undefined): boolean {
  if (!keywords || keywords.length === 0) return false;
  const t = norm(text);
  return keywords.some((kw) => t.includes(norm(kw)));
}

/**
 * Pick the best food image for a given (caption|title) + clientId.
 *
 * Selection order:
 *   1. Skip any image whose `avoidUseCases` matches the text.
 *   2. Prefer images whose `cuisineFit` includes the client (or "any").
 *   3. Prefer images whose `bestUseCases` match the text.
 *   4. Tie-break by the client's food-type preference order.
 *   5. Fall back to a deterministic pick within remaining candidates.
 *
 * Always returns an image (the catalog is non-empty by construction).
 */
export function pickImageForCaption(
  text: string,
  clientId: DemoCuisineFit | string = "any",
): DemoImage {
  const food = getDemoImagesByCategory("food");
  const cid = (CLIENT_FOOD_TYPE_PREFERENCE as Record<string, string[] | undefined>)[clientId]
    ? (clientId as DemoCuisineFit)
    : "any";
  const prefs = CLIENT_FOOD_TYPE_PREFERENCE[cid];

  // 1. Remove anything we'd be embarrassed to show with this text.
  const eligible = food.filter((img) => !anyMatch(text, img.avoidUseCases));

  // 2. Cuisine fit (client OR any).
  const cuisineOk = eligible.filter(
    (img) =>
      !img.cuisineFit ||
      img.cuisineFit.includes(cid) ||
      img.cuisineFit.includes("any"),
  );
  const pool = cuisineOk.length > 0 ? cuisineOk : eligible;

  // 3. Direct keyword hits.
  const direct = pool.filter((img) => anyMatch(text, img.bestUseCases));
  if (direct.length > 0) {
    return rankByPreference(direct, prefs)[0];
  }

  // 4. No keyword hit — rank remaining pool by client food-type preference.
  const ranked = rankByPreference(pool, prefs);
  if (ranked.length > 0) return ranked[0];

  // 5. Last resort.
  return food[0] ?? demoImages[0];
}

/** Stable hash for deterministic tie-breaks. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function rankByPreference(images: DemoImage[], prefs: string[]): DemoImage[] {
  return images.slice().sort((a, b) => {
    const ai = prefs.indexOf(a.foodType ?? "generic");
    const bi = prefs.indexOf(b.foodType ?? "generic");
    const aRank = ai === -1 ? prefs.length : ai;
    const bRank = bi === -1 ? prefs.length : bi;
    if (aRank !== bRank) return aRank - bRank;
    return hash(a.id) - hash(b.id);
  });
}

/**
 * Pick `count` distinct images for a series of texts under one client.
 * Caller-supplied texts are matched independently, but the picker
 * avoids returning the same image twice in a row when possible.
 */
export function pickImagesForCaptions(
  texts: readonly string[],
  clientId: DemoCuisineFit | string = "any",
): DemoImage[] {
  const used = new Set<string>();
  const out: DemoImage[] = [];
  for (const t of texts) {
    const first = pickImageForCaption(t, clientId);
    if (!used.has(first.id) || used.size >= getDemoImagesByCategory("food").length) {
      used.add(first.id);
      out.push(first);
      continue;
    }
    // Try to diversify by walking down the ranked list.
    const food = getDemoImagesByCategory("food").filter(
      (img) =>
        !img.avoidUseCases ||
        !img.avoidUseCases.some((kw) => norm(t).includes(norm(kw))),
    );
    const alt = food.find((img) => !used.has(img.id)) ?? first;
    used.add(alt.id);
    out.push(alt);
  }
  return out;
}
