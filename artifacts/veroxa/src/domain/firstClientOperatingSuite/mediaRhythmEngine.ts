import type { MediaRhythmInput, MediaRhythmStatus } from "./types";

export function evaluateMediaRhythm(input: MediaRhythmInput): MediaRhythmStatus {
  const contentSupplyStatus =
    input.usableMediaCount >= 10 && input.lowQualityMediaCount <= 2
      ? "ready"
      : input.usableMediaCount >= 5
        ? "thin"
        : input.usableMediaCount >= 1
          ? "low"
          : "blocked";

  const shouldSlowPostingDueToMedia =
    contentSupplyStatus === "low" || contentSupplyStatus === "blocked";

  const nextMediaRequest = shouldSlowPostingDueToMedia
    ? "Ask for 6–10 clear food, storefront, and best-seller photos before preparing a fuller posting rhythm."
    : contentSupplyStatus === "thin"
      ? "Ask for a small refresh of best-seller photos so the posting rhythm stays calm and usable."
      : "Request ongoing fresh food photos when convenient so Veroxa can keep future work current.";

  return {
    usableMediaCount: input.usableMediaCount,
    lowQualityMediaCount: input.lowQualityMediaCount,
    missingMediaCount: input.missingMediaCount,
    lastMediaUploadLabel: input.lastMediaUploadLabel,
    nextMediaRequest,
    contentSupplyStatus,
    shouldSlowPostingDueToMedia,
  };
}
