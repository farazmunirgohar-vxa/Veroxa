import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  decodeVeroxaPrivateMediaImageWithHost,
  inspectVeroxaPrivateMediaImageWithHost,
} from "../../../../../veroxa-private-media-host-image-decode.ts";
import { createMomoMediaRecoveryHandler } from "./core.ts";

export const runtime = "edge";

const HMAC_SECRET = /^[0-9a-f]{64}$/u;

function serverSupabaseConfig(): { url: string; secretKey: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const canonicalSecret = process.env.SUPABASE_SECRET_KEY?.trim();
  const secretKey = canonicalSecret?.startsWith("sb_secret_")
    ? canonicalSecret
    : "";
  if (!rawUrl || !secretKey) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" ||
      !url.hostname.endsWith(".supabase.co") || url.username || url.password ||
      url.port || (url.pathname !== "/" && url.pathname !== "") ||
      url.search || url.hash) return null;
    return { url: url.origin, secretKey };
  } catch {
    return null;
  }
}

function adminClient(
  config: { url: string; secretKey: string } | null,
): SupabaseClient | null {
  return config
    ? createClient(config.url, config.secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          "x-veroxa-server-purpose": "momo-media-ingestion-recovery-v1",
        },
      },
    })
    : null;
}

const wakeHmacSecret =
  process.env.VEROXA_MOMO_CONTENT_AI_DISPATCH_HMAC_SECRET?.trim() || "";
const admin = adminClient(serverSupabaseConfig());

function requireAdmin(): SupabaseClient {
  if (!admin) throw new Error("media_recovery_configuration_unavailable");
  return admin;
}

const handler = createMomoMediaRecoveryHandler({
  configured: Boolean(admin && HMAC_SECRET.test(wakeHmacSecret)),
  wakeHmacSecret,
  randomUUID: () => crypto.randomUUID(),
  decodeHighResolutionImage: decodeVeroxaPrivateMediaImageWithHost,
  inspectImageWithHost: inspectVeroxaPrivateMediaImageWithHost,
  async claim(input) {
    const { data, error } = await requireAdmin().rpc(
      "veroxa_claim_momo_media_ingestion_v1",
      {
        p_wake_nonce: input.wakeNonce,
        p_signed_at_ms: input.signedAtMs,
        p_lease_token: input.leaseToken,
      },
    );
    if (error) throw new Error("media_recovery_claim_rejected");
    return data;
  },
  async download(storagePath) {
    const { data, error } = await requireAdmin().storage
      .from("restaurant-media")
      .download(storagePath, undefined, { cache: "no-store" });
    if (error || !data) throw new Error("media_recovery_download_failed");
    return data;
  },
  async info(storagePath) {
    const { data, error } = await requireAdmin().storage
      .from("restaurant-media")
      .info(storagePath);
    if (error || !data) throw new Error("media_recovery_info_failed");
    return {
      id: data.id,
      version: data.version,
      name: data.name,
      bucketId: data.bucketId,
      size: data.size ?? -1,
      contentType: data.contentType ?? "",
    };
  },
  async complete(input) {
    const { data, error } = await requireAdmin().rpc(
      "veroxa_complete_momo_media_ingestion_v1",
      {
        p_outbox_id: input.outboxId,
        p_lease_token: input.leaseToken,
        p_storage_object_id: input.storageObjectId,
        p_storage_object_version: input.storageObjectVersion,
        p_detected_mime: input.detectedMime,
        p_file_size: input.fileSize,
        p_width: input.width,
        p_height: input.height,
        p_content_sha256: input.contentSha256,
        p_verification_snapshot: input.verificationSnapshot,
        p_verification_canonical: input.verificationCanonical,
        p_verification_sha256: input.verificationSha256,
        p_idempotency_hash: input.idempotencyHash,
      },
    );
    if (error) throw new Error("media_recovery_completion_rejected");
    return data;
  },
  async fail(input) {
    const { data, error } = await requireAdmin().rpc(
      "veroxa_fail_momo_media_ingestion_v1",
      {
        p_outbox_id: input.outboxId,
        p_lease_token: input.leaseToken,
        p_failure_code: input.failureCode,
        p_retryable: input.retryable,
        p_evidence_snapshot: input.evidenceSnapshot,
        p_evidence_canonical: input.evidenceCanonical,
        p_evidence_sha256: input.evidenceSha256,
        p_idempotency_sha256: input.idempotencySha256,
      },
    );
    if (error) throw new Error("media_recovery_failure_recording_rejected");
    return data;
  },
});

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}
