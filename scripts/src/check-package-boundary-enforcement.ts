import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const exists = (p: string) => existsSync(join(root, p));
const dir = "artifacts/veroxa/src/domain/packageBoundary";
for (const f of ["types.ts", "planCapabilities.ts", "requestClassifier.ts", "requestEligibilityEngine.ts", "upgradeMessageBuilder.ts", "teamPackageReviewQueue.ts", "packageBoundarySeedData.ts", "index.ts"]) if (!exists(`${dir}/${f}`)) failures.push(`Missing packageBoundary/${f}`);
const rules = read(`${dir}/planCapabilities.ts`); const engine = read(`${dir}/requestEligibilityEngine.ts`); const messages = read(`${dir}/upgradeMessageBuilder.ts`);
for (const required of ["completeOnlinePresenceIncluded", "yelp_profile_alignment", "website_alignment", "seo_search_visibility_basics", "monthly_report", "portal_request_review", "comingSoonNotIncludedTypes", "tiktok_request", "reels_request", "ad_management_request", "daily_posting_request", "customerServiceBlockedTypes", "websiteBlockedTypes", "offerConfirmationTypes"]) if (!rules.includes(required)) failures.push(`Package rules missing ${required}`);
for (const required of ["TikTok and Reels support are coming soon", "Ads management is coming soon", "Full website development is not included", "does not invent discounts", "comments, DMs, refunds, complaints, or order questions"]) if (!messages.includes(required) && !engine.includes(required)) failures.push(`Package messages missing ${required}`);
for (const file of ["artifacts/veroxa/src/pages/client-requests.tsx", "artifacts/veroxa/src/pages/team-work-queue.tsx"]) if (!read(file).includes("package") && !read(file).includes("Package")) failures.push(`${file} must surface package boundary context.`);
if (failures.length) { console.error("Package boundary guardrail failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Package boundary guardrail passed.");
