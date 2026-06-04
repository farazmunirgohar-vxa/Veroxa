import type { ClientRequestType, PlanId } from "./types";

export function buildIncludedMessage(): string {
  return "This request is included in the current Complete Online Presence package. Veroxa will review/respond in the portal within 24 hours; completion timing depends on scope, access, media, and needed confirmations.";
}

export function buildComingSoonMessage(type: ClientRequestType): string {
  if (type === "yelp_profile_alignment") return "Yelp is coming soon and is not included in the current launch package.";
  if (type === "tiktok_request" || type === "reels_request" || type === "video_content_request") return "TikTok and Reels support are coming soon and are not included in the current launch package.";
  if (type === "ad_management_request" || type === "ad_planning_request") return "Ads management is coming soon and is not included in the current launch package.";
  if (type === "daily_posting_request" || type === "premium_daily_posting_request") return "Daily posting is coming soon and is not included in the current Complete Online Presence package.";
  return "This request is outside the current Complete Online Presence package and needs manual review.";
}

export function buildUpgradeMessage(_currentPlan: PlanId, _requiredPlan: PlanId, type: ClientRequestType): string {
  return buildComingSoonMessage(type);
}

export function buildNotSupportedMessage(type: ClientRequestType): string {
  if (type === "full_website_redesign" || type === "custom_website_build" || type === "technical_hosting_or_domain_support") return "Full/custom website development and technical website support are not included. Veroxa can help with website alignment if access is provided; a new basic website is available as a $95 add-on.";
  return "Veroxa does not handle guest conversations, comments, DMs, refunds, complaints, or order questions at launch.";
}
