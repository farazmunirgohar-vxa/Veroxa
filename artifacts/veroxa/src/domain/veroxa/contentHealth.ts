import type { MediaAsset, Post } from "./types";

export type ContentHealthStatus =
  | "healthy"
  | "caution"
  | "urgent"
  | "broken_pipeline";
export type ContentAlertKind =
  | "content_low"
  | "content_exhausted"
  | "upload_reminder";

export interface ContentSupplyInput {
  mediaAssets: MediaAsset[];
  posts: Post[];
  postingFrequencyWeekly: number;
}

export interface ContentSupplySnapshot {
  unusedUsableMediaCount: number;
  postingFrequencyWeekly: number;
  weeksOfContentLeft: number;
  status: ContentHealthStatus;
  alerts: ContentAlertKind[];
  clientMessage: string;
  internalRiskMessage: string;
}

export function calculateUnusedUsableMediaCount(
  mediaAssets: MediaAsset[],
  posts: Post[],
): number {
  const usedMediaIds = new Set(posts.flatMap((post) => post.mediaAssetIds));
  return mediaAssets.filter(
    (asset) => asset.status === "usable" && !usedMediaIds.has(asset.id),
  ).length;
}

export function calculateWeeksOfContentLeft(
  unusedUsableMediaCount: number,
  postingFrequencyWeekly: number,
): number {
  if (postingFrequencyWeekly <= 0 || unusedUsableMediaCount <= 0) return 0;
  return (
    Math.round((unusedUsableMediaCount / postingFrequencyWeekly) * 10) / 10
  );
}

export function getContentHealthStatus(
  weeksOfContentLeft: number,
): ContentHealthStatus {
  if (weeksOfContentLeft <= 0) return "broken_pipeline";
  if (weeksOfContentLeft < 1) return "urgent";
  if (weeksOfContentLeft < 2) return "caution";
  return "healthy";
}

export function buildContentSupplySnapshot(
  input: ContentSupplyInput,
): ContentSupplySnapshot {
  const unusedUsableMediaCount = calculateUnusedUsableMediaCount(
    input.mediaAssets,
    input.posts,
  );
  const weeksOfContentLeft = calculateWeeksOfContentLeft(
    unusedUsableMediaCount,
    input.postingFrequencyWeekly,
  );
  const status = getContentHealthStatus(weeksOfContentLeft);
  const alerts: ContentAlertKind[] = [];

  if (status === "broken_pipeline")
    alerts.push("content_exhausted", "upload_reminder");
  if (status === "urgent") alerts.push("content_low", "upload_reminder");
  if (status === "caution") alerts.push("content_low");

  const clientMessage = getClientContentHealthMessage(status);
  const internalRiskMessage = `${unusedUsableMediaCount} unused usable media item(s), ${weeksOfContentLeft} week(s) left at ${input.postingFrequencyWeekly} post(s)/week.`;

  return {
    unusedUsableMediaCount,
    postingFrequencyWeekly: input.postingFrequencyWeekly,
    weeksOfContentLeft,
    status,
    alerts,
    clientMessage,
    internalRiskMessage,
  };
}

export function getClientContentHealthMessage(
  status: ContentHealthStatus,
): string {
  switch (status) {
    case "healthy":
      return "Your content supply is in good shape.";
    case "caution":
      return "A few fresh photos or videos will help keep your updates moving.";
    case "urgent":
      return "Please send new photos or videos soon so Veroxa can keep preparing updates.";
    case "broken_pipeline":
      return "Veroxa needs new photos or videos before more content can be prepared.";
  }
}
