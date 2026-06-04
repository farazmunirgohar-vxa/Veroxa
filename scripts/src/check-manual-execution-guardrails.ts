import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const exists = (p: string) => existsSync(join(root, p));
for (const file of [
  "artifacts/veroxa/src/domain/manualExecution/manualPublishingTracker.ts",
  "artifacts/veroxa/src/domain/manualExecution/clientConfirmationWorkflow.ts",
  "artifacts/veroxa/src/domain/manualExecution/executionPackBuilder.ts",
  "artifacts/veroxa/src/pages/team-manual-execution.tsx",
]) if (!exists(file)) failures.push(`Missing manual execution file: ${file}`);
const combined = ["artifacts/veroxa/src/domain/manualExecution/manualPublishingTracker.ts", "artifacts/veroxa/src/domain/manualExecution/clientConfirmationWorkflow.ts", "artifacts/veroxa/src/pages/team-manual-execution.tsx", "artifacts/veroxa/src/data/pricing/veroxaPricing.ts"].map(read).join("\n");
for (const required of ["Complete Online Presence", "$495", "team review", "client", "confirmation", "manual", "Queue", "Hold", "No", "live integrations"]) if (!combined.includes(required)) failures.push(`Manual execution missing marker: ${required}`);
for (const forbidden of [/auto[- ]?post/i, /automated customer-visible execution/i, /stripe/i, /checkout/i, /openai/i]) if (forbidden.test(combined) && !/not included|No|not connected|coming soon/i.test(combined)) failures.push(`Manual execution contains risky marker: ${forbidden}`);
if (failures.length) { console.error("Manual execution guardrails failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Manual execution guardrails passed.");
