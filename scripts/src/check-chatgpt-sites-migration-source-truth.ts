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
const protocol = read(
  "artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md",
);
const memory = read("artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md");
const status = read("artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md");
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
const router = read("artifacts/veroxa/src/App.tsx");
const sitesRouter = read("artifacts/veroxa-sites/app/page.tsx");
const sitesReadme = read("artifacts/veroxa-sites/README.md");
const sitesHosting = read("artifacts/veroxa-sites/.openai/hosting.json");
const workspace = read("pnpm-workspace.yaml");
const sourceTruth = [
  agents,
  activeDocs,
  protocol,
  memory,
  status,
  migration,
  lockedModel,
  currentStateReadme,
].join("\n");
const governedDocs = [
  agents,
  activeDocs,
  protocol,
  memory,
  status,
  migration,
  lockedModel,
  currentStateReadme,
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
    router.includes(`path=\"${path}\"`),
    `Canonical router missing migration-critical route: ${path}`,
  );
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
    sitesRouter.includes(`\"${path}\"`),
    `Sites delivery layer missing migration-critical route: ${path}`,
  );
}

for (const marker of [
  "GitHub `main` remains the canonical source of truth",
  "ChatGPT is Faraz's primary",
  "ChatGPT Sites",
  "not a new demo",
  "Vercel remains a temporary",
  "veroxasystems.com",
  "RR",
]) {
  must(
    sourceTruth.includes(marker),
    `Active migration source-of-truth missing marker: ${marker}`,
  );
}

for (const marker of [
  "`AUTH_MODE` remains `placeholder`",
  "/api/pilot-access",
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
  sitesReadme.includes("non-sensitive pre-live visual shells"),
  "Sites README must state the public Client/Team shell boundary honestly.",
);
for (const bannedSitesCopy of [
  "SECURE PORTAL ACCESS",
  "owner-restricted",
  "Open the internal operating workspace",
  "Internal only",
]) {
  must(
    !sitesRouter.includes(bannedSitesCopy),
    `Public Sites source contains stale access claim: ${bannedSitesCopy}`,
  );
}
for (const requiredSitesCopy of [
  "PRE-LIVE PORTAL PREVIEW",
  "public pre-live shells",
  "no production accounts or real client data",
  "Public pre-live shell",
]) {
  must(
    sitesRouter.includes(requiredSitesCopy),
    `Public Sites source missing honest access marker: ${requiredSitesCopy}`,
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
  workspace.includes("!artifacts/veroxa-sites"),
  "Root pnpm workspace must exclude the isolated npm-based Sites application.",
);

if (failures.length) {
  console.error("ChatGPT Sites migration source-of-truth guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("ChatGPT Sites migration source-of-truth guardrail passed.");
