import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isMomoContentUuid } from "./momo-content-ai-contract.ts";
import {
  finalizeMomoMediaUpload,
  MomoMediaFinalizeRequestError,
} from "./momo-media-finalize-client.ts";
import type { MomoMediaFinalizeApiResult } from "./momo-media-finalize-contract.ts";
import { updateHardenedVeroxaPassword } from "./veroxa-password-update.ts";

export type MomoClientPublicConfig = {
  url: string;
  publishableKey: string;
};

export type MomoClientDecision = {
  id: string;
  subjectType: string;
  subjectId: string | null;
  kind: string;
  decision: string | null;
  proposedValue: unknown;
  notes: string | null;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
};

export type MomoClientSnapshot = {
  mediaReadbackAvailable: boolean;
  mediaPipelineReadbackAvailable: boolean;
  profile: {
    truthFields: Array<{
      id: string;
      fieldKey: string;
      section: string;
      value: unknown;
      status: string;
      source: string;
      ownerConfirmedAt: string | null;
      updatedAt: string | null;
    }>;
    contacts: Array<{
      id: string;
      kind: string;
      name: string;
      email: string | null;
      phone: string | null;
      isPrimary: boolean;
      status: string;
    }>;
    steps: Array<{
      id: string;
      stepKey: string;
      title: string;
      position: number;
      status: string;
      completedAt: string | null;
    }>;
    presence: Array<{
      id: string;
    channel: string;
    publicUrl: string | null;
    }>;
  };
  decisions: MomoClientDecision[];
  actionConsents: Array<{
    id: string;
    actionKind: "business_profile_change" | "review_reply" | "google_post" | "social_post" | "website_change" | "access_connection";
    description: string;
    scope: {
      target: string;
      operation: string;
      before?: unknown;
      after?: unknown;
      contentPreview?: string;
      scheduledFor?: string;
      batchSize?: number;
    };
    status: string;
    requestedAt: string;
    expiresAt: string;
    decidedAt: string | null;
    decisionNotes: string | null;
    revokedAt: string | null;
    revocationNotes: string | null;
  }>;
  media: Array<{
    id: string;
    storagePath: string;
    displayFileName: string;
    mimeType: string;
    fileSize: number;
    status: string;
    createdAt: string;
    rightsId: string | null;
    rightsStatus: string | null;
    usageScope: string[];
    validFrom: string | null;
    expiresAt: string | null;
    reviewStatus: string | null;
    publicUseApproved: boolean;
    renditionStatus: "ready" | null;
    renditionStoragePath: string | null;
    renditionAltText: string | null;
    renditionWidth: number | null;
    renditionHeight: number | null;
    pipelineStatus: "uploaded" | "verified" | "processing" | "needs_attention" | "veroxa_ready" | null;
    pipelineVerificationStatus: "verified" | null;
    exactDuplicate: boolean;
    pipelineAttentionReasons: MomoClientAttentionReason[];
  }>;
  contentDirections: Array<{
    contentItemId: string;
    title: string;
    concept: string;
    masterCaption: string | null;
    manualPillar: string | null;
    mediaDisplayFileName: string | null;
    confirmationStatus: string | null;
  }>;
  schedule: Array<{
    contentItemId: string;
    title: string;
    itemId: string;
    channel: string;
    caption: string;
    status: "scheduled" | "published";
    scheduledFor: string | null;
    timezone: string;
    publishedAt: string | null;
  }>;
  reports: Array<{
    id: string;
    reportType: string;
    periodStart: string;
    periodEnd: string;
    summary: unknown;
    status: string;
    approvedAt: string | null;
    publishedAt: string | null;
    updatedAt: string | null;
  }>;
};

export type MomoClientRequest = {
  id: string;
  requestType: "onboarding" | "truth_update" | "media" | "content" | "website" | "reporting" | "support";
  title: string;
  details: string;
  priority: "normal" | "urgent";
  status: "open" | "acknowledged" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type MomoClientMessage = {
  id: string;
  senderRole: "team" | "client";
  body: string;
  createdAt: string;
};

let config: MomoClientPublicConfig | null = null;
let client: SupabaseClient | null = null;

const validConfig = (value: MomoClientPublicConfig | null | undefined): value is MomoClientPublicConfig => {
  if (!value?.publishableKey?.startsWith("sb_publishable_")) return false;
  try {
    const parsed = new URL(value.url);
    return parsed.protocol === "https:"
      && parsed.hostname.endsWith(".supabase.co")
      && !parsed.username
      && !parsed.password
      && !parsed.port
      && (parsed.pathname === "/" || parsed.pathname === "")
      && !parsed.search
      && !parsed.hash;
  } catch {
    return false;
  }
};

export function configureMomoClient(configValue: MomoClientPublicConfig | null | undefined): void {
  if (!validConfig(configValue)) return;
  const normalized = { url: new URL(configValue.url).origin, publishableKey: configValue.publishableKey.trim() };
  if (config && (config.url !== normalized.url || config.publishableKey !== normalized.publishableKey)) client = null;
  config = normalized;
}

function requiredClient(): SupabaseClient {
  if (!client) {
    if (!config) throw new Error("configuration_unavailable");
    client = createBrowserClient(config.url, config.publishableKey);
  }
  return client;
}

const records = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)))
    : [];

const textValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const dateValue = (value: unknown): string | null => {
  const text = textValue(value);
  return text && Number.isFinite(Date.parse(text)) ? text : null;
};

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const actionScope = (value: unknown): MomoClientSnapshot["actionConsents"][number]["scope"] | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.target !== "string" || row.target.trim().length < 2
    || typeof row.operation !== "string" || row.operation.trim().length < 2) return null;
  if (row.contentPreview !== undefined && typeof row.contentPreview !== "string") return null;
  if (row.scheduledFor !== undefined && !dateValue(row.scheduledFor)) return null;
  if (row.batchSize !== undefined && (typeof row.batchSize !== "number" || !Number.isInteger(row.batchSize) || row.batchSize < 1 || row.batchSize > 50)) return null;
  return {
    target: row.target.trim(), operation: row.operation.trim(),
    ...(row.before !== undefined ? { before: row.before } : {}),
    ...(row.after !== undefined ? { after: row.after } : {}),
    ...(typeof row.contentPreview === "string" ? { contentPreview: row.contentPreview } : {}),
    ...(typeof row.scheduledFor === "string" ? { scheduledFor: row.scheduledFor } : {}),
    ...(typeof row.batchSize === "number" ? { batchSize: row.batchSize } : {}),
  };
};

export function parseMomoClientSnapshot(value: unknown): MomoClientSnapshot {
  const root = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const onboarding = root.onboarding && typeof root.onboarding === "object" && !Array.isArray(root.onboarding)
    ? root.onboarding as Record<string, unknown>
    : {};

  return {
    mediaReadbackAvailable: false,
    mediaPipelineReadbackAvailable: false,
    profile: {
      truthFields: records(onboarding.truthFields).map((row) => ({
        id: String(row.id || ""),
        fieldKey: String(row.fieldKey || ""),
        section: String(row.section || ""),
        value: row.value,
        status: String(row.status || "unknown"),
        source: String(row.source || "unknown"),
        ownerConfirmedAt: textValue(row.ownerConfirmedAt),
        updatedAt: textValue(row.updatedAt),
      })).filter((row) => row.id && row.fieldKey),
      contacts: records(onboarding.contacts).map((row) => ({
        id: String(row.id || ""),
        kind: String(row.kind || "contact"),
        name: String(row.name || ""),
        email: textValue(row.email),
        phone: textValue(row.phone),
        isPrimary: row.isPrimary === true,
        status: String(row.status || "unknown"),
      })).filter((row) => row.id && row.name),
      steps: records(onboarding.steps).map((row) => ({
        id: String(row.id || ""),
        stepKey: String(row.stepKey || ""),
        title: String(row.title || "Setup step"),
        position: Number(row.position || 0),
        status: String(row.status || "not_started"),
        completedAt: textValue(row.completedAt),
      })).filter((row) => row.id).sort((left, right) => left.position - right.position),
      presence: records(onboarding.presence).map((row) => ({
        id: String(row.id || ""),
        channel: String(row.channel || "online profile"),
        publicUrl: textValue(row.publicUrl),
      })).filter((row) => row.id),
    },
    decisions: records(root.confirmations).map((row) => ({
      id: String(row.id || ""),
      subjectType: String(row.subjectType || ""),
      subjectId: textValue(row.subjectId),
      kind: String(row.kind || ""),
      decision: textValue(row.decision),
      proposedValue: row.proposedValue,
      notes: textValue(row.notes),
      status: String(row.status || "unknown"),
      submittedAt: String(row.submittedAt || ""),
      reviewedAt: textValue(row.reviewedAt),
    })).filter((row) => row.id),
    actionConsents: records(root.actionConsents).map((row) => ({
      id: String(row.id || ""),
      actionKind: String(row.actionKind || "") as MomoClientSnapshot["actionConsents"][number]["actionKind"],
      description: String(row.description || ""),
      scope: actionScope(row.scope),
      status: String(row.status || "unknown"),
      requestedAt: String(row.requestedAt || ""),
      expiresAt: String(row.expiresAt || ""),
      decidedAt: dateValue(row.decidedAt),
      decisionNotes: textValue(row.decisionNotes),
      revokedAt: dateValue(row.revokedAt),
      revocationNotes: textValue(row.revocationNotes),
    })).filter((row): row is MomoClientSnapshot["actionConsents"][number] => Boolean(row.id && row.description && row.scope
      && ["business_profile_change", "review_reply", "google_post", "social_post", "website_change", "access_connection"].includes(row.actionKind)
      && ["pending", "approved", "rejected", "revoked", "expired"].includes(row.status)
      && dateValue(row.requestedAt) && dateValue(row.expiresAt))),
    media: records(root.media).map((row) => ({
      id: String(row.id || ""),
      storagePath: String(row.storagePath || ""),
      displayFileName: String(row.displayFileName || "Private media"),
      mimeType: String(row.mimeType || "application/octet-stream"),
      fileSize: Number(row.fileSize || 0),
      status: String(row.status || "unknown"),
      createdAt: String(row.createdAt || ""),
      rightsId: textValue(row.rightsId),
      rightsStatus: textValue(row.rightsStatus),
      usageScope: stringList(row.usageScope),
      validFrom: textValue(row.validFrom),
      expiresAt: textValue(row.expiresAt),
      reviewStatus: textValue(row.reviewStatus),
      publicUseApproved: row.publicUseApproved === true,
      renditionStatus: null,
      renditionStoragePath: null,
      renditionAltText: null,
      renditionWidth: null,
      renditionHeight: null,
      pipelineStatus: null,
      pipelineVerificationStatus: null,
      exactDuplicate: false,
      pipelineAttentionReasons: [],
    })).filter((row) => row.id
      && /^restaurants\/[0-9a-f-]{36}\/uploads\//.test(row.storagePath)
      && Number.isFinite(row.fileSize) && row.fileSize > 0 && row.fileSize <= 104857600
      && Boolean(dateValue(row.createdAt))
      && (!row.expiresAt || Boolean(dateValue(row.expiresAt)))),
    contentDirections: records(root.pendingContentConfirmations).map((row) => ({
      contentItemId: String(row.contentItemId || ""),
      title: String(row.title || "Content direction"),
      concept: String(row.concept || ""),
      masterCaption: textValue(row.masterCaption),
      manualPillar: textValue(row.manualPillar),
      mediaDisplayFileName: textValue(row.mediaDisplayFileName),
      confirmationStatus: textValue(row.confirmationStatus),
    })).filter((row) => row.contentItemId),
    schedule: records(root.contentCalendar).map((row) => ({
      contentItemId: String(row.contentItemId || ""),
      title: String(row.title || "Scheduled content"),
      itemId: String(row.itemId || ""),
      channel: String(row.channel || row.platform || "social"),
      caption: String(row.caption || ""),
      status: row.calendarStatus as "scheduled" | "published",
      scheduledFor: dateValue(row.scheduledFor),
      timezone: String(row.timezone || ""),
      publishedAt: dateValue(row.publishedAt),
    })).filter((row) => row.contentItemId && row.itemId && row.caption
      && ["scheduled", "published"].includes(row.status)
      && row.timezone === "America/Chicago"
      && (row.status === "scheduled" ? Boolean(row.scheduledFor) : Boolean(row.publishedAt))),
    reports: records(root.reports).map((row) => ({
      id: String(row.id || ""),
      reportType: String(row.reportType || "report"),
      periodStart: String(row.periodStart || ""),
      periodEnd: String(row.periodEnd || ""),
      summary: row.summary,
      status: String(row.status || ""),
      approvedAt: dateValue(row.approvedAt),
      publishedAt: dateValue(row.publishedAt),
      updatedAt: dateValue(row.updatedAt),
    })).filter((row) => row.id && row.status === "approved"
      && /^\d{4}-\d{2}-\d{2}$/.test(row.periodStart)
      && /^\d{4}-\d{2}-\d{2}$/.test(row.periodEnd)
      && Boolean(row.approvedAt)),
  };
}

const MOMO_CLIENT_PIPELINE_STATUSES = new Set([
  "uploaded", "verified", "processing", "needs_attention", "veroxa_ready",
]);
const MOMO_CLIENT_ATTENTION_ORDER = [
  "permission_needs_update",
  "image_needs_replacement",
  "checking_temporarily_unavailable",
  "preparation_needs_veroxa_review",
] as const;
export type MomoClientAttentionReason = typeof MOMO_CLIENT_ATTENTION_ORDER[number];
const MOMO_CLIENT_ATTENTION_REASONS = new Set<MomoClientAttentionReason>(
  MOMO_CLIENT_ATTENTION_ORDER,
);

function momoClientMediaRightsCurrent(
  item: MomoClientSnapshot["media"][number],
  now = Date.now(),
): boolean {
  const validFrom = item.validFrom ? Date.parse(item.validFrom) : null;
  const expiresAt = item.expiresAt ? Date.parse(item.expiresAt) : null;
  return item.rightsStatus === "confirmed"
    && (validFrom === null || (Number.isFinite(validFrom) && validFrom <= now))
    && (expiresAt === null || (Number.isFinite(expiresAt) && expiresAt > now));
}

export function mergeMomoClientUploadPipelineV3(
  snapshot: MomoClientSnapshot,
  value: unknown,
): MomoClientSnapshot {
  const cleared: MomoClientSnapshot = {
    ...snapshot,
    mediaPipelineReadbackAvailable: false,
    media: snapshot.media.map((item) => ({
      ...item,
      pipelineStatus: null,
      pipelineVerificationStatus: null,
      exactDuplicate: false,
      pipelineAttentionReasons: [],
    })),
  };
  if (!Array.isArray(value)) return cleared;

  type PipelineReadback = Pick<MomoClientSnapshot["media"][number],
    "pipelineStatus" | "pipelineVerificationStatus" | "exactDuplicate" |
    "pipelineAttentionReasons">;
  const mediaById = new Map(snapshot.media.map((item) => [item.id, item]));
  const knownAssetIds = new Set(mediaById.keys());
  const byAsset = new Map<string, PipelineReadback>();
  const duplicates = new Set<string>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const row = candidate as Record<string, unknown>;
    const assetId = typeof row.asset_id === "string" ? row.asset_id.toLowerCase() : "";
    const pipelineStatus = typeof row.pipeline_status === "string"
      ? row.pipeline_status : "";
    const attentionReasons = Array.isArray(row.attention_reasons)
      ? row.attention_reasons.filter((item): item is MomoClientAttentionReason =>
        typeof item === "string" && MOMO_CLIENT_ATTENTION_REASONS.has(
          item as MomoClientAttentionReason,
        ))
      : [];
    const sortedReasons = attentionReasons.every((item, index) =>
      index === 0 || MOMO_CLIENT_ATTENTION_ORDER.indexOf(attentionReasons[index - 1]) <
        MOMO_CLIENT_ATTENTION_ORDER.indexOf(item));
    const verificationStatus = row.verification_status === null
      ? null : row.verification_status === "verified" ? "verified" : "invalid";
    if (!knownAssetIds.has(assetId) || !MOMO_CLIENT_PIPELINE_STATUSES.has(pipelineStatus) ||
      typeof row.is_exact_duplicate !== "boolean" ||
      row.external_write_allowed !== false || verificationStatus === "invalid" ||
      !Array.isArray(row.attention_reasons) ||
      attentionReasons.length !== row.attention_reasons.length ||
      attentionReasons.length > MOMO_CLIENT_ATTENTION_ORDER.length ||
      new Set(attentionReasons).size !== attentionReasons.length || !sortedReasons ||
      (["verified", "processing", "veroxa_ready"].includes(pipelineStatus) &&
        verificationStatus !== "verified") ||
      ((pipelineStatus === "needs_attention") !== (attentionReasons.length > 0))) continue;
    if (byAsset.has(assetId)) {
      duplicates.add(assetId);
      byAsset.delete(assetId);
      continue;
    }
    const mediaItem = mediaById.get(assetId)!;
    const rightsCurrent = momoClientMediaRightsCurrent(mediaItem);
    const effectivePipelineStatus = rightsCurrent
      ? pipelineStatus as PipelineReadback["pipelineStatus"]
      : "needs_attention";
    const effectiveAttentionReasons: MomoClientAttentionReason[] = rightsCurrent
      ? attentionReasons
      : ["permission_needs_update"];
    byAsset.set(assetId, {
      pipelineStatus: effectivePipelineStatus,
      pipelineVerificationStatus: verificationStatus,
      exactDuplicate: row.is_exact_duplicate,
      pipelineAttentionReasons: effectiveAttentionReasons,
    });
  }
  for (const assetId of duplicates) byAsset.delete(assetId);
  return {
    ...cleared,
    mediaPipelineReadbackAvailable: true,
    media: cleared.media.map((item) => ({ ...item, ...(byAsset.get(item.id) || {}) })),
  };
}

export function mergeMomoClientMediaReadback(
  snapshot: MomoClientSnapshot,
  value: unknown,
  restaurantId: string,
): MomoClientSnapshot {
  const cleared: MomoClientSnapshot = {
    ...snapshot,
    mediaReadbackAvailable: false,
    media: snapshot.media.map((item) => ({
      ...item,
      renditionStatus: null,
      renditionStoragePath: null,
      renditionAltText: null,
      renditionWidth: null,
      renditionHeight: null,
    })),
  };
  if (!Array.isArray(value)) return cleared;

  type Readback = Pick<MomoClientSnapshot["media"][number],
    "renditionStatus" | "renditionStoragePath" | "renditionAltText" | "renditionWidth" | "renditionHeight">;
  const knownAssetIds = new Set(snapshot.media.map((item) => item.id));
  const byAsset = new Map<string, Readback>();
  const duplicates = new Set<string>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const row = candidate as Record<string, unknown>;
    const assetId = typeof row.assetId === "string" ? row.assetId : "";
    if (!knownAssetIds.has(assetId)) continue;
    if (byAsset.has(assetId)) {
      duplicates.add(assetId);
      byAsset.delete(assetId);
      continue;
    }
    if (row.renditionStatus !== "ready") continue;
    const storagePath = typeof row.renditionStoragePath === "string" ? row.renditionStoragePath : "";
    const pathParts = storagePath.split("/");
    const canonicalPath = pathParts.length === 5
      && pathParts[0] === "restaurants"
      && pathParts[1] === restaurantId
      && pathParts[2] === "renditions"
      && pathParts[3] === assetId
      && /^[a-f0-9]{64}[.](jpg|png|webp)$/.test(pathParts[4]);
    const altText = typeof row.renditionAltText === "string" ? row.renditionAltText.trim() : "";
    const width = Number(row.renditionWidth);
    const height = Number(row.renditionHeight);
    if (!canonicalPath || altText.length < 1 || altText.length > 280
      || !Number.isInteger(width) || width < 1 || width > 8000
      || !Number.isInteger(height) || height < 1 || height > 8000) continue;
    byAsset.set(assetId, {
      renditionStatus: "ready",
      renditionStoragePath: storagePath,
      renditionAltText: altText,
      renditionWidth: width,
      renditionHeight: height,
    });
  }
  for (const assetId of duplicates) byAsset.delete(assetId);

  return {
    ...cleared,
    mediaReadbackAvailable: true,
    media: cleared.media.map((item) => ({ ...item, ...(byAsset.get(item.id) || {}) })),
  };
}

export async function loadMomoClientSnapshot(restaurantId: string): Promise<MomoClientSnapshot> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_momo_client_snapshot_v1", {
    target_restaurant_id: restaurantId,
  });
  if (error || !data) throw new Error("workspace_unavailable");
  const snapshot = parseMomoClientSnapshot(Array.isArray(data) ? data[0] : data);
  const readback = await client.rpc("veroxa_momo_client_media_status_v1", {
    target_restaurant_id: restaurantId,
  });
  const withRenditions = readback.error
    ? snapshot
    : mergeMomoClientMediaReadback(snapshot, readback.data, restaurantId);
  const pipeline = await client.rpc("veroxa_momo_client_upload_status_v3", {
    target_restaurant_id: restaurantId,
  });
  if (pipeline.error) return withRenditions;
  return mergeMomoClientUploadPipelineV3(withRenditions, pipeline.data);
}

const requestTypes = new Set<MomoClientRequest["requestType"]>([
  "onboarding", "truth_update", "media", "content", "website", "reporting", "support",
]);
const requestStatuses = new Set<MomoClientRequest["status"]>([
  "open", "acknowledged", "in_progress", "completed", "cancelled",
]);

const requestFromRow = (row: Record<string, unknown>): MomoClientRequest | null => {
  const requestType = row.requestType;
  const priority = row.priority;
  const status = row.status;
  if (typeof row.id !== "string" || typeof requestType !== "string" || !requestTypes.has(requestType as MomoClientRequest["requestType"])
    || typeof row.title !== "string" || typeof row.details !== "string"
    || (priority !== "normal" && priority !== "urgent")
    || typeof status !== "string" || !requestStatuses.has(status as MomoClientRequest["status"])
    || typeof row.createdAt !== "string" || typeof row.updatedAt !== "string") return null;
  return {
    id: row.id,
    requestType: requestType as MomoClientRequest["requestType"],
    title: row.title,
    details: row.details,
    priority,
    status: status as MomoClientRequest["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: typeof row.completedAt === "string" ? row.completedAt : null,
  };
};

export async function loadMomoClientRequests(restaurantId: string): Promise<MomoClientRequest[]> {
  const { data, error } = await requiredClient().rpc("veroxa_list_client_requests_v1", {
    p_restaurant_id: restaurantId,
    p_before: null,
    p_limit: 25,
  });
  if (error) throw new Error("requests_unavailable");
  const result = records(data).map(requestFromRow);
  if (result.some((item) => !item)) throw new Error("requests_unavailable");
  return result as MomoClientRequest[];
}

export async function loadMomoClientMessages(requestId: string): Promise<MomoClientMessage[]> {
  const { data, error } = await requiredClient().rpc("veroxa_request_thread_v1", {
    p_request_id: requestId,
    p_before: null,
    p_limit: 50,
  });
  if (error) throw new Error("conversation_unavailable");
  return records(data).map((row) => ({
    id: String(row.id || ""),
    senderRole: row.senderRole === "team" ? "team" as const : "client" as const,
    body: String(row.body || ""),
    createdAt: String(row.createdAt || ""),
  })).filter((row) => row.id && row.body);
}

export async function createMomoClientRequest(input: {
  restaurantId: string;
  requestType: MomoClientRequest["requestType"];
  title: string;
  details: string;
  priority: MomoClientRequest["priority"];
  idempotencyKey: string;
}): Promise<void> {
  const { error } = await requiredClient().rpc("veroxa_create_client_request_v1", {
    p_restaurant_id: input.restaurantId,
    p_request_type: input.requestType,
    p_title: input.title.trim(),
    p_details: input.details.trim(),
    p_priority: input.priority,
    p_idempotency_key: `request:${input.idempotencyKey}`,
  });
  if (error) throw new Error("request_save_failed");
}

export async function appendMomoClientMessage(requestId: string, body: string, idempotencyKey: string): Promise<void> {
  const { error } = await requiredClient().rpc("veroxa_append_request_message_v1", {
    p_request_id: requestId,
    p_body: body.trim(),
    p_idempotency_key: `message:${idempotencyKey}`,
  });
  if (error) throw new Error("message_save_failed");
}

export async function submitMomoClientDecision(input: {
  restaurantId: string;
  subjectType: "truth_field" | "contact" | "onboarding_step" | "presence_profile" | "media_rights" | "content_item";
  subjectId: string;
  kind: "business_truth" | "contact" | "onboarding" | "presence" | "usage_rights" | "content_direction";
  decision: "confirm" | "correct" | "reject" | "needs_help";
  proposedValue?: unknown;
  notes?: string;
}): Promise<void> {
  const { data, error } = await requiredClient().rpc("veroxa_submit_momo_confirmation_v1", {
    p_restaurant_id: input.restaurantId,
    p_subject_type: input.subjectType,
    p_subject_id: input.subjectId,
    p_confirmation_kind: input.kind,
    p_decision: input.decision,
    p_proposed_value: input.proposedValue ?? null,
    p_notes: input.notes?.trim() || null,
  });
  if (error || !data) throw new Error("decision_save_failed");
}

const MOMO_CLIENT_MIN_MEDIA_BYTES = 10 * 1024;
const MOMO_CLIENT_MAX_MEDIA_BYTES = 5 * 1024 * 1024;
const MOMO_CLIENT_MEDIA_SCOPES = ["facebook", "instagram", "google_business"] as const;

type MomoClientMediaUploadClient = Pick<SupabaseClient, "storage" | "rpc">;

export type MomoClientMediaUploadOutcome = (MomoMediaFinalizeApiResult & {
  assetId: string;
  storagePath: string;
}) | {
  status: "uploaded_but_needs_attention";
  assetId: string | null;
  storagePath: string;
  errorCode: string;
  externalWriteAllowed: false;
};

export type MomoClientMediaUploadDependencies = {
  client: MomoClientMediaUploadClient;
  finalize?: typeof finalizeMomoMediaUpload;
  now?: () => Date;
  randomUuid?: () => string;
};

function registrationAssetId(value: unknown): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const assetId = (row as { asset_id?: unknown }).asset_id;
  return isMomoContentUuid(assetId) ? assetId.toLowerCase() : null;
}

function uploadAttention(
  assetId: string | null,
  storagePath: string,
  error: unknown,
): MomoClientMediaUploadOutcome {
  const errorCode = error instanceof MomoMediaFinalizeRequestError
    ? error.code
    : typeof error === "string" && /^[a-z][a-z0-9_]{2,80}$/u.test(error)
      ? error
      : "media_verification_unavailable";
  return {
    status: "uploaded_but_needs_attention",
    assetId,
    storagePath,
    errorCode,
    externalWriteAllowed: false,
  };
}

async function finalizeRegisteredMomoClientMedia(
  input: { restaurantId: string; assetId: string; storagePath: string },
  finalize: typeof finalizeMomoMediaUpload,
): Promise<MomoClientMediaUploadOutcome> {
  try {
    const result = await finalize(input);
    return { ...result, assetId: input.assetId, storagePath: input.storagePath };
  } catch (error) {
    return uploadAttention(input.assetId, input.storagePath, error);
  }
}

export async function uploadMomoClientMediaWithDependencies(input: {
  restaurantId: string;
  file: File;
  usageScope: string[];
  expiresAt?: string;
}, dependencies: MomoClientMediaUploadDependencies): Promise<MomoClientMediaUploadOutcome> {
  if (!isMomoContentUuid(input.restaurantId)) throw new Error("invalid_restaurant_id");
  if (input.file.type !== "image/jpeg") throw new Error("invalid_media_type");
  if (input.file.size < MOMO_CLIENT_MIN_MEDIA_BYTES || input.file.size > MOMO_CLIENT_MAX_MEDIA_BYTES) {
    throw new Error("invalid_media_size");
  }
  const usageScope = [...new Set(input.usageScope)];
  if (usageScope.length < 1 || usageScope.some((scope) => !MOMO_CLIENT_MEDIA_SCOPES.includes(scope as typeof MOMO_CLIENT_MEDIA_SCOPES[number]))) {
    throw new Error("invalid_media_scope");
  }
  const now = (dependencies.now ?? (() => new Date()))();
  const objectId = (dependencies.randomUuid ?? (() => crypto.randomUUID()))();
  if (!isMomoContentUuid(objectId)) throw new Error("media_upload_failed");
  const storagePath = `restaurants/${input.restaurantId.toLowerCase()}/uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${objectId.toLowerCase()}.jpg`;
  const uploaded = await dependencies.client.storage.from("restaurant-media").upload(storagePath, input.file, {
    contentType: input.file.type,
    upsert: false,
  });
  if (uploaded.error) throw new Error("media_upload_failed");
  const registration = await dependencies.client.rpc("veroxa_register_momo_media_v2", {
    p_restaurant_id: input.restaurantId.toLowerCase(),
    p_storage_path: storagePath,
    p_mime_type: input.file.type,
    p_file_size: input.file.size,
    p_original_file_name: input.file.name,
    p_intake_notes: null,
    p_usage_scope: usageScope,
    p_expires_on: input.expiresAt || null,
  });
  if (registration.error || !registration.data) {
    await dependencies.client.storage.from("restaurant-media").remove([storagePath]);
    throw new Error("media_registration_failed");
  }
  const assetId = registrationAssetId(registration.data);
  if (!assetId) return uploadAttention(null, storagePath, "media_registration_response_invalid");
  return finalizeRegisteredMomoClientMedia({
    restaurantId: input.restaurantId.toLowerCase(),
    assetId,
    storagePath,
  }, dependencies.finalize ?? finalizeMomoMediaUpload);
}

export async function uploadMomoClientMedia(input: {
  restaurantId: string;
  file: File;
  usageScope: string[];
  expiresAt?: string;
}): Promise<MomoClientMediaUploadOutcome> {
  return uploadMomoClientMediaWithDependencies(input, { client: requiredClient() });
}

export async function retryMomoClientMediaVerification(input: {
  restaurantId: string;
  assetId: string;
  storagePath: string;
}): Promise<MomoClientMediaUploadOutcome> {
  if (!isMomoContentUuid(input.restaurantId) || !isMomoContentUuid(input.assetId)) {
    throw new Error("invalid_media_retry");
  }
  return finalizeRegisteredMomoClientMedia({
    restaurantId: input.restaurantId.toLowerCase(),
    assetId: input.assetId.toLowerCase(),
    storagePath: input.storagePath,
  }, finalizeMomoMediaUpload);
}

export async function getMomoClientMediaPreview(storagePath: string): Promise<string> {
  const { data, error } = await requiredClient().storage.from("restaurant-media").createSignedUrl(storagePath, 300);
  if (error || !data?.signedUrl) throw new Error("media_preview_failed");
  return data.signedUrl;
}

export async function revokeMomoClientMediaRights(restaurantId: string, rightsId: string, reason: string): Promise<void> {
  const { data, error } = await requiredClient().rpc("veroxa_revoke_momo_media_rights_v1", {
    p_restaurant_id: restaurantId,
    p_media_rights_id: rightsId,
    p_reason: reason.trim(),
  });
  if (error || !data) throw new Error("rights_update_failed");
}

export async function decideMomoClientAction(consentId: string, decision: "approved" | "rejected", notes?: string): Promise<void> {
  const { data, error } = await requiredClient().rpc("veroxa_decide_momo_action_consent_v1", {
    p_consent_id: consentId,
    p_decision: decision,
    p_notes: notes?.trim() || null,
  });
  if (error || typeof data !== "string") throw new Error("action_decision_failed");
}

export async function revokeMomoClientAction(consentId: string, reason: string): Promise<void> {
  const { data, error } = await requiredClient().rpc("veroxa_revoke_momo_action_consent_v1", {
    p_consent_id: consentId,
    p_reason: reason.trim(),
  });
  if (error || typeof data !== "string") throw new Error("action_revocation_failed");
}

export async function signOutMomoClient(): Promise<void> {
  const { error } = await requiredClient().auth.signOut();
  if (error) throw new Error("sign_out_failed");
}

export async function updateMomoClientPassword(
  password: string,
): Promise<{ otherRefreshSessionsRevoked: boolean }> {
  return updateHardenedVeroxaPassword(requiredClient(), password);
}
