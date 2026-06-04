export type MediaType = "photo" | "video" | "reel_candidate" | "tiktok_candidate" | "menu_photo" | "storefront" | "ambience" | "staff_optional" | "catering_optional" | "unknown";
export type MediaCategory = "best_seller" | "food_closeup" | "food_prep" | "dining_room" | "storefront" | "menu" | "catering" | "seasonal_item" | "family_meal" | "drink" | "dessert" | "other";
export type QualityStatus = "ready" | "usable" | "needs_better_lighting" | "blurry" | "weak_angle" | "duplicate" | "save_for_later" | "not_usable" | "needs_confirmation";
export type PerformanceStatus = "not_enough_data" | "working" | "promising" | "weak" | "overused" | "platform_mismatch";
export type PlatformFit = "google" | "facebook" | "instagram" | "instagram_reels_coming_soon" | "tiktok_coming_soon" | "report_only" | "save_for_later";
export interface PlatformDraftDirection { platform: PlatformFit; label: string; clientIncludedAtLaunch: boolean; direction: string; }
export interface MediaAssetInsight {
  id: string;
  clientId: string;
  restaurantName: string;
  mediaType: MediaType;
  category: MediaCategory;
  platformFit: PlatformFit[];
  draftDirections: PlatformDraftDirection[];
  qualityStatus: QualityStatus;
  performanceStatus: PerformanceStatus;
  reachContribution: "unknown" | "low" | "medium" | "high";
  actionContribution: "unknown" | "low" | "medium" | "high";
  bestUse: string;
  clientSafeSummary: string;
  teamNotes: string;
  nextRecommendation: string;
  warnings: string[];
}
