import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getMomoContentAiLifecycleBridgeConfig,
  invokeMomoContentAiLifecycleBridge,
} from "../../../momo-content-ai-lifecycle-bridge";
import { getServerVeroxaContext } from "../../../veroxa-supabase-server";
import {
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_SOURCE_BYTES,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_MODEL,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_PROMPT_VERSION,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_RESERVED_MICROUSD,
  VEROXA_PRIVATE_MEDIA_ASSESSMENT_SCHEMA_VERSION,
  VEROXA_PRIVATE_MEDIA_MIME_TYPES,
  parseVeroxaPrivateMediaAssessment,
  type VeroxaMediaEvidenceClass,
  type VeroxaPrivateMediaMimeType,
} from "../../../veroxa-private-media-assessment";
import {
  createVeroxaPrivateMediaAssessmentHandler,
  type VeroxaPrivateMediaAssessmentReservation,
} from "./core";
import {
  createVeroxaPrivateMediaStorageImageDecoder,
} from "../../../veroxa-private-media-supabase-image-decode";

export const runtime = "edge";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SHA256 = /^[0-9a-f]{64}$/u;
const RESPONSE_ID = /^resp_[A-Za-z0-9_-]{8,195}$/u;
const openAiKey = process.env.OPENAI_API_KEY?.trim() || "";

function record(value: unknown): Record<string, unknown> | null {
  const row = Array.isArray(value) ? value[0] : value;
  return typeof row === "object" && row !== null && !Array.isArray(row)
    ? row as Record<string, unknown>
    : null;
}

function optionalUuid(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return typeof value === "string" && UUID.test(value)
    ? value.toLowerCase()
    : undefined;
}

function reservation(value: unknown): VeroxaPrivateMediaAssessmentReservation {
  const row = record(value);
  const statuses = new Set(["reserved", "provider_running", "completed", "failed"]);
  const sourceMimeType = row?.source_mime_type;
  const evidenceClass = row?.evidence_class;
  const reused = optionalUuid(row?.reused_from_assessment_id);
  const responseId = row?.provider_response_id === null ||
      row?.provider_response_id === undefined
    ? null
    : typeof row.provider_response_id === "string" &&
        RESPONSE_ID.test(row.provider_response_id)
      ? row.provider_response_id
      : undefined;
  const outputSha256 = row?.output_sha256 === null ||
      row?.output_sha256 === undefined
    ? null
    : typeof row.output_sha256 === "string" && SHA256.test(row.output_sha256)
      ? row.output_sha256
      : undefined;
  const output = row?.output_payload === null ||
      row?.output_payload === undefined
    ? null
    : parseVeroxaPrivateMediaAssessment(row.output_payload);
  const size = Number(row?.source_file_size);
  const width = Number(row?.source_width);
  const height = Number(row?.source_height);
  if (!row || typeof row.assessment_id !== "string" ||
    !UUID.test(row.assessment_id) ||
    typeof row.assessment_status !== "string" ||
    !statuses.has(row.assessment_status) ||
    typeof row.request_hash !== "string" || !SHA256.test(row.request_hash) ||
    typeof row.source_storage_path !== "string" ||
    row.source_storage_path.length < 40 || row.source_storage_path.length > 500 ||
    typeof row.source_storage_object_id !== "string" ||
    !UUID.test(row.source_storage_object_id) ||
    typeof row.source_storage_object_version !== "string" ||
    row.source_storage_object_version.length < 1 ||
    row.source_storage_object_version.length > 200 ||
    typeof sourceMimeType !== "string" ||
    !VEROXA_PRIVATE_MEDIA_MIME_TYPES.includes(
      sourceMimeType as VeroxaPrivateMediaMimeType,
    ) || !Number.isSafeInteger(size) ||
    size < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_SOURCE_BYTES ||
    size > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_SOURCE_BYTES ||
    !Number.isSafeInteger(width) ||
    width < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION ||
    width > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION ||
    !Number.isSafeInteger(height) ||
    height < VEROXA_PRIVATE_MEDIA_ASSESSMENT_MIN_DIMENSION ||
    height > VEROXA_PRIVATE_MEDIA_ASSESSMENT_MAX_DIMENSION ||
    !Number.isSafeInteger(width * height) ||
    typeof row.source_content_sha256 !== "string" ||
    !SHA256.test(row.source_content_sha256) ||
    (evidenceClass !== "development_proxy" && evidenceClass !== "real_owner") ||
    reused === undefined || responseId === undefined || outputSha256 === undefined ||
    row.reserved_microusd !==
      VEROXA_PRIVATE_MEDIA_ASSESSMENT_RESERVED_MICROUSD ||
    (row.assessment_status === "completed" && (!output || !outputSha256)) ||
    (row.assessment_status !== "completed" && output !== null)) {
    throw new Error("private_media_assessment_reservation_invalid");
  }
  return {
    assessmentId: row.assessment_id.toLowerCase(),
    status: row.assessment_status as
      VeroxaPrivateMediaAssessmentReservation["status"],
    requestHash: row.request_hash,
    sourceStoragePath: row.source_storage_path,
    sourceStorageObjectId: row.source_storage_object_id.toLowerCase(),
    sourceStorageObjectVersion: row.source_storage_object_version,
    sourceMimeType: sourceMimeType as VeroxaPrivateMediaMimeType,
    sourceFileSize: size,
    sourceWidth: width,
    sourceHeight: height,
    sourceContentSha256: row.source_content_sha256,
    evidenceClass: evidenceClass as VeroxaMediaEvidenceClass,
    reusedFromAssessmentId: reused,
    providerResponseId: responseId,
    output,
    outputSha256,
    reservedMicrousd: row.reserved_microusd,
  };
}

function dependencies(
  client: SupabaseClient,
  actor: {
    role: "team" | "client";
    restaurantId: string | null;
    userId: string;
  },
) {
  const bridgeConfig = getMomoContentAiLifecycleBridgeConfig();
  return {
    enabled: process.env.VEROXA_MOMO_CONTENT_AI_ENABLED === "true",
    providerConfigured: Boolean(openAiKey && bridgeConfig),
    decodeHighResolutionImage: createVeroxaPrivateMediaStorageImageDecoder({
      client,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    }),
    async authenticate() {
      return actor;
    },
    async reserve(input: {
      restaurantId: string;
      assetId: string;
      requestHash: string;
      idempotencyHash: string;
      model: typeof VEROXA_PRIVATE_MEDIA_ASSESSMENT_MODEL;
      promptVersion: typeof VEROXA_PRIVATE_MEDIA_ASSESSMENT_PROMPT_VERSION;
      schemaVersion: typeof VEROXA_PRIVATE_MEDIA_ASSESSMENT_SCHEMA_VERSION;
      reservedMicrousd: number;
    }) {
      if (!bridgeConfig) throw new Error("assessment_bridge_unavailable");
      return reservation(await invokeMomoContentAiLifecycleBridge<unknown>(
        client,
        bridgeConfig,
        { operation: "reserve_private_assessment", ...input },
      ));
    },
    async start(input: { assessmentId: string; requestHash: string }) {
      if (!bridgeConfig) throw new Error("assessment_bridge_unavailable");
      const row = record(await invokeMomoContentAiLifecycleBridge<unknown>(
        client,
        bridgeConfig,
        { operation: "start_private_assessment", ...input },
      ));
      if (!row || row.assessment_id !== input.assessmentId ||
        typeof row.should_call !== "boolean" ||
        typeof row.assessment_status !== "string") {
        throw new Error("private_media_assessment_start_invalid");
      }
      return {
        assessmentId: row.assessment_id,
        shouldCall: row.should_call,
        status: row.assessment_status,
      };
    },
    async downloadSource(storagePath: string) {
      const { data, error } = await client.storage.from("restaurant-media")
        .download(storagePath);
      if (error || !data) throw new Error("private_media_download_failed");
      return data;
    },
    async sourceInfo(storagePath: string) {
      const { data, error } = await client.storage.from("restaurant-media")
        .info(storagePath);
      if (error || !data) throw new Error("private_media_info_failed");
      return {
        id: data.id,
        version: data.version,
        name: data.name,
        bucketId: data.bucketId,
        size: data.size ?? -1,
        contentType: data.contentType ?? "",
      };
    },
    async callOpenAI(rawBody: string) {
      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${openAiKey}`,
          "content-type": "application/json",
          "x-stainless-retry-count": "0",
        },
        body: rawBody,
        redirect: "manual",
        signal: AbortSignal.timeout(45_000),
      });
      if (response.status >= 300 && response.status < 400) {
        throw new Error("private_media_provider_redirect_rejected");
      }
      return response;
    },
    async complete(input: Record<string, unknown>) {
      if (!bridgeConfig) throw new Error("assessment_bridge_unavailable");
      const row = record(await invokeMomoContentAiLifecycleBridge<unknown>(
        client,
        bridgeConfig,
        { operation: "complete_private_assessment", ...input },
      ));
      if (!row || typeof row.assessment_id !== "string" ||
        typeof row.assessment_status !== "string") {
        throw new Error("private_media_assessment_completion_invalid");
      }
      return {
        assessmentId: row.assessment_id,
        status: row.assessment_status,
      };
    },
    async fail(input: Record<string, unknown>) {
      if (!bridgeConfig) throw new Error("assessment_bridge_unavailable");
      const result = await invokeMomoContentAiLifecycleBridge<unknown>(
        client,
        bridgeConfig,
        { operation: "fail_private_assessment", ...input },
      );
      if (result !== input.assessmentId) {
        throw new Error("private_media_assessment_failure_invalid");
      }
    },
  };
}

export async function POST(request: Request): Promise<Response> {
  const context = await getServerVeroxaContext();
  if (!context) {
    return createVeroxaPrivateMediaAssessmentHandler({
      ...dependencies({} as SupabaseClient, {
        role: "client",
        restaurantId: null,
        userId: "00000000-0000-4000-8000-000000000000",
      }),
      authenticate: async () => null,
    })(request);
  }
  return createVeroxaPrivateMediaAssessmentHandler(dependencies(
    context.client,
    {
      role: context.access.role,
      restaurantId: context.access.restaurantId,
      userId: context.userId,
    },
  ))(request);
}
