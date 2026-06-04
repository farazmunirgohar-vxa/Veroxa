import type { MediaCategory, MediaType, PlatformFit } from "./types";
import type { PlanId } from "../packageBoundary";
export function getPlatformFit(
  mediaType: MediaType,
  category: MediaCategory,
  plan: PlanId,
): PlatformFit[] {
  const base: PlatformFit[] =
    category === "menu"
      ? ["google", "report_only"]
      : ["google", "facebook", "instagram"];
  if (
    (mediaType === "video" || mediaType === "reel_candidate") &&
    plan !== "starter"
  )
    base.push("reels");
  if (
    (mediaType === "video" || mediaType === "tiktok_candidate") &&
    plan !== "starter"
  )
    base.push("tiktok");
  if (category === "storefront") base.push("report_only");
  return [...new Set(base)];
}
export function filterClientSafePlatformFit(
  fit: PlatformFit[],
  plan: PlanId,
): PlatformFit[] {
  return plan === "starter"
    ? fit.filter((p) => p !== "reels" && p !== "tiktok")
    : fit;
}
