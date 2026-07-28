export type MomoEditableImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export function momoOwnedArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export function detectMomoImageMimeType(
  bytes: Uint8Array,
): MomoEditableImageMimeType | null {
  if (
    bytes.length >= 3
    && bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes[2] === 0xff
  ) return "image/jpeg";
  if (
    bytes.length >= 8
    && bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47
    && bytes[4] === 0x0d
    && bytes[5] === 0x0a
    && bytes[6] === 0x1a
    && bytes[7] === 0x0a
  ) return "image/png";
  if (
    bytes.length >= 16
    && bytes[0] === 0x52
    && bytes[1] === 0x49
    && bytes[2] === 0x46
    && bytes[3] === 0x46
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50
    && bytes[12] === 0x56
    && bytes[13] === 0x50
    && bytes[14] === 0x38
    && [0x20, 0x4c, 0x58].includes(bytes[15])
  ) return "image/webp";
  return null;
}

export async function momoBytesSha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    momoOwnedArrayBuffer(bytes),
  );
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function inspectMomoPngBytes(bytes: Uint8Array): {
  width: number;
  height: number;
} | null {
  if (detectMomoImageMimeType(bytes) !== "image/png" || bytes.length < 24) {
    return null;
  }
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  const ihdrLength = view.getUint32(8, false);
  const ihdrType = String.fromCharCode(
    bytes[12],
    bytes[13],
    bytes[14],
    bytes[15],
  );
  if (ihdrLength !== 13 || ihdrType !== "IHDR") return null;
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  if (!width || !height) return null;
  return { width, height };
}

export function decodeMomoBase64Png(
  value: unknown,
  maxBytes: number,
): Uint8Array | null {
  if (
    typeof value !== "string"
    || !value
    || value.length > Math.ceil(maxBytes / 3) * 4 + 8
    || value.length % 4 !== 0
    || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)
  ) return null;
  try {
    const decoded = atob(value);
    if (!decoded.length || decoded.length > maxBytes) return null;
    const bytes = Uint8Array.from(decoded, (character) =>
      character.charCodeAt(0));
    return inspectMomoPngBytes(bytes) ? bytes : null;
  } catch {
    return null;
  }
}
