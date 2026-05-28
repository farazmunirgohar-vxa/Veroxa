/**
 * mediaRepository.ts — read-only adapter that maps demo media
 * fixtures into the `MediaAsset` contract.
 *
 * Read-only. No writes. No network. No uploads.
 */

import {
  demoMediaItems,
  demoMediaRunway,
  type DemoMediaItem,
  type MediaStatus,
} from "@/data/demo/demoMediaAssets";
import type {
  MediaAsset,
  MediaFileType,
  MediaQualityFlag,
  MediaReviewStatus,
} from "@/lib/data/veroxaDataContracts";

function mapFileType(t: DemoMediaItem["type"]): MediaFileType {
  return t === "Video" ? "video" : "photo";
}

function mapReviewStatus(s: MediaStatus): MediaReviewStatus {
  switch (s) {
    case "Approved":
      return "approved";
    case "Pending Review":
      return "pending_review";
    case "Blurry":
    case "Duplicate":
      return "needs_revision";
    case "Scheduled":
      return "scheduled";
    case "Used":
      return "used";
    case "Reserved":
      return "reserved";
    default:
      return "pending_review";
  }
}

function mapQualityFlag(s: MediaStatus): MediaQualityFlag {
  switch (s) {
    case "Blurry":
      return "blurry";
    case "Duplicate":
      return "duplicate";
    case "Pending Review":
      return "ok";
    default:
      return "ok";
  }
}

function toMediaAsset(m: DemoMediaItem): MediaAsset {
  return {
    mediaId: m.id,
    clientId: m.clientId,
    title: m.title,
    fileType: mapFileType(m.type),
    reviewStatus: mapReviewStatus(m.status),
    qualityFlag: mapQualityFlag(m.status),
    uploadedAt: m.dateAdded,
    suggestedUse: m.suggestedUse,
  };
}

export function getMediaForClient(clientId: string): MediaAsset[] {
  return demoMediaItems.filter((m) => m.clientId === clientId).map(toMediaAsset);
}

/**
 * "Unused usable" = approved or scheduled but not yet used.
 */
export function getUnusedUsableMediaForClient(clientId: string): MediaAsset[] {
  return getMediaForClient(clientId).filter(
    (m) => m.reviewStatus === "approved" || m.reviewStatus === "scheduled",
  );
}

export interface MediaInventorySummary {
  totalAssets: number;
  approved: number;
  pendingReview: number;
  scheduled: number;
  lowInventoryClients: number;
}

export function getMediaInventorySummary(): MediaInventorySummary {
  const all = demoMediaItems.map(toMediaAsset);
  return {
    totalAssets: all.length,
    approved: all.filter((m) => m.reviewStatus === "approved").length,
    pendingReview: all.filter((m) => m.reviewStatus === "pending_review").length,
    scheduled: all.filter((m) => m.reviewStatus === "scheduled").length,
    lowInventoryClients: demoMediaRunway.filter(
      (r) => r.health === "Low" || r.health === "Critical",
    ).length,
  };
}

export function getLowContentClients(): string[] {
  return demoMediaRunway
    .filter((r) => r.health === "Low" || r.health === "Critical")
    .map((r) => r.clientId);
}
