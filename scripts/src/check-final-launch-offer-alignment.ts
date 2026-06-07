import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");

const pricing = read("artifacts/veroxa/src/data/pricing/veroxaPricing.ts");
const landing = read("artifacts/veroxa/src/pages/landing.tsx");
const audit = read("artifacts/veroxa/src/pages/free-audit.tsx");
const requests = read("artifacts/veroxa/src/pages/client-requests.tsx");
const onboarding = read("artifacts/veroxa/src/pages/client-onboarding.tsx");
const teamBoundary = read("artifacts/veroxa/src/domain/packageBoundary/teamPackageReviewQueue.ts");
const valueProof = [
  read("artifacts/veroxa/src/domain/valueProof/internalCostJustification.ts"),
  read("artifacts/veroxa/docs/VALUE_PROOF_AND_RESTAURANT_REACH_LAYER.md"),
].join("\n");
const docs = [
  "AGENTS.md",
  "artifacts/veroxa/docs/VEROXA_OS_CURRENT_MASTER.md",
  "artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/PUBLIC_PRICING_AND_SERVICES.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md",
  "artifacts/veroxa/docs/PACKAGE_BOUNDARY_AND_REQUEST_ENFORCEMENT.md",
  "artifacts/veroxa/docs/PORTAL_REQUEST_SLA_24_HOUR_MODEL.md",
  "artifacts/veroxa/docs/MEDIA_INTELLIGENCE_LAYER.md",
  "artifacts/veroxa/docs/RESTAURANT_ONBOARDING_OS_V1.md",
  "artifacts/veroxa/docs/PRE_PAID_ACTIVATION_GATE.md",
  "artifacts/veroxa/docs/VEROXA_90_PERCENT_PREPAID_OS_READINESS_MAP.md",
  "artifacts/veroxa/docs/ADDON_NEW_BASIC_WEBSITE_SCOPE.md",
  "artifacts/veroxa/docs/ADDON_SOCIAL_PROFILE_CREATION_SCOPE.md",
  "artifacts/veroxa/docs/FIRST_5_CLIENT_READINESS_PLAN.md",
].map(read).join("\n");

for (const marker of [
  "COMPLETE_ONLINE_PRESENCE_PRICE_MONTHLY = 495",
  "NEW_BASIC_WEBSITE_ADDON_PRICE = 95",
  "MISSING_SOCIAL_PROFILE_ADDON_PRICE = 45",
  "FIRST_CLIENT_LOYALTY_DISCOUNT_PERCENT = 20",
  "CURRENT_LAUNCH_INCLUDED",
  "CURRENT_LAUNCH_COMING_SOON",
  "CURRENT_LAUNCH_NOT_INCLUDED",
  "CURRENT_LAUNCH_ADDONS",
  "Weekly updates",
  "Monthly online presence report",
  "Yelp",
]) {
  if (!pricing.includes(marker)) failures.push(`Pricing missing ${marker}`);
}
if (/CURRENT_LAUNCH_INCLUDED[\s\S]*Yelp/.test(pricing.split("export const CURRENT_LAUNCH_COMING_SOON")[0])) failures.push("Yelp appears inside CURRENT_LAUNCH_INCLUDED before coming-soon export.");

for (const marker of ["Complete Online Presence", "$495", "Weekly updates", "Monthly online presence report", "+$95", "+$45/profile", "Yelp", "coming soon", "guaranteed results"]) {
  if (!landing.includes(marker)) failures.push(`Landing missing ${marker}`);
}

const nav = read("artifacts/veroxa/src/components/public/PublicNav.tsx");
if (!nav.includes("Veroxa")) failures.push("Public header missing Veroxa brand.");
for (const marker of ['label: "Home"', 'label: "Audit"', 'label: "Login"', 'nav-link-home', 'nav-link-audit', 'nav-link-login']) {
  if (nav.includes(marker)) failures.push(`Public header must not render visible ${marker} navigation.`);
}
for (const forbidden of ["Starter —", "Growth —", "Premium —", "Local Presence", "Full Presence", "Yelp included", "ads included", "TikTok included", "Reels included", "daily posting included", "Client Demo", "/demo/client"]) {
  if (landing.includes(forbidden)) failures.push(`Landing contains active old/demo/included marker ${forbidden}`);
}

for (const forbidden of ["Client Demo", "/demo/client", "$295", "$995", "Most popular"]) {
  if (landing.includes(forbidden)) failures.push(`Landing promotes forbidden marker ${forbidden}`);
}
for (const marker of ["Complete Online Presence — $495/month", "Yelp is a coming-soon/future review area", "Not ready / needs manual verification", "Not a fit yet", "no checkout/payment"]) {
  if (!audit.includes(marker)) failures.push(`Audit missing ${marker}`);
}
for (const marker of ["Included", "Needs confirmation", "Add-on available", "Coming soon", "Not included at launch", "Needs manual review", "not a promise that larger work is completed within 24 hours"]) {
  if (!requests.includes(marker)) failures.push(`Client requests missing ${marker}`);
}
for (const marker of ["I understand Veroxa does not handle", "I agree the restaurant is responsible for", "Yelp/TikTok/Reels/Ads yet", "24-hour response means review/answer/next step, not guaranteed completion", "this does not create a legal onboarding signature", "Weekly updates are included", "Complete Online Presence"]) {
  if (!onboarding.includes(marker)) failures.push(`Onboarding missing ${marker}`);
}
for (const marker of ["comingSoonRouted", "routedBoundaryWork", "upgradeRouted: decisions.filter"]) {
  if (!teamBoundary.includes(marker)) failures.push(`Team boundary summary missing ${marker}`);
}
if (/upgradeRouted:\s*0/.test(teamBoundary)) failures.push("Team boundary summary still hardcodes upgradeRouted to 0.");
for (const marker of ["9900", "$9,900/month", "$15k–$25k/month", "$25k+/month", "internal-only", "not extra new sales"]) {
  if (!valueProof.includes(marker)) failures.push(`Value proof missing ${marker}`);
}
for (const marker of ["Yelp is coming soon", "weekly updates", "+$95", "+$45/profile", "First-client loyalty", "$9,900/month", "Team Portal complexity remains deferred", "No live auth"]) {
  if (!docs.includes(marker)) failures.push(`Docs missing ${marker}`);
}

if (failures.length) {
  console.error("Final launch offer alignment guardrail failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}
console.log("Final launch offer alignment guardrail passed.");
