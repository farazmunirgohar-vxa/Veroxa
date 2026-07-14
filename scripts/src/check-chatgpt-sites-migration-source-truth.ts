import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

function archivedRuntimeHash(entries: string[]): { fileCount: number; sha256: string } {
  const files: string[] = [];
  const walk = (path: string) => {
    const absolute = resolve(repoRoot, path);
    if (statSync(absolute).isDirectory()) {
      for (const name of readdirSync(absolute).sort()) walk(`${path}/${name}`);
    } else {
      files.push(path);
    }
  };
  for (const entry of entries) walk(entry);
  const hash = createHash("sha256");
  for (const file of files.sort()) {
    hash.update(file, "utf8");
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, file)));
    hash.update("\0");
  }
  return { fileCount: files.length, sha256: hash.digest("hex") };
}

const agents = read("AGENTS.md");
const activeDocs = read("artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md");
const currentMilestone = read(
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
);
const protocol = read(
  "artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md",
);
const memory = read("artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md");
const status = read("artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md");
const foundingPilot = read(
  "artifacts/veroxa/docs/MOMO_FOUNDING_PILOT_COMMITMENT_AND_ONBOARDING_GATE.md",
);
const deploymentManifest = read(
  "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json",
);
const migration = read(
  "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
);
const lockedModel = read("artifacts/veroxa/docs/VEROXA_OS_LOCKED_MODEL.md");
const currentStateReadme = read(
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
);
const preBuild = read("artifacts/veroxa/docs/PRE_BUILD_STABILITY_CHECKLIST.md");
const currentMaster = read("artifacts/veroxa/docs/VEROXA_OS_CURRENT_MASTER.md");
const aiStrategy = read(
  "artifacts/veroxa/docs/AI_READY_BUT_NOT_CONNECTED_STRATEGY.md",
);
const integrationStrategy = read(
  "artifacts/veroxa/docs/INTEGRATION_READY_BUT_NOT_CONNECTED_STRATEGY.md",
);
const onboardingStrategy = read(
  "artifacts/veroxa/docs/RESTAURANT_ONBOARDING_OS_GAP_AND_BUILD_PLAN.md",
);
const preliveMap = read(
  "artifacts/veroxa/docs/VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md",
);
const prePaidGate = read("artifacts/veroxa/docs/PRE_PAID_ACTIVATION_GATE.md");
const pricingTruth = read("artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md");
const currentRealModel = read(
  "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md",
);
const alignedCurrentDocs = [
  "artifacts/veroxa/docs/PUBLIC_PRICING_AND_SERVICES.md",
  "artifacts/veroxa/docs/PACKAGE_BOUNDARY_AND_REQUEST_ENFORCEMENT.md",
  "artifacts/veroxa/docs/PORTAL_REQUEST_SLA_24_HOUR_MODEL.md",
  "artifacts/veroxa/docs/VALUE_PROOF_AND_RESTAURANT_REACH_LAYER.md",
  "artifacts/veroxa/docs/MEDIA_INTELLIGENCE_LAYER.md",
  "artifacts/veroxa/docs/RESTAURANT_ONBOARDING_OS_V1.md",
].map(read);
const sitesRouter = read("artifacts/veroxa-sites/app/page.tsx");
const sitesReadme = read("artifacts/veroxa-sites/README.md");
const sitesHosting = read("artifacts/veroxa-sites/.openai/hosting.json");
const legacyArchive = read("artifacts/veroxa/ARCHIVED.md");
const workspace = read("pnpm-workspace.yaml");
const sourceTruth = [
  agents,
  activeDocs,
  currentMilestone,
  protocol,
  memory,
  status,
  migration,
  lockedModel,
  currentStateReadme,
  foundingPilot,
  deploymentManifest,
].join("\n");
const governedDocs = [
  agents,
  activeDocs,
  currentMilestone,
  protocol,
  memory,
  status,
  migration,
  lockedModel,
  currentStateReadme,
  foundingPilot,
  deploymentManifest,
  preBuild,
  currentMaster,
  aiStrategy,
  integrationStrategy,
  onboardingStrategy,
  preliveMap,
  prePaidGate,
  pricingTruth,
  currentRealModel,
  ...alignedCurrentDocs,
  sitesReadme,
].join("\n");

for (const marker of [
  "Momo's House San Antonio",
  "founding pilot",
  "secure, persistent, human-controlled Momo operating loop",
  "Restaurant Audit Center",
  "does not become an operational client",
  "Other restaurants",
  "VEROXA_DEPLOYMENT_MANIFEST.json",
  "Sites version 15",
  "all four required workflows",
  "Mandatory post-build continuity update",
  "After every build",
]) {
  must(
    currentMilestone.includes(marker),
    `Current milestone missing locked scope marker: ${marker}`,
  );
}

for (const document of [agents, activeDocs, protocol, memory, status]) {
  for (const marker of [
    "VEROXA_CURRENT_MILESTONE.md",
    "Momo's House San Antonio",
    "Restaurant Audit Center",
    "operational client",
  ]) {
    must(
      document.includes(marker),
      `Durable operating document missing current milestone marker: ${marker}`,
    );
  }
}

for (const marker of [
  "Mandatory post-build continuity update",
  "After every build",
  "CURRENT_BUILD_STATUS.md",
  "plain-language handoff",
  "what remains inactive",
]) {
  must(
    protocol.includes(marker),
    `Build protocol missing continuity marker: ${marker}`,
  );
}

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
  must(
    migration.includes(`\`${path}\``) ||
      [
        "/",
        "/free-audit",
        "/login",
        "/client/dashboard",
        "/client/onboarding",
        "/client/media",
        "/client/reports",
      ].includes(path),
    `Migration document missing grouped route: ${path}`,
  );
}

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
  "/team/audits",
]) {
  must(
    sitesRouter.includes(`\"${path}\"`),
    `Sites delivery layer missing migration-critical route: ${path}`,
  );
}

for (const marker of [
  "GitHub `main` remains the canonical source of truth",
  "ChatGPT is Faraz's primary",
  "ChatGPT Sites",
  "not a new demo",
  "Vercel is retired",
  "veroxasystems.com",
  "RR",
]) {
  must(
    sourceTruth.includes(marker),
    `Active migration source-of-truth missing marker: ${marker}`,
  );
}

for (const marker of [
  "9749b68ce2cfc383deeae6aa63c413019ef61385",
  "e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0",
  "Sites version 15",
  "ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f",
  "20260714022859_reconcile_audit_v3_and_function_search_paths.sql",
  "192505ca4631e55f35b28f0c849a7d380bc1a709e5ae89adca742d7d349da45e",
  "20260714022911_ai_budget_and_momo_manual_pilot_contract.sql",
  "ebc2ea499a24b79da1baaffa02423488b1a28a95cb75d4c0d5c002c7c585948d",
  "verified_reconciliation_cleanup_deployed",
  "post_release_cleanup_deployed",
  "reviewed_manual_deployment_only",
  // Preserve the exact pre-PR #148 drift baseline as historical evidence.
  "674e1a7c0d140c9b281029277baeb2e68962dac2",
  "dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805",
  "Sites version 13",
  "20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql",
  "304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2",
]) {
  must(
    sourceTruth.includes(marker),
    `Active source truth missing production-reconciliation marker: ${marker}`,
  );
}
must(
  /futureMergedGitHubCommit"\s*:\s*null/.test(deploymentManifest) &&
    /futureSitesVersion"\s*:\s*null/.test(deploymentManifest),
  "Deployment manifest must not predict a merge commit or future Sites version.",
);

for (const marker of [
  "secure-email-link Supabase authentication",
  "approved-user password authentication",
  "Public signup remains disabled",
  "root `/api/pilot-access` deployment adapter is retired",
  "Roles remain `client` and `team` only",
  "Momo owner walkthrough",
]) {
  must(
    migration.includes(marker),
    `Migration authority missing safety marker: ${marker}`,
  );
}

for (const document of [agents, migration, memory]) {
  for (const command of [
    "`Build it`",
    "`Build it, but hold for review`",
    "`Build and deploy it`",
    "`RR`",
  ]) {
    must(
      document.includes(command),
      `ChatGPT-managed operating authority missing command: ${command}`,
    );
  }
}

for (const marker of [
  "Faraz uses ChatGPT as the primary Veroxa command center",
  "GitHub `main`",
  "Green merge gate",
  "exact head commit",
  "required GitHub checks",
  "unresolved actionable review thread",
  "critical/high-severity",
  "GitHub merge and Sites deployment are separate actions",
]) {
  must(
    protocol.includes(marker),
    `ChatGPT-managed operating protocol missing marker: ${marker}`,
  );
}

for (const marker of [
  "production authentication",
  "real customer/client data",
  "destructive data",
  "billing, payments",
  "external integrations",
  "public publishing",
  "business truth",
  "DNS/domain-record changes",
  "Momo owner walkthrough",
]) {
  must(
    protocol.includes(marker),
    `ChatGPT-managed operating protocol missing pause boundary: ${marker}`,
  );
}

must(
  /`Build it` does not independently authorize a ChatGPT Sites production deployment/.test(
    protocol,
  ),
  "Build it must not silently authorize Sites deployment.",
);
must(
  /hold for review[\s\S]*must not merge or deploy/.test(protocol),
  "Hold command must stop before merge and deployment.",
);
must(
  /Build and deploy it[\s\S]*exact merged GitHub source state[\s\S]*checkpoint/.test(
    protocol,
  ),
  "Deploy command must sync the exact merged GitHub state before a Sites checkpoint.",
);
must(
  /`RR` by itself does not authorize merge, deployment/.test(protocol),
  "RR must not independently authorize merge or deployment.",
);
must(
  /Faraz approved public Sites access/.test(migration),
  "Migration authority must record approved public Sites access.",
);
must(
  /active provider and SSL status/.test(migration),
  "Migration authority must record active custom-domain and SSL state.",
);
must(
  /rollback path/.test(migration),
  "Domain stabilization gate must retain a rollback path.",
);
must(
  sitesReadme.includes("Sites access is public"),
  "Sites README must record current public access.",
);
must(
  sitesReadme.includes("Client and Team routes require a verified Supabase session"),
  "Sites README must record the protected Client/Team route boundary.",
);
for (const bannedSitesCopy of [
  "owner-restricted",
  "public pre-live shells",
  "no production accounts or real client data",
]) {
  must(
    !sitesRouter.includes(bannedSitesCopy),
    `Public Sites source contains stale access claim: ${bannedSitesCopy}`,
  );
}
for (const requiredSitesCopy of [
  "SECURE PORTAL ACCESS",
  "Signed sessions and password verification are handled by Supabase Auth",
  "Secure Team route",
  "Momo-only production boundary",
]) {
  must(
    sitesRouter.includes(requiredSitesCopy),
    `Sites source missing production access marker: ${requiredSitesCopy}`,
  );
}
must(
  !/Owner-restricted Sites access remains in place/i.test(sitesReadme),
  "Sites README must not claim public routes are owner-restricted.",
);
must(
  !/ChatGPT Sites is the canonical source of truth/i.test(sourceTruth),
  "Sites must not replace GitHub as canonical source of truth.",
);
must(
  !/Vercel is the new primary deployment target/i.test(sourceTruth),
  "Active migration docs must not restore Vercel as the new primary target.",
);
must(
  !/GitHub \+ Codex \+ Vercel/i.test(governedDocs),
  "Governed current docs must not restore the old GitHub + Codex + Vercel stack.",
);
must(
  !/Use Vercel as the deployment target/i.test(governedDocs),
  "Governed current docs must not restore Vercel as the primary deployment target.",
);
must(
  !/Do not point `veroxasystems\.com`|Do not attach or redirect `veroxasystems\.com`|`veroxasystems\.com` has not been moved/i.test(
    governedDocs,
  ),
  "Governed current docs must not restore stale pre-cutover domain instructions.",
);
must(
  !/farazclient|farazteam/i.test(governedDocs),
  "Governed current docs must not carry retired preview password strings.",
);
must(
  sitesHosting.includes("project_id"),
  "GitHub-synchronized Sites source must preserve its hosting identity manifest.",
);
must(
  workspace.includes("!artifacts/veroxa-sites") &&
    workspace.includes("!artifacts/veroxa") &&
    legacyArchive.includes("archived from active development") &&
    legacyArchive.includes("not the canonical production application"),
  "Root workspace must isolate Sites and archive legacy Vite from active development.",
);
const legacyRuntime = archivedRuntimeHash([
  "artifacts/veroxa/src",
  "artifacts/veroxa/public",
  "artifacts/veroxa/e2e",
  "artifacts/veroxa/.env.example",
  "artifacts/veroxa/components.json",
  "artifacts/veroxa/index.html",
  "artifacts/veroxa/package.json",
  "artifacts/veroxa/tsconfig.json",
  "artifacts/veroxa/vite.config.ts",
]);
must(
  legacyRuntime.fileCount === 670 &&
    legacyRuntime.sha256 ===
      "34c9133b9e672f9396357cbb7ba1fa46d7d2f3c5d513548fde9e31c32f566a49" &&
    legacyArchive.includes(legacyRuntime.sha256),
  "Archived Vite runtime changed without an explicit reactivation decision and archive-hash update.",
);

if (failures.length) {
  console.error("ChatGPT Sites migration source-of-truth guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("ChatGPT Sites migration source-of-truth guardrail passed.");
import "./check-momo-house-readiness-tracking";
