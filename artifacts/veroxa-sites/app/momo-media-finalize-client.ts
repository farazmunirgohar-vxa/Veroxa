import {
  parseMomoMediaFinalizeApiResult,
  parseMomoMediaFinalizeFailureReceipt,
  type MomoMediaFinalizeApiResult,
  type MomoMediaFinalizeFailureReceipt,
} from "./momo-media-finalize-contract.ts";
import { isMomoContentUuid } from "./momo-content-ai-contract.ts";

const MAX_RESPONSE_BYTES = 8_192;

export type MomoMediaRegisteredFinalizeInput = {
  restaurantId: string;
  assetId: string;
  storagePath: string;
};

export type MomoMediaSessionFinalizeInput = {
  restaurantId: string;
  uploadSessionId: string;
  clientIdempotencyKey: string;
  storagePath: string;
};

export type MomoMediaSessionFinalizeApiResult = MomoMediaFinalizeApiResult & {
  uploadSessionId: string;
  assetId: string;
  rightsId: string;
};

export class MomoMediaFinalizeRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly receipt: MomoMediaFinalizeFailureReceipt | null;
  readonly correlationId: string | null;

  constructor(
    code: string,
    status: number,
    receipt: MomoMediaFinalizeFailureReceipt | null = null,
    correlationId: string | null = null,
  ) {
    super(code);
    this.name = "MomoMediaFinalizeRequestError";
    this.code = code;
    this.status = status;
    this.receipt = receipt;
    this.correlationId = correlationId;
  }
}

function responseErrorCode(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "media_verification_unavailable";
  const code = (value as { error?: unknown }).error;
  return typeof code === "string" && /^[a-z][a-z0-9_]{2,80}$/u.test(code)
    ? code
    : "media_verification_unavailable";
}

async function requestMomoMediaFinalize(
  input: MomoMediaRegisteredFinalizeInput | MomoMediaSessionFinalizeInput,
  fetchImplementation: typeof fetch = fetch,
): Promise<MomoMediaFinalizeApiResult | MomoMediaSessionFinalizeApiResult> {
  const correlationId = crypto.randomUUID();
  let response: Response;
  try {
    response = await fetchImplementation("/api/media/finalize", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-veroxa-correlation-id": correlationId,
      },
      body: JSON.stringify(input),
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new MomoMediaFinalizeRequestError(
      "media_verification_unavailable",
      503,
      null,
      correlationId,
    );
  }
  let text: string;
  try { text = await response.text(); } catch {
    throw new MomoMediaFinalizeRequestError(
      "media_verification_unavailable",
      503,
      null,
      correlationId,
    );
  }
  if (!text || new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES ||
    !response.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new MomoMediaFinalizeRequestError(
      "media_verification_unavailable",
      503,
      null,
      correlationId,
    );
  }
  let value: unknown;
  try { value = JSON.parse(text); } catch {
    throw new MomoMediaFinalizeRequestError(
      "media_verification_unavailable",
      503,
      null,
      correlationId,
    );
  }
  if (!response.ok) {
    const responseCorrelationId = response.headers.get(
      "x-veroxa-correlation-id",
    );
    const receipt = typeof value === "object" && value !== null &&
        !Array.isArray(value) &&
        (value as { externalWriteAllowed?: unknown }).externalWriteAllowed ===
          false
      ? parseMomoMediaFinalizeFailureReceipt(
        (value as { receipt?: unknown }).receipt,
        responseCorrelationId === correlationId ? correlationId : null,
      )
      : null;
    throw new MomoMediaFinalizeRequestError(
      responseErrorCode(value),
      response.status,
      responseCorrelationId === correlationId ? receipt : null,
      responseCorrelationId === correlationId ? correlationId : null,
    );
  }
  let expectedAssetId: string;
  let apiValue = value;
  let sessionRegistration: {
    uploadSessionId: string;
    assetId: string;
    rightsId: string;
  } | null = null;
  if ("assetId" in input) {
    expectedAssetId = input.assetId;
  } else {
    if (typeof value !== "object" || value === null || Array.isArray(value) ||
      Object.keys(value).sort().join(",") !== [
        "assetId", "canonicalAssetId", "duplicateAssetId",
        "externalWriteAllowed", "rightsId", "status", "uploadSessionId",
        "verificationId",
      ].sort().join(",")) {
      throw new MomoMediaFinalizeRequestError(
        "media_verification_unavailable",
        503,
        null,
        response.headers.get("x-veroxa-correlation-id") === correlationId
          ? correlationId
          : null,
      );
    }
    const registration = value as Record<string, unknown>;
    if (registration.uploadSessionId !== input.uploadSessionId ||
      !isMomoContentUuid(registration.assetId) ||
      !isMomoContentUuid(registration.rightsId)) {
      throw new MomoMediaFinalizeRequestError(
        "media_verification_unavailable",
        503,
        null,
        response.headers.get("x-veroxa-correlation-id") === correlationId
          ? correlationId
          : null,
      );
    }
    expectedAssetId = registration.assetId;
    sessionRegistration = {
      uploadSessionId: registration.uploadSessionId as string,
      assetId: registration.assetId,
      rightsId: registration.rightsId,
    };
    apiValue = {
      verificationId: registration.verificationId,
      status: registration.status,
      canonicalAssetId: registration.canonicalAssetId,
      duplicateAssetId: registration.duplicateAssetId,
      externalWriteAllowed: registration.externalWriteAllowed,
    };
  }
  const result = parseMomoMediaFinalizeApiResult(apiValue, expectedAssetId);
  if (!result) {
    throw new MomoMediaFinalizeRequestError(
      "media_verification_unavailable",
      503,
      null,
      response.headers.get("x-veroxa-correlation-id") === correlationId
        ? correlationId
        : null,
    );
  }
  return sessionRegistration ? { ...result, ...sessionRegistration } : result;
}

export async function finalizeMomoMediaUpload(
  input: MomoMediaRegisteredFinalizeInput,
  fetchImplementation: typeof fetch = fetch,
): Promise<MomoMediaFinalizeApiResult> {
  return requestMomoMediaFinalize(input, fetchImplementation) as
    Promise<MomoMediaFinalizeApiResult>;
}

export async function finalizeMomoMediaUploadSession(
  input: MomoMediaSessionFinalizeInput,
  fetchImplementation: typeof fetch = fetch,
): Promise<MomoMediaSessionFinalizeApiResult> {
  return requestMomoMediaFinalize(input, fetchImplementation) as
    Promise<MomoMediaSessionFinalizeApiResult>;
}
