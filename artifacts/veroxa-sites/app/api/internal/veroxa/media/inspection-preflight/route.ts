import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  detectMomoImageMimeType,
  inspectMomoImageBytesFully,
  momoBytesSha256,
} from "../../../../../momo-image-bytes.ts";
import {
  createVeroxaPrivateMediaStorageImageInspector,
} from "../../../../../veroxa-private-media-supabase-image-decode.ts";
import {
  createMediaInspectionPreflightHandler,
  type MediaInspectionPreflightFixture,
} from "./core.ts";

export const runtime = "edge";

const HMAC_SECRET = /^[0-9a-f]{64}$/u;
const FIXTURE_BASE64 =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRQBAwQEBQQFCQUFCRQNCw0UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFP/AABEIAAIAAwMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APEP2g/+SpXv/Xhpv/pBb18NlH+5Q/7e/wDSmfZZl/vdT1P/2Q==";
const FIXTURE_SHA256 =
  "8e597e6ec4a639870aea7291a8e4c0cedbedc38377c8cf91704ef82a2673c865";
const FIXTURE_PATH =
  `__veroxa_system/image-inspection-preflight/v1/${FIXTURE_SHA256}.jpg`;

function serverSupabaseConfig(): { url: string; secretKey: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const canonicalSecret = process.env.SUPABASE_SECRET_KEY?.trim();
  const secretKey = canonicalSecret?.startsWith("sb_secret_")
    ? canonicalSecret
    : "";
  if (!rawUrl || !secretKey) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") ||
      url.username || url.password || url.port ||
      (url.pathname !== "/" && url.pathname !== "") || url.search || url.hash) {
      return null;
    }
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
          "x-veroxa-server-purpose": "media-inspection-preflight-v1",
        },
      },
    })
    : null;
}

function base64Bytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function copiedArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

const fixtureBytes = base64Bytes(FIXTURE_BASE64);

async function readFixture(
  client: SupabaseClient,
): Promise<MediaInspectionPreflightFixture | null> {
  const storage = client.storage.from("restaurant-media");
  const before = await storage.info(FIXTURE_PATH);
  if (before.error || !before.data || typeof before.data.id !== "string" ||
    typeof before.data.version !== "string" || before.data.name !== FIXTURE_PATH ||
    before.data.bucketId !== "restaurant-media" || before.data.size !== fixtureBytes.byteLength ||
    before.data.contentType?.split(";", 1)[0].trim() !== "image/jpeg") {
    return null;
  }
  const downloaded = await storage.download(FIXTURE_PATH, undefined, {
    cache: "no-store",
  });
  if (downloaded.error || !downloaded.data) return null;
  const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
  const decoded = await inspectMomoImageBytesFully(bytes);
  if (await momoBytesSha256(bytes) !== FIXTURE_SHA256 ||
    detectMomoImageMimeType(bytes) !== "image/jpeg" || !decoded ||
    decoded.mimeType !== "image/jpeg" || decoded.width !== 3 || decoded.height !== 2) {
    return null;
  }
  const after = await storage.info(FIXTURE_PATH);
  if (after.error || !after.data || after.data.id !== before.data.id ||
    after.data.version !== before.data.version || after.data.size !== before.data.size ||
    after.data.contentType !== before.data.contentType) return null;
  return {
    bytes,
    mimeType: "image/jpeg",
    storagePath: FIXTURE_PATH,
    storageObjectId: before.data.id.toLowerCase(),
    storageObjectVersion: before.data.version,
    sha256: FIXTURE_SHA256,
  };
}

async function ensureFixture(client: SupabaseClient): Promise<MediaInspectionPreflightFixture> {
  const expected = await inspectMomoImageBytesFully(fixtureBytes);
  if (await momoBytesSha256(fixtureBytes) !== FIXTURE_SHA256 || !expected ||
    expected.mimeType !== "image/jpeg" || expected.width !== 3 || expected.height !== 2) {
    throw new Error("media_inspection_fixture_integrity_invalid");
  }
  const existing = await readFixture(client);
  if (existing) return existing;
  const upload = await client.storage.from("restaurant-media").upload(
    FIXTURE_PATH,
    new Blob([copiedArrayBuffer(fixtureBytes)], { type: "image/jpeg" }),
    {
      cacheControl: "31536000",
      contentType: "image/jpeg",
      upsert: false,
    },
  );
  // A concurrent canary may win the create-only race. In either case, only a
  // full metadata-and-byte readback is accepted as the fixture source.
  if (upload.error && !await readFixture(client)) {
    throw new Error("media_inspection_fixture_create_failed");
  }
  const verified = await readFixture(client);
  if (!verified) throw new Error("media_inspection_fixture_readback_failed");
  return verified;
}

const configuration = serverSupabaseConfig();
const admin = adminClient(configuration);
const hmacSecret =
  process.env.VEROXA_MOMO_CONTENT_AI_DISPATCH_HMAC_SECRET?.trim() || "";
const inspect = createVeroxaPrivateMediaStorageImageInspector({
  client: admin,
  supabaseUrl: configuration?.url,
});

function requireAdmin(): SupabaseClient {
  if (!admin) throw new Error("media_inspection_preflight_configuration_unavailable");
  return admin;
}

const handler = createMediaInspectionPreflightHandler({
  configured: Boolean(admin && HMAC_SECRET.test(hmacSecret)),
  wakeHmacSecret: hmacSecret,
  inspect,
  ensureFixture: () => ensureFixture(requireAdmin()),
  async claim(input) {
    const { data, error } = await requireAdmin().rpc(
      "veroxa_claim_media_inspection_preflight_v1",
      {
        p_wake_nonce: input.wakeNonce,
        p_signed_at_ms: input.signedAtMs,
      },
    );
    if (error) throw new Error("media_inspection_preflight_claim_rejected");
    return data;
  },
  async complete(input) {
    const { error } = await requireAdmin().rpc(
      "veroxa_complete_media_inspection_preflight_v1",
      {
        p_run_id: input.runId,
        p_state: input.state,
        p_failure_code: input.failureCode,
        p_diagnostics: input.diagnostics,
        p_fixture_sha256: input.fixtureSha256,
      },
    );
    if (error) throw new Error("media_inspection_preflight_completion_rejected");
  },
});

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}
