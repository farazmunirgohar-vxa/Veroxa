import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const requiredDocs = [
  "AGENTS.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md",
  "artifacts/veroxa/docs/VEROXA_OS_CURRENT_MASTER.md",
  "artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/PUBLIC_PRICING_AND_SERVICES.md",
  "artifacts/veroxa/docs/PRE_PAID_ACTIVATION_GATE.md",
  "artifacts/veroxa/docs/PACKAGE_BOUNDARY_AND_REQUEST_ENFORCEMENT.md",
  "artifacts/veroxa/docs/PORTAL_REQUEST_SLA_24_HOUR_MODEL.md",
  "artifacts/veroxa/docs/VALUE_PROOF_AND_RESTAURANT_REACH_LAYER.md",
  "artifacts/veroxa/docs/MEDIA_INTELLIGENCE_LAYER.md",
  "artifacts/veroxa/docs/RESTAURANT_ONBOARDING_OS_V1.md",
];
const read = (p: string) => readFileSync(join(root, p), "utf8");
let combined = "";
for (const file of requiredDocs) { if (!existsSync(join(root, file))) failures.push(`Missing doc ${file}`); else combined += `\n--- ${file}\n${read(file)}`; }
for (const required of ["Complete Online Presence", "$495/month", "Home -> Audit -> Login", "no public demo", "TikTok support", "Reels/video content support", "ads management", "coming soon", "no production auth", "portal requests", "24 hours", "no routine text/call", "does not recommend or invent discounts", "90% complete", "requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30", "internal only", "SaasDataMode", "RepositoryBundle", "future production adapter requires RR approval"]) if (!combined.toLowerCase().includes(required.toLowerCase())) failures.push(`Docs missing marker: ${required}`);
for (const forbidden of [/Starter:\s*\$295\/month(?![\s\S]{0,120}(historical|deprecated|retired))/i, /Premium:\s*\$995\/month(?![\s\S]{0,120}(historical|deprecated|retired))/i]) if (forbidden.test(combined)) failures.push(`Docs contain stale active marker: ${forbidden}`);
if (failures.length) { console.error("Docs model alignment failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Docs model alignment passed.");
