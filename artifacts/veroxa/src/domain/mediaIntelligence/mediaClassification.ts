import type { MediaCategory, MediaType } from "./types";
export function classifyMediaAsset(label: string): {
  mediaType: MediaType;
  category: MediaCategory;
} {
  const text = label.toLowerCase();
  if (text.includes("prep") || text.includes("video"))
    return { mediaType: "video", category: "food_prep" };
  if (text.includes("menu"))
    return { mediaType: "menu_photo", category: "menu" };
  if (text.includes("storefront"))
    return { mediaType: "storefront", category: "storefront" };
  if (text.includes("best") || text.includes("close"))
    return { mediaType: "photo", category: "best_seller" };
  return { mediaType: "photo", category: "other" };
}

export function getClientSafeMediaReviewLabel(status: string): string {
  if (status === "ready" || status === "usable") return "Ready for Veroxa review";
  if (status === "needs_better_lighting" || status === "blurry" || status === "weak_angle") return "Needs clearer photo";
  if (status === "duplicate" || status === "save_for_later") return "Saved for later";
  if (status === "needs_confirmation") return "Needs business confirmation";
  return "Useful for picture-based content";
}

export const clientSafeMediaGuidance = [
  "Ready for Veroxa review",
  "Needs clearer photo",
  "More best-seller photos needed",
  "Saved for later",
  "Needs business confirmation",
  "Useful for picture-based content",
  "Video channels coming soon",
] as const;
