import type { ClientRequestType } from "./types";
const checks: Array<[ClientRequestType, RegExp]> = [
  [
    "dm_or_comment_reply_request",
    /\b(dm|direct message|comment|inbox|reply to guest|instagram message|facebook message)\b/i,
  ],
  [
    "customer_service_request",
    /\b(refund|complaint|order question|customer service|angry guest|customer conversation|delivery issue)\b/i,
  ],
  [
    "offer_or_discount_request",
    /\b(discount|bogo|coupon|offer|promotion|lower price|price cut|deal)\b/i,
  ],
  [
    "ad_management_request",
    /\b(ad management|manage ads|paid ads|boost|advertising campaign)\b/i,
  ],
  ["ad_planning_request", /\b(ad plan|ad budget|paid plan|campaign budget)\b/i],
  [
    "premium_daily_posting_request",
    /\b(daily post|post every day|1 post per day|one post per day)\b/i,
  ],
  [
    "advanced_campaign_request",
    /\b(advanced campaign|multi platform campaign|paid campaign)\b/i,
  ],
  ["reels_request", /\b(reel|reels|short video)\b/i],
  ["tiktok_request", /\b(tiktok|tik tok)\b/i],
  ["weekly_update_request", /\b(weekly update|weekly progress)\b/i],
  ["monthly_report_request", /\b(monthly report|report)\b/i],
  [
    "better_support_request",
    /\b(priority support|better support|faster support|stronger communication)\b/i,
  ],
  [
    "google_profile_update",
    /\b(google business|google profile|gbp|hours|category|google update)\b/i,
  ],
  [
    "maps_visibility_update",
    /\b(map|maps|local search|directions|visibility)\b/i,
  ],
  ["facebook_picture_post", /\bfacebook\b/i],
  ["instagram_picture_post", /\binstagram|ig\b/i],
  ["picture_caption", /\b(caption|copy for photo|write post)\b/i],
  [
    "media_guidance",
    /\b(photo guidance|what media|what should i send|media guidance|better photo)\b/i,
  ],
];
export function classifyClientRequest(
  title: string,
  message: string,
): ClientRequestType {
  const haystack = `${title} ${message}`;
  return checks.find(([, rx]) => rx.test(haystack))?.[0] ?? "unknown_request";
}
