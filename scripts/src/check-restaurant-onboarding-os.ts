import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (path: string) => readFileSync(join(root, path), "utf8");
const exists = (path: string) => existsSync(join(root, path));
const assert = (condition: boolean, message: string) => { if (!condition) failures.push(message); };

const domainDir = "artifacts/veroxa/src/domain/restaurantOnboarding";
const expectedDomainFiles = [
  "types.ts",
  "onboardingSeedData.ts",
  "onboardingReadinessEngine.ts",
  "businessInfoChecklist.ts",
  "platformProfileChecklist.ts",
  "mediaIntakeGuidance.ts",
  "businessTruthConfirmation.ts",
  "firstWeekSetupEngine.ts",
  "clientOnboardingMessages.ts",
  "teamOnboardingQueue.ts",
  "proofInputCollector.ts",
  "packageOnboardingRules.ts",
  "onboardingStatusEngine.ts",
  "index.ts",
];

assert(exists(domainDir), "restaurantOnboarding domain folder must exist.");
for (const file of expectedDomainFiles) assert(exists(`${domainDir}/${file}`), `Missing restaurant onboarding domain file: ${file}`);

const app = read("artifacts/veroxa/src/App.tsx");
for (const route of ["/client/onboarding", "/demo/client/onboarding", "/team/onboarding"]) {
  assert(app.includes(`<Route path="${route}"`), `Missing route: ${route}`);
}
const teamRouteBlock = app.match(/<Route path="\/team\/onboarding">[\s\S]*?<\/Route>/)?.[0] ?? "";
assert(teamRouteBlock.includes("InternalDemoGuard") && teamRouteBlock.includes('role="team"'), "/team/onboarding must be guarded with InternalDemoGuard role=team.");
assert(teamRouteBlock.includes("RealPortalDataBoundary"), "/team/onboarding must use RealPortalDataBoundary.");

const clientNav = read("artifacts/veroxa/src/lib/clientPortalNav.ts");
const teamNav = read("artifacts/veroxa/src/lib/teamPortalNav.ts");
assert(clientNav.includes('label: "Onboarding"') && clientNav.includes('/client/onboarding'), "Client nav must include Onboarding.");
assert(teamNav.includes('label: "Onboarding"') && teamNav.includes('/team/onboarding'), "Team nav must include Onboarding.");

const clientOnboarding = read("artifacts/veroxa/src/pages/client-onboarding.tsx");
const forbiddenClientTerms = [/backend/i, /fixture/i, /raw score/i, /\bRLS\b/i, /Supabase/i, /OpenAI/i, /\bAPI\b/, /connector/i, /internal risk/i, /profit math/i];
for (const pattern of forbiddenClientTerms) assert(!pattern.test(clientOnboarding), `Client onboarding page contains forbidden client term: ${pattern}`);

const onboardingFiles = [
  ...expectedDomainFiles.map((file) => `${domainDir}/${file}`),
  "artifacts/veroxa/src/pages/client-onboarding.tsx",
  "artifacts/veroxa/src/pages/team-onboarding.tsx",
  "artifacts/veroxa/docs/RESTAURANT_ONBOARDING_OS_V1.md",
];
const forbiddenImports = [/openai/i, /googleapis/i, /@google/i, /meta/i, /tiktok/i, /stripe/i, /supabase.*storage/i, /publish/i];
for (const file of onboardingFiles) {
  const text = read(file);
  for (const pattern of forbiddenImports) assert(!pattern.test(text) || /no |not |without|does not|do not|blocked|hold/i.test(text), `${file} appears to reference forbidden live system language: ${pattern}`);
}

const docs = read("artifacts/veroxa/docs/RESTAURANT_ONBOARDING_OS_V1.md");
for (const marker of ["preview/manual/pre-live", "No database writes", "No storage uploads", "No live integrations", "No payments", "No auto-posting", "No offer invention", "not to promise ROI"]) {
  assert(docs.includes(marker), `Restaurant onboarding docs missing marker: ${marker}`);
}
for (const pattern of [/run a discount/i, /lower your price/i, /create a promotion/i, /offer 20% off/i]) {
  for (const file of onboardingFiles) assert(!pattern.test(read(file)), `${file} contains forbidden offer-recommendation language: ${pattern}`);
}
assert(read(`${domainDir}/businessTruthConfirmation.ts`).includes("Please confirm the exact offer, dates, terms, and pricing before Veroxa prepares anything public."), "Business-truth confirmation must require exact existing-offer confirmation language.");

assert(/AUTH_MODE:\s*AuthMode\s*=\s*"placeholder"/.test(read("artifacts/veroxa/src/lib/auth/authMode.ts")), "AUTH_MODE must remain placeholder.");
const pricingSource = read("artifacts/veroxa/src/data/pricing/veroxaPricing.ts");
for (const marker of ["$295", "$495", "$995"]) assert(pricingSource.includes(marker), `Pricing source missing ${marker}.`);
const credentials = read("artifacts/veroxa/src/lib/auth/devCredentials.ts");
for (const marker of ["faraz@client.com", "farazclient", "faraz@team.com", "farazteam"]) assert(credentials.includes(marker), `Preview credential missing: ${marker}`);
const services = read("artifacts/veroxa/src/pages/services.tsx");
for (const marker of ["$295", "$495", "$995", "295/month", "495/month", "995/month"]) assert(!services.includes(marker), `Services page must not contain price marker: ${marker}`);
const pricing = read("artifacts/veroxa/src/pages/pricing.tsx");
const growthBlock = pricing.match(/name:\s*"Growth"[\s\S]*?(?=name:\s*"Premium")/)?.[0] ?? "";
assert(!/up to 1 post\/day/i.test(growthBlock), "Growth must not have up to 1 post/day language.");
assert(/Premium[\s\S]{0,500}Ad management/i.test(pricing), "Premium must include ad management.");
assert(/Premium[\s\S]{0,700}up to 1 post\/day/i.test(pricing), "Premium must include up to 1 post/day.");

if (failures.length > 0) {
  console.error("Restaurant Onboarding OS guardrail failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}
console.log("Restaurant Onboarding OS guardrail passed.");
