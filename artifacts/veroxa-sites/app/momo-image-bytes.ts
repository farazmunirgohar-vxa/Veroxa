export type MomoEditableImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export type MomoImageInspection = {
  mimeType: MomoEditableImageMimeType;
  width: number;
  height: number;
};

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

type ImageDimensions = {
  width: number;
  height: number;
};

type PngInspection = ImageDimensions & {
  bitDepth: number;
  colorType: number;
  interlace: 0 | 1;
  imageDataChunks: Uint8Array[];
};

const PNG_SIGNATURE = [
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a,
] as const;

const PNG_CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1
        ? 0xedb88320 ^ (value >>> 1)
        : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function pngCrc32(
  bytes: Uint8Array,
  start: number,
  end: number,
): number {
  let crc = 0xffffffff;
  for (let offset = start; offset < end; offset += 1) {
    crc = PNG_CRC_TABLE[(crc ^ bytes[offset]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function asciiFourCc(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3],
  );
}

function validPngChunkType(bytes: Uint8Array, offset: number): boolean {
  for (let index = offset; index < offset + 4; index += 1) {
    const byte = bytes[index];
    if (
      !(byte >= 0x41 && byte <= 0x5a)
      && !(byte >= 0x61 && byte <= 0x7a)
    ) return false;
  }
  // The PNG reserved bit (the third chunk-type byte) must be zero.
  return (bytes[offset + 2] & 0x20) === 0;
}

function validPngHeader(
  bytes: Uint8Array,
  dataOffset: number,
): Omit<PngInspection, "imageDataChunks"> | null {
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  const width = view.getUint32(dataOffset, false);
  const height = view.getUint32(dataOffset + 4, false);
  const bitDepth = bytes[dataOffset + 8];
  const colorType = bytes[dataOffset + 9];
  const validBitDepths: Record<number, readonly number[]> = {
    0: [1, 2, 4, 8, 16],
    2: [8, 16],
    3: [1, 2, 4, 8],
    4: [8, 16],
    6: [8, 16],
  };
  if (
    !width
    || !height
    || width > 0x7fffffff
    || height > 0x7fffffff
    || !validBitDepths[colorType]?.includes(bitDepth)
    || bytes[dataOffset + 10] !== 0
    || bytes[dataOffset + 11] !== 0
    || ![0, 1].includes(bytes[dataOffset + 12])
  ) return null;
  return {
    width,
    height,
    bitDepth,
    colorType,
    interlace: bytes[dataOffset + 12] as 0 | 1,
  };
}

function inspectPng(bytes: Uint8Array): PngInspection | null {
  if (
    bytes.length < 57
    || PNG_SIGNATURE.some((byte, index) => bytes[index] !== byte)
  ) return null;
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  let offset: number = PNG_SIGNATURE.length;
  let header: Omit<PngInspection, "imageDataChunks"> | null = null;
  let colorType = -1;
  let bitDepth = -1;
  let sawPalette = false;
  let sawImageData = false;
  let imageDataEnded = false;
  let imageDataBytes = 0;
  const imageDataChunks: Uint8Array[] = [];
  const zlibHeader: number[] = [];

  while (offset < bytes.length) {
    if (bytes.length - offset < 12) return null;
    const chunkLength = view.getUint32(offset, false);
    if (chunkLength > bytes.length - offset - 12) return null;
    const typeOffset = offset + 4;
    const dataOffset = offset + 8;
    const dataEnd = dataOffset + chunkLength;
    const chunkEnd = dataEnd + 4;
    if (!validPngChunkType(bytes, typeOffset)) return null;
    const chunkType = asciiFourCc(bytes, typeOffset);
    if (
      pngCrc32(bytes, typeOffset, dataEnd)
        !== view.getUint32(dataEnd, false)
    ) return null;

    if (!header && chunkType !== "IHDR") return null;
    if (sawImageData && chunkType !== "IDAT" && chunkType !== "IEND") {
      imageDataEnded = true;
    }

    if (chunkType === "IHDR") {
      if (header || offset !== PNG_SIGNATURE.length || chunkLength !== 13) {
        return null;
      }
      header = validPngHeader(bytes, dataOffset);
      if (!header) return null;
      bitDepth = bytes[dataOffset + 8];
      colorType = bytes[dataOffset + 9];
    } else if (chunkType === "PLTE") {
      if (
        sawPalette
        || sawImageData
        || chunkLength === 0
        || chunkLength % 3 !== 0
        || chunkLength > 768
        || colorType === 0
        || colorType === 4
        || (colorType === 3 && chunkLength / 3 > 2 ** bitDepth)
      ) return null;
      sawPalette = true;
    } else if (chunkType === "IDAT") {
      if (
        imageDataEnded
        || colorType === 3 && !sawPalette
      ) return null;
      sawImageData = true;
      imageDataBytes += chunkLength;
      imageDataChunks.push(bytes.subarray(dataOffset, dataEnd));
      for (
        let index = dataOffset;
        index < dataEnd && zlibHeader.length < 2;
        index += 1
      ) {
        zlibHeader.push(bytes[index]);
      }
    } else if (chunkType === "IEND") {
      if (
        chunkLength !== 0
        || !header
        || !sawImageData
        || imageDataBytes < 6
        || zlibHeader.length !== 2
        || (zlibHeader[0] & 0x0f) !== 8
        || (zlibHeader[0] >> 4) > 7
        || ((zlibHeader[0] << 8) | zlibHeader[1]) % 31 !== 0
        || (zlibHeader[1] & 0x20) !== 0
        || chunkEnd !== bytes.length
      ) return null;
      return { ...header, imageDataChunks };
    } else if ((bytes[typeOffset] & 0x20) === 0) {
      // Reject unknown critical chunks; ancillary chunks remain CRC-checked.
      return null;
    }
    offset = chunkEnd;
  }
  return null;
}

function pngScanlinePlan(
  inspection: PngInspection,
): Array<{ rowBytes: number; rows: number }> | null {
  const channels = {
    0: 1,
    2: 3,
    3: 1,
    4: 2,
    6: 4,
  }[inspection.colorType];
  if (!channels) return null;
  const bitsPerPixel = channels * inspection.bitDepth;
  const passes = inspection.interlace === 0
    ? [[0, 0, 1, 1] as const]
    : [
      [0, 0, 8, 8] as const,
      [4, 0, 8, 8] as const,
      [0, 4, 4, 8] as const,
      [2, 0, 4, 4] as const,
      [0, 2, 2, 4] as const,
      [1, 0, 2, 2] as const,
      [0, 1, 1, 2] as const,
    ];
  const plan: Array<{ rowBytes: number; rows: number }> = [];
  let decodedBytes = 0;
  for (const [startX, startY, stepX, stepY] of passes) {
    if (inspection.width <= startX || inspection.height <= startY) continue;
    const passWidth = Math.ceil((inspection.width - startX) / stepX);
    const rows = Math.ceil((inspection.height - startY) / stepY);
    const rowBytes = Math.ceil(passWidth * bitsPerPixel / 8);
    const passBytes = (rowBytes + 1) * rows;
    if (
      !Number.isSafeInteger(passBytes)
      || passBytes < 1
      || !Number.isSafeInteger(decodedBytes + passBytes)
    ) return null;
    decodedBytes += passBytes;
    plan.push({ rowBytes, rows });
  }
  return plan.length ? plan : null;
}

/**
 * Returns the exact number of bytes the streaming PNG verifier must consume.
 * This is an arithmetic/format check, not an allocation or acceptance ceiling:
 * pixel bytes are decompressed and checked incrementally below.
 */
export function momoPngDecodedStreamByteLength(input: {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  interlace: 0 | 1;
}): number | null {
  const plan = pngScanlinePlan({ ...input, imageDataChunks: [] });
  if (!plan) return null;
  const total = plan.reduce(
    (sum, pass) => sum + (pass.rowBytes + 1) * pass.rows,
    0,
  );
  return Number.isSafeInteger(total) && total > 0 ? total : null;
}

async function validPngPixelStream(
  inspection: PngInspection,
): Promise<boolean> {
  const plan = pngScanlinePlan(inspection);
  if (!plan || typeof DecompressionStream === "undefined") return false;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  try {
    const compressed = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of inspection.imageDataChunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });
    const decompressor = new DecompressionStream("deflate") as unknown as
      ReadableWritablePair<Uint8Array, Uint8Array>;
    reader = compressed
      .pipeThrough(decompressor)
      .getReader();
    let passIndex = 0;
    let rowsRemaining = plan[0].rows;
    let rowOffset = 0;
    let decodedBytes = 0;
    const expectedBytes = plan.reduce(
      (total, pass) => total + (pass.rowBytes + 1) * pass.rows,
      0,
    );

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) {
        throw new Error("invalid_png_decompression_chunk");
      }
      for (const byte of value) {
        if (decodedBytes >= expectedBytes || passIndex >= plan.length) {
          throw new Error("invalid_png_decompressed_length");
        }
        if (rowOffset === 0 && byte > 4) {
          throw new Error("invalid_png_filter");
        }
        rowOffset += 1;
        decodedBytes += 1;
        if (rowOffset === plan[passIndex].rowBytes + 1) {
          rowOffset = 0;
          rowsRemaining -= 1;
          if (rowsRemaining === 0) {
            passIndex += 1;
            rowsRemaining = passIndex < plan.length
              ? plan[passIndex].rows
              : 0;
          }
        }
      }
    }
    return (
      decodedBytes === expectedBytes
      && passIndex === plan.length
      && rowOffset === 0
      && rowsRemaining === 0
    );
  } catch {
    try {
      await reader?.cancel();
    } catch {
      // The stream is already terminal.
    }
    return false;
  }
}

function isJpegStartOfFrame(marker: number): boolean {
  return [
    0xc0,
    0xc1,
    0xc2,
    0xc3,
    0xc5,
    0xc6,
    0xc7,
    0xc9,
    0xca,
    0xcb,
    0xcd,
    0xce,
    0xcf,
  ].includes(marker);
}

function inspectJpeg(bytes: Uint8Array): ImageDimensions | null {
  if (
    bytes.length < 14
    || bytes[0] !== 0xff
    || bytes[1] !== 0xd8
  ) return null;
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  let offset = 2;
  let dimensions: ImageDimensions | null = null;
  let sawScan = false;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return null;
    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd9) {
      return dimensions && sawScan && offset === bytes.length
        ? dimensions
        : null;
    }
    if (
      marker === 0x00
      || marker === 0xd8
      || marker >= 0xd0 && marker <= 0xd7
    ) return null;
    if (marker === 0x01) continue;
    if (offset + 2 > bytes.length) return null;
    const segmentLength = view.getUint16(offset, false);
    if (segmentLength < 2 || segmentLength > bytes.length - offset) {
      return null;
    }
    const dataOffset = offset + 2;
    const segmentEnd = offset + segmentLength;

    if (isJpegStartOfFrame(marker)) {
      if (dimensions || segmentLength < 11) return null;
      const height = view.getUint16(dataOffset + 1, false);
      const width = view.getUint16(dataOffset + 3, false);
      const components = bytes[dataOffset + 5];
      if (
        !width
        || !height
        || components < 1
        || components > 4
        || segmentLength !== 8 + components * 3
      ) return null;
      dimensions = { width, height };
    }

    offset = segmentEnd;
    if (marker !== 0xda) continue;
    if (!dimensions || segmentLength < 8) return null;
    const components = bytes[dataOffset];
    if (
      components < 1
      || components > 4
      || segmentLength !== 6 + components * 2
    ) return null;
    sawScan = true;
    let sawEntropyByte = false;
    while (offset < bytes.length) {
      if (bytes[offset] !== 0xff) {
        sawEntropyByte = true;
        offset += 1;
        continue;
      }
      const markerOffset = offset;
      while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
      if (offset >= bytes.length) return null;
      const entropyMarker = bytes[offset];
      if (entropyMarker === 0x00) {
        sawEntropyByte = true;
        offset += 1;
        continue;
      }
      if (entropyMarker >= 0xd0 && entropyMarker <= 0xd7) {
        offset += 1;
        continue;
      }
      offset = markerOffset;
      break;
    }
    if (!sawEntropyByte) return null;
  }
  return null;
}

function readUint24LittleEndian(bytes: Uint8Array, offset: number): number {
  return bytes[offset]
    | bytes[offset + 1] << 8
    | bytes[offset + 2] << 16;
}

function inspectVp8(
  bytes: Uint8Array,
  offset: number,
  length: number,
): ImageDimensions | null {
  if (
    length < 10
    || (bytes[offset] & 1) !== 0
    || bytes[offset + 3] !== 0x9d
    || bytes[offset + 4] !== 0x01
    || bytes[offset + 5] !== 0x2a
  ) return null;
  const width = (bytes[offset + 6] | bytes[offset + 7] << 8) & 0x3fff;
  const height = (bytes[offset + 8] | bytes[offset + 9] << 8) & 0x3fff;
  return width && height ? { width, height } : null;
}

function inspectVp8Lossless(
  bytes: Uint8Array,
  offset: number,
  length: number,
): (ImageDimensions & { hasAlpha: boolean }) | null {
  if (
    length < 5
    || bytes[offset] !== 0x2f
    || (bytes[offset + 4] & 0xe0) !== 0
  ) return null;
  const width = 1 + bytes[offset + 1] + ((bytes[offset + 2] & 0x3f) << 8);
  const height = 1
    + (bytes[offset + 2] >> 6)
    + (bytes[offset + 3] << 2)
    + ((bytes[offset + 4] & 0x0f) << 10);
  return {
    width,
    height,
    hasAlpha: (bytes[offset + 4] & 0x10) !== 0,
  };
}

function inspectWebp(bytes: Uint8Array): ImageDimensions | null {
  if (
    bytes.length < 30
    || asciiFourCc(bytes, 0) !== "RIFF"
    || asciiFourCc(bytes, 8) !== "WEBP"
  ) return null;
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  if (view.getUint32(4, true) !== bytes.length - 8) return null;

  let offset = 12;
  let extendedDimensions: ImageDimensions | null = null;
  let imageDimensions: ImageDimensions | null = null;
  let imageChunkType: "VP8 " | "VP8L" | null = null;
  let losslessHasAlpha = false;
  let extendedFlags = 0;
  let sawAlpha = false;
  let sawIcc = false;
  let sawExif = false;
  let sawXmp = false;

  while (offset < bytes.length) {
    if (bytes.length - offset < 8) return null;
    const chunkType = asciiFourCc(bytes, offset);
    const chunkLength = view.getUint32(offset + 4, true);
    const dataOffset = offset + 8;
    if (chunkLength > bytes.length - dataOffset) return null;
    const dataEnd = dataOffset + chunkLength;
    const chunkEnd = dataEnd + (chunkLength & 1);
    if (
      chunkEnd > bytes.length
      || (chunkLength & 1) !== 0 && bytes[dataEnd] !== 0
    ) return null;

    if (chunkType === "VP8X") {
      if (
        offset !== 12
        || extendedDimensions
        || imageDimensions
        || chunkLength !== 10
      ) return null;
      extendedFlags = bytes[dataOffset];
      if (
        (extendedFlags & 0xc1) !== 0
        || (extendedFlags & 0x02) !== 0
        || bytes[dataOffset + 1] !== 0
        || bytes[dataOffset + 2] !== 0
        || bytes[dataOffset + 3] !== 0
      ) return null;
      extendedDimensions = {
        width: 1 + readUint24LittleEndian(bytes, dataOffset + 4),
        height: 1 + readUint24LittleEndian(bytes, dataOffset + 7),
      };
    } else if (chunkType === "VP8 " || chunkType === "VP8L") {
      if (imageDimensions) return null;
      imageChunkType = chunkType;
      if (chunkType === "VP8 ") {
        imageDimensions = inspectVp8(bytes, dataOffset, chunkLength);
      } else {
        const lossless = inspectVp8Lossless(bytes, dataOffset, chunkLength);
        imageDimensions = lossless;
        losslessHasAlpha = lossless?.hasAlpha ?? false;
      }
      if (!imageDimensions) return null;
    } else if (chunkType === "ALPH") {
      if (
        !extendedDimensions
        || imageDimensions
        || sawAlpha
        || chunkLength < 1
        || (extendedFlags & 0x10) === 0
      ) return null;
      sawAlpha = true;
    } else if (chunkType === "ICCP") {
      if (
        !extendedDimensions
        || imageDimensions
        || sawIcc
        || chunkLength < 1
        || (extendedFlags & 0x20) === 0
      ) return null;
      sawIcc = true;
    } else if (chunkType === "EXIF") {
      if (
        !extendedDimensions
        || !imageDimensions
        || sawExif
        || chunkLength < 1
        || (extendedFlags & 0x08) === 0
      ) return null;
      sawExif = true;
    } else if (chunkType === "XMP ") {
      if (
        !extendedDimensions
        || !imageDimensions
        || sawXmp
        || chunkLength < 1
        || (extendedFlags & 0x04) === 0
      ) return null;
      sawXmp = true;
    } else {
      return null;
    }
    offset = chunkEnd;
  }

  if (!imageDimensions || offset !== bytes.length) return null;
  if (!extendedDimensions) return imageDimensions;
  if (
    imageDimensions.width !== extendedDimensions.width
    || imageDimensions.height !== extendedDimensions.height
    || Boolean(extendedFlags & 0x20) !== sawIcc
    || Boolean(extendedFlags & 0x08) !== sawExif
    || Boolean(extendedFlags & 0x04) !== sawXmp
    || sawAlpha && imageChunkType !== "VP8 "
    || Boolean(extendedFlags & 0x10) !== (
      imageChunkType === "VP8L" ? losslessHasAlpha : sawAlpha
    )
  ) return null;
  return extendedDimensions;
}

export function inspectMomoImageBytes(
  bytes: Uint8Array,
): MomoImageInspection | null {
  const mimeType = detectMomoImageMimeType(bytes);
  const dimensions = mimeType === "image/png"
    ? inspectPng(bytes)
    : mimeType === "image/jpeg"
      ? inspectJpeg(bytes)
      : mimeType === "image/webp"
        ? inspectWebp(bytes)
        : null;
  return mimeType && dimensions
    ? {
      mimeType,
      width: dimensions.width,
      height: dimensions.height,
    }
    : null;
}

export async function inspectMomoImageBytesFully(
  bytes: Uint8Array,
): Promise<MomoImageInspection | null> {
  const mimeType = detectMomoImageMimeType(bytes);
  if (mimeType === "image/png") {
    const inspection = inspectPng(bytes);
    if (!inspection || !await validPngPixelStream(inspection)) return null;
    return {
      mimeType,
      width: inspection.width,
      height: inspection.height,
    };
  }
  const dimensions = mimeType === "image/jpeg"
    ? inspectJpeg(bytes)
    : mimeType === "image/webp"
      ? inspectWebp(bytes)
      : null;
  return mimeType && dimensions
    ? { mimeType, ...dimensions }
    : null;
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
  if (detectMomoImageMimeType(bytes) !== "image/png") return null;
  const inspection = inspectPng(bytes);
  return inspection
    ? { width: inspection.width, height: inspection.height }
    : null;
}

export async function decodeMomoBase64Png(
  value: unknown,
  maxBytes: number,
): Promise<Uint8Array | null> {
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
    const inspection = await inspectMomoImageBytesFully(bytes);
    return inspection?.mimeType === "image/png" ? bytes : null;
  } catch {
    return null;
  }
}
