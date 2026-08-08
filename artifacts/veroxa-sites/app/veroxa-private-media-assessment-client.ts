import { isMomoContentUuid } from "./momo-content-ai-contract.ts";
import {
  parseVeroxaPrivateMediaAssessment,
  type VeroxaPrivateMediaAssessment,
} from "./veroxa-private-media-assessment.ts";

const MAX_RESPONSE_BYTES = 48 * 1024;
const SHA256 = /^[0-9a-f]{64}$/u;

export type VeroxaPrivateMediaAssessmentApiResult = {
  assessmentId: string;
  status: "completed";
  assessment: VeroxaPrivateMediaAssessment;
  reused: boolean;
  reusedFromAssessmentId: string | null;
  sourceContentSha256: string;
  externalWriteAllowed: false;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class VeroxaPrivateMediaAssessmentRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = "VeroxaPrivateMediaAssessmentRequestError";
    this.code = code;
    this.status = status;
  }
}

function errorCode(value: unknown): string {
  const error = isRecord(value) ? value.error : null;
  return typeof error === "string" && /^[a-z][a-z0-9_]{2,100}$/u.test(error)
    ? error
    : "private_media_assessment_unavailable";
}

function parseResult(value: unknown): VeroxaPrivateMediaAssessmentApiResult | null {
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== [
    "assessment",
    "assessmentId",
    "externalWriteAllowed",
    "reused",
    "reusedFromAssessmentId",
    "sourceContentSha256",
    "status",
  ].sort().join(",") || !isMomoContentUuid(value.assessmentId) ||
    value.status !== "completed" || typeof value.reused !== "boolean" ||
    (value.reusedFromAssessmentId !== null &&
      !isMomoContentUuid(value.reusedFromAssessmentId)) ||
    (value.reused !== (value.reusedFromAssessmentId !== null)) ||
    typeof value.sourceContentSha256 !== "string" ||
    !SHA256.test(value.sourceContentSha256) ||
    value.externalWriteAllowed !== false) return null;
  const assessment = parseVeroxaPrivateMediaAssessment(value.assessment);
  return assessment ? {
    assessmentId: value.assessmentId.toLowerCase(),
    status: "completed",
    assessment,
    reused: value.reused,
    reusedFromAssessmentId: value.reusedFromAssessmentId === null
      ? null
      : value.reusedFromAssessmentId.toLowerCase(),
    sourceContentSha256: value.sourceContentSha256,
    externalWriteAllowed: false,
  } : null;
}

export async function requestVeroxaPrivateMediaAssessment(input: {
  restaurantId: string;
  assetId: string;
  idempotencyKey?: string;
}, fetchImplementation: typeof fetch = fetch): Promise<VeroxaPrivateMediaAssessmentApiResult> {
  if (!isMomoContentUuid(input.restaurantId) || !isMomoContentUuid(input.assetId)) {
    throw new VeroxaPrivateMediaAssessmentRequestError("invalid_request", 400);
  }
  const idempotencyKey = input.idempotencyKey ||
    `private-assessment:${input.assetId.toLowerCase()}`;
  let response: Response;
  try {
    response = await fetchImplementation("/api/media/assessment", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({
        restaurantId: input.restaurantId.toLowerCase(),
        assetId: input.assetId.toLowerCase(),
        privateAssessmentRequested: true,
        idempotencyKey,
      }),
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new VeroxaPrivateMediaAssessmentRequestError(
      "private_media_assessment_unavailable",
      503,
    );
  }
  let text: string;
  try {
    text = await response.text();
  } catch {
    throw new VeroxaPrivateMediaAssessmentRequestError(
      "private_media_assessment_unavailable",
      503,
    );
  }
  if (!text || new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES ||
    !response.headers.get("content-type")?.toLowerCase()
      .startsWith("application/json")) {
    throw new VeroxaPrivateMediaAssessmentRequestError(
      "private_media_assessment_unavailable",
      503,
    );
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new VeroxaPrivateMediaAssessmentRequestError(
      "private_media_assessment_unavailable",
      503,
    );
  }
  if (!response.ok) {
    throw new VeroxaPrivateMediaAssessmentRequestError(
      errorCode(value),
      response.status,
    );
  }
  const result = parseResult(value);
  if (!result) {
    throw new VeroxaPrivateMediaAssessmentRequestError(
      "private_media_assessment_unavailable",
      503,
    );
  }
  return result;
}
