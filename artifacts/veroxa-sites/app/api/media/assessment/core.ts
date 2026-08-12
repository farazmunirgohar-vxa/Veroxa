import {
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_ASPECT_RATIO,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_ASPECT_RATIO,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_SOURCE_BYTES,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MODEL,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_PROMPT_VERSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_RESERVED_MICROUSD,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_SCHEMA_VERSION,
  buildVeroxaPrivateMediaAssessmentProviderBody,
  canRunVeroxaPrivateMediaAssessment,
  parseVeroxaPrivateMediaAssessment,
  parseVeroxaPrivateMediaProviderResponse,
  veroxaPrivateMediaAssessmentSafetyIdentifier,
  type VeroxaMediaEvidenceClass,
  type VeroxaPrivateMediaAssessment,
  type VeroxaPrivateMediaMimeType,
} from "../../../veroxa-private-media-assessment.ts";
import {
  VEROXA_PRIVATE_MEDIA_FULL_DECODE_MIME_TYPES,
  fullyDecodeVeroxaPrivateMediaImage,
  veroxaPrivateMediaImageVerificationMode,
  type VeroxaPrivateMediaFullDecodeMimeType,
} from "../../../veroxa-private-media-image-decode.ts";
import { momoCanonicalJson } from "../../../momo-canonical-json.ts";
import {
  inspectMomoImageBytesFully,
  momoBytesSha256,
} from "../../../momo-image-bytes.ts";
import {
  MOMO_AI_MAX_AUTOMATIC_MICROUSD,
  evaluateMomoAiTaskPreflight,
} from "../../../momo-ai-task-preflight.ts";

const MAX_BODY_BYTES = 2_048;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SHA256 = /^[0-9a-f]{64}$/u;
const IDEMPOTENCY = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,199}$/u;

export type VeroxaPrivateMediaAssessmentActor = {
  role: "team" | "client";
  restaurantId: string | null;
  userId: string;
};

export type VeroxaPrivateMediaAssessmentReservation = {
  assessmentId: string;
  status: "reserved" | "provider_running" | "completed" | "failed";
  requestHash: string;
  sourceStoragePath: string;
  sourceStorageObjectId: string;
  sourceStorageObjectVersion: string;
  sourceMimeType: VeroxaPrivateMediaMimeType;
  sourceFileSize: number;
  sourceWidth: number;
  sourceHeight: number;
  sourceContentSha256: string;
  evidenceClass: VeroxaMediaEvidenceClass;
  reusedFromAssessmentId: string | null;
  providerResponseId: string | null;
  output: VeroxaPrivateMediaAssessment | null;
  outputSha256: string | null;
  reservedMicrousd: number;
};

export type VeroxaPrivateMediaAssessmentDependencies = {
  enabled: boolean;
  providerConfigured: boolean;
  authenticate(): Promise<VeroxaPrivateMediaAssessmentActor | null>;
  reserve(input: {
    restaurantId: string;
    assetId: string;
    requestHash: string;
    idempotencyHash: string;
    model: typeof VEROXA_PRIVATE_MEDIA_ASSESSMENT_MODEL;
    promptVersion: typeof VEROXA_PRIVATE_MEDIA_ASSESSMENT_PROMPT_VERSION;
    schemaVersion: typeof VEROXA_PRIVATE_MEDIA_ASSESSMENT_SCHEMA_VERSION;
    reservedMicrousd: number;
  }): Promise<VeroxaPrivateMediaAssessmentReservation>;
  start(input: {
    assessmentId: string;
    requestHash: string;
  }): Promise<{ assessmentId: string; shouldCall: boolean; status: string }>;
  downloadSource(storagePath: string): Promise<Blob>;
  sourceInfo(storagePath: string): Promise<{
    id: string;
    version: string;
    name: string;
    bucketId: string;
    size: number;
    contentType: string;
  }>;
  callOpenAI(rawBody: string): Promise<Response>;
  complete(input: {
    assessmentId: string;
    requestHash: string;
    providerResponseId: string;
    output: VeroxaPrivateMediaAssessment;
    outputCanonical: string;
    outputSha256: string;
    accountedMicrousd: number;
    accountingBasis:
      | "provider_usage_estimate"
      | "conservative_reservation";
    providerUsage: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    } | null;
  }): Promise<{ assessmentId: string; status: string }>;
  fail(input: {
    assessmentId: string;
    requestHash: string;
    providerResponseId: string | null;
    errorCode: string;
    providerCalled: boolean;
    accountedMicrousd: number | null;
    providerUsage: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    } | null;
  }): Promise<void>;
};

type NormalizedRequest = {
  restaurantId: string;
  assetId: string;
  idempotencyKey: string;
  privateAssessmentRequested: true;
};

class PublicError extends Error {
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

async function boundedText(request: Request): Promise<string> {
  const header = request.headers.get("content-length");
  const declared = header === null ? null : Number(header);
  if (declared !== null && (!Number.isSafeInteger(declared) || declared < 0 ||
    declared > MAX_BODY_BYTES)) throw new PublicError("invalid_request", 413);
  if (!request.body) throw new PublicError("invalid_request", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel("request_too_large");
        throw new PublicError("invalid_request", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!total || (declared !== null && declared !== total)) {
    throw new PublicError("invalid_request", 400);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new PublicError("invalid_request", 400);
  }
}

async function parseRequest(request: Request): Promise<NormalizedRequest> {
  if (request.method !== "POST" || !request.headers.get("content-type")
    ?.toLowerCase().startsWith("application/json")) {
    throw new PublicError("invalid_request", request.method === "POST" ? 415 : 405);
  }
  let value: unknown;
  try {
    value = JSON.parse(await boundedText(request));
  } catch (error) {
    if (error instanceof PublicError) throw error;
    throw new PublicError("invalid_request", 400);
  }
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== [
    "assetId",
    "idempotencyKey",
    "privateAssessmentRequested",
    "restaurantId",
  ].sort().join(",") || !UUID.test(String(value.restaurantId)) ||
    !UUID.test(String(value.assetId)) ||
    value.privateAssessmentRequested !== true ||
    typeof value.idempotencyKey !== "string" ||
    !IDEMPOTENCY.test(value.idempotencyKey)) {
    throw new PublicError("invalid_request", 400);
  }
  const headerKey = request.headers.get("idempotency-key")?.trim() || "";
  if (headerKey && headerKey !== value.idempotencyKey) {
    throw new PublicError("invalid_request", 400);
  }
  return {
    restaurantId: String(value.restaurantId).toLowerCase(),
    assetId: String(value.assetId).toLowerCase(),
    idempotencyKey: value.idempotencyKey,
    privateAssessmentRequested: true,
  };
}

async function safeFail(
  dependencies: VeroxaPrivateMediaAssessmentDependencies,
  reservation: VeroxaPrivateMediaAssessmentReservation,
  input: Omit<Parameters<VeroxaPrivateMediaAssessmentDependencies["fail"]>[0],
    "assessmentId" | "requestHash">,
): Promise<void> {
  try {
    await dependencies.fail({
      assessmentId: reservation.assessmentId,
      requestHash: reservation.requestHash,
      ...input,
    });
  } catch {
    // The database reservation remains the authority for later reconciliation.
  }
}

function completedResponse(
  reservation: VeroxaPrivateMediaAssessmentReservation,
): Response {
  const assessment = reservation.output
    ? parseVeroxaPrivateMediaAssessment(reservation.output)
    : null;
  if (!assessment) {
    throw new PublicError("private_media_assessment_unavailable", 503);
  }
  return noStore({
    assessmentId: reservation.assessmentId,
    status: "completed",
    assessment,
    reused: reservation.reusedFromAssessmentId !== null,
    reusedFromAssessmentId: reservation.reusedFromAssessmentId,
    sourceContentSha256: reservation.sourceContentSha256,
    externalWriteAllowed: false,
  }, 200);
}

function mapReservationError(error: unknown): PublicError {
  const message = error instanceof Error ? error.message : "";
  if (/budget|authorization|wallet/iu.test(message)) {
    return new PublicError("private_media_assessment_budget_unavailable", 409);
  }
  if (/idempotency_conflict/iu.test(message)) {
    return new PublicError("idempotency_conflict", 409);
  }
  if (/rights|consent|source|association/iu.test(message)) {
    return new PublicError("private_media_assessment_source_not_ready", 409);
  }
  return new PublicError("private_media_assessment_unavailable", 503);
}

export function createVeroxaPrivateMediaAssessmentHandler(
  dependencies: VeroxaPrivateMediaAssessmentDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    let reservation: VeroxaPrivateMediaAssessmentReservation | null = null;
    let providerCalled = false;
    try {
      if (!originAllowed(request)) {
        throw new PublicError("cross_site_request_rejected", 403);
      }
      const actor = await dependencies.authenticate();
      if (!actor || !actor.restaurantId || !UUID.test(actor.restaurantId) ||
        !UUID.test(actor.userId) ||
        (actor.role !== "client" && actor.role !== "team")) {
        throw new PublicError("private_media_access_required", 403);
      }
      const input = await parseRequest(request);
      if (input.restaurantId !== actor.restaurantId.toLowerCase()) {
        throw new PublicError("private_media_access_required", 403);
      }
      if (!dependencies.enabled) {
        throw new PublicError("private_media_assessment_disabled", 503);
      }
      if (!dependencies.providerConfigured) {
        throw new PublicError(
          "private_media_assessment_configuration_unavailable",
          503,
        );
      }
      const preflight = evaluateMomoAiTaskPreflight({
        taskKind: "private_media_assessment",
        actorRole: actor.role,
        restaurantId: input.restaurantId,
        authorizedRestaurantId: actor.restaurantId,
        requestedTools: ["openai.responses.create"],
        consequence: "private_draft",
        estimatedMicrousd:
          VEROXA_PRIVATE_MEDIA_ASSESSMENT_RESERVED_MICROUSD,
        authorizedMicrousd: MOMO_AI_MAX_AUTOMATIC_MICROUSD,
        untrustedDataBoundary: true,
        humanReviewRequired: true,
        externalActionAuthorized: false,
      });
      if (!preflight.allowed) {
        throw new PublicError(
          preflight.decision === "approval_required"
            ? "private_media_assessment_budget_approval_required"
            : "private_media_assessment_control_denied",
          preflight.decision === "approval_required" ? 409 : 403,
        );
      }
      const idempotencyHash = await momoBytesSha256(new TextEncoder().encode(
        `${input.restaurantId}:${input.idempotencyKey}`,
      ));
      const requestHash = await momoBytesSha256(new TextEncoder().encode(
        momoCanonicalJson({
          assetId: input.assetId,
          model: VEROXA_PRIVATE_MEDIA_ASSESSMENT_MODEL,
          promptVersion: VEROXA_PRIVATE_MEDIA_ASSESSMENT_PROMPT_VERSION,
          schemaVersion: VEROXA_PRIVATE_MEDIA_ASSESSMENT_SCHEMA_VERSION,
        }),
      ));
      try {
        reservation = await dependencies.reserve({
          restaurantId: input.restaurantId,
          assetId: input.assetId,
          requestHash,
          idempotencyHash,
          model: VEROXA_PRIVATE_MEDIA_ASSESSMENT_MODEL,
          promptVersion: VEROXA_PRIVATE_MEDIA_ASSESSMENT_PROMPT_VERSION,
          schemaVersion: VEROXA_PRIVATE_MEDIA_ASSESSMENT_SCHEMA_VERSION,
          reservedMicrousd:
            VEROXA_PRIVATE_MEDIA_ASSESSMENT_RESERVED_MICROUSD,
        });
      } catch (error) {
        throw mapReservationError(error);
      }
      if (!UUID.test(reservation.assessmentId) ||
        (reservation.requestHash !== requestHash &&
          reservation.reusedFromAssessmentId === null) ||
        !SHA256.test(reservation.sourceContentSha256) ||
        reservation.reservedMicrousd !==
          VEROXA_PRIVATE_MEDIA_ASSESSMENT_RESERVED_MICROUSD ||
        !Number.isSafeInteger(
          reservation.sourceWidth * reservation.sourceHeight,
        ) ||
        !canRunVeroxaPrivateMediaAssessment({
          evidenceClass: reservation.evidenceClass,
          currentRightsReserved: true,
          perRequestIntent: input.privateAssessmentRequested,
        })) {
        throw new PublicError("private_media_assessment_source_not_ready", 409);
      }
      if (reservation.status === "completed") return completedResponse(reservation);
      if (reservation.status === "provider_running") {
        throw new PublicError("private_media_assessment_in_progress", 409);
      }
      if (reservation.status === "failed") {
        throw new PublicError("private_media_assessment_previous_attempt_failed", 409);
      }
      if (!VEROXA_PRIVATE_MEDIA_FULL_DECODE_MIME_TYPES.includes(
        reservation.sourceMimeType as VeroxaPrivateMediaFullDecodeMimeType,
      )) {
        await safeFail(dependencies, reservation, {
          providerResponseId: null,
          errorCode: "source_full_decode_unsupported",
          providerCalled: false,
          accountedMicrousd: null,
          providerUsage: null,
        });
        throw new PublicError(
          "private_media_assessment_format_unsupported",
          409,
        );
      }

      let sourceBytes: Uint8Array;
      try {
        const [source, info] = await Promise.all([
          dependencies.downloadSource(reservation.sourceStoragePath),
          dependencies.sourceInfo(reservation.sourceStoragePath),
        ]);
        if (source.size !== reservation.sourceFileSize ||
          info.id !== reservation.sourceStorageObjectId ||
          info.version !== reservation.sourceStorageObjectVersion ||
          info.name !== reservation.sourceStoragePath ||
          info.bucketId !== "restaurant-media" ||
          info.size !== reservation.sourceFileSize ||
          info.contentType.split(";", 1)[0].trim() !==
            reservation.sourceMimeType ||
          source.size < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_SOURCE_BYTES ||
          source.size > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES) {
          throw new Error();
        }
        sourceBytes = new Uint8Array(await source.arrayBuffer());
        const inspection = await inspectMomoImageBytesFully(sourceBytes);
        const ratio = inspection ? inspection.width / inspection.height : 0;
        const verificationMode = inspection
          ? veroxaPrivateMediaImageVerificationMode(
            inspection.width,
            inspection.height,
          )
          : null;
        if (!inspection || inspection.mimeType !== reservation.sourceMimeType ||
          inspection.width !== reservation.sourceWidth ||
          inspection.height !== reservation.sourceHeight ||
          inspection.width < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION ||
          inspection.height < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION ||
          inspection.width > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION ||
          inspection.height > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION ||
          ratio < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_ASPECT_RATIO ||
          ratio > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_ASPECT_RATIO ||
          await momoBytesSha256(sourceBytes) !==
            reservation.sourceContentSha256 ||
          verificationMode === null ||
          (verificationMode === "full_decode" &&
            !fullyDecodeVeroxaPrivateMediaImage({
              bytes: sourceBytes,
              mimeType: reservation.sourceMimeType,
              expectedWidth: reservation.sourceWidth,
              expectedHeight: reservation.sourceHeight,
            }))) throw new Error();
      } catch {
        await safeFail(dependencies, reservation, {
          providerResponseId: null,
          errorCode: "source_verification_failed",
          providerCalled: false,
          accountedMicrousd: null,
          providerUsage: null,
        });
        throw new PublicError("private_media_assessment_source_not_ready", 409);
      }

      let start: { assessmentId: string; shouldCall: boolean; status: string };
      try {
        start = await dependencies.start({
          assessmentId: reservation.assessmentId,
          requestHash: reservation.requestHash,
        });
      } catch {
        throw new PublicError("private_media_assessment_unavailable", 503);
      }
      if (start.assessmentId !== reservation.assessmentId || !start.shouldCall) {
        throw new PublicError(
          start.status === "completed"
            ? "private_media_assessment_refresh_required"
            : "private_media_assessment_in_progress",
          409,
        );
      }

      const safetyIdentifier =
        await veroxaPrivateMediaAssessmentSafetyIdentifier(actor.userId);
      const rawBody = JSON.stringify(
        buildVeroxaPrivateMediaAssessmentProviderBody({
          assessmentId: reservation.assessmentId,
          requestHash: reservation.requestHash,
          sourceContentSha256: reservation.sourceContentSha256,
          sourceMimeType: reservation.sourceMimeType,
          sourceBytes,
          safetyIdentifier,
        }),
      );
      providerCalled = true;
      let providerResponse: Response;
      try {
        providerResponse = await dependencies.callOpenAI(rawBody);
      } catch {
        await safeFail(dependencies, reservation, {
          providerResponseId: null,
          errorCode: "provider_request_failed",
          providerCalled: true,
          accountedMicrousd:
            VEROXA_PRIVATE_MEDIA_ASSESSMENT_RESERVED_MICROUSD,
          providerUsage: null,
        });
        throw new PublicError("private_media_assessment_unavailable", 502);
      }
      const result = await parseVeroxaPrivateMediaProviderResponse(
        providerResponse,
        {
          assessmentId: reservation.assessmentId,
          requestHash: reservation.requestHash,
          sourceContentSha256: reservation.sourceContentSha256,
        },
      );
      if (!result) {
        await safeFail(dependencies, reservation, {
          providerResponseId: null,
          errorCode: providerResponse.ok
            ? "provider_output_invalid"
            : "provider_rejected",
          providerCalled: true,
          accountedMicrousd:
            VEROXA_PRIVATE_MEDIA_ASSESSMENT_RESERVED_MICROUSD,
          providerUsage: null,
        });
        throw new PublicError("private_media_assessment_unavailable", 502);
      }
      if (!result.validOutput) {
        await safeFail(dependencies, reservation, {
          providerResponseId: result.providerResponseId,
          errorCode: "provider_output_invalid",
          providerCalled: true,
          accountedMicrousd: result.exceedsReservation
            ? result.accountedMicrousd
            : VEROXA_PRIVATE_MEDIA_ASSESSMENT_RESERVED_MICROUSD,
          providerUsage: result.exceedsReservation
            ? result.providerUsage
            : null,
        });
        throw new PublicError("private_media_assessment_unavailable", 502);
      }
      if (result.exceedsReservation) {
        await safeFail(dependencies, reservation, {
          providerResponseId: result.providerResponseId,
          errorCode: "provider_usage_exceeded_reservation",
          providerCalled: true,
          accountedMicrousd: result.accountedMicrousd,
          providerUsage: result.providerUsage,
        });
        throw new PublicError("private_media_assessment_unavailable", 502);
      }
      const completed = await dependencies.complete({
        assessmentId: reservation.assessmentId,
        requestHash: reservation.requestHash,
        providerResponseId: result.providerResponseId,
        output: result.assessment,
        outputCanonical: result.outputCanonical,
        outputSha256: result.outputSha256,
        accountedMicrousd: result.accountedMicrousd,
        accountingBasis: result.accountingBasis,
        providerUsage: result.providerUsage,
      });
      if (completed.assessmentId !== reservation.assessmentId ||
        completed.status !== "completed") {
        throw new PublicError("private_media_assessment_unavailable", 503);
      }
      return noStore({
        assessmentId: reservation.assessmentId,
        status: "completed",
        assessment: result.assessment,
        reused: false,
        reusedFromAssessmentId: null,
        sourceContentSha256: reservation.sourceContentSha256,
        externalWriteAllowed: false,
      }, 200);
    } catch (error) {
      if (error instanceof PublicError) {
        return noStore({ error: error.message }, error.status);
      }
      if (providerCalled && reservation) {
        await safeFail(dependencies, reservation, {
          providerResponseId: null,
          errorCode: "assessment_finalization_uncertain",
          providerCalled: true,
          accountedMicrousd:
            VEROXA_PRIVATE_MEDIA_ASSESSMENT_RESERVED_MICROUSD,
          providerUsage: null,
        });
      }
      return noStore({ error: "private_media_assessment_unavailable" }, 503);
    }
  };
}
