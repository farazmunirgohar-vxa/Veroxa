import {
  MOMO_CONTENT_AI_MAX_BODY_BYTES,
  MOMO_CONTENT_AI_MODEL,
  MOMO_CONTENT_AI_PRICING_VERSION,
  MOMO_CONTENT_AI_PROMPT_VERSION,
  MOMO_CONTENT_AI_SCHEMA_VERSION,
  MOMO_CONTENT_AI_VALIDATOR_VERSION,
  isMomoContentIdempotencyKey,
  isMomoContentUuid,
} from "../../../../momo-content-ai-contract.ts";
import { momoCanonicalJson } from "../../../../momo-canonical-json.ts";
import { momoBytesSha256 } from "../../../../momo-image-bytes.ts";
import type { MomoContentAiReservation } from "../../../../momo-content-ai-provider-request.ts";

export type { MomoContentAiReservation } from "../../../../momo-content-ai-provider-request.ts";

export type MomoContentAiActor = {
  role: "team" | "client";
  restaurantId: string | null;
  userId: string;
};

export type MomoContentAiDependencies = {
  enabled: boolean;
  providerConfigured: boolean;
  authenticate(): Promise<MomoContentAiActor | null>;
  reserve(input: {
    restaurantId: string;
    assetId: string;
    idempotencyHash: string;
    clientRequestHash: string;
    recoveryResponseId: null;
  }): Promise<MomoContentAiReservation>;
};

type NormalizedRequest = {
  restaurantId: string;
  assetId: string;
  idempotencyKey: string;
};

class PublicRouteError extends Error {
  readonly publicCode: string;
  readonly httpStatus: number;

  constructor(publicCode: string, httpStatus: number) {
    super(publicCode);
    this.publicCode = publicCode;
    this.httpStatus = httpStatus;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function originAllowed(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function boundedRequestText(
  request: Request,
  maximumBytes: number,
): Promise<
  { ok: true; value: string } |
  { ok: false; reason: "too_large" | "invalid" }
> {
  if (!request.body) return { ok: false, reason: "invalid" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) {
        return { ok: false, reason: "invalid" };
      }
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel("request_too_large");
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "invalid" };
  } finally {
    reader.releaseLock();
  }
  if (total < 2) return { ok: false, reason: "invalid" };
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return {
      ok: true,
      value: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

async function parseRequest(request: Request): Promise<NormalizedRequest> {
  if (!request.headers.get("content-type")?.toLowerCase()
    .startsWith("application/json")) {
    throw new PublicRouteError("invalid_request", 415);
  }
  const declared = Number(request.headers.get("content-length") || 0);
  if (!Number.isFinite(declared) || declared < 0 ||
    declared > MOMO_CONTENT_AI_MAX_BODY_BYTES) {
    throw new PublicRouteError("invalid_request", 413);
  }
  const bounded = await boundedRequestText(
    request,
    MOMO_CONTENT_AI_MAX_BODY_BYTES,
  );
  if (!bounded.ok) {
    throw new PublicRouteError(
      "invalid_request",
      bounded.reason === "too_large" ? 413 : 400,
    );
  }
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(bounded.value) as unknown;
    if (!isRecord(parsed)) throw new Error();
    body = parsed;
  } catch {
    throw new PublicRouteError("invalid_request", 400);
  }
  const actualKeys = Object.keys(body).sort().join(",");
  const expectedKeys = [
    "assetId",
    "idempotencyKey",
    "restaurantId",
    "standingAutomation",
  ].sort().join(",");
  if (actualKeys !== expectedKeys) {
    throw new PublicRouteError("invalid_request", 400);
  }
  const headerKey = request.headers.get("idempotency-key")?.trim() || "";
  const bodyKey = typeof body.idempotencyKey === "string"
    ? body.idempotencyKey.trim()
    : "";
  if (!isMomoContentUuid(body.restaurantId) ||
    !isMomoContentUuid(body.assetId) || body.standingAutomation !== true ||
    !isMomoContentIdempotencyKey(bodyKey) ||
    (headerKey && headerKey !== bodyKey)) {
    throw new PublicRouteError("invalid_request", 400);
  }
  return {
    restaurantId: body.restaurantId.toLowerCase(),
    assetId: body.assetId.toLowerCase(),
    idempotencyKey: bodyKey,
  };
}

async function sha256Text(value: string): Promise<string> {
  return momoBytesSha256(new TextEncoder().encode(value));
}

function mapReservationError(error: unknown): PublicRouteError {
  const message = error instanceof Error ? error.message : "";
  if (/idempotency_conflict/iu.test(message)) {
    return new PublicRouteError("idempotency_conflict", 409);
  }
  if (/in_progress|active_run/iu.test(message)) {
    return new PublicRouteError("content_ai_in_progress", 409);
  }
  if (/budget|authorization|wallet/iu.test(message)) {
    return new PublicRouteError("content_ai_budget_unavailable", 409);
  }
  if (/runtime|disabled/iu.test(message)) {
    return new PublicRouteError("content_ai_disabled", 503);
  }
  return new PublicRouteError("source_not_ready", 409);
}

export function createMomoContentAiPostHandler(
  dependencies: MomoContentAiDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    try {
      if (!originAllowed(request)) {
        throw new PublicRouteError("cross_site_request_rejected", 403);
      }
      const actor = await dependencies.authenticate();
      if (!actor || actor.role !== "team" || !actor.restaurantId ||
        !isMomoContentUuid(actor.restaurantId) ||
        !isMomoContentUuid(actor.userId)) {
        throw new PublicRouteError("team_access_required", 403);
      }
      if (!dependencies.enabled) {
        throw new PublicRouteError("content_ai_disabled", 503);
      }
      if (!dependencies.providerConfigured) {
        throw new PublicRouteError(
          "content_ai_configuration_unavailable",
          503,
        );
      }
      const input = await parseRequest(request);
      if (input.restaurantId !== actor.restaurantId.toLowerCase()) {
        throw new PublicRouteError("team_access_required", 403);
      }
      const idempotencyHash = await sha256Text(
        `${input.restaurantId}:${input.idempotencyKey}`,
      );
      const clientRequestHash = await sha256Text(momoCanonicalJson({
        restaurantId: input.restaurantId,
        assetId: input.assetId,
        model: MOMO_CONTENT_AI_MODEL,
        promptVersion: MOMO_CONTENT_AI_PROMPT_VERSION,
        schemaVersion: MOMO_CONTENT_AI_SCHEMA_VERSION,
        validatorVersion: MOMO_CONTENT_AI_VALIDATOR_VERSION,
        pricingVersion: MOMO_CONTENT_AI_PRICING_VERSION,
      }));
      let reservation: MomoContentAiReservation;
      try {
        reservation = await dependencies.reserve({
          restaurantId: input.restaurantId,
          assetId: input.assetId,
          idempotencyHash,
          clientRequestHash,
          recoveryResponseId: null,
        });
      } catch (error) {
        throw mapReservationError(error);
      }

      if (reservation.status === "failed") {
        throw new PublicRouteError("content_ai_previous_attempt_failed", 409);
      }
      const status = reservation.status === "reserved"
        ? "queued"
        : reservation.status === "result_staged"
        ? "finalizing"
        : reservation.status === "pending_review"
        ? "pending_team_review"
        : reservation.status;
      const inProgress = [
        "reserved",
        "provider_running",
        "result_staged",
      ].includes(reservation.status);
      return noStore({
        runId: reservation.runId,
        status,
        ...(reservation.storedOutput
          ? { package: reservation.storedOutput }
          : {}),
        replayed: reservation.status !== "reserved",
        canMarkReady: false,
        externalWriteAllowed: false,
      }, inProgress ? 202 : 200);
    } catch (error) {
      if (error instanceof PublicRouteError) {
        return noStore({ error: error.publicCode }, error.httpStatus);
      }
      return noStore({ error: "content_ai_unavailable" }, 503);
    }
  };
}
