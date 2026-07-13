import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const checkpointPath = resolve(root, "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json");
const checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8")) as {
  schemaVersion: number;
  checkpoint: string;
  status: string;
  source: {
    pullRequest: number;
    reviewedHead: string;
    mergedCommit: string;
    sitesProductionVerified: boolean;
    sitesVersion: number;
    customDomainsVerified: boolean;
  };
  candidate: {
    pullRequest: number;
    branch: string;
    reviewedHead: null;
    merged: boolean;
    databaseApplied: boolean;
    databaseVerified: boolean;
    productionMigrations: number;
    sitesPublished: boolean;
    sitesProductionVerified: boolean;
    sitesVersion: null;
    momoClientIdentityProvisioned: boolean;
    ownerConfirmedBusinessTruthVerified: boolean;
    permissionedMediaVerified: boolean;
    externalProvidersConnected: boolean;
    externalPublishingVerified: boolean;
    activationExecuted: boolean;
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
  pullRequest: 142,
  reviewedHead: "26f0e2dec1a5e834f6c599fb2413bb24341c0327",
  mergedCommit: "9a905c822f084fd2df5c9a2cb87c1a8286647e59",
  sitesVersion: 8,
};
const expectedCandidate = {
  pullRequest: 143,
  branch: "agent/momo-seven-step-free-first-release",
  productionMigrations: 8,
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

if (checkpoint.schemaVersion !== 1 || checkpoint.status !== "candidate") {
  throw new Error("RR checkpoint schema/status is invalid");
}
if (checkpoint.checkpoint !== "momo-zero-cost-operating-rehearsal-v1-candidate") {
  throw new Error("RR checkpoint must record the exact PR #143 pre-production candidate");
}
if (
  checkpoint.source.pullRequest !== expectedRelease.pullRequest ||
  checkpoint.source.reviewedHead !== expectedRelease.reviewedHead ||
  checkpoint.source.mergedCommit !== expectedRelease.mergedCommit ||
  checkpoint.source.sitesVersion !== expectedRelease.sitesVersion ||
  !checkpoint.source.sitesProductionVerified ||
  !checkpoint.source.customDomainsVerified
) {
  throw new Error("RR checkpoint source does not match the verified PR #142 / Sites version 8 baseline");
}
const candidate = checkpoint.candidate;
if (
  candidate.pullRequest !== expectedCandidate.pullRequest ||
  candidate.branch !== expectedCandidate.branch ||
  candidate.reviewedHead !== null ||
  candidate.merged ||
  candidate.databaseApplied ||
  candidate.databaseVerified ||
  candidate.productionMigrations !== expectedCandidate.productionMigrations ||
  candidate.sitesPublished ||
  candidate.sitesProductionVerified ||
  candidate.sitesVersion !== null ||
  candidate.momoClientIdentityProvisioned ||
  candidate.ownerConfirmedBusinessTruthVerified ||
  candidate.permissionedMediaVerified ||
  candidate.externalProvidersConnected ||
  candidate.externalPublishingVerified ||
  candidate.activationExecuted
) {
  throw new Error("RR candidate overstates review, merge, migration, Sites, identity, owner data, providers, publishing, or activation");
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
  checkpoint.scope.otherRestaurantCapability !== "Restaurant Audit Center only" ||
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
  lastVerifiedRelease: { mainCommit: string; sitesVersion: number; productionMigrations: number };
  currentBranchCandidate: {
    releaseState: string;
    productionBaselineUnchanged: boolean;
    candidateSourceMigrations: number;
    productionMigrations: number;
    pendingForwardMigrationApplied: boolean;
    pendingForwardMigrationVerified: boolean;
    sitesCandidatePublished: boolean;
    momoClientIdentityProvisioned: boolean;
    ownerConfirmedBusinessTruthVerified: boolean;
    permissionedMediaVerified: boolean;
    externalProvidersConnected: boolean;
    externalPublishingVerified: boolean;
    activationExecuted: boolean;
  };
};

for (const { file, currentText } of releaseDocuments) {
  for (const marker of [
    "PR #142",
    expectedRelease.mergedCommit,
    "Sites version 8",
    "PR #143",
    "not merged",
    "not applied",
    "not published",
  ]) {
    if (!currentText.includes(marker)) throw new Error(`${file} is missing current verified release marker: ${marker}`);
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
  if (!milestoneCurrent.includes(marker)) throw new Error(`Exact PR #143 seven-step sequence is missing: ${marker}`);
}
const currentReleaseText = releaseDocuments.map(({ currentText }) => currentText).join("\n");
for (const stale of [
  "Real Team provisioning is blocked external authority",
  "Authenticated Team and Momo browser smoke remain unverified",
  "no corresponding V1 Auth profile/membership",
]) {
  if (currentReleaseText.includes(stale)) throw new Error(`Current release docs retain superseded Team-access truth: ${stale}`);
}
const readinessCandidate = readinessBaseline.currentBranchCandidate;
if (
  readinessBaseline.recordKind !== "release_baseline_checkpoint" ||
  !readinessBaseline.operationalAuthority.includes("Supabase") ||
  readinessBaseline.lastVerifiedRelease.mainCommit !== expectedRelease.mergedCommit ||
  readinessBaseline.lastVerifiedRelease.sitesVersion !== expectedRelease.sitesVersion ||
  readinessBaseline.lastVerifiedRelease.productionMigrations !== expectedCandidate.productionMigrations ||
  readinessCandidate.releaseState !== "prepared_not_merged_not_applied_not_published" ||
  !readinessCandidate.productionBaselineUnchanged ||
  readinessCandidate.candidateSourceMigrations !== checkpoint.databaseMigrations.length ||
  readinessCandidate.productionMigrations !== expectedCandidate.productionMigrations ||
  readinessCandidate.pendingForwardMigrationApplied ||
  readinessCandidate.pendingForwardMigrationVerified ||
  readinessCandidate.sitesCandidatePublished ||
  readinessCandidate.momoClientIdentityProvisioned ||
  readinessCandidate.ownerConfirmedBusinessTruthVerified ||
  readinessCandidate.permissionedMediaVerified ||
  readinessCandidate.externalProvidersConnected ||
  readinessCandidate.externalPublishingVerified ||
  readinessCandidate.activationExecuted
) {
  throw new Error("Momo release baseline/candidate is not reconciled to the PR #142 production boundary and PR #143 source state");
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
