import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

const requiredMomoDocs = [
  "MOMO_WORK_QUEUE_DAILY_OPERATING_BOARD.md",
  "MOMO_WORKSPACE_DASHBOARD_OPERATING_SNAPSHOT.md",
  "MOMO_WORKSPACE_PRIMARY_NAVIGATION_ALIGNMENT.md",
  "MOMO_FOCUSED_TEAM_PORTAL_CONSOLIDATION.md",
  "MOMO_FOCUSED_TEAM_PORTAL_DIRECTION.md",
  "MOMO_INTERNAL_DRY_RUN_GO_NO_GO_GATE.md",
  "MOMO_AI_DRAFT_APPROVAL_QUEUE.md",
  "MOMO_CONTROLLED_AI_DRAFT_GENERATION_FOUNDATION.md",
  "MOMO_BRAND_VOICE_AI_PROMPT_RULES.md",
  "MOMO_MEDIA_CONTENT_INVENTORY_PACK.md",
  "MOMO_BUSINESS_TRUTH_REVIEW_PACK.md",
  "MOMO_INTERNAL_PILOT_PREP_PACK.md",
] as const;

const activeDocs = read("artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md");
const currentBuildStatus = read("artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md");
const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const pilotAccess = read("api/pilot-access.ts");
const roles = `${read("artifacts/veroxa/src/domain/users/permissions.ts")}\n${read("artifacts/veroxa/src/lib/auth/authContract.ts")}`;

must(/AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode), "AUTH_MODE remains placeholder.");
must(pilotAccess.includes("export default function handler") && pilotAccess.includes("manual_pilot_auth"), "/api/pilot-access remains active.");
must(/AppRole\s*=\s*["']client["']\s*\|\s*["']team["']/.test(roles) && /VeroxaRole\s*=\s*["']client["']\s*\|\s*["']team["']/.test(roles), "Roles remain client/team only.");
must(!/AppRole\s*=.*(owner|operator|admin|super_admin|super-admin)/i.test(roles), "No owner/operator/admin role was added to AppRole.");
must(!/VeroxaRole\s*=.*(owner|operator|admin|super_admin|super-admin)/i.test(roles), "No owner/operator/admin role was added to VeroxaRole.");

must(activeDocs.includes("GitHub PR #131"), "ACTIVE_DOCS_INDEX.md includes GitHub PR #131.");
must(activeDocs.includes("GitHub PR #131 is Active Docs Override List Alignment only"), "ACTIVE_DOCS_INDEX.md says PR #131 is Active Docs Override List Alignment only.");
must(currentBuildStatus.includes("GitHub PR #131 is docs/guardrail only"), "CURRENT_BUILD_STATUS.md says PR #131 is docs/guardrail only.");

for (const marker of [
  "does not activate the pilot",
  "does not activate real auth",
  "does not create credentials",
  "does not contact Momo’s House",
  "does not publish externally",
  "does not connect external platforms",
  "does not generate AI output",
  "does not create fake data",
  "Momo owner walkthrough remains blocked",
  "No next activation PR is approved by default",
  "Future real-world activation requires separate explicit Faraz approval",
]) {
  must(activeDocs.includes(marker), `ACTIVE_DOCS_INDEX.md missing PR #131 safety marker: ${marker}`);
}

const currentHeading = "## Current source-of-truth docs";
const overrideSentence = "These files reflect the current Veroxa operating truth";
const currentSectionStart = activeDocs.indexOf(currentHeading);
const currentSectionEnd = currentSectionStart >= 0 ? activeDocs.indexOf(overrideSentence, currentSectionStart) : -1;
const currentSection = currentSectionStart >= 0 && currentSectionEnd > currentSectionStart
  ? activeDocs.slice(currentSectionStart, currentSectionEnd)
  : "";
must(Boolean(currentSection), "Could not slice Current source-of-truth docs section before lower override sentence.");
for (const doc of requiredMomoDocs) {
  must(currentSection.includes(doc), `Current source-of-truth docs section must include ${doc}.`);
}

const overrideStart = activeDocs.indexOf(overrideSentence);
const nextHeading = overrideStart >= 0 ? activeDocs.indexOf("\n## ", overrideStart) : -1;
const overrideSection = overrideStart >= 0
  ? activeDocs.slice(overrideStart, nextHeading > overrideStart ? nextHeading : activeDocs.length)
  : "";
must(Boolean(overrideSection), "Could not slice lower active override list section.");
for (const doc of requiredMomoDocs) {
  must(overrideSection.includes(doc), `Lower active override list must include ${doc}.`);
}

if (failures.length) {
  console.error("Active docs Momo workspace override list guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Active docs Momo workspace override list guardrail passed.");
