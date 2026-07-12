import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

const agents = read("AGENTS.md");
const activeDocs = read("artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md");
const memory = read("artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md");
const status = read("artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md");
const migration = read("artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md");
const router = read("artifacts/veroxa/src/App.tsx");
const sitesRouter = read("artifacts/veroxa-sites/app/page.tsx");
const sitesHosting = read("artifacts/veroxa-sites/.openai/hosting.json");
const workspace = read("pnpm-workspace.yaml");
const sourceTruth = [agents, activeDocs, memory, status, migration].join("\n");

for (const path of [
  "/",
  "/free-audit",
  "/login",
  "/client/dashboard",
  "/client/onboarding",
  "/client/media",
  "/client/reports",
  "/team/momo",
  "/team/momo/work",
  "/team/momo/intelligence",
  "/team/momo/content-ai",
  "/team/momo/reports",
  "/team/momo/readiness",
]) {
  must(router.includes(`path=\"${path}\"`), `Canonical router missing migration-critical route: ${path}`);
  must(migration.includes(`\`${path}\``) || ["/", "/free-audit", "/login", "/client/dashboard", "/client/onboarding", "/client/media", "/client/reports"].includes(path), `Migration document missing grouped route: ${path}`);
}

for (const path of [
  "/free-audit",
  "/login",
  "/client/dashboard",
  "/client/onboarding",
  "/client/media",
  "/client/reports",
  "/team/momo",
  "/team/momo/work",
  "/team/momo/intelligence",
  "/team/momo/content-ai",
  "/team/momo/reports",
  "/team/momo/readiness",
]) {
  must(sitesRouter.includes(`\"${path}\"`), `Sites delivery layer missing migration-critical route: ${path}`);
}

for (const marker of [
  "GitHub `main` remains the canonical source of truth",
  "ChatGPT Sites",
  "not a new demo",
  "Vercel remains a temporary",
  "veroxasystems.com",
  "RR",
]) {
  must(sourceTruth.includes(marker), `Active migration source-of-truth missing marker: ${marker}`);
}

for (const marker of [
  "`AUTH_MODE` remains `placeholder`",
  "/api/pilot-access",
  "Roles remain `client` and `team` only",
  "Momo owner walkthrough",
]) {
  must(migration.includes(marker), `Migration authority missing safety marker: ${marker}`);
}

must(/Do not point `veroxasystems\.com`/.test(migration), "Migration authority must block premature domain cutover.");
must(/access mode for the public website is explicitly approved/.test(migration), "Domain gate must require explicit public-access approval.");
must(/rollback path/.test(migration), "Domain gate must retain a rollback path.");
must(!/ChatGPT Sites is the canonical source of truth/i.test(sourceTruth), "Sites must not replace GitHub as canonical source of truth.");
must(!/Vercel is the new primary deployment target/i.test(sourceTruth), "Active migration docs must not restore Vercel as the new primary target.");
must(sitesHosting.includes("project_id"), "GitHub-synchronized Sites source must preserve its hosting identity manifest.");
must(workspace.includes("!artifacts/veroxa-sites"), "Root pnpm workspace must exclude the isolated npm-based Sites application.");

if (failures.length) {
  console.error("ChatGPT Sites migration source-of-truth guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("ChatGPT Sites migration source-of-truth guardrail passed.");
