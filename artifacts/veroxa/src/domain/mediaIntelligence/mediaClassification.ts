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
