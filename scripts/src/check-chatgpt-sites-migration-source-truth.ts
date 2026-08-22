import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  INTERNAL_AI_RELEASE_EVIDENCE,
  MEDIA_UPLOAD_HANDOFF_EVIDENCE,
  REPAIR_MIGRATION_EVIDENCE,
  assertReviewedLocalCandidateManifest,
  hasActiveMediaInspectionForwardCandidate,
  readDeploymentManifest,
  repoRoot,
} from "./release-manifest";

const failures: string[] = [];
const must = (condition: boolean, message: string): void => {
  if (!condition) failures.push(message);
};
const read = (relativePath: string): string =>
  readFileSync(resolve(repoRoot, relativePath), "utf8");
const manifest = readDeploymentManifest();
const activeForwardCandidate = hasActiveMediaInspectionForwardCandidate();
const currentState = JSON.parse(
  read("artifacts/veroxa/docs/CURRENT_STATE.json"),
) as Record<string, any>;
const reconciledLiveStatus =
  currentState.phase === "r3_release_converged_authenticated_proof_pending" &&
  currentState.activeCandidate?.kind ===
    "ver43_hosted_signature_envelope_release" &&
  currentState.activeCandidate?.state ===
    "release_converged_authenticated_proof_pending" &&
  !activeForwardCandidate;
try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (reconciledLiveStatus) {
  const currentAuthorityDocs = [
    "AGENTS.md",
    "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
    "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  ];
  const requiredCurrentMarkers = [
    "c47920dce981478d757a3cc89ef9f337c39908ef",
    "Sites v68",
    "60",
    "VER-43",
    "VER-39",
    "VER-26",
    "VER-27",
    "VER-28",
    "Supabase Pro",
  ];
  for (const path of currentAuthorityDocs) {
    const text = read(path);
    must(!/^(<<<<<<<|=======|>>>>>>>)/mu.test(text),
      path + " contains merge markers.");
    const headings = text.match(/^## .*?\(current authority\)$/gmu) ?? [];
    must(headings.length === 1,
      path + " must contain exactly one current-authority heading.");
    const currentHeading = headings[0] ?? "";
    const start = headings.length === 1 ? text.indexOf(currentHeading) : -1;
    const next = start < 0
      ? -1
      : text.indexOf("\n## ", start + currentHeading.length);
    const current = start < 0 ? "" : text.slice(start, next < 0 ? undefined : next);
    for (const marker of requiredCurrentMarkers) {
      must(current.includes(marker),
        path + " is missing reconciled authority marker: " + marker);
    }
    must(/no Momo(?:\s+or\s+|\/)\s*founder\s+GO/iu.test(current),
      path + " does not explicitly preserve the no-GO boundary.");
  }

  const milestone = read("artifacts/veroxa/docs/CURRENT_MILESTONE.md");
  for (const marker of [
    "Current Milestone — R3 Authenticated Acceptance Proof",
    "NOT READY",
    "appgdep_6a894fe379108191a767de502d56d5bd",
    "45ad07a3-0192-452b-8a01-5d5bf8528ced",
    "momoGo=false",
    "VEROXA_LIVE_STATUS_CLOSEOUT_20260822.json",
  ]) must(milestone.includes(marker),
    "CURRENT_MILESTONE.md is missing marker: " + marker);

  const capacity = read(
    "artifacts/veroxa/docs/SUPABASE_PRO_CAPACITY_AND_WORKFLOW_DIRECTION.md",
  );
  for (const marker of [
    "governed capacity",
    "Spend Cap configuration",
    "unverified",
    "Release exact reviewed bytes",
    "Copilot alone reviews",
  ]) must(capacity.includes(marker),
    "Supabase Pro authority is missing marker: " + marker);

  const closeout = JSON.parse(read(
    "artifacts/veroxa/docs/VEROXA_LIVE_STATUS_CLOSEOUT_20260822.json",
  )) as Record<string, any>;
  must(
    closeout.recordKind === "veroxa_live_status_closeout" &&
      closeout.status === "release_converged_authenticated_proof_pending" &&
      closeout.github?.observedMainCommit ===
        "c47920dce981478d757a3cc89ef9f337c39908ef" &&
      closeout.github?.pullRequest205?.requiredWorkflows?.ci === "success" &&
      closeout.github?.pullRequest205?.requiredWorkflows?.veroxaVerify === "success" &&
      closeout.github?.pullRequest205?.requiredWorkflows?.sitesVerify === "success" &&
      closeout.github?.pullRequest205?.requiredWorkflows?.supabaseVerify === "success" &&
      closeout.github?.pullRequest205?.review?.owner === "copilot" &&
      closeout.github?.pullRequest205?.review?.codexDuplicateReviewPerformed === false &&
      closeout.github?.pullRequest205?.review?.reReviewNewFindingCount === 0 &&
      closeout.github?.pullRequest205?.review?.unresolvedThreadCount === 0 &&
      closeout.sites?.version === 68 &&
      closeout.sites?.deploymentId ===
        "appgdep_6a894fe379108191a767de502d56d5bd" &&
      closeout.sites?.runtimeSubtree?.matchesObservedGitHubMain === true &&
      closeout.supabase?.migrations?.count === 60 &&
      closeout.supabase?.externalActionLocks?.connectedProviderRows === 0 &&
      closeout.supabase?.externalActionLocks?.publishQueueRows === 0 &&
      closeout.supabase?.externalActionLocks?.publishAttemptRows === 0 &&
      closeout.supabase?.acceptance?.scopeRows === 1 &&
      closeout.supabase?.acceptance?.customerVisibleRows === 0 &&
      closeout.supabase?.acceptance?.includedInReportRows === 0 &&
      closeout.supabase?.acceptance?.uploadSessionRows === 4 &&
      closeout.supabase?.acceptance?.initiatedSessionRows === 1 &&
      closeout.supabase?.acceptance?.expiredSessionRows === 3 &&
      closeout.supabase?.acceptance?.registeredSessionRows === 0 &&
      closeout.supabase?.acceptance?.assetRows === 0 &&
      closeout.supabase?.acceptance?.packageRows === 0 &&
      closeout.supabase?.acceptance?.providerConnectionRows === 0 &&
      closeout.supabase?.acceptanceSessionBlocker?.requiredRecovery ===
        "fresh_explicit_one_shot_authorization_then_one_short_lived_least_privileged_synthetic_client_proof" &&
      closeout.supabase?.privateSchemaDefenseInDepth?.tableCount === 26 &&
      closeout.supabase?.privateSchemaDefenseInDepth?.tablesWithoutRls === 6 &&
      closeout.supabase?.privateSchemaDefenseInDepth?.publicAnonAuthenticatedTableGrantCount === 0 &&
      closeout.supabase?.privateSchemaDefenseInDepth?.publicAnonAuthenticatedSchemaGrantCount === 0 &&
      closeout.supabase?.privateSchemaDefenseInDepth?.confirmedPublicExposure === false &&
      closeout.edge?.allActiveFunctionBundleSourcesMatchObservedGitHubMain === true &&
      closeout.edge?.functions?.find?.(
        (item: Record<string, any>) => item.slug === "momo-content-ai-lifecycle",
      )?.version === 15 &&
      closeout.edge?.proofEvidence?.lastInvocationVersion === 14 &&
      closeout.edge?.proofEvidence?.lastInvocationStatus === 403 &&
      closeout.edge?.proofEvidence?.version15InvocationCount === 0 &&
      closeout.edge?.proofEvidence?.proofConsumed === false &&
      closeout.supabase?.externalActionLocks?.status === "closed" &&
      closeout.r3Program?.ver43?.status === "In Progress" &&
      closeout.r3Program?.ver39?.status === "In Progress" &&
      closeout.r3Program?.ver41?.status === "Todo" &&
      closeout.r3Program?.syntheticGate?.status === "In Progress" &&
      closeout.r3Program?.syntheticGate?.complete === false &&
      closeout.r3Program?.authenticatedPortalGate?.status === "Todo" &&
      closeout.r3Program?.authenticatedPortalGate?.complete === false &&
      closeout.r3Program?.founderGate?.status === "Todo" &&
      closeout.r3Program?.founderGate?.complete === false &&
      closeout.r3Program?.founderGate?.momoGo === false &&
      closeout.productBoundary?.runtimeOrPlatformMutationPerformed === true &&
      closeout.productBoundary?.secondAuthenticationProofPerformed === false &&
      closeout.productBoundary?.realMomoMediaTouched === false,
    "live-status closeout is incomplete, stale, or overclaims an acceptance gate",
  );
  must(
    currentState.currentStatusCloseout ===
        "artifacts/veroxa/docs/VEROXA_LIVE_STATUS_CLOSEOUT_20260822.json" &&
      currentState.updatedAt === closeout.observedAt &&
      currentState.production?.github?.observedMainCommit ===
        closeout.github?.observedMainCommit &&
      currentState.production?.sites?.runtimeSubtreeSha256 ===
        closeout.sites?.runtimeSubtree?.sha256 &&
      currentState.production?.supabase?.migrationTreeSha256 ===
        closeout.supabase?.migrations?.treeSha256 &&
      currentState.production?.supabase?.privateSchemaTableCount ===
        closeout.supabase?.privateSchemaDefenseInDepth?.tableCount &&
      currentState.production?.supabase?.privateSchemaTablesWithoutRls ===
        closeout.supabase?.privateSchemaDefenseInDepth?.tablesWithoutRls &&
      currentState.production?.supabase?.publicAnonAuthenticatedPrivateSchemaGrants === 0 &&
      closeout.supabase?.privateSchemaDefenseInDepth?.publicAnonAuthenticatedTableGrantCount === 0 &&
      closeout.supabase?.privateSchemaDefenseInDepth?.publicAnonAuthenticatedSchemaGrantCount === 0 &&
      currentState.production?.edge?.contentLifecycleVersion === 15 &&
      currentState.production?.edge?.contentLifecycleV15ProofInvocationCount === 0 &&
      currentState.acceptanceBlocker?.lastProofEdgeVersion ===
        closeout.edge?.proofEvidence?.lastInvocationVersion &&
      currentState.acceptanceBlocker?.lastProofHttpStatus ===
        closeout.edge?.proofEvidence?.lastInvocationStatus &&
      currentState.acceptanceBlocker?.proofState === "unconsumed" &&
      currentState.acceptanceBlocker?.nextSafeStep ===
        "fresh_explicit_one_shot_authorization_then_one_short_lived_least_privileged_synthetic_client_proof" &&
      currentState.activeCandidate?.requiredGates?.syntheticSuccessPassed === false &&
      currentState.activeCandidate?.requiredGates?.restaurantPortalVerified === false &&
      currentState.activeCandidate?.requiredGates?.founderGoIssued === false,
    "CURRENT_STATE does not match the reconciled closeout or preserves no-GO incompletely",
  );

  if (failures.length > 0) {
    for (const failure of failures) console.error("FAIL:", failure);
    process.exit(1);
  }
  console.log(
    "PASS: current Veroxa status, Sites/Supabase/Edge parity, incomplete R3 gates, and governed Supabase Pro capacity are aligned.",
  );
  process.exit(0);
}


if (activeForwardCandidate) {
  const authorityDocs = [
    "AGENTS.md",
    "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
    "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
    "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
    "artifacts/veroxa/docs/README_CURRENT_STATE.md",
    "artifacts/veroxa/docs/RR_CHECKPOINT.md",
    "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
    "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  ];
  const requiredCurrentMarkers = [
    "artifacts/veroxa/docs/CURRENT_MILESTONE.md",
    "a05e7a79b2c527ff93a4c3810afc6ada193fce6c",
    "PR #193 is the current candidate only",
    "PR #187 remains deferred and unmerged",
    "Sites v59",
    "saved v60 is not deployment proof",
    "59 observed migrations",
    "05ab2303-f7ea-4056-8f75-9cd7e523a4f4",
    "zero retries",
    "ready_for_team_review",
    "free founding pilot",
    "remain fail-closed",
  ];
  for (const path of authorityDocs) {
    const text = read(path);
    must(!/^(<<<<<<<|=======|>>>>>>>)/mu.test(text), path + " contains merge markers.");
    const headings = text.match(/^## .*?\(current authority\)$/gmu) ?? [];
    must(headings.length === 1, path + " must contain exactly one current-authority heading.");
    const heading = text.match(/^## .*?\(current authority\)$/mu);
    const start = heading?.index ?? -1;
    const next = start < 0 ? -1 : text.indexOf(
      "\n## ", start + (heading?.[0].length ?? 0),
    );
    const current = start < 0 ? "" : text.slice(start, next < 0 ? undefined : next);
    for (const marker of requiredCurrentMarkers) {
      must(current.includes(marker), path + " is missing R3 authority marker: " + marker);
    }
  }
  const milestone = read("artifacts/veroxa/docs/CURRENT_MILESTONE.md");
  must(!/^(<<<<<<<|=======|>>>>>>>)/mu.test(milestone),
    "CURRENT_MILESTONE.md contains merge markers.");
  for (const marker of [
    "Current Milestone — R3 Pre-Intervention Readiness",
    "controlling written R3 authority",
    "VER-20",
    "VER-28",
    "PR #193",
    "zero retries",
    "ready_for_team_review",
    "free founding pilot",
  ]) {
    must(milestone.includes(marker), "CURRENT_MILESTONE.md is missing R3 marker: " + marker);
  }
  if (failures.length > 0) {
    for (const failure of failures) console.error("FAIL:", failure);
    process.exit(1);
  }
  console.log(
    "PASS: the R3 authority chain and designated CURRENT_STATE consistently describe the guarded forward candidate.",
  );
  process.exit(0);
}

if (manifest.schemaVersion === 13) {
  const authorityDocs = [
    "AGENTS.md",
    "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
    "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
    "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
    "artifacts/veroxa/docs/README_CURRENT_STATE.md",
    "artifacts/veroxa/docs/RR_CHECKPOINT.md",
    "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
    "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  ];
  for (const path of authorityDocs) {
    const text = read(path);
    must(!/^(<<<<<<<|=======|>>>>>>>)/mu.test(text), path + " contains merge markers.");
    const headings = text.match(/^## .*?\(current authority\)$/gmu) ?? [];
    must(headings.length === 1, path + " must contain exactly one current-authority heading.");
    const heading = text.match(/^## .*?\(current authority\)$/mu);
    const start = heading?.index ?? -1;
    const next = start < 0 ? -1 : text.indexOf("\n## ", start + (heading?.[0].length ?? 0));
    const current = start < 0 ? "" : text.slice(start, next < 0 ? undefined : next);
    for (const marker of [
      "GUARDED_INTERNAL_AI_ROLLOUT_AUTHORITY",
      "private media-recovery host-inspection diagnostic closeout",
      "77dadd67505642353b431db3802d2ec365966869",
      "PR #185",
      "20260813175640_durable_media_ingestion_path_regex_repair_v1.sql",
      "Sites v56",
      "database58",
      "environment revision 22",
      "479/479",
      "05ab2303-f7ea-4056-8f75-9cd7e523a4f4",
      "request `297`",
      "media_not_assessable",
      "dead_letter",
      "remain preserved and unchanged",
      "images_binding_unavailable",
      "bindingAvailable=false",
      "does not make the asset Ready",
      "No retry remains authorized",
      "External providers",
      "USD 0 incremental spend",
    ]) {
      const haystack = marker === "GUARDED_INTERNAL_AI_ROLLOUT_AUTHORITY" ? text : current;
      must(haystack.includes(marker), path + " is missing schema-13 authority marker: " + marker);
    }
  }
  if (failures.length > 0) {
    for (const failure of failures) console.error("FAIL:", failure);
    process.exit(1);
  }
  console.log(
    "PASS: schema-13 authority docs describe the exact Sites v56 diagnostic closeout and the failed third attempt without recovery overclaims.",
  );
  process.exit(0);
}

if (manifest.schemaVersion === 11) {
  const authorityDocs = [
    "AGENTS.md",
    "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
    "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
    "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
    "artifacts/veroxa/docs/README_CURRENT_STATE.md",
    "artifacts/veroxa/docs/RR_CHECKPOINT.md",
    "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
    "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  ];
  for (const path of authorityDocs) {
    const text = read(path);
    must(
      !/^(<<<<<<<|=======|>>>>>>>)/mu.test(text),
      path + " contains merge markers.",
    );
    const headings = text.match(/^## .*?\(current authority\)$/gmu) ?? [];
    must(
      headings.length === 1,
      path + " must contain exactly one current-authority heading.",
    );
    const heading = text.match(/^## .*?\(current authority\)$/mu);
    const start = heading?.index ?? -1;
    const next =
      start < 0
        ? -1
        : text.indexOf("\n## ", start + (heading?.[0].length ?? 0));
    const current =
      start < 0 ? "" : text.slice(start, next < 0 ? undefined : next);
    for (const marker of [
      "GUARDED_INTERNAL_AI_ROLLOUT_AUTHORITY",
      "Sites v53",
      "live56",
      "20260812214257_high_resolution_private_media_v1.sql",
      "20260812221509_restore_high_resolution_media_finalize_service_role_v1.sql",
      "16,777,216",
      "total-pixel ceiling and hidden 128 MiB PNG decoded-stream ceiling are removed",
      "remaining media=0",
      "remaining storage objects=0",
      "content lifecycle v11",
      "no real new-user upload",
      "External providers",
      "USD 0 incremental spend",
      "443/443",
      "appgver_6e36025a6f248191a047d9bbdd04d90a",
      "f21cd4e9b99d601d8e3df9b221e14b513a8ac2d6",
      "temporary purge endpoint is inert",
    ]) {
      const haystack =
        marker === "GUARDED_INTERNAL_AI_ROLLOUT_AUTHORITY" ? text : current;
      must(
        haystack.includes(marker),
        path + " is missing schema-11 authority marker: " + marker,
      );
    }
  }
  if (failures.length > 0) {
    for (const failure of failures) console.error("FAIL:", failure);
    process.exit(1);
  }
  console.log(
    "PASS: schema-11 authority docs match the live56 Sites v53 high-resolution release.",
  );
  process.exit(0);
}

const repairCloseout = manifest.generatedVersionCloseouts?.repair as
  | Record<string, unknown>
  | undefined;
const mediaUploadHandoff = manifest.mediaUploadHandoff as
  | Record<string, unknown>
  | undefined;
must(
  mediaUploadHandoff?.latestMigration ===
      manifest.currentProductionObservation.latestProductionMigration &&
    mediaUploadHandoff.latestMigration ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.latestMigration,
  "Latest source migration is not explained by live or pending evidence.",
);
must(
  repairCloseout?.actualLedgerFilename === REPAIR_MIGRATION_EVIDENCE.filename &&
    repairCloseout.unchangedBytesVerified === true,
  "Repair generated-version identity or byte evidence is incomplete.",
);

const authorityDocs = [
  "AGENTS.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
  "artifacts/veroxa/docs/RR_CHECKPOINT.md",
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
];
for (const path of authorityDocs) {
  const text = read(path);
  must(!/^(<<<<<<<|=======|>>>>>>>)/mu.test(text), `${path} contains merge markers.`);
  must(
    (text.match(/^## .*\(current authority\)$/gmu) ?? []).length === 1,
    `${path} must contain exactly one current-authority heading.`,
  );
  const currentHeading = text.match(/^## .*\(current authority\)$/mu);
  const currentStart = currentHeading?.index ?? -1;
  const nextHeading =
    currentStart < 0
      ? -1
      : text.indexOf("\n## ", currentStart + (currentHeading?.[0].length ?? 0));
  const currentAuthority =
    currentStart < 0
      ? ""
      : text.slice(currentStart, nextHeading < 0 ? undefined : nextHeading);
  for (const marker of [
    "GUARDED_INTERNAL_AI_ROLLOUT_AUTHORITY",
    manifest.currentProductionObservation.canonicalGitHubMainCommit,
    `Sites v${manifest.currentProductionObservation.sitesVersion}`,
    `live${manifest.currentProductionObservation.productionMigrationCount}`,
    manifest.currentProductionObservation.latestProductionMigration,
    manifest.source.treeSha256,
    INTERNAL_AI_RELEASE_EVIDENCE.sitesVersionId,
    INTERNAL_AI_RELEASE_EVIDENCE.sitesSourceCommit,
    INTERNAL_AI_RELEASE_EVIDENCE.sitesArchiveSha256,
    INTERNAL_AI_RELEASE_EVIDENCE.edgeBundleSha256,
    INTERNAL_AI_RELEASE_EVIDENCE.invokedAt,
    INTERNAL_AI_RELEASE_EVIDENCE.activationAuditEventId,
    "ai_live_calls=true",
    "13 authenticated",
    "32 service-role",
    "14 functions still held",
    "one active Team profile",
    "one active Momo membership",
    "2 upload-status rows all external-locked",
    "rollout authorization is consumed",
    "no Sites v42",
    "External providers",
    "USD 0 incremental spend",
    "clientActionAfterUpload=none",
    "processingOwner=veroxa_team",
    "authenticated v2 execute is revoked",
    "Team-only saved-instruction processor",
    "3 open Team media-intake exceptions",
    "no re-upload or retry",
  ]) {
    const haystack =
      marker === "GUARDED_INTERNAL_AI_ROLLOUT_AUTHORITY" ? text : currentAuthority;
    must(
      haystack.includes(marker),
      `${path} is missing current authority marker: ${marker}`,
    );
  }
  must(
    !/gate-ready but uninvoked|invoke the dormant routine|no .*activation execution|ai_live_calls=false/iu.test(
      currentAuthority,
    ),
    `${path} current authority contradicts the completed activation.`,
  );
}

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log("PASS: authority docs match the guarded rollout source truth.");
}
