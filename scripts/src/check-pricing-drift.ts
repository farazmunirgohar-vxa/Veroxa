import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const publicFiles = [
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/components/public/PublicNav.tsx",
  "artifacts/veroxa/src/components/public/PublicFooter.tsx",
  "artifacts/veroxa/src/data/pricing/veroxaPricing.ts",
];
const publicCombined = publicFiles.map(read).join("\n");
for (const marker of ["Complete Online Presence", "$495", "one launch offer", "Up to 3 total posts/updates per week", "Weekly updates", "Monthly online presence report", "Portal request response/review/answer within 24 hours", "Yelp is coming soon", "New basic website", "+$95", "Missing social profile creation", "+$45/profile", "First-client loyalty discount", "20% off for the first 12 months", "If the client leaves and returns later, the discount no longer applies"]) {
  if (!publicCombined.includes(marker)) failures.push(`Missing current offer public marker: ${marker}`);
}
for (const forbidden of [/\$295(?![^\n]*(retired|historical|deprecated|not current))/i, /\$995(?![^\n]*(retired|historical|deprecated|not current))/i, /CURRENT_PUBLIC_PLAN_IDS\s*=\s*\[[^\]]*(starter|growth|premium)/]) {
  if (forbidden.test(publicCombined)) failures.push(`Active public pricing contains retired tier marker: ${forbidden}`);
}
const pricing = read("artifacts/veroxa/src/data/pricing/veroxaPricing.ts");
for (const required of ["CURRENT_PUBLIC_PLAN_IDS = [\"complete_online_presence\"]", "CURRENT_LAUNCH_INCLUDED", "CURRENT_LAUNCH_COMING_SOON", "CURRENT_LAUNCH_NOT_INCLUDED", "CURRENT_LAUNCH_ADDONS", "NEW_BASIC_WEBSITE_ADDON_PRICE = 95", "MISSING_SOCIAL_PROFILE_ADDON_PRICE = 45", "FIRST_CLIENT_LOYALTY_DISCOUNT_PERCENT = 20", "Yelp", "Weekly updates", "starter", "status: \"retired\"", "growth", "premium", "local_presence", "full_presence", "old_complete_presence"]) {
  if (!pricing.includes(required)) failures.push(`Pricing source missing launch/retired marker: ${required}`);
}
if (/CURRENT_LAUNCH_INCLUDED[\s\S]*Yelp business profile alignment/.test(pricing)) failures.push("Yelp must not be included in CURRENT_LAUNCH_INCLUDED.");
if (failures.length) { console.error("Pricing drift guardrail failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Pricing drift guardrail passed.");
