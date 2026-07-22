import { assertMomoEvidenceUse, type MomoEvidenceClass } from "./momo-evidence-boundary.ts";

export type MomoImagePresetKey =
  | "instagram_square"
  | "instagram_portrait"
  | "instagram_story"
  | "facebook_feed"
  | "google_business_square"
  | "website_hero";

export const MOMO_IMAGE_PRESETS: Record<MomoImagePresetKey, {
  label: string;
  width: number;
  height: number;
  intendedUse: string;
}> = {
  instagram_square: { label: "Instagram square", width: 1080, height: 1080, intendedUse: "instagram" },
  instagram_portrait: { label: "Instagram portrait", width: 1080, height: 1350, intendedUse: "instagram" },
  instagram_story: { label: "Instagram story", width: 1080, height: 1920, intendedUse: "instagram" },
  facebook_feed: { label: "Facebook feed", width: 1200, height: 1500, intendedUse: "facebook" },
  google_business_square: { label: "Google Business square", width: 720, height: 720, intendedUse: "google_business" },
  website_hero: { label: "Website hero", width: 1600, height: 900, intendedUse: "website" },
};

export type MomoNormalizedCrop = { x: number; y: number; width: number; height: number };

export const MOMO_IMAGE_ASPECT_TOLERANCE = 0.000001;

type MomoImageGeometry = {
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
  rotation: 0 | 90 | 180 | 270;
};

const cropNumber = (value: number) => Number(value.toFixed(12));

const orientedMomoImageDimensions = ({ sourceWidth, sourceHeight, rotation }: MomoImageGeometry) =>
  rotation === 90 || rotation === 270
    ? { width: sourceHeight, height: sourceWidth }
    : { width: sourceWidth, height: sourceHeight };

const momoImageGeometryValid = (geometry: MomoImageGeometry) =>
  [geometry.sourceWidth, geometry.sourceHeight, geometry.outputWidth, geometry.outputHeight]
    .every((value) => Number.isFinite(value) && value > 0);

export function deriveMomoCenterCoverCrop(geometry: MomoImageGeometry): MomoNormalizedCrop {
  if (!momoImageGeometryValid(geometry)) throw new Error("image_dimensions_required");
  const oriented = orientedMomoImageDimensions(geometry);
  const sourceAspect = oriented.width / oriented.height;
  const outputAspect = geometry.outputWidth / geometry.outputHeight;
  if (Math.abs(sourceAspect - outputAspect) <= MOMO_IMAGE_ASPECT_TOLERANCE * Math.max(1, outputAspect)) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }
  if (sourceAspect > outputAspect) {
    const width = outputAspect / sourceAspect;
    return { x: cropNumber((1 - width) / 2), y: 0, width: cropNumber(width), height: 1 };
  }
  const height = sourceAspect / outputAspect;
  return { x: 0, y: cropNumber((1 - height) / 2), width: 1, height: cropNumber(height) };
}

export function deriveMomoCoverCropAtFocalPoint(
  geometry: MomoImageGeometry,
  focalX = 0.5,
  focalY = 0.5,
): MomoNormalizedCrop {
  const centered = deriveMomoCenterCoverCrop(geometry);
  const clampedX = Math.min(1, Math.max(0, focalX));
  const clampedY = Math.min(1, Math.max(0, focalY));
  return {
    ...centered,
    x: centered.width < 1 ? cropNumber((1 - centered.width) * clampedX) : 0,
    y: centered.height < 1 ? cropNumber((1 - centered.height) * clampedY) : 0,
  };
}

export function momoImageCropMatchesOutputAspect(
  geometry: MomoImageGeometry,
  crop: MomoNormalizedCrop,
): boolean {
  if (!momoImageGeometryValid(geometry)
    || ![crop.x, crop.y, crop.width, crop.height].every(Number.isFinite)
    || crop.width <= 0 || crop.height <= 0) return false;
  const oriented = orientedMomoImageDimensions(geometry);
  const cropAspect = (crop.width * oriented.width) / (crop.height * oriented.height);
  const outputAspect = geometry.outputWidth / geometry.outputHeight;
  return Math.abs(cropAspect - outputAspect) <= MOMO_IMAGE_ASPECT_TOLERANCE * Math.max(1, outputAspect);
}

export type MomoImageRecipe = {
  preset: MomoImagePresetKey;
  crop: MomoNormalizedCrop;
  rotation: 0 | 90 | 180 | 270;
  brightness: number;
  contrast: number;
  saturation: number;
  outputFormat: "image/jpeg" | "image/png" | "image/webp";
  quality: number;
  altText: string;
};

export type MomoImageSource = {
  restaurantId: string;
  assetId: string;
  sourceKind: "owner_asset" | "synthetic_fixture";
  mimeType: string;
  width: number;
  height: number;
  contentSha256: string;
  rightsStatus: string;
  reviewStatus: string;
  publicUseApproved: boolean;
  usageScope: string[];
  evidenceClass: MomoEvidenceClass;
};

export type MomoImageEditPlan = {
  schemaVersion: "momo-image-edit-v1";
  sourceAssetId: string;
  sourceSha256: string;
  preset: MomoImagePresetKey;
  outputWidth: number;
  outputHeight: number;
  outputMimeType: MomoImageRecipe["outputFormat"];
  intendedUse: string;
  recipe: MomoImageRecipe;
  fingerprint: string;
  storagePath: string;
  externalWriteAllowed: false;
};

const canonical = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
};

export async function momoSha256(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function normalizeMomoImageRecipe(input: Partial<MomoImageRecipe> & Pick<MomoImageRecipe, "preset">): MomoImageRecipe {
  const crop = input.crop ?? { x: 0, y: 0, width: 1, height: 1 };
  const clamp = (value: number, minimum: number, maximum: number, fallback: number) =>
    Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
  const normalizedCrop = {
    x: clamp(Number(crop.x), 0, 1, 0),
    y: clamp(Number(crop.y), 0, 1, 0),
    width: clamp(Number(crop.width), 0.01, 1, 1),
    height: clamp(Number(crop.height), 0.01, 1, 1),
  };
  normalizedCrop.width = Math.min(normalizedCrop.width, 1 - normalizedCrop.x);
  normalizedCrop.height = Math.min(normalizedCrop.height, 1 - normalizedCrop.y);
  const rotation = [0, 90, 180, 270].includes(Number(input.rotation)) ? Number(input.rotation) as MomoImageRecipe["rotation"] : 0;
  const outputFormat = ["image/jpeg", "image/png", "image/webp"].includes(input.outputFormat || "")
    ? input.outputFormat as MomoImageRecipe["outputFormat"]
    : "image/jpeg";
  return {
    preset: input.preset,
    crop: normalizedCrop,
    rotation,
    brightness: clamp(Number(input.brightness ?? 100), 80, 120, 100),
    contrast: clamp(Number(input.contrast ?? 100), 80, 120, 100),
    saturation: clamp(Number(input.saturation ?? 100), 75, 125, 100),
    outputFormat,
    quality: clamp(Number(input.quality ?? 0.9), 0.5, 1, 0.9),
    altText: String(input.altText || "").trim().slice(0, 280),
  };
}

export function validateMomoImageEdit(source: MomoImageSource, recipe: MomoImageRecipe): string[] {
  const problems: string[] = [];
  if (!source.assetId) problems.push("source_asset_required");
  if (!/^image\/(jpeg|png|webp)$/.test(source.mimeType)) problems.push("editable_image_type_required");
  if (!Number.isInteger(source.width) || source.width < 1 || !Number.isInteger(source.height) || source.height < 1) problems.push("source_dimensions_required");
  if (!/^[a-f0-9]{64}$/i.test(source.contentSha256)) problems.push("source_hash_required");
  if (!source.restaurantId) problems.push("restaurant_scope_required");
  if (source.sourceKind === "owner_asset" && source.rightsStatus !== "confirmed") problems.push("current_rights_required");
  if (source.sourceKind === "owner_asset" && (source.reviewStatus !== "approved" || !source.publicUseApproved)) problems.push("public_review_required");
  const preset = MOMO_IMAGE_PRESETS[recipe.preset];
  const intendedUse = preset?.intendedUse;
  if (!intendedUse || (source.sourceKind === "owner_asset" && !source.usageScope.includes(intendedUse))) problems.push("intended_use_not_authorized");
  if (intendedUse === "google_business" && recipe.outputFormat === "image/webp") problems.push("google_business_jpg_or_png_required");
  if (source.sourceKind === "synthetic_fixture" && source.evidenceClass !== "synthetic") problems.push("synthetic_fixture_class_required");
  if (![0, 90, 180, 270].includes(recipe.rotation)
    || !Number.isFinite(recipe.brightness) || recipe.brightness < 80 || recipe.brightness > 120
    || !Number.isFinite(recipe.contrast) || recipe.contrast < 80 || recipe.contrast > 120
    || !Number.isFinite(recipe.saturation) || recipe.saturation < 75 || recipe.saturation > 125
    || !Number.isFinite(recipe.quality) || recipe.quality < 0.5 || recipe.quality > 1
    || ![recipe.crop.x, recipe.crop.y, recipe.crop.width, recipe.crop.height].every(Number.isFinite)
    || recipe.crop.x < 0 || recipe.crop.y < 0 || recipe.crop.width <= 0 || recipe.crop.height <= 0
    || recipe.crop.x + recipe.crop.width > 1 || recipe.crop.y + recipe.crop.height > 1) problems.push("safe_edit_recipe_required");
  if (preset && !momoImageCropMatchesOutputAspect({
    sourceWidth: source.width,
    sourceHeight: source.height,
    outputWidth: preset.width,
    outputHeight: preset.height,
    rotation: recipe.rotation,
  }, recipe.crop)) problems.push("output_aspect_crop_required");
  if (!recipe.altText) problems.push("alt_text_required");
  try { assertMomoEvidenceUse(source.evidenceClass, "preconnection_rehearsal"); } catch { problems.push("classified_evidence_required"); }
  return [...new Set(problems)];
}

export async function buildMomoImageEditPlan(source: MomoImageSource, input: Partial<MomoImageRecipe> & Pick<MomoImageRecipe, "preset">): Promise<MomoImageEditPlan> {
  const normalizedRecipe = normalizeMomoImageRecipe(input);
  const preset = MOMO_IMAGE_PRESETS[normalizedRecipe.preset];
  const recipe = input.crop === undefined && preset ? {
    ...normalizedRecipe,
    crop: deriveMomoCenterCoverCrop({
      sourceWidth: source.width,
      sourceHeight: source.height,
      outputWidth: preset.width,
      outputHeight: preset.height,
      rotation: normalizedRecipe.rotation,
    }),
  } : normalizedRecipe;
  const problems = validateMomoImageEdit(source, recipe);
  if (problems.length) throw new Error(problems.join(","));
  const payload = {
    schemaVersion: "momo-image-edit-v1",
    sourceAssetId: source.assetId,
    sourceSha256: source.contentSha256.toLowerCase(),
    recipe,
    outputWidth: preset.width,
    outputHeight: preset.height,
  };
  const fingerprint = await momoSha256(canonical(payload));
  const extension = recipe.outputFormat === "image/png" ? "png" : recipe.outputFormat === "image/webp" ? "webp" : "jpg";
  return {
    ...payload,
    schemaVersion: "momo-image-edit-v1",
    preset: recipe.preset,
    outputMimeType: recipe.outputFormat,
    intendedUse: preset.intendedUse,
    fingerprint,
    storagePath: `restaurants/${source.restaurantId}/renditions/${source.assetId}/${fingerprint}.${extension}`,
    externalWriteAllowed: false,
  };
}
