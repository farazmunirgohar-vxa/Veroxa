import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd(), "..");
const docs = [
  "artifacts/veroxa/docs/BACKEND_SOP_OPERATING_PRINCIPLES.md",
  "artifacts/veroxa/docs/SOP_WEEKLY_UPDATE.md",
  "artifacts/veroxa/docs/SOP_MONTHLY_REPORT.md",
  "artifacts/veroxa/docs/SOP_MEDIA_REVIEW.md",
  "artifacts/veroxa/docs/SOP_WEBSITE_ALIGNMENT.md",
  "artifacts/veroxa/docs/SOP_PORTAL_REQUEST_HANDLING.md",
  "artifacts/veroxa/docs/FIRST_5_CLIENT_READINESS_PLAN.md",
  "artifacts/veroxa/docs/AUDIT_TO_FIRST_CLIENT_FLOW.md",
  "artifacts/veroxa/docs/VEROXA_90_PERCENT_PREPAID_OS_READINESS_MAP.md",
  "artifacts/veroxa/docs/BACKEND_DAILY_WORKFLOW.md",
  "artifacts/veroxa/docs/BACKEND_WEEKLY_UPDATE_PLAYBOOK.md",
  "artifacts/veroxa/docs/BACKEND_MONTHLY_REPORT_PLAYBOOK.md",
  "artifacts/veroxa/docs/BACKEND_REQUEST_RESPONSE_EXAMPLES.md",
  "artifacts/veroxa/docs/FARAZ_ESCALATION_PLAYBOOK.md",
];
const required = ["no live systems", "portal-first", "no routine calls/texts", "24-hour response means review/answer/next step", "no guarantees", "no offer invention", "confirmation required", "add-ons", "coming soon", "weekly updates", "monthly reports", "faraz escalation"];
const failures: string[] = [];
let combined = "";
for (const doc of docs) {
  const path = join(root, doc);
  if (!existsSync(path)) {
    failures.push(`Missing SOP/readiness doc: ${doc}`);
    continue;
  }
  combined += `\n${readFileSync(path, "utf8")}`;
}
const lower = combined.toLowerCase();
for (const marker of required) if (!lower.includes(marker)) failures.push(`SOP/readiness docs missing marker: ${marker}`);
if (failures.length) { console.error("Backend SOP readiness guardrail failed:\n" + failures.map((f) => `- ${f}`).join("\n")); process.exit(1); }
console.log("Backend SOP readiness guardrail passed.");
