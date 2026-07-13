import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const checkpointPath = resolve(root, "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json");
const checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8")) as {
  schemaVersion: number;
  checkpoint: string;
  status: string;
  deployedOperationalRelease: {
    pullRequest: number;
    reviewedHead: string;
    mergedOperationalCommit: string;
    sitesCheckoutSourceCommit: string;
    databaseApplied: boolean;
    databaseVerified: boolean;
    productionMigrations: number;
    sitesProductionVerified: boolean;
    sitesVersion: number;
    customDomainsVerified: boolean;
  };
  continuityRelease: {
    pullRequest: number;
    releaseKind: string;
    requiredFinalSitesVersion: number;
    deployableSitesSourceChanged: boolean;
    operationalBehaviorChanged: boolean;
    databaseSourceChanged: boolean;
    databaseSchemaChanged: boolean;
    migrationContentChanged: boolean;
    migrationCountChanged: boolean;
    migrationLedgerReconciled: boolean;
    databaseSourceChangeReason: string;
    reconciledMigrationVersion: string;
    reconciledMigrationSha256: string;
    selfCommitEmbedded: boolean;
    sourceIdentityAuthority: string;
    deploymentIdentityAuthority: string;
    fingerprintAuthority: string;
    completionRule: string;
  };
  runtimeVerification: {
    teamIdentityProvisioned: boolean;
    authenticatedProtectedRouteVerified: boolean;
    passwordSignInVerifiedByUser: boolean;
    hostedReauthenticationVerified: boolean;
    oldSessionRevocationVerified: boolean;
    momoClientIdentityProvisioned: boolean;
    ownerConfirmedBusinessTruthVerified: boolean;
    permissionedMediaVerified: boolean;
    externalProvidersConnected: boolean;
    externalPublishingVerified: boolean;
    activationExecuted: boolean;
  };
  scope: { operationalRestaurant: string; otherRestaurantCapability: string; automaticProspectConversion: boolean };
  databaseMigrations: string[];
  reusableEvidence: string[];
  fullReviewTriggers: string[];
  activationGates: string[];
  boundaryGroups: Record<string, { review: string; files: string[]; sha256: string }>;
};

const expectedRelease = {
  pullRequest: 143,
  reviewedHead: "009276dbbf2639dc1eb5296bf62906f9f8ac45f1",
  mergedOperationalCommit: "49a5250d6ce7bd8d78f19e415641563e2260ace8",
  sitesCheckoutSourceCommit: "69871c51f8e80d1802539a6bca52e3ce5b4ff71c",
  sitesVersion: 9,
  productionMigrations: 9,
};

function groupHash(files: string[]): string {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    hash.update(`${file}\0`);
    hash.update(readFileSync(resolve(root, file)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

if (checkpoint.schemaVersion !== 2 || checkpoint.status !== "production_continuity") {
  throw new Error("RR checkpoint schema/status is invalid");
}
if (checkpoint.checkpoint !== "momo-zero-cost-operating-rehearsal-v1-production-continuity") {
  throw new Error("RR checkpoint must record the PR #143 production foundation and PR #144 continuity target");
}
const release = checkpoint.deployedOperationalRelease;
if (
  release.pullRequest !== expectedRelease.pullRequest ||
  release.reviewedHead !== expectedRelease.reviewedHead ||
  release.mergedOperationalCommit !== expectedRelease.mergedOperationalCommit ||
  release.sitesCheckoutSourceCommit !== expectedRelease.sitesCheckoutSourceCommit ||
  !release.databaseApplied ||
  !release.databaseVerified ||
  release.productionMigrations !== expectedRelease.productionMigrations ||
  release.sitesVersion !== expectedRelease.sitesVersion ||
  !release.sitesProductionVerified ||
  !release.customDomainsVerified
) {
  throw new Error("RR checkpoint source does not match the verified PR #143 / Sites version 9 / nine-migration operational foundation");
}
const continuity = checkpoint.continuityRelease;
if (
  continuity.pullRequest !== 144 ||
  continuity.releaseKind !== "repository_and_sites_evidence_continuity" ||
  continuity.requiredFinalSitesVersion !== 10 ||
  !continuity.deployableSitesSourceChanged ||
  continuity.operationalBehaviorChanged ||
  !continuity.databaseSourceChanged ||
  continuity.databaseSchemaChanged ||
  continuity.migrationContentChanged ||
  continuity.migrationCountChanged ||
  !continuity.migrationLedgerReconciled ||
  continuity.databaseSourceChangeReason !== "remote_migration_version_filename_reconciliation_only" ||
  continuity.reconciledMigrationVersion !== "20260713191147" ||
  continuity.reconciledMigrationSha256 !== "07cdb0a41b3d81e23e2c9432b139ae219c2b4671fed7cd18f761d4c4d6a79f2a" ||
  continuity.selfCommitEmbedded ||
  !continuity.sourceIdentityAuthority.includes("GitHub PR #144 metadata") ||
  !continuity.deploymentIdentityAuthority.includes("Sites version 10 checkpoint metadata") ||
  continuity.fingerprintAuthority !== "boundaryGroups" ||
  !continuity.completionRule.includes("only after") ||
  /\b[0-9a-f]{40}\b/i.test(JSON.stringify(continuity))
) {
  throw new Error("RR continuity must require external PR #144 / Sites version 10 identity and filename-only migration-ledger reconciliation without embedding a future commit");
}
if (
  !checkpoint.runtimeVerification.teamIdentityProvisioned ||
  !checkpoint.runtimeVerification.authenticatedProtectedRouteVerified ||
  !checkpoint.runtimeVerification.passwordSignInVerifiedByUser ||
  checkpoint.runtimeVerification.hostedReauthenticationVerified ||
  checkpoint.runtimeVerification.oldSessionRevocationVerified ||
  checkpoint.runtimeVerification.momoClientIdentityProvisioned ||
  checkpoint.runtimeVerification.ownerConfirmedBusinessTruthVerified ||
  checkpoint.runtimeVerification.permissionedMediaVerified ||
  checkpoint.runtimeVerification.externalProvidersConnected ||
  checkpoint.runtimeVerification.externalPublishingVerified ||
  checkpoint.runtimeVerification.activationExecuted
) {
  throw new Error("RR checkpoint runtime verification overstates or understates the approved Team/password and blocked Momo boundary");
}
if (
  checkpoint.scope.operationalRestaurant !== "Momo's House San Antonio" ||
  checkpoint.scope.otherRestaurantCapability !==
    "Restaurant Audit Center plus explicit-consent pending profile only" ||
  checkpoint.scope.automaticProspectConversion !== false
) {
  throw new Error("RR checkpoint drifted from the locked Momo-only operating scope");
}
if (checkpoint.fullReviewTriggers.length < 4) throw new Error("RR checkpoint review triggers are incomplete");
if (checkpoint.reusableEvidence.some((item) => /unmerged|undeployed|candidate/i.test(item))) {
  throw new Error("Verified RR evidence retains stale candidate language");
}
for (const marker of [
  "authenticated Team/Momo protected route",
  "No Momo owner truth or media rights may be invented",
  "inactive pending authorized access",
]) {
  if (!checkpoint.activationGates.some((gate) => gate.includes(marker))) {
    throw new Error(`RR checkpoint activation truth missing: ${marker}`);
  }
}
if (!checkpoint.activationGates.some((gate) => /Hosted reauthentication and old-session revocation remain unverified/i.test(gate))) {
  throw new Error("RR checkpoint must preserve the unverified reauthentication/session-revocation boundary");
}

const activeMigrations = readdirSync(resolve(root, "supabase/migrations"))
  .filter((name) => name.endsWith(".sql"))
  .sort();
if (JSON.stringify(activeMigrations) !== JSON.stringify([...checkpoint.databaseMigrations].sort())) {
  throw new Error("RR checkpoint migration inventory does not match the active migration chain");
}

const auth = readFileSync(resolve(root, "artifacts/veroxa-sites/app/veroxa-supabase.ts"), "utf8");
const password = readFileSync(resolve(root, "artifacts/veroxa-sites/app/veroxa-password.mjs"), "utf8");
const route = readFileSync(resolve(root, "artifacts/veroxa-sites/app/[...slug]/page.tsx"), "utf8");
const milestone = readFileSync(resolve(root, "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md"), "utf8");
const releaseDocuments = [
  "AGENTS.md",
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/RR_CHECKPOINT.md",
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
  "artifacts/veroxa/docs/MOMO_100_READINESS_SEVEN_SYSTEM_CONTRACT.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  "artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md",
].map((file) => {
  const text = readFileSync(resolve(root, file), "utf8");
  const historicalBoundary = text.search(/\n## (?:Historical|2026-06-)/);
  return {
    file,
    text,
    currentText: historicalBoundary > 0 ? text.slice(0, historicalBoundary) : text.slice(0, 20_000),
  };
});
const readinessBaseline = JSON.parse(
  readFileSync(resolve(root, "artifacts/veroxa-sites/app/momo-readiness-tracker.json"), "utf8"),
) as {
  recordKind: string;
  operationalAuthority: string;
  lastVerifiedOperationalRelease: {
    pullRequest: number;
    reviewedHead: string;
    mergedOperationalCommit: string;
    sitesCheckoutSourceCommit: string;
    sitesVersion: number;
    productionMigrations: number;
    databaseVerified: boolean;
    customDomainsVerified: boolean;
  };
  deployedNoCostFoundation: {
    releaseState: string;
    forwardMigrationApplied: boolean;
    forwardMigrationVerified: boolean;
    momoClientIdentityProvisioned: boolean;
    ownerConfirmedBusinessTruthVerified: boolean;
    permissionedMediaVerified: boolean;
    externalProvidersConnected: boolean;
    externalPublishingVerified: boolean;
    activationExecuted: boolean;
  };
  continuityRelease: {
    pullRequest: number;
    requiredFinalSitesVersion: number;
    deployableSitesSourceChanged: boolean;
    operationalBehaviorChanged: boolean;
    databaseSourceChanged: boolean;
    databaseSchemaChanged: boolean;
    migrationContentChanged: boolean;
    migrationCountChanged: boolean;
    migrationLedgerReconciled: boolean;
    databaseSourceChangeReason: string;
    reconciledMigrationVersion: string;
    reconciledMigrationSha256: string;
    selfCommitEmbedded: boolean;
    sourceIdentityAuthority: string;
    deploymentIdentityAuthority: string;
  };
};

for (const { file, currentText } of releaseDocuments) {
  for (const marker of [
    "PR #143",
    expectedRelease.reviewedHead,
    expectedRelease.mergedOperationalCommit,
    expectedRelease.sitesCheckoutSourceCommit,
    "Sites version 9",
    "PR #144",
    "Sites version 10",
  ]) {
    if (!currentText.includes(marker)) throw new Error(`${file} is missing current verified release marker: ${marker}`);
  }
  if (!/(?:not yet deployed|not already deployed|required post-merge target)/i.test(currentText)) {
    throw new Error(`${file} must not present the PR #144 / Sites version 10 continuity target as pre-merge production truth`);
  }
}
const milestoneCurrent = releaseDocuments.find(({ file }) => file.endsWith("VEROXA_CURRENT_MILESTONE.md"))?.currentText ?? "";
for (const marker of [
  "1. **Source and delivery reconciliation:**",
  "2. **Client identity and onboarding:**",
  "3. **Media and rights:**",
  "4. **Manual content:**",
  "5. **Operations, reports, and recovery:**",
  "6. **Meta and Google preflight:**",
  "7. **Atomic final rehearsal:**",
]) {
    if (!milestoneCurrent.includes(marker)) throw new Error(`Exact deployed PR #143 seven-step sequence is missing: ${marker}`);
}
const currentReleaseText = releaseDocuments.map(({ currentText }) => currentText).join("\n");
for (const stale of [
  "Real Team provisioning is blocked external authority",
  "Authenticated Team and Momo browser smoke remain unverified",
  "no corresponding V1 Auth profile/membership",
]) {
  if (currentReleaseText.includes(stale)) throw new Error(`Current release docs retain superseded Team-access truth: ${stale}`);
}
const readinessOperational = readinessBaseline.lastVerifiedOperationalRelease;
const readinessDeployed = readinessBaseline.deployedNoCostFoundation;
const readinessContinuity = readinessBaseline.continuityRelease;
if (
  readinessBaseline.recordKind !== "production_readiness_checkpoint" ||
  !readinessBaseline.operationalAuthority.includes("Supabase") ||
  readinessOperational.pullRequest !== expectedRelease.pullRequest ||
  readinessOperational.reviewedHead !== expectedRelease.reviewedHead ||
  readinessOperational.mergedOperationalCommit !== expectedRelease.mergedOperationalCommit ||
  readinessOperational.sitesCheckoutSourceCommit !== expectedRelease.sitesCheckoutSourceCommit ||
  readinessOperational.sitesVersion !== expectedRelease.sitesVersion ||
  readinessOperational.productionMigrations !== expectedRelease.productionMigrations ||
  !readinessOperational.databaseVerified ||
  !readinessOperational.customDomainsVerified ||
  readinessDeployed.releaseState !== "merged_applied_published_verified" ||
  !readinessDeployed.forwardMigrationApplied ||
  !readinessDeployed.forwardMigrationVerified ||
  readinessDeployed.momoClientIdentityProvisioned ||
  readinessDeployed.ownerConfirmedBusinessTruthVerified ||
  readinessDeployed.permissionedMediaVerified ||
  readinessDeployed.externalProvidersConnected ||
  readinessDeployed.externalPublishingVerified ||
  readinessDeployed.activationExecuted ||
  readinessContinuity.pullRequest !== 144 ||
  readinessContinuity.requiredFinalSitesVersion !== 10 ||
  !readinessContinuity.deployableSitesSourceChanged ||
  readinessContinuity.operationalBehaviorChanged ||
  !readinessContinuity.databaseSourceChanged ||
  readinessContinuity.databaseSchemaChanged ||
  readinessContinuity.migrationContentChanged ||
  readinessContinuity.migrationCountChanged ||
  !readinessContinuity.migrationLedgerReconciled ||
  readinessContinuity.databaseSourceChangeReason !== "remote_migration_version_filename_reconciliation_only" ||
  readinessContinuity.reconciledMigrationVersion !== "20260713191147" ||
  readinessContinuity.reconciledMigrationSha256 !== "07cdb0a41b3d81e23e2c9432b139ae219c2b4671fed7cd18f761d4c4d6a79f2a" ||
  readinessContinuity.selfCommitEmbedded ||
  /\b[0-9a-f]{40}\b/i.test(JSON.stringify(readinessContinuity))
) {
  throw new Error("Momo readiness evidence is not reconciled to the PR #143 operational foundation and PR #144 / Sites version 10 continuity target");
}
if (
  !auth.includes("shouldCreateUser: false") ||
  !auth.includes("signInWithPassword") ||
  !auth.includes("updateUser({ password })") ||
  /resetPasswordForEmail|\.auth\.signUp/.test(auth) ||
  !auth.includes('await client.auth.signOut({ scope: "local" }).catch')
) {
  throw new Error("RR checkpoint approved-user password/email-link boundary is incomplete or public signup/recovery drifted");
}
if (
  !password.includes("api.pwnedpasswords.com/range/${prefix}") ||
  !password.includes('"Add-Padding": "true"') ||
  !password.includes("fullHash.slice(0, 5)")
) {
  throw new Error("RR checkpoint Free-plan leaked-password defense-in-depth boundary is incomplete");
}
if (
  !route.includes('const protectedAccount = initialPath === "/account/security"') ||
  !route.includes("getServerVeroxaAccess()")
) {
  throw new Error("RR checkpoint account-security route is not server protected");
}
for (const marker of [
  "Momo's House San Antonio is Veroxa's only operational client",
  "Restaurant Audit Center",
  "does not become an operational client",
]) {
  if (!milestone.includes(marker)) throw new Error(`RR checkpoint scope marker missing: ${marker}`);
}

for (const [name, group] of Object.entries(checkpoint.boundaryGroups)) {
  if (!group.files.length || !group.review) throw new Error(`RR checkpoint group is incomplete: ${name}`);
  if (group.sha256 === "pending") {
    throw new Error(`RR checkpoint fingerprint is pending: ${name}`);
  }
  const actual = groupHash(group.files);
  if (actual !== group.sha256) {
    throw new Error(`RR checkpoint boundary changed; route an exact delta review for: ${name}`);
  }
}

console.log("RR release checkpoint guardrail passed.");
