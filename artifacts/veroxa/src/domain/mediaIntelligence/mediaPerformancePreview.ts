import type { MediaCategory, PerformanceStatus, QualityStatus } from "./types";
export function getPerformancePreview(
  category: MediaCategory,
  quality: QualityStatus,
): PerformanceStatus {
  if (
    [
      "blurry",
      "needs_better_lighting",
      "weak_angle",
      "duplicate",
      "not_usable",
    ].includes(quality)
  )
    return "weak";
  if (["best_seller", "food_closeup", "food_prep"].includes(category))
    return "promising";
  return "not_enough_data";
}
