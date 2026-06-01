/**
 * devWriteSmokeTests.ts — M024B
 *
 * Internal-only dev write smoke test runner.
 *
 * Rules:
 *   - NEVER runs automatically.
 *   - Requires an explicit page button click to invoke.
 *   - Requires an explicit `clientId` (dev-created fictional UUID).
 *   - Requires WRITES_ENABLED === true (exact dev write flag, second safety flag, and non-production mode).
 *   - Metadata writes only — no storage, no files, no service role.
 *   - Fictional data only — no real restaurant names.
 *   - Raw errors never returned to UI.
 */

import { veroxaWriteAdapter } from "./writeAdapter";
import { WRITES_ENABLED } from "./writeReadiness";
import { normalizeDevClientId } from "./devClientIdValidation";
import {
  createDevSmokeTestDirectionInput,
  createDevSmokeTestReviewDecisionInput,
  createDevSmokeTestUploadInput,
} from "./devWriteSmokeTestData";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  SchemaSmokeTestResult,
  SchemaSmokeTestStep,
} from "./schemaVerificationTypes";

export interface DevWriteSmokeTestOptions {
  clientId?: string;
  dryRun?: boolean;
}

export interface DevWriteSmokeTestReadiness {
  writesEnabled: boolean;
  clientConfigured: boolean;
  safeMessage: string;
  canRun: boolean;
}

export function getDevWriteSmokeTestReadiness(): DevWriteSmokeTestReadiness {
  const writesEnabled = WRITES_ENABLED;
  const clientConfigured = getSupabaseClient() !== null;

  if (!writesEnabled) {
    return {
      writesEnabled,
      clientConfigured,
      canRun: false,
      safeMessage:
        'Writes are disabled. Set VITE_VEROXA_ENABLE_DEV_WRITES="true" and VITE_VEROXA_DEV_WRITE_ENV="dev" in non-production dev only.',
    };
  }
  if (!clientConfigured) {
    return {
      writesEnabled,
      clientConfigured,
      canRun: false,
      safeMessage:
        "Supabase client not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    };
  }
  return {
    writesEnabled,
    clientConfigured,
    canRun: true,
    safeMessage: "Dev write adapter is ready. Provide a dev client UUID to run.",
  };
}

export async function runDevWriteSmokeTests(
  options: DevWriteSmokeTestOptions = {},
): Promise<SchemaSmokeTestResult> {
  const ranAt = new Date().toISOString();
  const steps: SchemaSmokeTestStep[] = [];

  function step(
    name: string,
    status: SchemaSmokeTestStep["status"],
    safeMessage: string,
  ): void {
    steps.push({ name, status, safeMessage });
  }

  // Step 1 — write mode check
  if (!WRITES_ENABLED) {
    step(
      "Write mode check",
      "skipped",
      'Writes are disabled. Set VITE_VEROXA_ENABLE_DEV_WRITES="true" and VITE_VEROXA_DEV_WRITE_ENV="dev" in non-production dev only.',
    );
    return {
      ok: false,
      status: "skipped",
      safeMessage:
        'Writes are disabled. Set VITE_VEROXA_ENABLE_DEV_WRITES="true" and VITE_VEROXA_DEV_WRITE_ENV="dev" in non-production dev only.',
      ranAt,
      steps,
    };
  }
  step("Write mode check", "passed", "Write mode is dev_supabase_writes.");

  // Step 2 — Supabase client
  if (!getSupabaseClient()) {
    step(
      "Supabase client check",
      "failed",
      "Supabase client not configured. Cannot run smoke tests.",
    );
    return {
      ok: false,
      status: "failed",
      safeMessage: "Supabase client not configured.",
      ranAt,
      steps,
    };
  }
  step("Supabase client check", "passed", "Supabase client is available.");

  // Step 3 — client UUID
  const clientId = normalizeDevClientId(options.clientId);
  if (!clientId) {
    step(
      "Dev client UUID",
      "skipped",
      "A dev client UUID is required before metadata write smoke tests can run.",
    );
    return {
      ok: false,
      status: "partial",
      safeMessage:
        "A dev client UUID is required before metadata write smoke tests can run.",
      ranAt,
      steps,
    };
  }
  step("Dev client UUID", "passed", "Client UUID provided and valid.");

  // Dry run — report what would be tested without calling adapter
  if (options.dryRun) {
    step(
      "createUploadSubmission",
      "dry_run",
      "Would insert fictional upload submission for dev client.",
    );
    step(
      "createDirectionRequest",
      "dry_run",
      "Would insert fictional direction request for dev client.",
    );
    step(
      "createTeamReviewDecision",
      "dry_run",
      "Would insert fictional team review decision for dev client.",
    );
    step(
      "updateUploadReviewStatus",
      "dry_run",
      "Would update upload submission status to in_review.",
    );
    step(
      "updateDirectionStatus",
      "dry_run",
      "Would update direction request status to interpreted.",
    );
    return {
      ok: true,
      status: "dry_run",
      safeMessage:
        "Dry run complete — no writes performed. Remove dryRun:true to execute.",
      ranAt,
      steps,
    };
  }

  // Step 4 — createUploadSubmission
  const uploadInput = createDevSmokeTestUploadInput(clientId);
  const uploadResult = await veroxaWriteAdapter.createUploadSubmission(uploadInput);
  if (!uploadResult.ok) {
    const msg =
      uploadResult.status === "failure" ? uploadResult.safeMessage : uploadResult.safeMessage;
    step("createUploadSubmission", "failed", msg);
    return {
      ok: false,
      status: "failed",
      safeMessage: `createUploadSubmission failed: ${msg}`,
      ranAt,
      steps,
    };
  }
  const uploadId = uploadResult.data.id;
  step("createUploadSubmission", "passed", `Upload submission created (id: ${uploadId}).`);

  // Step 5 — createDirectionRequest
  const directionInput = createDevSmokeTestDirectionInput(clientId);
  const directionResult =
    await veroxaWriteAdapter.createDirectionRequest(directionInput);
  if (!directionResult.ok) {
    step(
      "createDirectionRequest",
      "failed",
      directionResult.status === "failure"
        ? directionResult.safeMessage
        : directionResult.safeMessage,
    );
    return {
      ok: false,
      status: "partial",
      safeMessage: "createDirectionRequest failed after upload succeeded.",
      ranAt,
      steps,
    };
  }
  const directionId = directionResult.data.id;
  step("createDirectionRequest", "passed", `Direction request created (id: ${directionId}).`);

  // Step 6 — createTeamReviewDecision
  const reviewInput = createDevSmokeTestReviewDecisionInput(
    clientId,
    uploadId,
    "upload_submission",
  );
  const reviewResult =
    await veroxaWriteAdapter.createTeamReviewDecision(reviewInput);
  if (!reviewResult.ok) {
    step(
      "createTeamReviewDecision",
      "failed",
      reviewResult.status === "failure"
        ? reviewResult.safeMessage
        : reviewResult.safeMessage,
    );
  } else {
    step(
      "createTeamReviewDecision",
      "passed",
      `Team review decision created (id: ${reviewResult.data.id}).`,
    );
  }

  // Step 7 — updateUploadReviewStatus
  const uploadUpdateResult = await veroxaWriteAdapter.updateUploadReviewStatus({
    submissionId: uploadId,
    nextStatus: "in_review",
    internalNote: "Smoke test status update.",
  });
  if (!uploadUpdateResult.ok) {
    step(
      "updateUploadReviewStatus",
      "failed",
      uploadUpdateResult.status === "failure"
        ? uploadUpdateResult.safeMessage
        : uploadUpdateResult.safeMessage,
    );
  } else {
    step("updateUploadReviewStatus", "passed", "Upload status updated to in_review.");
  }

  // Step 8 — updateDirectionStatus
  const directionUpdateResult = await veroxaWriteAdapter.updateDirectionStatus({
    directionId,
    nextStatus: "interpreted",
    internalNote: "Smoke test direction status update.",
  });
  if (!directionUpdateResult.ok) {
    step(
      "updateDirectionStatus",
      "failed",
      directionUpdateResult.status === "failure"
        ? directionUpdateResult.safeMessage
        : directionUpdateResult.safeMessage,
    );
  } else {
    step("updateDirectionStatus", "passed", "Direction status updated to interpreted.");
  }

  const failed = steps.filter((s) => s.status === "failed").length;
  const allPassed = steps.every(
    (s) => s.status === "passed" || s.status === "dry_run",
  );

  return {
    ok: failed === 0,
    status: allPassed ? "passed" : failed > 0 ? "partial" : "passed",
    safeMessage: allPassed
      ? "All smoke test steps passed."
      : `${failed} step(s) failed. Check results.`,
    ranAt,
    steps,
  };
}
