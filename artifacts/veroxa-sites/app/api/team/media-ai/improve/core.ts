import {
  MOMO_MEDIA_AI_GOALS,
  MOMO_MEDIA_AI_MAX_BODY_BYTES,
  MOMO_MEDIA_AI_MAX_OUTPUT_BYTES,
  MOMO_MEDIA_AI_MAX_SOURCE_BYTES,
  MOMO_MEDIA_AI_MODEL,
  MOMO_MEDIA_AI_PROCESSING_ATTESTATION,
  MOMO_MEDIA_AI_PROMPT_VERSION,
  MOMO_MEDIA_AI_AUTHORIZATION_THRESHOLD_MICROUSD,
  isMomoMediaAiGoal,
  isMomoMediaAiHash,
  isMomoMediaAiIdempotencyKey,
  isMomoMediaAiPreset,
  isMomoMediaAiProviderSize,
  isMomoMediaAiQuality,
  isMomoMediaAiUuid,
  type MomoMediaAiGoal,
  type MomoMediaAiQuality,
} from "../../../../momo-media-ai-contract.ts";
import {
  decodeMomoBase64Png,
  inspectMomoImageBytesFully,
  inspectMomoPngBytes,
  momoBytesSha256,
  momoOwnedArrayBuffer,
} from "../../../../momo-image-bytes.ts";
import type { MomoImagePresetKey } from "../../../../momo-media-workflow.ts";
import {
  MOMO_AI_MAX_AUTOMATIC_MICROUSD,
  evaluateMomoAiTaskPreflight,
} from "../../../../momo-ai-task-preflight.ts";

const MAX_PROVIDER_RESPONSE_BYTES = 75_000_000;

export type MomoMediaAiActor = {
  role: "team" | "client";
  restaurantId: string | null;
  userId: string;
};

export type MomoMediaAiReservation = {
  candidateId: string;
  status:
    | "reserved"
    | "provider_running"
    | "pending_review"
    | "approved"
    | "rejected";
  sourceStoragePath: string;
  sourceMimeType: "image/jpeg" | "image/png" | "image/webp";
  sourceFileSize: number;
  sourceContentSha256: string;
  outputWidth: number;
  outputHeight: number;
  intendedUse: "facebook" | "instagram" | "google_business" | "website";
  evidenceClass: "development_proxy" | "real_owner";
  reservedMicrousd: number;
};

export type MomoMediaAiReserveInput = {
  restaurantId: string;
  assetId: string;
  goal: MomoMediaAiGoal;
  preset: MomoImagePresetKey;
  quality: MomoMediaAiQuality;
  altText: string;
  idempotencyHash: string;
  requestHash: string;
  processingAttestation: typeof MOMO_MEDIA_AI_PROCESSING_ATTESTATION;
};

export type MomoMediaAiProviderUsage = {
  input_tokens: number;
  input_tokens_details: {
    image_tokens: number;
    text_tokens: number;
  };
  output_tokens: number;
  total_tokens: number;
};

export type MomoMediaAiDependencies = {
  enabled: boolean;
  providerConfigured: boolean;
  verifyProviderAccess(): Promise<boolean>;
  hashBytes?(bytes: Uint8Array): Promise<string>;
  authenticate(): Promise<MomoMediaAiActor | null>;
  reserve(input: MomoMediaAiReserveInput): Promise<MomoMediaAiReservation>;
  downloadSource(storagePath: string): Promise<Blob>;
  startProvider(input: {
    candidateId: string;
    requestHash: string;
  }): Promise<{
    shouldCall: boolean;
    status: string;
  }>;
  callOpenAI(body: FormData): Promise<Response>;
  storeCandidate(input: {
    storagePath: string;
    output: Blob;
    contentSha256: string;
    width: number;
    height: number;
  }): Promise<void>;
  complete(input: {
    candidateId: string;
    requestHash: string;
    providerRequestId: string;
    storagePath: string;
    fileSize: number;
    width: number;
    height: number;
    contentSha256: string;
    accountedMicrousd: number;
    accountingBasis: "provider_usage_estimate" | "conservative_reservation";
    providerUsage: MomoMediaAiProviderUsage | null;
  }): Promise<void>;
  fail(input: {
    candidateId: string;
    requestHash: string;
    errorCode: string;
  }): Promise<void>;
};

type NormalizedRequest = {
  restaurantId: string;
  assetId: string;
  goal: MomoMediaAiGoal;
  preset: MomoImagePresetKey;
  quality: MomoMediaAiQuality;
  altText: string;
  idempotencyKey: string;
};

class PublicRouteError extends Error {
  readonly publicCode: string;
  readonly httpStatus: number;

  constructor(
    publicCode: string,
    httpStatus: number,
  ) {
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
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

async function parseRequest(request: Request): Promise<NormalizedRequest> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith(
    "application/json",
  )) {
    throw new PublicRouteError("invalid_request", 415);
  }
  const configuredLength = Number(request.headers.get("content-length") || 0);
  if (
    !Number.isFinite(configuredLength)
    || configuredLength < 0
    || configuredLength > MOMO_MEDIA_AI_MAX_BODY_BYTES
  ) throw new PublicRouteError("invalid_request", 413);

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    throw new PublicRouteError("invalid_request", 400);
  }
  if (utf8Bytes(raw) > MOMO_MEDIA_AI_MAX_BODY_BYTES) {
    throw new PublicRouteError("invalid_request", 413);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isPlainObject(parsed)) throw new Error();
    body = parsed;
  } catch {
    throw new PublicRouteError("invalid_request", 400);
  }
  const allowedKeys = new Set([
    "restaurantId",
    "assetId",
    "goal",
    "preset",
    "quality",
    "altText",
    "standingAutomation",
    "idempotencyKey",
  ]);
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) {
    throw new PublicRouteError("invalid_request", 400);
  }

  const headerKey = request.headers.get("idempotency-key")?.trim() || "";
  const bodyKey =
    typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  if (
    !isMomoMediaAiUuid(body.restaurantId)
    || !isMomoMediaAiUuid(body.assetId)
    || !isMomoMediaAiGoal(body.goal)
    || !isMomoMediaAiPreset(body.preset)
    || !isMomoMediaAiQuality(body.quality)
    || typeof body.altText !== "string"
    || body.altText !== body.altText.trim()
    || body.altText.length < 1
    || body.altText.length > 280
    || body.standingAutomation !== true
    || !isMomoMediaAiIdempotencyKey(bodyKey)
    || (headerKey && headerKey !== bodyKey)
  ) throw new PublicRouteError("invalid_request", 400);

  return {
    restaurantId: body.restaurantId.toLowerCase(),
    assetId: body.assetId.toLowerCase(),
    goal: body.goal,
    preset: body.preset,
    quality: body.quality,
    altText: body.altText,
    idempotencyKey: bodyKey,
  };
}

async function sha256Text(value: string): Promise<string> {
  return momoBytesSha256(new TextEncoder().encode(value));
}

function stableRequestSnapshot(
  input: NormalizedRequest,
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    restaurantId: input.restaurantId,
    assetId: input.assetId,
    goal: input.goal,
    preset: input.preset,
    quality: input.quality,
    altText: input.altText,
    model: MOMO_MEDIA_AI_MODEL,
    promptVersion: MOMO_MEDIA_AI_PROMPT_VERSION,
  };
}

function imagePrompt(goal: MomoMediaAiGoal): string {
  return [
    "Create one high-quality, faithful professional food-photo edit of the provided image.",
    `Allowed improvement: ${MOMO_MEDIA_AI_GOALS[goal].instruction}`,
    "Preserve the exact real dish, ingredients, portions, plating, packaging, restaurant marks, readable text, and factual setting already present in the source.",
    "Do not invent, remove, replace, or materially reshape any food, ingredient, garnish, sauce, steam, serving item, logo, label, person, price, claim, text overlay, or promotional prop.",
    "Do not make the portion appear larger or the food appear materially different from the original.",
    "Retain all readable text and branding exactly; do not add any text.",
    "Keep the result photorealistic, natural rather than overprocessed, and suitable only as a private Team candidate for human inspection.",
  ].join(" ");
}

function providerForm(
  input: NormalizedRequest,
  reservation: MomoMediaAiReservation,
  source: Uint8Array,
): FormData {
  const form = new FormData();
  const extension = reservation.sourceMimeType === "image/png"
    ? "png"
    : reservation.sourceMimeType === "image/webp"
      ? "webp"
      : "jpg";
  form.set("model", MOMO_MEDIA_AI_MODEL);
  form.set(
    "image[]",
    new File([momoOwnedArrayBuffer(source)], `momo-source.${extension}`, {
      type: reservation.sourceMimeType,
    }),
  );
  form.set("prompt", imagePrompt(input.goal));
  form.set(
    "size",
    `${reservation.outputWidth}x${reservation.outputHeight}`,
  );
  form.set("quality", input.quality);
  form.set("output_format", "png");
  form.set("background", "opaque");
  form.set("moderation", "auto");
  form.set("n", "1");
  // gpt-image-2 processes edit inputs at high fidelity by default and does not
  // accept an input_fidelity override.
  return form;
}

async function boundedProviderJson(
  response: Response,
): Promise<Record<string, unknown> | null> {
  const length = Number(response.headers.get("content-length") || 0);
  if (
    !Number.isFinite(length)
    || length < 0
    || length > MAX_PROVIDER_RESPONSE_BYTES
  ) return null;
  try {
    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > MAX_PROVIDER_RESPONSE_BYTES) {
      return null;
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function providerImage(
  payload: Record<string, unknown>,
): Promise<Uint8Array | null> {
  const data = payload.data;
  if (!Array.isArray(data) || data.length !== 1 || !isPlainObject(data[0])) {
    return null;
  }
  return decodeMomoBase64Png(
    data[0].b64_json,
    MOMO_MEDIA_AI_MAX_OUTPUT_BYTES,
  );
}

function nonNegativeSafeInteger(value: unknown): number | null {
  return Number.isSafeInteger(value) && Number(value) >= 0
    ? Number(value)
    : null;
}

function providerAccounting(
  payload: Record<string, unknown>,
  conservativeMicrousd: number,
): {
  accountedMicrousd: number;
  accountingBasis: "provider_usage_estimate" | "conservative_reservation";
  providerUsage: MomoMediaAiProviderUsage | null;
} {
  const usage = isPlainObject(payload.usage) ? payload.usage : null;
  const details = usage && isPlainObject(usage.input_tokens_details)
    ? usage.input_tokens_details
    : null;
  const inputTokens = nonNegativeSafeInteger(usage?.input_tokens);
  const imageTokens = nonNegativeSafeInteger(details?.image_tokens);
  const textTokens = nonNegativeSafeInteger(details?.text_tokens);
  const outputTokens = nonNegativeSafeInteger(usage?.output_tokens);
  const totalTokens = nonNegativeSafeInteger(usage?.total_tokens);
  if (
    inputTokens !== null
    && imageTokens !== null
    && textTokens !== null
    && outputTokens !== null
    && totalTokens !== null
    && inputTokens === imageTokens + textTokens
    && totalTokens === inputTokens + outputTokens
  ) {
    // Standard GPT Image 2 rates at the locked pricing version:
    // text input $5/M, image input $8/M, image output $30/M.
    const estimatedMicrousd =
      textTokens * 5 + imageTokens * 8 + outputTokens * 30;
    if (
      Number.isSafeInteger(estimatedMicrousd)
      && estimatedMicrousd > 0
      && estimatedMicrousd <= conservativeMicrousd
      && estimatedMicrousd
        <= MOMO_MEDIA_AI_AUTHORIZATION_THRESHOLD_MICROUSD
    ) {
      return {
        accountedMicrousd: estimatedMicrousd,
        accountingBasis: "provider_usage_estimate",
        providerUsage: {
          input_tokens: inputTokens,
          input_tokens_details: {
            image_tokens: imageTokens,
            text_tokens: textTokens,
          },
          output_tokens: outputTokens,
          total_tokens: totalTokens,
        },
      };
    }
  }
  return {
    accountedMicrousd: conservativeMicrousd,
    accountingBasis: "conservative_reservation",
    providerUsage: null,
  };
}

async function safeFail(
  dependencies: MomoMediaAiDependencies,
  reservation: MomoMediaAiReservation,
  requestHash: string,
  errorCode: string,
): Promise<void> {
  try {
    await dependencies.fail({
      candidateId: reservation.candidateId,
      requestHash,
      errorCode,
    });
  } catch {
    // The caller receives a safe terminal error. A later Team readback, not an
    // automatic provider retry, is the only recovery path for uncertain state.
  }
}

function mapReservationError(error: unknown): PublicRouteError {
  const message = error instanceof Error ? error.message : "";
  if (
    /source_not_eligible|current_rights_review_required|storage_object_required/i
      .test(message)
  ) return new PublicRouteError("source_not_ready", 409);
  if (
    /authorization_required|authorization_threshold_reached|pilot_wallet_exhausted/i
      .test(message)
  ) {
    return new PublicRouteError("media_ai_authorization_required", 409);
  }
  if (/failed_attempt_cannot_replay/i.test(message)) {
    return new PublicRouteError("media_ai_previous_attempt_failed", 409);
  }
  if (/asset_attempt_active/i.test(message)) {
    return new PublicRouteError("media_ai_in_progress", 409);
  }
  if (/idempotency_conflict/i.test(message)) {
    return new PublicRouteError("idempotency_conflict", 409);
  }
  if (/runtime_disabled|wallet_disabled/i.test(message)) {
    return new PublicRouteError("media_ai_disabled", 503);
  }
  return new PublicRouteError("source_not_ready", 409);
}

export function createMomoMediaAiPostHandler(
  dependencies: MomoMediaAiDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    let postBoundaryContext: {
      reservation: MomoMediaAiReservation;
      requestHash: string;
    } | null = null;
    const hashBytes = dependencies.hashBytes || momoBytesSha256;
    try {
      if (!originAllowed(request)) {
        throw new PublicRouteError("cross_site_request_rejected", 403);
      }
      const actor = await dependencies.authenticate();
      if (
        !actor
        || actor.role !== "team"
        || !actor.restaurantId
        || !isMomoMediaAiUuid(actor.restaurantId)
        || !isMomoMediaAiUuid(actor.userId)
      ) throw new PublicRouteError("team_access_required", 403);
      if (!dependencies.enabled) {
        throw new PublicRouteError("media_ai_disabled", 503);
      }
      if (!dependencies.providerConfigured) {
        throw new PublicRouteError(
          "media_ai_configuration_unavailable",
          503,
        );
      }

      const input = await parseRequest(request);
      if (input.restaurantId !== actor.restaurantId.toLowerCase()) {
        throw new PublicRouteError("team_access_required", 403);
      }
      const controlPreflight = evaluateMomoAiTaskPreflight({
        taskKind: "media_improvement",
        actorRole: actor.role,
        restaurantId: input.restaurantId,
        authorizedRestaurantId: actor.restaurantId,
        requestedTools: ["openai.images.edit"],
        consequence: "private_media_candidate",
        estimatedMicrousd: MOMO_MEDIA_AI_AUTHORIZATION_THRESHOLD_MICROUSD,
        authorizedMicrousd: MOMO_AI_MAX_AUTOMATIC_MICROUSD,
        untrustedDataBoundary: true,
        humanReviewRequired: true,
        externalActionAuthorized: false,
      });
      if (!controlPreflight.allowed) {
        throw new PublicRouteError(
          controlPreflight.decision === "approval_required"
            ? "media_ai_budget_approval_required"
            : "media_ai_control_preflight_denied",
          controlPreflight.decision === "approval_required" ? 409 : 403,
        );
      }
      let providerAccessible = false;
      try {
        providerAccessible = await dependencies.verifyProviderAccess();
      } catch {
        providerAccessible = false;
      }
      if (!providerAccessible) {
        throw new PublicRouteError(
          "media_ai_configuration_unavailable",
          503,
        );
      }
      const idempotencyHash = await sha256Text(
        `${input.restaurantId}:${input.idempotencyKey}`,
      );
      const requestHash = await sha256Text(
        JSON.stringify(stableRequestSnapshot(input)),
      );

      let reservation: MomoMediaAiReservation;
      try {
        reservation = await dependencies.reserve({
          restaurantId: input.restaurantId,
          assetId: input.assetId,
          goal: input.goal,
          preset: input.preset,
          quality: input.quality,
          altText: input.altText,
          idempotencyHash,
          requestHash,
          processingAttestation: MOMO_MEDIA_AI_PROCESSING_ATTESTATION,
        });
      } catch (error) {
        throw mapReservationError(error);
      }

      if (
        reservation.status === "pending_review"
        || reservation.status === "approved"
        || reservation.status === "rejected"
      ) {
        return noStore({
          candidateId: reservation.candidateId,
          status: reservation.status,
          replayed: true,
        }, 200);
      }
      if (reservation.status === "provider_running") {
        throw new PublicRouteError("media_ai_in_progress", 409);
      }
      if (
        !isMomoMediaAiProviderSize(
          reservation.outputWidth,
          reservation.outputHeight,
        )
      ) {
        await safeFail(
          dependencies,
          reservation,
          requestHash,
          "provider_size_invalid",
        );
        throw new PublicRouteError("media_ai_configuration_unavailable", 503);
      }

      let sourceBytes: Uint8Array;
      try {
        const source = await dependencies.downloadSource(
          reservation.sourceStoragePath,
        );
        if (
          source.size !== reservation.sourceFileSize
          || source.size < 1
          || source.size > MOMO_MEDIA_AI_MAX_SOURCE_BYTES
        ) throw new Error();
        sourceBytes = new Uint8Array(await source.arrayBuffer());
        const sourceInspection = await inspectMomoImageBytesFully(sourceBytes);
        if (
          sourceInspection?.mimeType !== reservation.sourceMimeType
          || await hashBytes(sourceBytes)
            !== reservation.sourceContentSha256
        ) throw new Error();
      } catch {
        await safeFail(
          dependencies,
          reservation,
          requestHash,
          "source_verification_failed",
        );
        throw new PublicRouteError("source_not_ready", 409);
      }

      let start: { shouldCall: boolean; status: string };
      try {
        start = await dependencies.startProvider({
          candidateId: reservation.candidateId,
          requestHash,
        });
      } catch {
        await safeFail(
          dependencies,
          reservation,
          requestHash,
          "provider_start_failed",
        );
        throw new PublicRouteError(
          "candidate_finalization_uncertain",
          503,
        );
      }
      if (!start.shouldCall) {
        throw new PublicRouteError(
          start.status === "failed"
            ? "source_not_ready"
            : "media_ai_in_progress",
          409,
        );
      }
      postBoundaryContext = { reservation, requestHash };

      let providerResponse: Response;
      try {
        providerResponse = await dependencies.callOpenAI(
          providerForm(input, reservation, sourceBytes),
        );
      } catch (error) {
        const code = error instanceof DOMException && error.name === "TimeoutError"
          ? "provider_timeout"
          : "provider_request_failed";
        await safeFail(dependencies, reservation, requestHash, code);
        throw new PublicRouteError(
          code === "provider_timeout" ? "provider_timeout" : "provider_rejected",
          502,
        );
      }

      const providerPayload = await boundedProviderJson(providerResponse);
      if (!providerResponse.ok) {
        await safeFail(
          dependencies,
          reservation,
          requestHash,
          "provider_rejected",
        );
        throw new PublicRouteError("provider_rejected", 502);
      }
      const providerRequestId =
        providerResponse.headers.get("x-request-id")?.trim()
        || providerResponse.headers.get("openai-request-id")?.trim()
        || "";
      const outputBytes = providerPayload
        ? await providerImage(providerPayload)
        : null;
      const accounting = providerPayload
        ? providerAccounting(providerPayload, reservation.reservedMicrousd)
        : providerAccounting({}, reservation.reservedMicrousd);
      const dimensions = outputBytes
        ? inspectMomoPngBytes(outputBytes)
        : null;
      if (
        !providerRequestId
        || providerRequestId.length > 200
        || !outputBytes
        || !dimensions
        || dimensions.width !== reservation.outputWidth
        || dimensions.height !== reservation.outputHeight
      ) {
        await safeFail(
          dependencies,
          reservation,
          requestHash,
          "provider_output_invalid",
        );
        throw new PublicRouteError("provider_output_invalid", 502);
      }

      const contentSha256 = await hashBytes(outputBytes);
      if (!isMomoMediaAiHash(contentSha256)) {
        await safeFail(
          dependencies,
          reservation,
          requestHash,
          "provider_output_invalid",
        );
        throw new PublicRouteError("provider_output_invalid", 502);
      }
      const storagePath =
        `restaurants/${input.restaurantId}/renditions/${reservation.candidateId}/${contentSha256}.png`;
      const output = new Blob(
        [momoOwnedArrayBuffer(outputBytes)],
        { type: "image/png" },
      );
      try {
        await dependencies.storeCandidate({
          storagePath,
          output,
          contentSha256,
          width: dimensions.width,
          height: dimensions.height,
        });
      } catch {
        await safeFail(
          dependencies,
          reservation,
          requestHash,
          "candidate_storage_failed",
        );
        throw new PublicRouteError("candidate_storage_failed", 502);
      }

      try {
        await dependencies.complete({
          candidateId: reservation.candidateId,
          requestHash,
          providerRequestId,
          storagePath,
          fileSize: output.size,
          width: dimensions.width,
          height: dimensions.height,
          contentSha256,
          ...accounting,
        });
      } catch {
        throw new PublicRouteError(
          "candidate_finalization_uncertain",
          503,
        );
      }

      return noStore({
        candidateId: reservation.candidateId,
        status: "pending_review",
        model: MOMO_MEDIA_AI_MODEL,
        width: dimensions.width,
        height: dimensions.height,
        contentSha256,
        accountedMicrousd: accounting.accountedMicrousd,
        accountingBasis: accounting.accountingBasis,
        externalWriteAllowed: false,
      }, 200);
    } catch (error) {
      if (error instanceof PublicRouteError) {
        return noStore({ error: error.publicCode }, error.httpStatus);
      }
      if (postBoundaryContext) {
        await safeFail(
          dependencies,
          postBoundaryContext.reservation,
          postBoundaryContext.requestHash,
          "unexpected_post_provider_failure",
        );
        return noStore(
          { error: "candidate_finalization_uncertain" },
          503,
        );
      }
      return noStore({ error: "media_ai_configuration_unavailable" }, 503);
    }
  };
}
