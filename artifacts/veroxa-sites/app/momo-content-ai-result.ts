import {
  MOMO_CONTENT_AI_LONG_CONTEXT_INPUT_TOKENS,
  MOMO_CONTENT_AI_LONG_INPUT_MICROUSD_PER_TOKEN,
  MOMO_CONTENT_AI_LONG_OUTPUT_MICROUSD_PER_TOKEN,
  MOMO_CONTENT_AI_MODEL,
  MOMO_CONTENT_AI_STANDARD_INPUT_MICROUSD_PER_TOKEN,
  MOMO_CONTENT_AI_STANDARD_OUTPUT_MICROUSD_PER_TOKEN,
  MOMO_CONTENT_AI_VALIDATOR_VERSION,
  type MomoContentAiPackageOutput,
  type MomoContentPlatform,
  type MomoContentTruthSnapshotField,
} from "./momo-content-ai-contract.ts";
import { momoCanonicalJson } from "./momo-canonical-json.ts";
import { momoBytesSha256 } from "./momo-image-bytes.ts";
import {
  buildMomoAllowedHashtags,
  buildMomoAllowedSeoPhrases,
  validateMomoContentPackage,
} from "./momo-content-package-validation.ts";

export type MomoContentAiProviderUsage = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

export type MomoContentAiResultContext = {
  runId: string;
  requestHash: string;
  targetPlatforms: MomoContentPlatform[];
  truthSnapshot: MomoContentTruthSnapshotField[];
  reservedMicrousd: number;
  providerResponseId?: string | null;
};

export type MomoContentAiAccounting = {
  accountedMicrousd: number;
  accountingBasis: "provider_usage_estimate" | "conservative_reservation";
  providerUsage: MomoContentAiProviderUsage | null;
  exceedsReservation: boolean;
};

export type MomoContentAiPreparedStage = {
  output: MomoContentAiPackageOutput;
  outputCanonical: string;
  outputSha256: string;
  validationReport: Record<string, unknown>;
  validationCanonical: string;
  validationSha256: string;
  accountedMicrousd: number;
  accountingBasis: "provider_usage_estimate" | "conservative_reservation";
  providerUsage: MomoContentAiProviderUsage | null;
  warnings: string[];
};

export type MomoContentAiQualityAssessmentEvidence = {
  subject: MomoContentAiPackageOutput["assetAssessment"]["subject"];
  visualSummary: string;
  qualityScore: number;
  qualityIssues: MomoContentAiPackageOutput["assetAssessment"]["qualityIssues"];
};

export type MomoContentAiValidationEvidenceSnapshot = {
  schemaValid: boolean;
  qualityAssessment: MomoContentAiQualityAssessmentEvidence | null;
};

export type MomoContentAiValidationFailureEvidence = {
  stage: "content_validation";
  policyVersion: typeof MOMO_CONTENT_AI_VALIDATOR_VERSION;
  blockers: string[];
  warnings: string[];
  evidenceSnapshot: MomoContentAiValidationEvidenceSnapshot;
  evidenceCanonical: string;
  evidenceSha256: string;
};

export type MomoContentAiPreparationFailure = {
  errorCode: string;
  publicCode: "content_ai_quality_gate_failed" | "content_ai_budget_contract_exceeded";
  httpStatus: 422 | 502;
  measured?: { accountedMicrousd: number; providerUsage: MomoContentAiProviderUsage };
  validationEvidence?: MomoContentAiValidationFailureEvidence;
};

const OPENAI_RESPONSE_ID = /^resp_[A-Za-z0-9_-]{8,195}$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeInteger(value: unknown): number | null {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

async function sha256Text(value: string): Promise<string> {
  return momoBytesSha256(new TextEncoder().encode(value));
}

export function momoContentAiProviderPayloadBelongsToRun(
  payload: Record<string, unknown>,
  context: Pick<MomoContentAiResultContext, "runId" | "requestHash" | "providerResponseId">,
): boolean {
  const metadata = isRecord(payload.metadata) ? payload.metadata : null;
  return payload.object === "response" &&
    typeof payload.id === "string" && OPENAI_RESPONSE_ID.test(payload.id) &&
    (!context.providerResponseId || payload.id === context.providerResponseId) &&
    payload.model === MOMO_CONTENT_AI_MODEL &&
    metadata?.veroxa_run_id === context.runId &&
    metadata.veroxa_request_hash === context.requestHash;
}

export function momoContentAiProviderOutputText(
  payload: Record<string, unknown>,
): string | null {
  if (typeof payload.output_text === "string" && payload.output_text.length <= 200_000) {
    return payload.output_text;
  }
  if (!Array.isArray(payload.output)) return null;
  for (const item of payload.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (isRecord(content) && content.type === "output_text" &&
        typeof content.text === "string" && content.text.length <= 200_000) {
        return content.text;
      }
      if (isRecord(content) && content.type === "refusal") return null;
    }
  }
  return null;
}

export function momoContentAiIncompleteReason(
  payload: Record<string, unknown>,
): string {
  const details = isRecord(payload.incomplete_details) ? payload.incomplete_details : null;
  const raw = typeof details?.reason === "string" ? details.reason.toLowerCase() : "unknown";
  const safe = raw.replace(/[^a-z0-9_]+/gu, "_").replace(/^_+|_+$/gu, "").slice(0, 40);
  return safe || "unknown";
}

export function momoContentAiProviderAccounting(
  payload: Record<string, unknown>,
  reservationMicrousd: number,
): MomoContentAiAccounting {
  const usage = isRecord(payload.usage) ? payload.usage : null;
  const input = safeInteger(usage?.input_tokens);
  const output = safeInteger(usage?.output_tokens);
  const total = safeInteger(usage?.total_tokens);
  const inputDetails = usage && Object.hasOwn(usage, "input_tokens_details")
    ? (isRecord(usage.input_tokens_details) ? usage.input_tokens_details : null)
    : undefined;
  const cachedTokens = inputDetails && Object.hasOwn(inputDetails, "cached_tokens")
    ? safeInteger(inputDetails.cached_tokens)
    : null;
  const cacheWriteTokens = inputDetails && Object.hasOwn(inputDetails, "cache_write_tokens")
    ? safeInteger(inputDetails.cache_write_tokens)
    : null;
  const cacheAccountingSafe = cachedTokens === 0 && cacheWriteTokens === 0;

  if (input !== null && output !== null && total !== null && total === input + output) {
    const longContext = input > MOMO_CONTENT_AI_LONG_CONTEXT_INPUT_TOKENS;
    const estimate = input * (longContext
      ? MOMO_CONTENT_AI_LONG_INPUT_MICROUSD_PER_TOKEN
      : MOMO_CONTENT_AI_STANDARD_INPUT_MICROUSD_PER_TOKEN) + output * (longContext
      ? MOMO_CONTENT_AI_LONG_OUTPUT_MICROUSD_PER_TOKEN
      : MOMO_CONTENT_AI_STANDARD_OUTPUT_MICROUSD_PER_TOKEN);
    if (Number.isSafeInteger(estimate) && estimate > 0 &&
      (estimate > reservationMicrousd || cacheAccountingSafe)) {
      return {
        accountedMicrousd: estimate,
        accountingBasis: "provider_usage_estimate",
        providerUsage: {
          input_tokens: input,
          output_tokens: output,
          total_tokens: total,
        },
        exceedsReservation: estimate > reservationMicrousd,
      };
    }
  }

  return {
    accountedMicrousd: reservationMicrousd,
    accountingBasis: "conservative_reservation",
    providerUsage: null,
    exceedsReservation: false,
  };
}

export async function prepareMomoContentAiCompletedResult(
  payload: Record<string, unknown>,
  context: MomoContentAiResultContext,
): Promise<
  { ok: true; staged: MomoContentAiPreparedStage } |
  { ok: false; failure: MomoContentAiPreparationFailure }
> {
  const accounting = momoContentAiProviderAccounting(payload, context.reservedMicrousd);
  const measured = accounting.providerUsage
    ? {
        accountedMicrousd: accounting.accountedMicrousd,
        providerUsage: accounting.providerUsage,
      }
    : undefined;

  if (accounting.exceedsReservation) {
    return {
      ok: false,
      failure: {
        errorCode: "provider_usage_exceeded_reservation",
        publicCode: "content_ai_budget_contract_exceeded",
        httpStatus: 502,
        measured,
      },
    };
  }

  const text = momoContentAiProviderOutputText(payload);
  let rawOutput: unknown = null;
  try {
    rawOutput = text ? JSON.parse(text) : null;
  } catch {
    rawOutput = null;
  }
  const validation = validateMomoContentPackage(rawOutput, {
    targetPlatforms: context.targetPlatforms,
    truthFields: context.truthSnapshot,
    allowedSeoPhrases: buildMomoAllowedSeoPhrases(context.truthSnapshot),
    allowedHashtags: buildMomoAllowedHashtags(context.truthSnapshot),
  });
  if (!validation.ok) {
    const blockers = [...validation.blockers].sort();
    const warnings = [...validation.warnings].sort();
    const assessment = validation.qualityAssessment;
    const evidenceSnapshot: MomoContentAiValidationEvidenceSnapshot = {
      schemaValid: Boolean(assessment),
      qualityAssessment: assessment
        ? {
            subject: assessment.subject,
            visualSummary: assessment.visualSummary,
            qualityScore: assessment.qualityScore,
            qualityIssues: [...assessment.qualityIssues].sort(),
          }
        : null,
    };
    const evidenceCore = {
      stage: "content_validation" as const,
      policyVersion: MOMO_CONTENT_AI_VALIDATOR_VERSION,
      blockers,
      warnings,
      evidenceSnapshot,
    };
    const evidenceCanonical = momoCanonicalJson(evidenceCore);
    return {
      ok: false,
      failure: {
        errorCode: `validation_${blockers[0] ?? "failed"}`.slice(0, 80),
        publicCode: "content_ai_quality_gate_failed",
        httpStatus: 422,
        measured,
        validationEvidence: {
          ...evidenceCore,
          evidenceCanonical,
          evidenceSha256: await sha256Text(evidenceCanonical),
        },
      },
    };
  }

  const outputCanonical = momoCanonicalJson(validation.value);
  const validationReport = {
    validatorVersion: MOMO_CONTENT_AI_VALIDATOR_VERSION,
    passed: true,
    warnings: validation.warnings,
    platformSet: context.targetPlatforms,
    checks: [
      "schema",
      "grounding",
      "claims",
      "seo",
      "hashtags",
      "alt_text",
      "platform_fit",
      "cta",
      "uncertainty",
    ],
  };
  const validationCanonical = momoCanonicalJson(validationReport);
  return {
    ok: true,
    staged: {
      output: validation.value,
      outputCanonical,
      outputSha256: await sha256Text(outputCanonical),
      validationReport,
      validationCanonical,
      validationSha256: await sha256Text(validationCanonical),
      accountedMicrousd: accounting.accountedMicrousd,
      accountingBasis: accounting.accountingBasis,
      providerUsage: accounting.providerUsage,
      warnings: validation.warnings,
    },
  };
}
