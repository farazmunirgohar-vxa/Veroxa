import type { MomoImagePresetKey } from "./momo-media-workflow";

export const MOMO_MEDIA_AI_MODEL = "gpt-image-2" as const;
export const MOMO_MEDIA_AI_PROMPT_VERSION = "momo-media-ai-v1" as const;
export const MOMO_MEDIA_AI_PRICING_VERSION =
  "openai-gpt-image-2-2026-07-28-v1" as const;
export const MOMO_MEDIA_AI_PROCESSING_ATTESTATION_VERSION =
  "momo-media-ai-processing-v1" as const;
export const MOMO_MEDIA_AI_INSPECTION_ATTESTATION_VERSION =
  "momo-media-ai-inspection-v1" as const;

export const MOMO_MEDIA_AI_PROCESSING_ATTESTATION =
  "I confirm this Team-only AI request may send the selected private image to OpenAI solely to create one private improvement candidate. It will not alter the original or publish anything.";
export const MOMO_MEDIA_AI_APPROVAL_ATTESTATION =
  "I opened and inspected this private AI candidate, verified that it preserves the real dish without invented food or claims, and approve it only for the selected Ready use.";
export const MOMO_MEDIA_AI_REJECTION_ATTESTATION =
  "I reject this private AI candidate. It must not become Ready or be used outside this Team-only review.";

export const MOMO_MEDIA_AI_GOALS = {
  lighting_color: {
    label: "Improve lighting and color",
    instruction:
      "Correct exposure, white balance, natural color, and gentle contrast only.",
  },
  food_focus: {
    label: "Strengthen food focus",
    instruction:
      "Improve framing and local clarity so the existing dish is the visual focus.",
  },
  background_cleanup: {
    label: "Clean the non-food background",
    instruction:
      "Remove only minor visual distractions from the non-food background while keeping the real setting believable.",
  },
} as const;

export type MomoMediaAiGoal = keyof typeof MOMO_MEDIA_AI_GOALS;
export type MomoMediaAiQuality = "low" | "medium";
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
    width: 1024,
    height: 1024,
    intendedUse: "instagram",
  },
  instagram_portrait: {
    width: 1024,
    height: 1280,
    intendedUse: "instagram",
  },
  instagram_story: {
    width: 1024,
    height: 1824,
    intendedUse: "instagram",
  },
  facebook_feed: {
    width: 1024,
    height: 1280,
    intendedUse: "facebook",
  },
  google_business_square: {
    width: 1024,
    height: 1024,
    intendedUse: "google_business",
  },
  website_hero: {
    width: 1536,
    height: 864,
    intendedUse: "website",
  },
};

export const MOMO_MEDIA_AI_RESERVATION_MICROUSD = {
  low: 100_000,
  medium: 250_000,
} as const;
export const MOMO_MEDIA_AI_PILOT_CAP_MICROUSD = 2_000_000 as const;
export const MOMO_MEDIA_AI_MAX_BODY_BYTES = 4_096 as const;
export const MOMO_MEDIA_AI_MAX_SOURCE_BYTES = 20_971_520 as const;
export const MOMO_MEDIA_AI_MAX_OUTPUT_BYTES = 26_214_400 as const;

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
  return value === "low" || value === "medium";
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
    team_access_required:
      "An active Veroxa Team session is required.",
    cross_site_request_rejected:
      "The request was rejected because it did not originate from Veroxa.",
    invalid_request:
      "Choose a valid image, goal, output, quality, description, and one-request processing confirmation.",
    invalid_idempotency_key:
      "This request could not be safely identified. Refresh the Team workspace and try again.",
    source_not_ready:
      "This image needs current rights, original-file verification, and an approved Team review before AI processing.",
    media_ai_wallet_exhausted:
      "The $2 Media AI pilot wallet has reached its hard limit. No provider call occurred.",
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
