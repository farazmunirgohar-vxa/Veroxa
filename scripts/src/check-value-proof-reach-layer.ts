import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const exists = (p: string) => existsSync(join(root, p));
const dir = "artifacts/veroxa/src/domain/valueProof";
for (const f of ["types.ts", "proofSignalCatalog.ts", "restaurantReachEngine.ts", "onlineInfluencedActionEngine.ts", "clientSafeValueSummary.ts", "internalCostJustification.ts", "valueProofSeedData.ts", "index.ts"]) if (!exists(`${dir}/${f}`)) failures.push(`Missing valueProof/${f}`);
const all = [read(`${dir}/types.ts`), read(`${dir}/valueProofSeedData.ts`), read("artifacts/veroxa/docs/VALUE_PROOF_AND_RESTAURANT_REACH_LAYER.md")].join("\n");
for (const required of ["google_search", "google_maps", "facebook", "instagram", "website", "menu_link", "order_link", "call_click", "direction_click", "customer_mention", "owner_reported", "internal only", "what worked, what needs improvement, and what Veroxa needs next"]) if (!all.includes(required)) failures.push(`Value proof missing ${required}`);
if (failures.length) { console.error("Value proof guardrail failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Value proof guardrail passed.");
