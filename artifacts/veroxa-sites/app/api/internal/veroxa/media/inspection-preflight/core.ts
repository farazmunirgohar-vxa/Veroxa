import {
  type VeroxaPrivateMediaHostInspectionDiagnostics,
  type VeroxaPrivateMediaHostInspector,
} from "../../../../../veroxa-private-media-image-decode.ts";

export const mediaInspectionPreflightPath =
  "/api/internal/veroxa/media/inspection-preflight";
export const mediaInspectionPreflightCanonicalBody =
  '{"schemaVersion":1}';
export const mediaInspectionPreflightWakeContext =
  `veroxa:media-inspection-preflight:v1\nPOST\n${mediaInspectionPreflightPath}`;

const HMAC = /^[0-9a-f]{64}$/u;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const MAX_WAKE_BYTES = 1_024;
const MAX_WAKE_AGE_MS = 120_000;
const EXACT_WAKE_JSON =
  /^\{[\t\n\r ]*"schemaVersion"[\t\n\r ]*:[\t\n\r ]*1[\t\n\r ]*\}$/u;

export type MediaInspectionPreflightFixture = {
  bytes: Uint8Array;
  mimeType: "image/jpeg" | "image/png";
  storagePath: string;
  storageObjectId: string;
  storageObjectVersion: string;
  sha256: string;
};

export type MediaInspectionPreflightDependencies = {
  configured: boolean;
  wakeHmacSecret: string;
  now?(): number;
  claim(input: {
    wakeNonce: string;
    signedAtMs: number;
  }): Promise<unknown>;
  ensureFixture(): Promise<MediaInspectionPreflightFixture>;
  inspect: VeroxaPrivateMediaHostInspector;
  complete(input: {
    runId: string;
    state: "passed" | "failed";
    failureCode: string | null;
    diagnostics: VeroxaPrivateMediaHostInspectionDiagnostics | null;
    fixtureSha256: string | null;
  }): Promise<unknown>;
};

class PreflightRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function noStore(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}

function hexBytes(value: string): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(new ArrayBuffer(value.length / 2));
  for (let index = 0; index < value.length; index += 2) {
    result[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index]);
}

async function boundedText(request: Request): Promise<string | null> {
  const declaredHeader = request.headers.get("content-length");
  const declared = declaredHeader === null ? null : Number(declaredHeader);
  if (declared !== null && (!Number.isSafeInteger(declared) || declared < 0 ||
    declared > MAX_WAKE_BYTES) || !request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) return null;
      total += value.byteLength;
      if (total > MAX_WAKE_BYTES) {
        await reader.cancel("request_too_large");
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
  if (total < 2 || (declared !== null && declared !== total)) return null;
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

async function verifiedWake(
  request: Request,
  secret: string,
  now: number,
): Promise<{ wakeNonce: string; signedAtMs: number }> {
  if (request.method !== "POST") {
    throw new PreflightRequestError("method_not_allowed", 405);
  }
  const url = new URL(request.url);
  if (url.pathname !== mediaInspectionPreflightPath || url.search || url.hash ||
    !/^application\/json(?:[\t ]*;|$)/iu.test(
      request.headers.get("content-type")?.trim() || "",
    )) {
    throw new PreflightRequestError("invalid_request", 400);
  }
  const raw = await boundedText(request);
  if (!raw) throw new PreflightRequestError("invalid_request", 400);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new PreflightRequestError("invalid_request", 400);
  }
  if (!EXACT_WAKE_JSON.test(raw) || !isRecord(body) ||
    !exactKeys(body, ["schemaVersion"]) || body.schemaVersion !== 1) {
    throw new PreflightRequestError("invalid_request", 400);
  }
  const timestampText = request.headers
    .get("x-veroxa-media-inspection-timestamp-ms")?.trim() || "";
  const nonce = request.headers.get("x-veroxa-media-inspection-nonce")?.trim() ||
    "";
  const signature = request.headers
    .get("x-veroxa-media-inspection-signature")?.trim() || "";
  const timestamp = Number(timestampText);
  if (!/^\d{13}$/u.test(timestampText) || !Number.isSafeInteger(timestamp) ||
    Math.abs(now - timestamp) > MAX_WAKE_AGE_MS || !UUID.test(nonce) ||
    !HMAC.test(signature) || !HMAC.test(secret)) {
    throw new PreflightRequestError("preflight_access_required", 403);
  }
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexBytes(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const message = new TextEncoder().encode(
      `${mediaInspectionPreflightWakeContext}\n${timestampText}\n${nonce}\n${mediaInspectionPreflightCanonicalBody}`,
    );
    if (!await crypto.subtle.verify(
      "HMAC",
      key,
      hexBytes(signature),
      message,
    )) throw new Error("invalid_signature");
  } catch {
    throw new PreflightRequestError("preflight_access_required", 403);
  }
  return { wakeNonce: nonce.toLowerCase(), signedAtMs: timestamp };
}

function claimedRunId(value: unknown): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row)) return null;
  const id = row.preflight_run_id;
  return typeof id === "string" && UUID.test(id) ? id.toLowerCase() : null;
}

export type MediaInspectionPreflightFailureCode =
  | "media_inspection_fixture_integrity_invalid"
  | "media_inspection_fixture_create_failed"
  | "media_inspection_fixture_readback_failed";

/**
 * Deliberately carries only a fixed, non-secret operational code. Runtime
 * storage and decoder errors must never escape into the HTTP response or
 * durable evidence record.
 */
export class MediaInspectionPreflightFailure extends Error {
  readonly code: MediaInspectionPreflightFailureCode;

  constructor(code: MediaInspectionPreflightFailureCode) {
    super(code);
    this.code = code;
  }
}

function failureCodeForException(error: unknown): string {
  if (error instanceof MediaInspectionPreflightFailure) return error.code;
  // The underlying exception deliberately stays server-side. The durable
  // record distinguishes a handler failure from a provider classification.
  return "media_inspection_preflight_execution_failed";
}

/**
 * A signed, private endpoint used by pg_net. It proves the exact production
 * Storage transformation dependency with a create-only synthetic fixture and
 * records the result before any customer media can be retried.
 */
export function createMediaInspectionPreflightHandler(
  dependencies: MediaInspectionPreflightDependencies,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (!dependencies.configured) {
      return noStore({ schemaVersion: 1, state: "configuration_unavailable" }, 503);
    }

    let wake: { wakeNonce: string; signedAtMs: number };
    try {
      wake = await verifiedWake(
        request,
        dependencies.wakeHmacSecret,
        dependencies.now?.() ?? Date.now(),
      );
    } catch (error) {
      const status = error instanceof PreflightRequestError ? error.status : 400;
      const message = error instanceof PreflightRequestError
        ? error.message
        : "invalid_request";
      return noStore({ schemaVersion: 1, state: message }, status);
    }

    let runId: string | null;
    try {
      runId = claimedRunId(await dependencies.claim(wake));
    } catch {
      return noStore({ schemaVersion: 1, state: "claim_unavailable" }, 503);
    }
    if (!runId) {
      // A nonce can only be claimed once. Do not run the fixture again for a
      // replay, a stale delivery, or a manually repeated request.
      return noStore({ schemaVersion: 1, state: "not_queued" }, 202);
    }

    let state: "passed" | "failed" = "failed";
    let failureCode: string | null = failureCodeForException();
    let diagnostics: VeroxaPrivateMediaHostInspectionDiagnostics | null = null;
    let fixtureSha256: string | null = null;
    try {
      const fixture = await dependencies.ensureFixture();
      fixtureSha256 = fixture.sha256;
      const result = await dependencies.inspect({
        bytes: fixture.bytes,
        mimeType: fixture.mimeType,
        storagePath: fixture.storagePath,
        storageObjectId: fixture.storageObjectId,
        storageObjectVersion: fixture.storageObjectVersion,
      });
      diagnostics = result.diagnostics;
      if (result.inspection) {
        state = "passed";
        failureCode = null;
      } else {
        failureCode = result.diagnostics.failureCode ||
          "media_inspection_preflight_failed";
      }
    } catch (error) {
      // Never place thrown provider, storage, or configuration values in the
      // response or audit payload; diagnostics only contain vetted fields.
      state = "failed";
      failureCode = failureCodeForException(error);
    }

    try {
      await dependencies.complete({
        runId,
        state,
        failureCode,
        diagnostics,
        fixtureSha256,
      });
    } catch {
      return noStore({ schemaVersion: 1, state: "recording_unavailable" }, 503);
    }

    return noStore({
      schemaVersion: 1,
      state,
      failureCode,
    }, state === "passed" ? 200 : 503);
  };
}
