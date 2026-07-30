import type { MomoImagePresetKey } from "./momo-media-workflow";

export const MOMO_MEDIA_AI_MODEL = "gpt-image-2" as const;
export const MOMO_MEDIA_AI_PROMPT_VERSION = "momo-media-ai-v2" as const;
export const MOMO_MEDIA_AI_PRICING_VERSION =
  "openai-gpt-image-2-2026-07-30-v2" as const;
export const MOMO_MEDIA_AI_PROCESSING_ATTESTATION_VERSION =
  "momo-media-ai-processing-v2" as const;
export const MOMO_MEDIA_AI_INSPECTION_ATTESTATION_VERSION =
  "momo-media-ai-inspection-v1" as const;

export const MOMO_MEDIA_AI_PROCESSING_ATTESTATION =
  "Momo Media AI standing automation may send each eligible, rights-current, Team-approved private image to OpenAI solely to create one high-fidelity private improvement candidate. It will not alter the original, retry automatically, mark Ready without inspection, or publish anything.";
export const MOMO_MEDIA_AI_APPROVAL_ATTESTATION =
  "I opened and inspected this private AI candidate, verified that it preserves the real dish without invented food or claims, and approve it only for the selected Ready use.";
export const MOMO_MEDIA_AI_REJECTION_ATTESTATION =
  "I reject this private AI candidate. It must not become Ready or be used outside this Team-only review.";

export const MOMO_MEDIA_AI_GOALS = {
  professional_food_finish: {
    label: "Automatic professional food finish",
    instruction:
      "Automatically improve exposure, white balance, natural color, gentle contrast, food focus, and minor non-food background distractions while preserving the exact photographed meal.",
  },
} as const;

export type MomoMediaAiGoal = keyof typeof MOMO_MEDIA_AI_GOALS;
export type MomoMediaAiQuality = "high";
export type MomoMediaAiCandidateStatus =
  | "reserved"
  | "provider_running"
  | "pending_review"
  | "approved"
  | "rejected"
  | "failed";

export type MomoMediaAiPresetContract = {
  width: number;
  height: number;
  intendedUse: "facebook" | "instagram" | "google_business" | "website";
};

export const MOMO_MEDIA_AI_PRESETS: Record<
  MomoImagePresetKey,
  MomoMediaAiPresetContract
> = {
  instagram_square: {
    width: 2048,
    height: 2048,
    intendedUse: "instagram",
  },
  instagram_portrait: {
    width: 2048,
    height: 2560,
    intendedUse: "instagram",
  },
  instagram_story: {
    width: 1440,
    height: 2560,
    intendedUse: "instagram",
  },
  facebook_feed: {
    width: 2048,
    height: 2560,
    intendedUse: "facebook",
  },
  google_business_square: {
    width: 2048,
    height: 2048,
    intendedUse: "google_business",
  },
  website_hero: {
    width: 2560,
    height: 1440,
    intendedUse: "website",
  },
};

export const MOMO_MEDIA_AI_AUTOMATIC_GOAL =
  "professional_food_finish" as const;
export const MOMO_MEDIA_AI_AUTOMATIC_QUALITY = "high" as const;
// Each individual attempt is authorized up to this conservative ceiling.
// Provider usage is reconciled when OpenAI returns token usage; an uncertain
// post-provider attempt keeps the full ceiling rather than claiming $0.
export const MOMO_MEDIA_AI_RESERVATION_MICROUSD = {
  high: 20_000_000,
} as const;
// This is a per-job approval threshold, never a lifetime or recurring budget.
export const MOMO_MEDIA_AI_AUTHORIZATION_THRESHOLD_MICROUSD =
  20_000_000 as const;
export const MOMO_MEDIA_AI_MAX_BODY_BYTES = 4_096 as const;
export const MOMO_MEDIA_AI_MAX_SOURCE_BYTES = 20_971_520 as const;
export const MOMO_MEDIA_AI_MAX_OUTPUT_BYTES = 52_428_800 as const;
export const MOMO_MEDIA_AI_MAX_EDGE_PIXELS = 3_840 as const;
export const MOMO_MEDIA_AI_MAX_TOTAL_PIXELS = 8_294_400 as const;
export const MOMO_MEDIA_AI_MIN_TOTAL_PIXELS = 655_360 as const;

export async function momoMediaAiFetch(
  fetcher: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>,
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetcher(input, init);
  } catch {
    throw new Error("media_ai_transport_uncertain");
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;

export function isMomoMediaAiGoal(value: unknown): value is MomoMediaAiGoal {
  return typeof value === "string"
    && Object.hasOwn(MOMO_MEDIA_AI_GOALS, value);
}

export function isMomoMediaAiQuality(
  value: unknown,
): value is MomoMediaAiQuality {
  return value === "high";
}

export function isMomoMediaAiProviderSize(
  width: unknown,
  height: unknown,
): boolean {
  if (
    typeof width !== "number"
    || typeof height !== "number"
    || !Number.isInteger(width)
    || !Number.isInteger(height)
    || width < 16
    || height < 16
    || width > MOMO_MEDIA_AI_MAX_EDGE_PIXELS
    || height > MOMO_MEDIA_AI_MAX_EDGE_PIXELS
    || width % 16 !== 0
    || height % 16 !== 0
  ) return false;
  const pixels = width * height;
  const ratio = Math.max(width, height) / Math.min(width, height);
  return pixels >= MOMO_MEDIA_AI_MIN_TOTAL_PIXELS
    && pixels <= MOMO_MEDIA_AI_MAX_TOTAL_PIXELS
    && ratio <= 3;
}

export function isMomoMediaAiPreset(
  value: unknown,
): value is MomoImagePresetKey {
  return typeof value === "string"
    && Object.hasOwn(MOMO_MEDIA_AI_PRESETS, value);
}

export function isMomoMediaAiCandidateStatus(
  value: unknown,
): value is MomoMediaAiCandidateStatus {
  return [
    "reserved",
    "provider_running",
    "pending_review",
    "approved",
    "rejected",
    "failed",
  ].includes(String(value));
}

export function isMomoMediaAiUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function isMomoMediaAiHash(value: unknown): value is string {
  return typeof value === "string" && HASH_PATTERN.test(value);
}

export function isMomoMediaAiIdempotencyKey(
  value: unknown,
): value is string {
  return typeof value === "string" && IDEMPOTENCY_PATTERN.test(value);
}

export function momoMediaAiAutomaticAttemptScope(input: {
  assetId: string;
  reviewId: string;
  sourceContentSha256: string;
  preset: MomoImagePresetKey;
  retryNonce: number;
}): {
  goal: typeof MOMO_MEDIA_AI_AUTOMATIC_GOAL;
  preset: MomoImagePresetKey;
  quality: typeof MOMO_MEDIA_AI_AUTOMATIC_QUALITY;
  idempotencyKey: string;
} | null {
  if (
    !isMomoMediaAiUuid(input.assetId)
    || !isMomoMediaAiUuid(input.reviewId)
    || !isMomoMediaAiHash(input.sourceContentSha256)
    || !isMomoMediaAiPreset(input.preset)
    || !Number.isSafeInteger(input.retryNonce)
    || input.retryNonce < 0
    || input.retryNonce > 9_999
  ) return null;

  const idempotencyKey = [
    "momo-ai-v2",
    input.assetId,
    input.reviewId,
    input.sourceContentSha256.slice(0, 16),
    input.preset,
    input.retryNonce,
  ].join(":");
  if (!isMomoMediaAiIdempotencyKey(idempotencyKey)) return null;

  return {
    goal: MOMO_MEDIA_AI_AUTOMATIC_GOAL,
    preset: input.preset,
    quality: MOMO_MEDIA_AI_AUTOMATIC_QUALITY,
    idempotencyKey,
  };
}

export function momoMediaAiFailedAttemptScopeKey(
  error: unknown,
  automaticIdempotencyKey: string,
): string {
  return error instanceof Error
    && error.message === "media_ai_previous_attempt_failed"
    && isMomoMediaAiIdempotencyKey(automaticIdempotencyKey)
    ? automaticIdempotencyKey
    : "";
}

export function momoMediaAiAttemptNeedsManualRetry(input: {
  matchingStatus: MomoMediaAiCandidateStatus | undefined;
  exactFailedReplayKeyKnown: boolean;
}): boolean {
  return input.matchingStatus === undefined
    ? input.exactFailedReplayKeyKnown
    : input.matchingStatus === "failed";
}

export function momoMediaAiAutomaticAttemptCanStart(input: {
  idempotencyKey: string;
  retryNonce: number;
  sourceEligible: boolean;
  reviewApproved: boolean;
  rightsScopeAllowsPreset: boolean;
  sourceFits: boolean;
  preflightReady: boolean;
  busy: boolean;
  hasActiveCandidate: boolean;
  matchingAttemptExists: boolean;
  attemptKnownFailed: boolean;
  readbackRequired: boolean;
  withinAuthorization: boolean;
  alreadyAttempted: boolean;
}): boolean {
  return isMomoMediaAiIdempotencyKey(input.idempotencyKey)
    && Number.isSafeInteger(input.retryNonce)
    && input.retryNonce >= 0
    && input.sourceEligible
    && input.reviewApproved
    && input.rightsScopeAllowsPreset
    && input.sourceFits
    && input.preflightReady
    && !input.busy
    && !input.hasActiveCandidate
    && (
      (!input.matchingAttemptExists && !input.attemptKnownFailed)
      || input.retryNonce > 0
    )
    && !input.readbackRequired
    && input.withinAuthorization
    && !input.alreadyAttempted;
}

export function momoMediaAiNextUnattemptedRetryScope(input: {
  assetId: string;
  reviewId: string;
  sourceContentSha256: string;
  preset: MomoImagePresetKey;
  currentNonce: number;
  retryIssuing: boolean;
  retryAllowed: boolean;
  attemptedKeys: ReadonlySet<string>;
}): {
  retryNonce: number;
  idempotencyKey: string;
} | null {
  if (
    input.retryIssuing
    || !input.retryAllowed
    || !Number.isSafeInteger(input.currentNonce)
    || input.currentNonce < 0
    || input.currentNonce >= 9_999
  ) return null;
  for (
    let retryNonce = input.currentNonce + 1;
    retryNonce <= 9_999;
    retryNonce += 1
  ) {
    const scope = momoMediaAiAutomaticAttemptScope({
      assetId: input.assetId,
      reviewId: input.reviewId,
      sourceContentSha256: input.sourceContentSha256,
      preset: input.preset,
      retryNonce,
    });
    if (scope && !input.attemptedKeys.has(scope.idempotencyKey)) {
      return {
        retryNonce,
        idempotencyKey: scope.idempotencyKey,
      };
    }
  }
  return null;
}

export function momoMediaAiAccountingLabel(input: {
  reservedMicrousd: number;
  accountedMicrousd: number | null;
  accountingBasis: string | null;
}): string {
  if (input.accountedMicrousd === null) {
    return `$${(input.reservedMicrousd / 1_000_000).toFixed(2)} authorization hold`;
  }
  if (input.accountingBasis === "zero_pre_provider") {
    return "$0 accounted; provider not called";
  }
  if (input.accountingBasis === "provider_usage_estimate") {
    return `$${(input.accountedMicrousd / 1_000_000).toFixed(2)} provider usage estimate`;
  }
  return `$${(input.accountedMicrousd / 1_000_000).toFixed(2)} conservative authorization hold`;
}

export function momoMediaAiInspectionAllowsApproval(input: {
  candidateToken: string;
  renderedToken: string;
  inspectionToken: string;
  inspectionConfirmed: boolean;
  inspectionNotes: string;
}): boolean {
  return input.candidateToken.length > 0
    && input.renderedToken === input.candidateToken
    && input.inspectionToken === input.candidateToken
    && input.inspectionConfirmed
    && input.inspectionNotes.trim().length >= 10;
}

export function momoMediaAiErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    media_ai_disabled:
      "Media AI is disabled. No provider call or charge occurred.",
    media_ai_configuration_unavailable:
      "Media AI is not fully connected. No provider call or charge occurred.",
    media_ai_runtime_unavailable:
      "The protected Media AI runtime could not be verified. No provider call or charge occurred.",
    media_ai_automation_not_ready:
      "Automatic high-fidelity processing is not ready for this source. No provider call or charge occurred.",
    team_access_required:
      "An active Veroxa Team session is required.",
    cross_site_request_rejected:
      "The request was rejected because it did not originate from Veroxa.",
    invalid_request:
      "Choose a valid image, goal, output, quality, description, and standing-automation request.",
    invalid_idempotency_key:
      "This request could not be safely identified. Refresh the Team workspace and try again.",
    source_not_ready:
      "This image needs current rights, original-file verification, and an approved Team review before AI processing.",
    media_ai_authorization_required:
      "This Media AI job is estimated above the $20 automatic authorization threshold. No provider call occurred; obtain Faraz’s authorization before it can run.",
    media_ai_in_progress:
      "This exact AI request has already crossed the provider boundary and will not be sent twice.",
    media_ai_previous_attempt_failed:
      "This exact attempt was finalized as failed and cannot be replayed. Change a setting or start a new request.",
    idempotency_conflict:
      "This request key is already bound to different settings. Refresh the Team workspace and try again.",
    provider_rejected:
      "OpenAI did not create a candidate. The attempt was recorded conservatively and was not retried.",
    provider_timeout:
      "OpenAI did not finish in time. The attempt was recorded conservatively and was not retried.",
    provider_output_invalid:
      "The provider response did not pass Veroxa’s private image checks and cannot be reviewed or marked Ready.",
    candidate_storage_failed:
      "The private candidate could not be verified in storage and cannot be reviewed or marked Ready.",
    candidate_finalization_uncertain:
      "The private candidate’s final database state could not be confirmed. It will not be sent to OpenAI again.",
    media_ai_transport_uncertain:
      "The response was lost, so OpenAI may already have been called. Veroxa kept the same request key and will not permit a fresh paid request until authoritative attempt history is available.",
    media_ai_readback_required:
      "Veroxa could not refresh authoritative AI attempt history. This request remains blocked with its original key; refresh the Team workspace before taking another paid action.",
    momo_media_ai_attempt_not_closeable:
      "This attempt is still inside its safety window or has already reached a terminal state. It was not retried.",
  };
  return messages[code] || "Media AI stopped safely. No image was published.";
}
