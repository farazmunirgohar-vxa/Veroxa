import {
  parseMomoMediaFinalizeApiResult,
  type MomoMediaFinalizeApiResult,
} from "./momo-media-finalize-contract.ts";

const MAX_RESPONSE_BYTES = 8_192;

export class MomoMediaFinalizeRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = "MomoMediaFinalizeRequestError";
    this.code = code;
    this.status = status;
  }
}

function responseErrorCode(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "media_verification_unavailable";
  const code = (value as { error?: unknown }).error;
  return typeof code === "string" && /^[a-z][a-z0-9_]{2,80}$/u.test(code)
    ? code
    : "media_verification_unavailable";
}

export async function finalizeMomoMediaUpload(
  input: { restaurantId: string; assetId: string; storagePath: string },
  fetchImplementation: typeof fetch = fetch,
): Promise<MomoMediaFinalizeApiResult> {
  let response: Response;
  try {
    response = await fetchImplementation("/api/media/finalize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new MomoMediaFinalizeRequestError("media_verification_unavailable", 503);
  }
  let text: string;
  try { text = await response.text(); } catch {
    throw new MomoMediaFinalizeRequestError("media_verification_unavailable", 503);
  }
  if (!text || new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES ||
    !response.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new MomoMediaFinalizeRequestError("media_verification_unavailable", 503);
  }
  let value: unknown;
  try { value = JSON.parse(text); } catch {
    throw new MomoMediaFinalizeRequestError("media_verification_unavailable", 503);
  }
  if (!response.ok) throw new MomoMediaFinalizeRequestError(responseErrorCode(value), response.status);
  const result = parseMomoMediaFinalizeApiResult(value, input.assetId);
  if (!result) throw new MomoMediaFinalizeRequestError("media_verification_unavailable", 503);
  return result;
}
