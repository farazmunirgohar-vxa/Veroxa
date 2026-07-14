import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const combined = [
  "AGENTS.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md",
  "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  "artifacts/veroxa/docs/MOMO_FOUNDING_PILOT_COMMITMENT_AND_ONBOARDING_GATE.md",
  "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json",
  "artifacts/veroxa/docs/VEROXA_OS_CURRENT_MASTER.md",
  "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md",
]
  .map((p) => readFileSync(join(root, p), "utf8"))
  .join("\n");
for (const required of [
  "ChatGPT-managed",
  "GitHub",
  "Codex",
  "ChatGPT Sites",
  "source of truth",
  "Vercel",
  "rollback",
  "`Build it`",
  "`Build it, but hold for review`",
  "`Build and deploy it`",
  "Client and Team",
  "Owner/Operator",
  "Complete Online Presence",
  "$495/month",
  "Home -> Audit -> Login",
  "AUTH_MODE",
  "placeholder",
  "90% complete",
  "Momo's House San Antonio",
  "founding pilot",
  "secure, persistent, human-controlled Momo operating loop",
  "Restaurant Audit Center",
  "Restaurant Audit Center",
  "does not become an operational client",
  "VEROXA_DEPLOYMENT_MANIFEST.json",
  "candidate_not_merged_not_deployed",
  "Sites version 13",
  "all four workflows",
  "Mandatory post-build continuity update",
  "plain-language handoff",
])
  if (!combined.includes(required))
    failures.push(`Current strategy missing ${required}`);
if (/ChatGPT Sites is the canonical source of truth/i.test(combined))
  failures.push(
    "GitHub, not ChatGPT Sites, must remain canonical source of truth",
  );
if (failures.length) {
  console.error(
    "Veroxa OS current strategy failed:\n" +
      failures.map((f) => `- ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log("Veroxa OS current strategy passed.");
