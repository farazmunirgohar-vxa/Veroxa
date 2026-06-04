import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const exists = (p: string) => existsSync(join(root, p));
const dir = "artifacts/veroxa/src/domain/packageBoundary";
for (const f of ["types.ts", "planCapabilities.ts", "requestClassifier.ts", "requestEligibilityEngine.ts", "upgradeMessageBuilder.ts", "teamPackageReviewQueue.ts", "packageBoundarySeedData.ts", "index.ts"]) if (!exists(`${dir}/${f}`)) failures.push(`Missing packageBoundary/${f}`);
const rules = read(`${dir}/planCapabilities.ts`); const engine = read(`${dir}/requestEligibilityEngine.ts`); const messages = read(`${dir}/upgradeMessageBuilder.ts`); const team = read(`${dir}/teamPackageReviewQueue.ts`);
for (const required of ["completeOnlinePresenceIncluded", "google_profile_update", "maps_visibility_update", "seo_search_visibility_basics", "website_alignment", "facebook_picture_post", "instagram_picture_post", "weekly_update", "monthly_report", "portal_request_review", "up_to_3_posts_per_week_media_dependent", "business_info_correction", "link_menu_contact_update", "comingSoonNotIncludedTypes", "yelp_profile_alignment", "tiktok_request", "reels_request", "video_content_request", "ad_management_request", "ad_planning_request", "daily_posting_request", "premium_daily_posting_request", "advanced_campaign_request", "addOnAvailableTypes", "new_basic_website_request", "missing_social_profile_creation", "customerServiceBlockedTypes", "websiteBlockedTypes", "offerConfirmationTypes"]) if (!rules.includes(required)) failures.push(`Package rules missing ${required}`);
for (const required of ["Yelp is coming soon", "TikTok and Reels support are coming soon", "Ads management is coming soon", "$95 add-on", "$45/profile", "does not invent discounts", "comments, DMs, refunds, complaints, or order questions"]) if (!messages.includes(required) && !engine.includes(required)) failures.push(`Package messages missing ${required}`);
for (const required of ["routedBoundaryWork", "comingSoonRouted", "upgradeRouted: decisions.filter", "addOnAvailable"]) if (!team.includes(required)) failures.push(`Team package summary missing accurate routed count marker: ${required}`);
if (/upgradeRouted:\s*0/.test(team)) failures.push("upgradeRouted must not be hardcoded to 0 while consumers still use it.");
for (const file of ["artifacts/veroxa/src/pages/client-requests.tsx", "artifacts/veroxa/src/pages/team-work-queue.tsx", "artifacts/veroxa/src/pages/team-dashboard.tsx"]) if (!read(file).includes("package") && !read(file).includes("Package")) failures.push(`${file} must surface package boundary context.`);
if (failures.length) { console.error("Package boundary guardrail failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Package boundary guardrail passed.");
