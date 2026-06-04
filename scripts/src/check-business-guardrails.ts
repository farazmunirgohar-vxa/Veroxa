import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const publicClientFiles = [
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
  "artifacts/veroxa/src/pages/free-audit.tsx",
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
];
const publicCombined = publicClientFiles.map(read).join("\n");
for (const forbidden of [/we make restaurants profitable/i, /Veroxa handles (DMs|comments|inboxes|refunds|complaints|order questions)/i, /run a discount/i, /BOGO/i, /lower your price/i, /offer 20% off/i]) if (forbidden.test(publicCombined)) failures.push(`Public/client surface contains forbidden business claim: ${forbidden}`);
const pricing = read("artifacts/veroxa/src/data/pricing/veroxaPricing.ts");
for (const required of ["Complete Online Presence", "$495", "one launch offer", "Up to 3 total posts/updates per week", "TikTok", "Reels/video", "Ads management", "coming soon", "does not invent discounts", "status: \"retired\""]) if (!pricing.includes(required)) failures.push(`Pricing/business source missing ${required}`);
const docs = ["AGENTS.md", "artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md", "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md"].map(read).join("\n");
for (const required of ["Complete Online Presence", "$495/month", "Starter, Growth, Premium", "historical/deprecated", "No production auth", "AUTH_MODE", "placeholder", "Owner/Operator", "not active", "No routine text/call", "does not recommend or invent discounts"]) if (!docs.includes(required)) failures.push(`Docs missing business guardrail marker: ${required}`);
if (failures.length) { console.error("Business guardrail check failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Business guardrail check passed.");
