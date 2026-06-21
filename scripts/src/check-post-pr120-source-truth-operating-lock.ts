import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd().endsWith("/scripts") ? join(process.cwd(), "..") : process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const exists = (path: string) => existsSync(join(root, path));
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

const docsPath = "artifacts/veroxa/docs/";
const activeIndex = read(`${docsPath}ACTIVE_DOCS_INDEX.md`);
const agents = read("AGENTS.md");
const operatingMemory = read(`${docsPath}VEROXA_LOCKED_OPERATING_MEMORY.md`);
const currentStatus = read(`${docsPath}CURRENT_BUILD_STATUS.md`);
const prSequence = read(`${docsPath}LIVE_AUTOMATION_V1_PR_SEQUENCE.md`);

const activeDocs = [activeIndex, operatingMemory, currentStatus, prSequence].join("\n");
const activeAndAgents = `${activeDocs}\n${agents}`;

must(/Current operating baseline: merged PR #120/i.test(activeIndex), "ACTIVE_DOCS_INDEX.md must mention PR #120 as current operating baseline.");
must(!/PR #121[^\n.]{0,120}(is merged|is completed|was merged|was completed)/i.test(activeIndex), "ACTIVE_DOCS_INDEX.md must not treat PR #121 as merged/completed.");
must(!/PR #122[^\n.]{0,120}(is active source-of-truth|is merged|is completed|was merged|was completed)/i.test(activeIndex), "ACTIVE_DOCS_INDEX.md must not treat PR #122 as active.");
must(/post-PR120/i.test(agents) && /operating lock/i.test(agents), "AGENTS.md must mention the post-PR120 operating lock.");
for (const marker of [
  "AUTH_MODE remains placeholder",
  "/api/pilot-access remains active",
  "Roles remain client/team only",
  "Momo owner walkthrough remains blocked",
]) {
  must(agents.includes(marker), `AGENTS.md missing marker: ${marker}`);
}
for (const path of ["MOMO_OWNER_WALKTHROUGH.md", "MOMO_PILOT_LAUNCH_QA.md"]) {
  if (exists(`${docsPath}${path}`)) {
    const doc = read(`${docsPath}${path}`).slice(0, 1500);
    must(/Historical\/blocked reference only/i.test(doc), `${path} must be clearly marked historical/blocked near the top.`);
    must(/Do not use this document as an active launch guide or active owner walkthrough guide/i.test(doc), `${path} must block active launch/walkthrough usage.`);
    must(!/^Status:\s*active\b/im.test(doc), `${path} must not contain active status wording near the top.`);
  }
}
for (const path of [
  "MOMO_CONTROLLED_AI_DRAFT_GENERATION_FOUNDATION.md",
  "MOMO_AI_DRAFT_APPROVAL_QUEUE.md",
  "MOMO_INTERNAL_DRY_RUN_GO_NO_GO_GATE.md",
]) {
  const doc = read(`${docsPath}${path}`);
  must(/merged\/completed/i.test(doc.slice(0, 1600)), `${path} must read as merged/completed near the top.`);
  for (const forbidden of [
    /PR #119 should be merged before this PR/i,
    /PR #120 should be merged before this PR/i,
    /future PR #120/i,
    /owner walkthrough is ready/i,
  ]) {
    must(!forbidden.test(doc), `${path} contains stale forbidden wording: ${forbidden}`);
  }
}
const forbiddenClaims = [
  "real auth is active",
  "Momo is activated",
  "owner walkthrough is approved",
  "external integrations are connected",
  "publishing is enabled",
  "AI provider calls are enabled",
  "customer-visible AI output is enabled",
  "activation is next by default",
];
const allowedNegativePrefixes = /^(?:[- ]*)?(?:No |Do not |Future |This does not |No active guide should |Momo owner walkthrough remains blocked)/i;
for (const line of activeDocs.split("\n")) {
  for (const claim of forbiddenClaims) {
    const lower = line.toLowerCase();
    const claimIndex = lower.indexOf(claim.toLowerCase());
    const beforeClaim = claimIndex >= 0 ? line.slice(0, claimIndex) : "";
    if (claimIndex >= 0 && !allowedNegativePrefixes.test(line) && !/No\s+$/i.test(beforeClaim)) {
      failures.push(`Active docs contain forbidden affirmative claim: ${line}`);
    }
  }
}
for (const marker of [
  "AUTH_MODE remains placeholder",
  "/api/pilot-access remains active",
  "Roles remain client/team only",
  "Momo owner walkthrough remains blocked",
  "No next activation PR is approved by default",
  "Future real-world activation requires separate explicit Faraz approval",
]) {
  must(activeAndAgents.includes(marker), `Active docs/AGENTS missing required marker: ${marker}`);
}
must(read(`${docsPath}ROUTE_PAGE_INVENTORY.md`).includes("/team/momo-dry-run-go-no-go"), "Route inventory must list /team/momo-dry-run-go-no-go.");
must(read(`${docsPath}VEROXA_ROUTE_SURFACE_MAP.md`).includes("/team/momo-dry-run-go-no-go"), "Route surface map must list /team/momo-dry-run-go-no-go.");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("Post-PR120 source-of-truth operating lock guardrail passed.");
