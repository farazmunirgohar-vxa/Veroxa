import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const exists = (p: string) => existsSync(join(root, p));
const dir = "artifacts/veroxa/src/domain/restaurantOnboarding";
for (const f of ["businessInfoChecklist.ts", "platformProfileChecklist.ts", "mediaIntakeGuidance.ts", "businessTruthConfirmation.ts", "proofInputCollector.ts", "packageOnboardingRules.ts", "onboardingSeedData.ts", "index.ts"]) if (!exists(`${dir}/${f}`)) failures.push(`Missing restaurantOnboarding/${f}`);
const docs = read("artifacts/veroxa/docs/RESTAURANT_ONBOARDING_OS_V1.md");
for (const required of ["Complete Online Presence", "$495/month", "Google Business Profile link/access status", "Google Maps link", "Yelp", "coming soon", "website link/access status", "Facebook link/access status", "Instagram link/access status", "menu/order/reservation links", "best sellers", "media supply", "business-truth confirmations", "website alignment permissions", "weekly update expectations", "monthly report baseline inputs", "I understand Veroxa does not handle", "I agree the restaurant is responsible for", "24-hour response means review/answer/next step", "No production auth", "real storage uploads", "live integrations", "payments", "automated customer-visible execution", "does not recommend or invent discounts"]) if (!docs.includes(required)) failures.push(`Restaurant onboarding docs missing marker: ${required}`);
const page = read("artifacts/veroxa/src/pages/client-onboarding.tsx");
for (const required of ["I understand Veroxa does not handle", "I agree the restaurant is responsible for", "Yelp/TikTok/Reels/Ads yet", "24-hour response means review/answer/next step, not guaranteed completion", "this does not create a legal onboarding signature", "Weekly updates are included", "prefilled_by_veroxa: \"Pre-filled — please review\"", "completed_by_team: \"Completed by Veroxa\"", "needs_owner_verification: \"Needs verification\"", "missing: \"Missing\"", "blocked_needs_access: \"Needs access\"", "Pre-filled items came from public or audit signals"]) if (!page.includes(required)) failures.push(`Client onboarding page missing expectation/status marker: ${required}`);
if (/prefilled_by_veroxa:\s*["']Completed by Veroxa["']/.test(page)) failures.push("Client onboarding must not label prefilled audit/public details as completed Veroxa work.");
const all = [read(`${dir}/platformProfileChecklist.ts`), read(`${dir}/packageOnboardingRules.ts`), read(`${dir}/proofInputCollector.ts`)].join("\n");
for (const required of ["google", "facebook", "instagram", "website", "menu", "business"] ) if (!all.toLowerCase().includes(required)) failures.push(`Onboarding domain missing marker: ${required}`);
if (failures.length) { console.error("Restaurant Onboarding OS guardrail failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Restaurant Onboarding OS guardrail passed.");
