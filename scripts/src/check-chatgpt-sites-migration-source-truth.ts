import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  INTERNAL_AI_RELEASE_EVIDENCE,
  MEDIA_UPLOAD_HANDOFF_EVIDENCE,
  REPAIR_MIGRATION_EVIDENCE,
  assertReviewedLocalCandidateManifest,
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
try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}


if (manifest.schemaVersion === 11) {
  for (const path of [
    "AGENTS.md","artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md","artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md","artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md","artifacts/veroxa/docs/README_CURRENT_STATE.md","artifacts/veroxa/docs/RR_CHECKPOINT.md","artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md","artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  ]) {
    const text = read(path);
    must(!/^(<<<<<<<|=======|>>>>>>>)/mu.test(text), path + " contains merge markers.");
    const heading = text.match(/^## .*?\(current authority\)$/mu);
    must(heading !== null, path + " is missing a current-authority heading.");
    const start = heading?.index ?? -1;
    const next = start < 0 ? -1 : text.indexOf("\n## ", start + (heading?.[0].length ?? 0));
    const current = start < 0 ? "" : text.slice(start, next < 0 ? undefined : next);
    for (const marker of ["GUARDED_INTERNAL_AI_ROLLOUT_AUTHORITY","Sites v50","live54","20260812042031_momo_team_content_ai_read_grants_v1.sql","content lifecycle v11","no real new-user upload","External providers","USD 0 incremental spend","clientActionAfterUpload=none","processingOwner=veroxa_team","3 open Team media-intake exceptions","owner permission attestation"]) {
      must(current.includes(marker), path + " is missing schema-11 authority marker: " + marker);
    }
  }
  if (failures.length > 0) { for (const failure of failures) console.error("FAIL:", failure); process.exit(1); }
  console.log("PASS: schema-11 authority docs match the live54 reconciliation.");
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
