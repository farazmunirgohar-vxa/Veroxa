import type { MediaAssetInsight } from "./types";
export function getNextBestMediaRequest(insights: MediaAssetInsight[]): string {
  if (
    insights.some(
      (i) =>
        i.qualityStatus === "needs_better_lighting" ||
        i.qualityStatus === "blurry",
    )
  )
    return "Please send more clear photos of your best-selling items with better lighting.";
  if (insights.some((i) => i.category === "best_seller"))
    return "This type of media is easier for Veroxa to use. Send more best-seller closeups when available.";
  return "Please send clear food photos, best-seller photos, storefront/menu/contact photos, and save any video ideas for coming-soon channel review.";
}
