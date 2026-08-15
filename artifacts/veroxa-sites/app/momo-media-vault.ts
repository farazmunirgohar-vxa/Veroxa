import { momoBytesSha256 } from "./momo-image-bytes.ts";
import type { VeroxaPrivateMediaMimeType } from
  "./veroxa-private-media-assessment.ts";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;

export type VeroxaMediaVaultObject = {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
  checksums: { sha256?: ArrayBuffer };
};

export type VeroxaMediaVaultObjectBody = VeroxaMediaVaultObject & {
  arrayBuffer(): Promise<ArrayBuffer>;
};

export type VeroxaMediaVaultBucket = {
  head(key: string): Promise<VeroxaMediaVaultObject | null>;
  get(key: string): Promise<VeroxaMediaVaultObjectBody | null>;
  put(
    key: string,
    value: Uint8Array,
    options: {
      onlyIf: Headers;
      httpMetadata: {
        contentType: string;
        contentDisposition: string;
        cacheControl: string;
      };
      customMetadata: Record<string, string>;
      sha256: ArrayBuffer;
    },
  ): Promise<VeroxaMediaVaultObject | null>;
};

export type VeroxaMediaVaultArchiveInput = {
  restaurantId: string;
  assetId: string;
  sourceStorageObjectId: string;
  sourceStorageObjectVersion: string;
  mimeType: VeroxaPrivateMediaMimeType;
  contentSha256: string;
  bytes: Uint8Array;
};

export type VeroxaMediaVaultReceipt = {
  vaultKey: string;
  vaultVersion: string;
  vaultEtag: string;
  fileSize: number;
  contentSha256: string;
  outcome: "created" | "already_verified";
};

export class VeroxaMediaVaultError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(code: string, retryable: boolean) {
    super(code);
    this.code = code;
    this.retryable = retryable;
  }
}

function bytesFromHex(value: string): ArrayBuffer {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes.buffer;
}

function hexFromBytes(value: ArrayBuffer | undefined): string | null {
  if (!value) return null;
  return [...new Uint8Array(value)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function veroxaMediaVaultKey(input: {
  restaurantId: string;
  contentSha256: string;
  mimeType: VeroxaPrivateMediaMimeType;
}): string {
  if (!UUID.test(input.restaurantId) || !SHA256.test(input.contentSha256) ||
    !["image/jpeg", "image/png"].includes(input.mimeType)) {
    throw new VeroxaMediaVaultError("media_vault_input_invalid", false);
  }
  const extension = input.mimeType === "image/png" ? "png" : "jpg";
  return `private-originals/v1/restaurants/${input.restaurantId}/sha256/` +
    `${input.contentSha256}.${extension}`;
}

function metadataMatches(
  object: VeroxaMediaVaultObject,
  input: VeroxaMediaVaultArchiveInput,
  key: string,
): boolean {
  const metadata = object.customMetadata ?? {};
  return object.key === key && object.size === input.bytes.byteLength &&
    object.httpMetadata?.contentType === input.mimeType &&
    metadata.schemaVersion === "1" &&
    metadata.restaurantId === input.restaurantId &&
    metadata.contentSha256 === input.contentSha256 &&
    metadata.fileSize === String(input.bytes.byteLength) &&
    hexFromBytes(object.checksums.sha256) === input.contentSha256 &&
    object.version.length > 0 && object.version.length <= 200 &&
    object.etag.length > 0 && object.etag.length <= 200;
}

async function verifyStoredObject(
  bucket: VeroxaMediaVaultBucket,
  input: VeroxaMediaVaultArchiveInput,
  key: string,
): Promise<VeroxaMediaVaultObjectBody> {
  let stored: VeroxaMediaVaultObjectBody | null;
  try {
    stored = await bucket.get(key);
  } catch {
    throw new VeroxaMediaVaultError("media_vault_readback_unavailable", true);
  }
  if (!stored || !metadataMatches(stored, input, key)) {
    throw new VeroxaMediaVaultError("media_vault_object_conflict", false);
  }
  let storedBytes: Uint8Array;
  try {
    storedBytes = new Uint8Array(await stored.arrayBuffer());
  } catch {
    throw new VeroxaMediaVaultError("media_vault_readback_unavailable", true);
  }
  if (storedBytes.byteLength !== input.bytes.byteLength ||
    await momoBytesSha256(storedBytes) !== input.contentSha256) {
    throw new VeroxaMediaVaultError("media_vault_readback_hash_mismatch", false);
  }
  return stored;
}

export async function archiveVeroxaPrivateMediaOriginal(
  bucket: VeroxaMediaVaultBucket,
  input: VeroxaMediaVaultArchiveInput,
): Promise<VeroxaMediaVaultReceipt> {
  if (!UUID.test(input.restaurantId) || !UUID.test(input.assetId) ||
    !UUID.test(input.sourceStorageObjectId) ||
    input.sourceStorageObjectVersion.length < 1 ||
    input.sourceStorageObjectVersion.length > 200 ||
    !SHA256.test(input.contentSha256) || input.bytes.byteLength < 1 ||
    await momoBytesSha256(input.bytes) !== input.contentSha256) {
    throw new VeroxaMediaVaultError("media_vault_input_invalid", false);
  }
  const vaultKey = veroxaMediaVaultKey(input);
  let existing: VeroxaMediaVaultObject | null;
  try {
    existing = await bucket.head(vaultKey);
  } catch {
    throw new VeroxaMediaVaultError("media_vault_unavailable", true);
  }
  if (existing && !metadataMatches(existing, input, vaultKey)) {
    throw new VeroxaMediaVaultError("media_vault_object_conflict", false);
  }

  let outcome: VeroxaMediaVaultReceipt["outcome"] = "already_verified";
  if (!existing) {
    let written: VeroxaMediaVaultObject | null;
    try {
      written = await bucket.put(vaultKey, input.bytes, {
        // R2 supports If-None-Match: * for an atomic create-only write.
        // A content-addressed key can therefore never be overwritten here.
        onlyIf: new Headers({ "if-none-match": "*" }),
        httpMetadata: {
          contentType: input.mimeType,
          contentDisposition: "attachment",
          cacheControl: "private, no-store, max-age=0",
        },
        customMetadata: {
          schemaVersion: "1",
          restaurantId: input.restaurantId,
          contentSha256: input.contentSha256,
          fileSize: String(input.bytes.byteLength),
        },
        sha256: bytesFromHex(input.contentSha256),
      });
    } catch {
      throw new VeroxaMediaVaultError("media_vault_write_unavailable", true);
    }
    // A null write means another invocation won the create-only race. The
    // shared object still has to pass the same exact-byte verification.
    if (written) outcome = "created";
  }

  const verified = await verifyStoredObject(bucket, input, vaultKey);
  return {
    vaultKey,
    vaultVersion: verified.version,
    vaultEtag: verified.etag,
    fileSize: verified.size,
    contentSha256: input.contentSha256,
    outcome,
  };
}
