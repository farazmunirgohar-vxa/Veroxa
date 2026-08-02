import { isMomoContentUuid } from "./momo-content-ai-contract.ts";

export type MomoMediaFinalizeResult = {
  verificationId: string;
  status: "verified" | "duplicate";
  canonicalAssetId: string;
  duplicateAssetId: string | null;
};

export type MomoMediaFinalizeApiResult = MomoMediaFinalizeResult & {
  externalWriteAllowed: false;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).sort().join(",") === [...keys].sort().join(",");
}

function validResultInvariants(result: MomoMediaFinalizeResult, requestedAssetId: string): boolean {
  if (result.status === "verified") {
    return result.canonicalAssetId === requestedAssetId && result.duplicateAssetId === null;
  }
  return result.duplicateAssetId === requestedAssetId && result.canonicalAssetId !== requestedAssetId;
}

export function parseMomoMediaFinalizeResult(
  value: unknown,
  requestedAssetId: string,
): MomoMediaFinalizeResult | null {
  if (!isMomoContentUuid(requestedAssetId)) return null;
  if (typeof value === "string") {
    return isMomoContentUuid(value) ? {
      verificationId: value,
      status: "verified",
      canonicalAssetId: requestedAssetId,
      duplicateAssetId: null,
    } : null;
  }
  if (!isRecord(value) || !exactKeys(value, [
    "verificationId", "status", "canonicalAssetId", "duplicateAssetId",
  ])) return null;
  if (!isMomoContentUuid(value.verificationId) ||
    (value.status !== "verified" && value.status !== "duplicate") ||
    !isMomoContentUuid(value.canonicalAssetId) ||
    (value.duplicateAssetId !== null && !isMomoContentUuid(value.duplicateAssetId))) return null;
  const result: MomoMediaFinalizeResult = {
    verificationId: value.verificationId,
    status: value.status,
    canonicalAssetId: value.canonicalAssetId,
    duplicateAssetId: value.duplicateAssetId,
  };
  return validResultInvariants(result, requestedAssetId) ? result : null;
}

export function parseMomoMediaFinalizeApiResult(
  value: unknown,
  requestedAssetId: string,
): MomoMediaFinalizeApiResult | null {
  if (!isRecord(value) || !exactKeys(value, [
    "verificationId", "status", "canonicalAssetId", "duplicateAssetId", "externalWriteAllowed",
  ]) || value.externalWriteAllowed !== false) return null;
  const result = parseMomoMediaFinalizeResult({
    verificationId: value.verificationId,
    status: value.status,
    canonicalAssetId: value.canonicalAssetId,
    duplicateAssetId: value.duplicateAssetId,
  }, requestedAssetId);
  return result ? { ...result, externalWriteAllowed: false } : null;
}
