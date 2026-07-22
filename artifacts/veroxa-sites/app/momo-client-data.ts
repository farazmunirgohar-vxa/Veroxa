import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  if (readback.error) return snapshot;
  return mergeMomoClientMediaReadback(snapshot, readback.data, restaurantId);
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

const mediaExtension = (file: File): string => {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    "image/heic": "heic", "image/heif": "heif", "video/mp4": "mp4",
    "video/quicktime": "mov", "video/webm": "webm",
  };
  const extension = extensions[file.type];
  if (!extension) throw new Error("unsupported_media_type");
  return extension;
};

export async function uploadMomoClientMedia(input: {
  restaurantId: string;
  file: File;
  usageScope: string[];
  expiresAt?: string;
}): Promise<void> {
  if (input.file.size <= 0 || input.file.size > 104857600) throw new Error("invalid_media_size");
  const supabase = requiredClient();
  const now = new Date();
  const storagePath = `restaurants/${input.restaurantId}/uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${mediaExtension(input.file)}`;
  const uploaded = await supabase.storage.from("restaurant-media").upload(storagePath, input.file, {
    contentType: input.file.type,
    upsert: false,
  });
  if (uploaded.error) throw new Error("media_upload_failed");
  const registration = await supabase.rpc("veroxa_register_momo_media_v2", {
    p_restaurant_id: input.restaurantId,
    p_storage_path: storagePath,
    p_mime_type: input.file.type,
    p_file_size: input.file.size,
    p_original_file_name: input.file.name,
    p_intake_notes: null,
    p_usage_scope: input.usageScope,
    p_expires_on: input.expiresAt || null,
  });
  if (registration.error || !registration.data) {
    await supabase.storage.from("restaurant-media").remove([storagePath]);
    throw new Error("media_registration_failed");
  }
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

export async function updateMomoClientPassword(password: string): Promise<void> {
  const { error } = await requiredClient().auth.updateUser({ password });
  if (error) throw new Error("password_update_failed");
  await requiredClient().auth.signOut({ scope: "others" }).catch(() => undefined);
}
