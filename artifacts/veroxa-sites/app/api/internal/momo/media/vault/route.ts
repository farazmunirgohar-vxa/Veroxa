import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { archiveVeroxaPrivateMediaOriginal } from
  "../../../../../momo-media-vault.ts";
import { createMomoMediaVaultHandler } from "./core.ts";

export const runtime = "edge";

const HMAC_SECRET = /^[0-9a-f]{64}$/u;

function serverSupabaseConfig(): { url: string; secretKey: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim() || "";
  if (!rawUrl || !secretKey.startsWith("sb_secret_")) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") ||
      url.username || url.password || url.port ||
      (url.pathname !== "/" && url.pathname !== "") || url.search ||
      url.hash) return null;
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
      global: { headers: {
        "x-veroxa-server-purpose": "momo-private-media-vault-v1",
      } },
    })
    : null;
}

const wakeHmacSecret =
  process.env.VEROXA_MOMO_CONTENT_AI_DISPATCH_HMAC_SECRET?.trim() || "";
const admin = adminClient(serverSupabaseConfig());

function requireAdmin(): SupabaseClient {
  if (!admin) throw new Error("media_vault_configuration_unavailable");
  return admin;
}

function createHandler(bucket: R2Bucket | undefined) {
  return createMomoMediaVaultHandler({
  configured: Boolean(admin && bucket && HMAC_SECRET.test(wakeHmacSecret)),
  wakeHmacSecret,
  randomUUID: () => crypto.randomUUID(),
  async claim(input) {
    const { data, error } = await requireAdmin().rpc(
      "veroxa_claim_momo_media_vault_v1",
      {
        p_wake_nonce: input.wakeNonce,
        p_signed_at_ms: input.signedAtMs,
        p_lease_token: input.leaseToken,
      },
    );
    if (error) throw new Error("media_vault_claim_rejected");
    return data;
  },
  async download(storagePath) {
    const { data, error } = await requireAdmin().storage
      .from("restaurant-media")
      .download(storagePath, undefined, { cache: "no-store" });
    if (error || !data) throw new Error("media_vault_source_download_failed");
    return data;
  },
  async info(storagePath) {
    const { data, error } = await requireAdmin().storage
      .from("restaurant-media").info(storagePath);
    if (error || !data) throw new Error("media_vault_source_info_failed");
    return {
      id: data.id,
      version: data.version,
      name: data.name,
      bucketId: data.bucketId,
      size: data.size ?? -1,
      contentType: data.contentType ?? "",
    };
  },
  async archive(input) {
    if (!bucket) throw new Error("media_vault_bucket_unavailable");
    return archiveVeroxaPrivateMediaOriginal(bucket, input);
  },
  async complete(input) {
    const { data, error } = await requireAdmin().rpc(
      "veroxa_complete_momo_media_vault_v1",
      {
        p_outbox_id: input.outboxId,
        p_lease_token: input.leaseToken,
        p_vault_key: input.vaultKey,
        p_vault_version: input.vaultVersion,
        p_vault_etag: input.vaultEtag,
        p_file_size: input.fileSize,
        p_content_sha256: input.contentSha256,
        p_verification_snapshot: input.verificationSnapshot,
        p_verification_canonical: input.verificationCanonical,
        p_verification_sha256: input.verificationSha256,
      },
    );
    if (error) throw new Error("media_vault_completion_rejected");
    return data;
  },
  async fail(input) {
    const { data, error } = await requireAdmin().rpc(
      "veroxa_fail_momo_media_vault_v1",
      {
        p_outbox_id: input.outboxId,
        p_lease_token: input.leaseToken,
        p_failure_code: input.failureCode,
        p_retryable: input.retryable,
        p_evidence_snapshot: input.evidenceSnapshot,
        p_evidence_canonical: input.evidenceCanonical,
        p_evidence_sha256: input.evidenceSha256,
      },
    );
    if (error) throw new Error("media_vault_failure_rejected");
    return data;
  },
  });
}

export async function POST(request: Request): Promise<Response> {
  // Keep the runtime-owned protocol import lazy so Node contract tests can
  // load the route module without pretending a Cloudflare binding exists.
  const { env } = await import("cloudflare:workers");
  return createHandler(env.BUCKET)(request);
}
