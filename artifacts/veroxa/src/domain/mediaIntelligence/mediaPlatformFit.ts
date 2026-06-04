import type { MediaCategory, MediaType, PlatformDraftDirection, PlatformFit } from "./types";
import type { PlanId } from "../packageBoundary";

export function buildImageDraftDirections(category: MediaCategory): PlatformDraftDirection[] {
  return [
    { platform: "facebook", label: "Facebook draft", clientIncludedAtLaunch: true, direction: "Picture-based Facebook caption direction for team review." },
    { platform: "instagram", label: "Instagram draft", clientIncludedAtLaunch: true, direction: "Picture-based Instagram caption direction for team review." },
    { platform: "google", label: "Google Business Profile / Google update draft", clientIncludedAtLaunch: true, direction: category === "menu" ? "Use only after menu/contact details are confirmed." : "Google update/profile freshness direction for team review." },
  ];
}

export function buildVideoDraftDirections(): PlatformDraftDirection[] {
  return [
    { platform: "facebook", label: "Facebook draft", clientIncludedAtLaunch: true, direction: "Still/image or light video-readiness direction for Facebook review." },
    { platform: "instagram_reels_coming_soon", label: "Instagram/Reels draft", clientIncludedAtLaunch: false, direction: "Coming-soon video channel; team/internal preview only." },
    { platform: "google", label: "Google Business Profile / Google update draft", clientIncludedAtLaunch: true, direction: "Google update/profile freshness direction for team review." },
    { platform: "tiktok_coming_soon", label: "TikTok draft", clientIncludedAtLaunch: false, direction: "Coming-soon channel; not included in the current launch package." },
  ];
}

export function getPlatformFit(mediaType: MediaType, category: MediaCategory, _plan: PlanId): PlatformFit[] {
  const isVideo = mediaType === "video" || mediaType === "reel_candidate" || mediaType === "tiktok_candidate";
  if (category === "menu") return ["google", "facebook", "instagram", "report_only"];
  if (isVideo) return ["facebook", "instagram_reels_coming_soon", "google", "tiktok_coming_soon"];
  return ["facebook", "instagram", "google"];
}
export function filterClientSafePlatformFit(fit: PlatformFit[], _plan: PlanId): PlatformFit[] {
  return fit.filter((p) => p !== "instagram_reels_coming_soon" && p !== "tiktok_coming_soon");
}
export function buildPlatformDraftDirections(mediaType: MediaType, category: MediaCategory): PlatformDraftDirection[] {
  return mediaType === "video" || mediaType === "reel_candidate" || mediaType === "tiktok_candidate" ? buildVideoDraftDirections() : buildImageDraftDirections(category);
}
