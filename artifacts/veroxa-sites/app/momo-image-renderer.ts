"use client";

import { momoImageCropMatchesOutputAspect, type MomoImageEditPlan } from "./momo-media-workflow.ts";

export type MomoEditableImageMimeType = "image/jpeg" | "image/png" | "image/webp";

export function detectMomoImageMimeType(bytes: Uint8Array): MomoEditableImageMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 16
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    && bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38
    && [0x20, 0x4c, 0x58].includes(bytes[15])) return "image/webp";
  return null;
}

async function normalizedMomoImageBlob(source: Blob): Promise<{ blob: Blob; mimeType: MomoEditableImageMimeType; fileSize: number }> {
  const bytes = new Uint8Array(await source.arrayBuffer());
  const mimeType = detectMomoImageMimeType(bytes);
  if (!mimeType) throw new Error("editable_image_type_required");
  return {
    blob: source.type === mimeType ? source : new Blob([bytes], { type: mimeType }),
    mimeType,
    fileSize: bytes.byteLength,
  };
}

type MomoDecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

async function decodeMomoImage(source: Blob): Promise<MomoDecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(source);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // WebKit can reject a valid response Blob even when the same codec works
      // through an image element. Fall through to that standards-based path.
    }
  }
  if (typeof document === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    throw new Error("image_decode_failed");
  }
  const objectUrl = URL.createObjectURL(source);
  const image = document.createElement("img");
  image.decoding = "async";
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("image_decode_failed"));
      image.src = objectUrl;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("image_decode_failed");
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

const canvas = (width: number, height: number) => {
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  return element;
};

const blobFromCanvas = (element: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => element.toBlob((blob) => blob ? resolve(blob) : reject(new Error("image_encode_failed")), mimeType, quality));

export async function inspectMomoImageBlob(source: Blob): Promise<{
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
}> {
  const normalized = await normalizedMomoImageBlob(source);
  const decoded = await decodeMomoImage(normalized.blob);
  try {
    return {
      mimeType: normalized.mimeType,
      fileSize: normalized.fileSize,
      width: decoded.width,
      height: decoded.height,
    };
  } finally {
    decoded.close();
  }
}

export async function renderMomoImageEdit(source: Blob, plan: MomoImageEditPlan): Promise<Blob> {
  const normalized = await normalizedMomoImageBlob(source);
  const decoded = await decodeMomoImage(normalized.blob);
  const rotateSideways = plan.recipe.rotation === 90 || plan.recipe.rotation === 270;
  const oriented = canvas(rotateSideways ? decoded.height : decoded.width, rotateSideways ? decoded.width : decoded.height);
  try {
    if (!momoImageCropMatchesOutputAspect({
      sourceWidth: decoded.width,
      sourceHeight: decoded.height,
      outputWidth: plan.outputWidth,
      outputHeight: plan.outputHeight,
      rotation: plan.recipe.rotation,
    }, plan.recipe.crop)) throw new Error("output_aspect_crop_required");
    const orientedContext = oriented.getContext("2d", { alpha: true });
    if (!orientedContext) throw new Error("image_canvas_unavailable");
    orientedContext.translate(oriented.width / 2, oriented.height / 2);
    orientedContext.rotate(plan.recipe.rotation * Math.PI / 180);
    orientedContext.drawImage(decoded.source, -decoded.width / 2, -decoded.height / 2);
  } finally {
    decoded.close();
  }

  const output = canvas(plan.outputWidth, plan.outputHeight);
  const context = output.getContext("2d", { alpha: plan.outputMimeType !== "image/jpeg" });
  if (!context) throw new Error("image_canvas_unavailable");
  context.filter = `brightness(${plan.recipe.brightness}%) contrast(${plan.recipe.contrast}%) saturate(${plan.recipe.saturation}%)`;
  const crop = plan.recipe.crop;
  context.drawImage(
    oriented,
    crop.x * oriented.width,
    crop.y * oriented.height,
    crop.width * oriented.width,
    crop.height * oriented.height,
    0,
    0,
    output.width,
    output.height,
  );
  const rendered = await blobFromCanvas(output, plan.outputMimeType, plan.recipe.quality);
  const inspected = await inspectMomoImageBlob(rendered);
  if (inspected.mimeType !== plan.outputMimeType
    || inspected.width !== plan.outputWidth
    || inspected.height !== plan.outputHeight) throw new Error("image_encode_mismatch");
  return rendered;
}
