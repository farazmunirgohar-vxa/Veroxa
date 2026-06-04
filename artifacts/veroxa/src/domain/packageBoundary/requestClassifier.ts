import type { ClientRequestType } from "./types";
const checks: Array<[ClientRequestType, RegExp]> = [
  ["dm_or_comment_reply_request", /\b(dm|direct message|comment|inbox|reply to guest|instagram message|facebook message)\b/i],
  ["refund_or_complaint_request", /\b(refund|complaint|angry guest|delivery issue)\b/i],
  ["order_question_request", /\b(order question|where is my order|customer order)\b/i],
  ["customer_service_request", /\b(customer service|customer conversation|guest conversation|reply to customer)\b/i],
  ["offer_or_discount_request", /\b(discount|bogo|coupon|offer|promotion|lower price|price cut|deal|20% off)\b/i],
  ["full_website_redesign", /\b(full website redesign|redesign our website|advanced design)\b/i],
  ["technical_hosting_or_domain_support", /\b(hosting|domain|email setup|plugin|site speed|dns|emergency website)\b/i],
  ["new_basic_website_request", /\b(new basic website|basic website|simple website|starter website)\b/i],
  ["custom_website_build", /\b(custom website|custom-coded website|build (a )?custom website|website from scratch)\b/i],
  ["missing_social_profile_creation", /\b(create.*(facebook|instagram)|missing social profile|set up.*(facebook|instagram)|facebook page setup|instagram profile setup)\b/i],
  ["ad_management_request", /\b(ad management|manage ads|paid ads|boost|advertising campaign)\b/i],
  ["ad_planning_request", /\b(ad plan|ad budget|paid plan|campaign budget)\b/i],
  ["daily_posting_request", /\b(daily post|post every day|1 post per day|one post per day)\b/i],
  ["advanced_campaign_request", /\b(advanced campaign|multi platform campaign|paid campaign)\b/i],
  ["video_content_request", /\b(video content|short video|food prep video)\b/i],
  ["reels_request", /\b(reel|reels)\b/i],
  ["tiktok_request", /\b(tiktok|tik tok)\b/i],
  ["weekly_update", /\b(weekly update|weekly summary|this week)\b/i],
  ["monthly_report_request", /\b(monthly report|report|reporting question)\b/i],
  ["yelp_profile_alignment", /\b(yelp)\b/i],
  ["website_alignment", /\b(website alignment|website update|website correction|site copy|restaurant description)\b/i],
  ["seo_search_visibility_basics", /\b(local seo|search visibility|search wording|keywords)\b/i],
  ["link_menu_contact_update", /\b(menu link|order link|reservation link|contact link|phone|address|hours)\b/i],
  ["business_info_correction", /\b(business info|correct info|wrong hours|wrong address|wrong phone)\b/i],
  ["google_profile_update", /\b(google business|google profile|gbp|google update)\b/i],
  ["maps_visibility_update", /\b(map|maps|local search|directions|visibility)\b/i],
  ["facebook_picture_post", /\bfacebook\b/i],
  ["instagram_picture_post", /\binstagram|ig\b/i],
  ["picture_caption", /\b(caption|copy for photo|write post)\b/i],
  ["media_guidance", /\b(photo guidance|what media|what should i send|media guidance|better photo)\b/i],
];
export function classifyClientRequest(title: string, message: string): ClientRequestType {
  const haystack = `${title} ${message}`;
  return checks.find(([, rx]) => rx.test(haystack))?.[0] ?? "unknown_request";
}
