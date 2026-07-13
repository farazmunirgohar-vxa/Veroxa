import type { User } from "@supabase/supabase-js";
import { getVeroxaSupabase } from "./veroxa-supabase";

export type MomoWorkspaceSection =
  | "dashboard"
  | "intelligence"
  | "media"
  | "content"
  | "connections"
  | "operations"
  | "readiness";

export type MomoTruthField = {
  id: string;
  restaurant_id: string;
  field_key: string;
  section: string;
  value_json: unknown;
  status: string;
  source: string;
  is_current: boolean;
  owner_confirmed_by: string | null;
  owner_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MomoContact = {
  id: string;
  restaurant_id: string;
  contact_kind: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

export type MomoOnboardingStep = {
  id: string;
  step_key: string;
  title: string;
  position: number;
  status: string;
  completion_evidence: unknown;
  blocker_reason: string | null;
  completed_by: string | null;
  completed_at: string | null;
};

export type MomoPresenceProfile = {
  id: string;
  provider: string;
  public_url: string | null;
  access_status: string;
  truth_status: string;
  external_account_label: string | null;
  last_checked_at: string | null;
  notes: string | null;
};

export type MomoConfirmation = {
  id: string;
  subject_type: string;
  subject_id: string | null;
  confirmation_kind: string;
  decision: string | null;
  proposed_value: unknown;
  notes: string | null;
  status: string;
  submitted_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type MomoReadinessDimension = {
  id: string;
  dimension_key: string;
  label: string;
  required: boolean;
  status: string;
  evidence: unknown;
  blockers: unknown;
  verified_by: string | null;
  verified_at: string | null;
  updated_at: string;
};

export type MomoReadinessGate = {
  required_count: number;
  verified_count: number;
  blocker_count: number;
  overall_status: string;
  can_activate: boolean;
};

export type MomoMediaAsset = {
  id: string;
  storage_path: string;
  display_name?: string;
  original_file_name?: string | null;
  mime_type: string;
  file_size: number;
  uploaded_by: string;
  status: string;
  reuse_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MomoMediaRight = {
  id: string;
  asset_id: string;
  rights_status: string;
  usage_scope: unknown;
  valid_from: string | null;
  expires_at: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
};

export type MomoMediaReview = {
  id: string;
  asset_id: string;
  status: string;
  quality_score: number | null;
  quality_notes: string | null;
  public_use_approved: boolean;
  is_current: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

export type MomoMediaTag = {
  id: string;
  slug: string;
  label: string;
  source: string;
};

export type MomoMediaAssetTag = {
  asset_id: string;
  tag_id: string;
  source: string;
  confidence: number | null;
};

export type MomoMediaUsage = {
  id: string;
  asset_id: string;
  content_item_id: string | null;
  platform: string | null;
  usage_kind: string;
  used_at: string;
  external_reference: string | null;
};

export type MomoAiJob = {
  id: string;
  job_kind: string;
  subject_type: string;
  subject_id: string | null;
  status: string;
  provider_key: string | null;
  model_key: string | null;
  prompt_version: string;
  input_payload: unknown;
  output_payload: unknown;
  safety_flags: unknown;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type MomoContentStrategy = {
  id: string;
  title: string;
  status: string;
  goals: unknown;
  pillars: unknown;
  brand_voice_snapshot: unknown;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MomoContentItem = {
  id: string;
  strategy_id: string | null;
  primary_media_asset_id: string | null;
  title: string;
  concept: string;
  master_caption: string | null;
  status: string;
  requires_owner_confirmation: boolean;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MomoPendingContentConfirmation = {
  content_item_id: string;
  title: string;
  concept: string;
  master_caption: string | null;
  confirmation_status: string | null;
};

export type MomoContentVariant = {
  id: string;
  content_item_id: string;
  platform: string;
  caption: string;
  metadata: unknown;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MomoApproval = {
  id: string;
  subject_type: string;
  subject_id: string;
  approval_kind: string;
  status: string;
  requested_by: string;
  requested_at: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_notes: string | null;
};

export type MomoCalendarEntry = {
  id: string;
  variant_id: string;
  status: string;
  scheduled_for: string | null;
  timezone: string;
  published_at: string | null;
};

export type MomoProviderConnection = {
  id: string;
  provider: string;
  external_account_id: string | null;
  display_label: string | null;
  status: string;
  capabilities: unknown;
  scopes: unknown;
  owner_authorized_by: string | null;
  owner_authorized_at: string | null;
  last_verified_at: string | null;
  last_error: string | null;
};

export type MomoPublishQueueItem = {
  id: string;
  connection_id: string;
  variant_id: string;
  approval_id: string;
  status: string;
  scheduled_for: string | null;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string | null;
  external_post_id: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type MomoLocalCheck = {
  id: string;
  presence_profile_id: string;
  check_type: string;
  status: string;
  observed_at: string;
  evidence: unknown;
  findings: unknown;
  recommended_actions: unknown;
};

export type MomoReviewRecord = {
  id: string;
  provider: string;
  external_review_id: string;
  rating: number | null;
  review_observed_at: string;
  review_excerpt: string | null;
  response_status: string;
  response_draft: string | null;
  approval_id: string | null;
  response_published_at: string | null;
};

export type MomoVisibilitySnapshot = {
  id: string;
  source: string;
  period_start: string;
  period_end: string;
  metrics: unknown;
  evidence: unknown;
  captured_at: string;
};

export type MomoWorkItem = {
  id: string;
  work_type: string;
  title: string;
  description: string | null;
  priority: number;
  status: string;
  subject_type: string | null;
  subject_id: string | null;
  due_at: string | null;
  assigned_to: string | null;
  blocked_reason: string | null;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MomoActivityEvent = {
  id: string;
  event_type: string;
  subject_type: string;
  subject_id: string | null;
  actor_id: string | null;
  visibility: string;
  report_eligible: boolean;
  payload: unknown;
  created_at: string;
};

export type MomoReport = {
  id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  status: string;
  summary: unknown;
  evidence_event_ids: unknown;
  approved_by: string | null;
  approved_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MomoMonitorCheck = {
  id: string;
  check_key: string;
  status: string;
  details: unknown;
  checked_at: string;
  next_check_at: string | null;
};

export type MomoAlert = {
  id: string;
  monitor_check_id: string | null;
  severity: string;
  status: string;
  title: string;
  message: string;
  opened_at: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
};

export type MomoRecoveryRun = {
  id: string;
  subject_type: string;
  subject_id: string;
  action_key: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string | null;
  last_error: string | null;
  initiated_by: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MomoWorkspaceData = {
  truth: MomoTruthField[];
  contacts: MomoContact[];
  onboarding: MomoOnboardingStep[];
  presence: MomoPresenceProfile[];
  confirmations: MomoConfirmation[];
  readiness: MomoReadinessDimension[];
  readinessGate: MomoReadinessGate | null;
  media: MomoMediaAsset[];
  mediaRights: MomoMediaRight[];
  mediaReviews: MomoMediaReview[];
  mediaTags: MomoMediaTag[];
  mediaAssetTags: MomoMediaAssetTag[];
  mediaUsage: MomoMediaUsage[];
  aiJobs: MomoAiJob[];
  strategies: MomoContentStrategy[];
  contentItems: MomoContentItem[];
  pendingContentConfirmations: MomoPendingContentConfirmation[];
  variants: MomoContentVariant[];
  approvals: MomoApproval[];
  calendar: MomoCalendarEntry[];
  connections: MomoProviderConnection[];
  publishQueue: MomoPublishQueueItem[];
  localChecks: MomoLocalCheck[];
  reviews: MomoReviewRecord[];
  visibility: MomoVisibilitySnapshot[];
  work: MomoWorkItem[];
  activity: MomoActivityEvent[];
  reports: MomoReport[];
  monitors: MomoMonitorCheck[];
  alerts: MomoAlert[];
  recovery: MomoRecoveryRun[];
};

export const emptyMomoWorkspaceData = (): MomoWorkspaceData => ({
  truth: [], contacts: [], onboarding: [], presence: [], confirmations: [],
  readiness: [], readinessGate: null, media: [], mediaRights: [], mediaReviews: [],
  mediaTags: [], mediaAssetTags: [], mediaUsage: [], aiJobs: [], strategies: [],
  contentItems: [], pendingContentConfirmations: [], variants: [], approvals: [], calendar: [], connections: [],
  publishQueue: [], localChecks: [], reviews: [], visibility: [], work: [],
  activity: [], reports: [], monitors: [], alerts: [], recovery: [],
});

type QueryDefinition = {
  key: keyof MomoWorkspaceData;
  table: string;
  columns: string;
  order?: string;
  ascending?: boolean;
  limit?: number;
};

const intelligenceQueries: QueryDefinition[] = [
  { key: "truth", table: "veroxa_restaurant_truth_fields", columns: "id, restaurant_id, field_key, section, value_json, status, source, is_current, owner_confirmed_by, owner_confirmed_at, created_at, updated_at", order: "field_key" },
  { key: "contacts", table: "veroxa_restaurant_contacts", columns: "id, restaurant_id, contact_kind, name, email, phone, is_primary, status, created_at, updated_at", order: "is_primary", ascending: false },
  { key: "onboarding", table: "veroxa_onboarding_steps", columns: "id, restaurant_id, step_key, title, position, status, completion_evidence, blocker_reason, completed_by, completed_at, created_at, updated_at", order: "position" },
  { key: "presence", table: "veroxa_presence_profiles", columns: "id, restaurant_id, provider, public_url, access_status, truth_status, external_account_label, last_checked_at, notes, created_at, updated_at", order: "provider" },
  { key: "confirmations", table: "veroxa_confirmations", columns: "id, restaurant_id, subject_type, subject_id, confirmation_kind, decision, proposed_value, notes, status, submitted_by, reviewed_by, reviewed_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "readiness", table: "veroxa_readiness_dimensions", columns: "id, restaurant_id, dimension_key, label, required, status, evidence, blockers, verified_by, verified_at, created_at, updated_at", order: "label" },
];

const mediaQueries: QueryDefinition[] = [
  { key: "media", table: "veroxa_media_assets", columns: "id, restaurant_id, storage_path, original_file_name, mime_type, file_size, uploaded_by, status, reuse_count, last_used_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "mediaRights", table: "veroxa_media_rights", columns: "id, restaurant_id, asset_id, rights_status, usage_scope, valid_from, expires_at, confirmed_by, confirmed_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "mediaReviews", table: "veroxa_media_reviews", columns: "id, restaurant_id, asset_id, status, quality_score, quality_notes, public_use_approved, is_current, reviewed_by, reviewed_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "mediaTags", table: "veroxa_media_tags", columns: "id, restaurant_id, slug, label, source, created_at, updated_at", order: "label" },
  { key: "mediaAssetTags", table: "veroxa_media_asset_tags", columns: "restaurant_id, asset_id, tag_id, source, confidence, created_at", order: "created_at", ascending: false },
  { key: "mediaUsage", table: "veroxa_media_usage", columns: "id, restaurant_id, asset_id, content_item_id, platform, usage_kind, used_at, external_reference, created_at", order: "used_at", ascending: false },
  { key: "aiJobs", table: "veroxa_ai_jobs", columns: "id, restaurant_id, job_kind, subject_type, subject_id, status, provider_key, model_key, prompt_version, input_payload, output_payload, safety_flags, attempt_count, max_attempts, next_attempt_at, last_error, created_at, updated_at", order: "created_at", ascending: false },
];

const contentQueries: QueryDefinition[] = [
  { key: "strategies", table: "veroxa_content_strategies", columns: "id, restaurant_id, title, status, goals, pillars, brand_voice_snapshot, approved_by, approved_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "contentItems", table: "veroxa_content_items", columns: "id, restaurant_id, strategy_id, primary_media_asset_id, title, concept, master_caption, status, requires_owner_confirmation, created_by, approved_by, approved_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "variants", table: "veroxa_content_variants", columns: "id, restaurant_id, content_item_id, platform, caption, metadata, status, approved_by, approved_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "approvals", table: "veroxa_approvals", columns: "id, restaurant_id, subject_type, subject_id, approval_kind, status, requested_by, requested_at, decided_by, decided_at, decision_notes, created_at, updated_at", order: "requested_at", ascending: false },
  { key: "calendar", table: "veroxa_content_calendar", columns: "id, restaurant_id, variant_id, status, scheduled_for, timezone, published_at, created_at, updated_at", order: "scheduled_for" },
  { key: "connections", table: "veroxa_provider_connections", columns: "id, restaurant_id, provider, external_account_id, display_label, status, capabilities, scopes, owner_authorized_by, owner_authorized_at, last_verified_at, last_error, created_at, updated_at", order: "provider" },
  { key: "publishQueue", table: "veroxa_publish_queue", columns: "id, restaurant_id, connection_id, variant_id, approval_id, status, scheduled_for, attempt_count, max_attempts, next_attempt_at, external_post_id, last_error, created_at, updated_at", order: "created_at", ascending: false },
];

const operationsQueries: QueryDefinition[] = [
  { key: "localChecks", table: "veroxa_local_presence_checks", columns: "id, restaurant_id, presence_profile_id, check_type, status, observed_at, evidence, findings, recommended_actions, created_at, updated_at", order: "observed_at", ascending: false },
  { key: "reviews", table: "veroxa_review_records", columns: "id, restaurant_id, provider, external_review_id, rating, review_observed_at, review_excerpt, response_status, response_draft, approval_id, response_published_at, created_at, updated_at", order: "review_observed_at", ascending: false },
  { key: "visibility", table: "veroxa_visibility_snapshots", columns: "id, restaurant_id, source, period_start, period_end, metrics, evidence, captured_at, created_at", order: "captured_at", ascending: false },
  { key: "work", table: "veroxa_work_items", columns: "id, restaurant_id, work_type, title, description, priority, status, subject_type, subject_id, due_at, assigned_to, blocked_reason, attempt_count, max_attempts, next_attempt_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "activity", table: "veroxa_activity_events", columns: "id, restaurant_id, event_type, subject_type, subject_id, actor_id, visibility, report_eligible, payload, occurred_at, created_at", order: "occurred_at", ascending: false },
  { key: "reports", table: "veroxa_reports", columns: "id, restaurant_id, report_type, period_start, period_end, status, summary, evidence_event_ids, approved_by, approved_at, published_at, created_at, updated_at", order: "period_end", ascending: false },
  { key: "monitors", table: "veroxa_monitor_checks", columns: "id, restaurant_id, check_key, status, details, checked_at, next_check_at, created_at, updated_at", order: "checked_at", ascending: false },
  { key: "alerts", table: "veroxa_alerts", columns: "id, restaurant_id, monitor_check_id, severity, status, title, message, opened_at, acknowledged_by, acknowledged_at, resolved_by, resolved_at, created_at, updated_at", order: "opened_at", ascending: false },
  { key: "recovery", table: "veroxa_recovery_runs", columns: "id, restaurant_id, subject_type, subject_id, action_key, status, attempt_count, max_attempts, next_attempt_at, last_error, initiated_by, started_at, completed_at, created_at, updated_at", order: "created_at", ascending: false },
];

function queriesForSection(section: MomoWorkspaceSection): QueryDefinition[] {
  if (section === "intelligence") return intelligenceQueries;
  if (section === "media") return mediaQueries;
  if (section === "content") return [...mediaQueries, ...contentQueries];
  if (section === "connections") return [...intelligenceQueries, ...contentQueries, ...operationsQueries.slice(0, 3)];
  if (section === "operations") return [...operationsQueries, contentQueries.find((query) => query.key === "approvals")!];
  if (section === "readiness") return [...intelligenceQueries, ...operationsQueries.slice(6)];
  return [...intelligenceQueries, ...mediaQueries, ...contentQueries, ...operationsQueries];
}

function hydrateMomoClientSnapshot(raw: Record<string, unknown>, restaurantId: string): MomoWorkspaceData {
  const result = emptyMomoWorkspaceData();
  const onboarding = raw.onboarding && typeof raw.onboarding === "object"
    ? raw.onboarding as Record<string, unknown>
    : {};
  const readiness = raw.readiness && typeof raw.readiness === "object"
    ? raw.readiness as Record<string, unknown>
    : {};
  const rows = (value: unknown) => Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];

  result.truth = rows(onboarding.truthFields).map((item) => ({
    id: String(item.id), restaurant_id: restaurantId, field_key: String(item.fieldKey),
    section: String(item.section), value_json: item.value, status: String(item.status),
    source: String(item.source), is_current: true, owner_confirmed_by: null,
    owner_confirmed_at: item.ownerConfirmedAt ? String(item.ownerConfirmedAt) : null,
    created_at: "", updated_at: item.updatedAt ? String(item.updatedAt) : "",
  }));
  result.contacts = rows(onboarding.contacts).map((item) => ({
    id: String(item.id), restaurant_id: restaurantId, contact_kind: String(item.kind),
    name: String(item.name), email: item.email ? String(item.email) : null,
    phone: item.phone ? String(item.phone) : null, is_primary: Boolean(item.isPrimary),
    status: String(item.status), created_at: "", updated_at: "",
  }));
  result.onboarding = rows(onboarding.steps).map((item) => ({
    id: String(item.id), step_key: String(item.stepKey), title: String(item.title),
    position: Number(item.position), status: String(item.status), completion_evidence: [],
    blocker_reason: null, completed_by: null,
    completed_at: item.completedAt ? String(item.completedAt) : null,
  }));
  result.presence = rows(onboarding.presence).map((item) => ({
    id: String(item.id), provider: String(item.provider),
    public_url: item.publicUrl ? String(item.publicUrl) : null,
    access_status: String(item.accessStatus), truth_status: String(item.truthStatus),
    external_account_label: null,
    last_checked_at: item.lastCheckedAt ? String(item.lastCheckedAt) : null,
    notes: null,
  }));
  result.connections = rows(raw.connections).map((item) => ({
    id: String(item.provider), provider: String(item.provider),
    external_account_id: null, display_label: null, status: String(item.status),
    capabilities: [], scopes: [], owner_authorized_by: null,
    owner_authorized_at: item.ownerAuthorizedAt ? String(item.ownerAuthorizedAt) : null,
    last_verified_at: item.lastVerifiedAt ? String(item.lastVerifiedAt) : null,
    last_error: null,
  }));
  result.confirmations = rows(raw.confirmations).map((item) => ({
    id: String(item.id), subject_type: String(item.subjectType),
    subject_id: item.subjectId ? String(item.subjectId) : null,
    confirmation_kind: String(item.kind), decision: item.decision ? String(item.decision) : null,
    proposed_value: item.proposedValue, notes: item.notes ? String(item.notes) : null,
    status: String(item.status), submitted_by: "", reviewed_by: null,
    reviewed_at: item.reviewedAt ? String(item.reviewedAt) : null,
    created_at: item.submittedAt ? String(item.submittedAt) : "",
  }));
  result.readiness = rows(readiness.dimensions).map((item) => ({
    id: String(item.dimensionKey), dimension_key: String(item.dimensionKey),
    label: String(item.label), required: Boolean(item.required), status: String(item.status),
    evidence: [], blockers: [], verified_by: null,
    verified_at: item.verifiedAt ? String(item.verifiedAt) : null, updated_at: "",
  }));
  const latestGate = readiness.latestGate && typeof readiness.latestGate === "object"
    ? readiness.latestGate as Record<string, unknown>
    : null;
  if (latestGate && latestGate.status) {
    result.readinessGate = {
      required_count: Number(latestGate.requiredCount || 0),
      verified_count: Number(latestGate.verifiedCount || 0),
      blocker_count: Number(latestGate.blockerCount || 0),
      overall_status: String(latestGate.status),
      can_activate: latestGate.status === "verified" && Number(latestGate.blockerCount || 0) === 0,
    };
  }
  for (const item of rows(raw.media)) {
    const assetId = String(item.id);
    result.media.push({
      id: assetId, storage_path: item.storagePath ? String(item.storagePath) : "", display_name: String(item.displayFileName || "Private media"),
      mime_type: String(item.mimeType),
      file_size: Number(item.fileSize), uploaded_by: "", status: String(item.status),
      reuse_count: 0, last_used_at: null,
      created_at: item.createdAt ? String(item.createdAt) : "", updated_at: "",
    });
    if (item.rightsStatus) result.mediaRights.push({
      id: `${assetId}:rights`, asset_id: assetId, rights_status: String(item.rightsStatus),
      usage_scope: [], valid_from: null, expires_at: null, confirmed_by: null, confirmed_at: null,
    });
    if (item.reviewStatus) result.mediaReviews.push({
      id: `${assetId}:review`, asset_id: assetId,
      status: String(item.reviewStatus), quality_score: null, quality_notes: null,
      public_use_approved: Boolean(item.publicUseApproved), is_current: true,
      reviewed_by: null, reviewed_at: null,
    });
  }
  for (const item of rows(raw.contentCalendar)) {
    const itemId = String(item.contentItemId);
    const variantId = String(item.variantId);
    if (!result.contentItems.some((content) => content.id === itemId)) result.contentItems.push({
      id: itemId, strategy_id: null, primary_media_asset_id: null, title: String(item.title),
      concept: "", master_caption: null, status: "approved", requires_owner_confirmation: false,
      created_by: "", approved_by: null, approved_at: null, created_at: "", updated_at: "",
    });
    result.variants.push({
      id: variantId, content_item_id: itemId, platform: String(item.platform),
      caption: String(item.caption), metadata: {}, status: "approved",
      approved_by: null, approved_at: null, created_at: "", updated_at: "",
    });
    result.calendar.push({
      id: variantId, variant_id: variantId, status: String(item.calendarStatus),
      scheduled_for: item.scheduledFor ? String(item.scheduledFor) : null,
      timezone: "America/Chicago",
      published_at: item.publishedAt ? String(item.publishedAt) : null,
    });
  }
  result.pendingContentConfirmations = rows(raw.pendingContentConfirmations).map((item) => ({
    content_item_id: String(item.contentItemId || item.id),
    title: String(item.title || "Content direction"),
    concept: String(item.concept || ""),
    master_caption: item.masterCaption ? String(item.masterCaption) : null,
    confirmation_status: item.confirmationStatus
      ? String(item.confirmationStatus)
      : result.confirmations.find((confirmation) => confirmation.subject_type === "content_item" && confirmation.subject_id === String(item.contentItemId || item.id))?.status || null,
  }));
  result.reports = rows(raw.reports).map((item) => ({
    id: String(item.id), report_type: String(item.reportType),
    period_start: String(item.periodStart), period_end: String(item.periodEnd),
    status: String(item.status || "approved"), summary: item.summary, evidence_event_ids: [],
    approved_by: null, approved_at: item.approvedAt ? String(item.approvedAt) : null,
    published_at: item.publishedAt ? String(item.publishedAt) : null,
    created_at: "", updated_at: item.updatedAt ? String(item.updatedAt) : "",
  }));
  return result;
}

export async function loadMomoWorkspaceData(
  restaurantId: string,
  section: MomoWorkspaceSection,
  role: "team" | "client",
): Promise<MomoWorkspaceData> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  if (role === "client") {
    const { data, error } = await client.rpc("veroxa_momo_client_snapshot_v1", {
      target_restaurant_id: restaurantId,
    });
    if (error || !data || typeof data !== "object") throw new Error("workspace_data_unavailable");
    const payload = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
    if (!payload) throw new Error("workspace_data_unavailable");
    return hydrateMomoClientSnapshot(payload, restaurantId);
  }
  const result = emptyMomoWorkspaceData();
  const definitions = queriesForSection(section);
  const responses = await Promise.all(definitions.map(async (definition) => {
    let query = client.from(definition.table).select(definition.columns).eq("restaurant_id", restaurantId);
    if (definition.order) {
      query = query.order(definition.order, { ascending: definition.ascending ?? true });
    }
    if (definition.limit) query = query.limit(definition.limit);
    const response = await query;
    return { definition, response };
  }));
  for (const { definition, response } of responses) {
    if (response.error) throw new Error("workspace_data_unavailable");
    (result[definition.key] as unknown[]) = response.data ?? [];
  }
  if (section === "readiness" || section === "dashboard") {
    const { data, error } = await client.rpc("veroxa_momo_readiness_summary_v1", {
      target_restaurant_id: restaurantId,
    });
    if (error) throw new Error("workspace_data_unavailable");
    result.readinessGate = (Array.isArray(data) ? data[0] : data) as MomoReadinessGate | null;
  }
  return result;
}

function requiredClient() {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  return client;
}

async function currentUser(): Promise<User> {
  const client = requiredClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("session_unavailable");
  return data.user;
}

export async function saveMomoTruthField(input: {
  restaurantId: string;
  existingId?: string;
  existingStatus?: string;
  fieldKey: string;
  section: string;
  value: unknown;
  role: "team" | "client";
}): Promise<void> {
  const client = requiredClient();
  const user = await currentUser();
  if (input.role === "client") {
    if (!input.existingId) throw new Error("team_prefill_required");
    const confirmation = await client.from("veroxa_confirmations").insert({
      restaurant_id: input.restaurantId,
      subject_type: "truth_field",
      subject_id: input.existingId,
      confirmation_kind: "business_truth",
      decision: "correct",
      proposed_value: input.value,
      status: "pending",
      submitted_by: user.id,
    });
    if (confirmation.error) throw new Error("truth_save_failed");
    return;
  }
  if (input.existingId && input.existingStatus === "owner_confirmed") {
    throw new Error("owner_confirmation_locked");
  }
  const record = {
    restaurant_id: input.restaurantId,
    field_key: input.fieldKey,
    section: input.section,
    value_json: input.value,
    status: "team_prefilled",
    source: "team",
    is_current: true,
    created_by: user.id,
  };
  const response = input.existingId
    ? await client.from("veroxa_restaurant_truth_fields").update(record).eq("id", input.existingId).eq("restaurant_id", input.restaurantId).select("id").single()
    : await client.from("veroxa_restaurant_truth_fields").insert(record).select("id").single();
  if (response.error || !response.data) throw new Error("truth_save_failed");
}

export async function saveMomoContact(input: {
  restaurantId: string;
  existingId?: string;
  existingStatus?: string;
  contactKind: string;
  name: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
  role: "team" | "client";
}): Promise<void> {
  const client = requiredClient();
  const user = await currentUser();
  const proposed = {
    contact_kind: input.contactKind,
    name: input.name.trim(),
    email: input.email?.trim().toLowerCase() || null,
    phone: input.phone?.trim() || null,
    is_primary: input.isPrimary,
  };
  if (input.role === "client") {
    if (!input.existingId) {
      const bootstrap = await client.rpc("veroxa_register_primary_contact_v1", {
        p_restaurant_id: input.restaurantId,
        p_name: proposed.name,
        p_email: proposed.email,
        p_phone: proposed.phone,
      });
      if (bootstrap.error || !bootstrap.data) throw new Error("contact_save_failed");
      return;
    }
    const confirmation = await client.from("veroxa_confirmations").insert({
      restaurant_id: input.restaurantId,
      subject_type: "contact",
      subject_id: input.existingId,
      confirmation_kind: "contact",
      decision: "correct",
      proposed_value: {
        name: proposed.name,
        email: proposed.email,
        phone: proposed.phone,
        isPrimary: proposed.is_primary,
      },
      status: "pending",
      submitted_by: user.id,
    });
    if (confirmation.error) throw new Error("contact_save_failed");
    return;
  }
  if (input.existingId && input.existingStatus === "owner_confirmed") {
    throw new Error("owner_confirmation_locked");
  }
  const record = { restaurant_id: input.restaurantId, ...proposed, status: "team_prefilled", created_by: user.id };
  const response = input.existingId
    ? await client.from("veroxa_restaurant_contacts").update(record).eq("id", input.existingId).eq("restaurant_id", input.restaurantId).select("id").single()
    : await client.from("veroxa_restaurant_contacts").insert(record).select("id").single();
  if (response.error || !response.data) throw new Error("contact_save_failed");
}

export async function reviewMomoConfirmation(
  confirmation: MomoConfirmation,
  status: "approved" | "changes_requested" | "rejected",
): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_apply_confirmation_v1", {
    p_confirmation_id: confirmation.id,
    p_decision: status,
    p_applied_value: null,
    p_review_notes: null,
  });
  if (error || !data) throw new Error("confirmation_review_failed");
}

function safeMediaExtension(file: File): string {
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    "image/heic": "heic", "image/heif": "heif", "video/mp4": "mp4",
    "video/quicktime": "mov", "video/webm": "webm",
  };
  const extension = byMime[file.type];
  if (!extension) throw new Error("unsupported_media_type");
  return extension;
}

export async function uploadMomoMedia(input: {
  restaurantId: string;
  file: File;
  usageScope: string[];
  expiresAt?: string;
}): Promise<void> {
  if (input.file.size <= 0 || input.file.size > 104857600) throw new Error("invalid_media_size");
  const client = requiredClient();
  const extension = safeMediaExtension(input.file);
  const now = new Date();
  const objectId = crypto.randomUUID();
  const storagePath = `restaurants/${input.restaurantId}/uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${objectId}.${extension}`;
  const uploaded = await client.storage.from("restaurant-media").upload(storagePath, input.file, {
    contentType: input.file.type,
    upsert: false,
  });
  if (uploaded.error) throw new Error("media_upload_failed");
  const registration = await client.rpc("veroxa_register_momo_media_v1", {
    p_restaurant_id: input.restaurantId,
    p_storage_path: storagePath,
    p_mime_type: input.file.type,
    p_file_size: input.file.size,
    p_original_file_name: input.file.name,
    p_intake_notes: null,
    p_usage_scope: input.usageScope,
    p_expires_at: input.expiresAt ? new Date(`${input.expiresAt}T23:59:59`).toISOString() : null,
  });
  if (registration.error || !registration.data) {
    await client.storage.from("restaurant-media").remove([storagePath]);
    throw new Error("media_registration_failed");
  }
}

export async function reviewMomoMedia(input: {
  restaurantId: string;
  assetId: string;
  status: string;
  qualityScore: number;
  qualityNotes: string;
  publicUseApproved: boolean;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_review_momo_media_v1", {
    p_asset_id: input.assetId,
    p_status: input.status,
    p_quality_score: input.qualityScore,
    p_quality_notes: input.qualityNotes.trim() || null,
    p_public_use_approved: input.publicUseApproved,
  });
  if (error || !data) throw new Error("media_review_failed");
}

export async function addMomoMediaTag(input: {
  restaurantId: string;
  assetId: string;
  label: string;
}): Promise<void> {
  const client = requiredClient();
  const slug = input.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new Error("invalid_tag");
  const tag = await client.from("veroxa_media_tags").upsert({
    restaurant_id: input.restaurantId,
    slug,
    label: input.label.trim(),
    source: "team",
  }, { onConflict: "restaurant_id,slug" }).select("id").single();
  if (tag.error || !tag.data) throw new Error("tag_save_failed");
  const linked = await client.from("veroxa_media_asset_tags").upsert({
    restaurant_id: input.restaurantId,
    asset_id: input.assetId,
    tag_id: tag.data.id,
    source: "team",
    confidence: 1,
  }, { onConflict: "asset_id,tag_id" }).select("asset_id, tag_id").single();
  if (linked.error || !linked.data) throw new Error("tag_save_failed");
}

export async function getMomoMediaPreviewUrl(storagePath: string): Promise<string> {
  const client = requiredClient();
  const { data, error } = await client.storage.from("restaurant-media").createSignedUrl(storagePath, 300);
  if (error || !data?.signedUrl) throw new Error("media_preview_failed");
  return data.signedUrl;
}

export async function recordMomoMediaReuse(input: {
  restaurantId: string;
  assetId: string;
  contentItemId?: string;
  platform?: "facebook" | "instagram" | "google_business" | "website" | "internal";
  usageKind: "draft" | "scheduled" | "published" | "report" | "internal_reference";
}): Promise<void> {
  const client = requiredClient();
  const user = await currentUser();
  const { data, error } = await client.from("veroxa_media_usage").insert({
    restaurant_id: input.restaurantId,
    asset_id: input.assetId,
    content_item_id: input.contentItemId || null,
    platform: input.platform || "internal",
    usage_kind: input.usageKind,
    recorded_by: user.id,
  }).select("id").single();
  if (error || !data) throw new Error("media_reuse_failed");
}

export async function prepareMomoAiJob(
  restaurantId: string,
  jobKind: string,
  subjectType: string,
  subjectId: string,
): Promise<void> {
  const client = requiredClient();
  const user = await currentUser();
  const { data, error } = await client.from("veroxa_ai_jobs").insert({
    restaurant_id: restaurantId,
    job_kind: jobKind,
    subject_type: subjectType,
    subject_id: subjectId,
    status: "blocked",
    provider_key: null,
    model_key: null,
    prompt_version: "v1-provider-neutral",
    input_payload: { subject_id: subjectId },
    output_payload: null,
    safety_flags: ["live_provider_not_connected", "human_review_required"],
    attempt_count: 0,
    max_attempts: 3,
    last_error: "Provider connection not authorized",
    created_by: user.id,
  }).select("id").single();
  if (error || !data) throw new Error("ai_job_prepare_failed");
}

export async function createMomoContentStrategy(input: {
  restaurantId: string;
  title: string;
  goals: string[];
  pillars: string[];
  brandVoice: string;
}): Promise<void> {
  const client = requiredClient();
  const user = await currentUser();
  const { data, error } = await client.from("veroxa_content_strategies").insert({
    restaurant_id: input.restaurantId,
    title: input.title.trim(),
    status: "pending",
    goals: input.goals,
    pillars: input.pillars,
    brand_voice_snapshot: { summary: input.brandVoice.trim() },
    created_by: user.id,
  }).select("id").single();
  if (error || !data) throw new Error("strategy_save_failed");
}

export async function createMomoContentDraft(input: {
  restaurantId: string;
  strategyId?: string;
  mediaAssetId?: string;
  title: string;
  concept: string;
  masterCaption: string;
  requiresOwnerConfirmation: boolean;
}): Promise<void> {
  const client = requiredClient();
  const user = await currentUser();
  const { data, error } = await client.from("veroxa_content_items").insert({
    restaurant_id: input.restaurantId,
    strategy_id: input.strategyId || null,
    primary_media_asset_id: input.mediaAssetId || null,
    title: input.title.trim(),
    concept: input.concept.trim(),
    master_caption: input.masterCaption.trim(),
    status: "pending",
    requires_owner_confirmation: input.requiresOwnerConfirmation,
    created_by: user.id,
  }).select("id").single();
  if (error || !data) throw new Error("content_save_failed");
}

export async function createMomoPlatformVariant(input: {
  restaurantId: string;
  contentItemId: string;
  platform: string;
  caption: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.from("veroxa_content_variants").insert({
    restaurant_id: input.restaurantId,
    content_item_id: input.contentItemId,
    platform: input.platform,
    caption: input.caption.trim(),
    metadata: { prepared_manually: true },
    status: "pending",
  }).select("id").single();
  if (error || !data) throw new Error("variant_save_failed");
}

export async function requestMomoApproval(input: {
  restaurantId: string;
  subjectType: string;
  subjectId: string;
  approvalKind: string;
}): Promise<void> {
  const client = requiredClient();
  const user = await currentUser();
  const { data, error } = await client.from("veroxa_approvals").insert({
    restaurant_id: input.restaurantId,
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    approval_kind: input.approvalKind,
    status: "pending",
    requested_by: user.id,
    requested_at: new Date().toISOString(),
  }).select("id").single();
  if (error || !data) throw new Error("approval_request_failed");
}

export async function submitMomoContentConfirmation(input: {
  restaurantId: string;
  contentItemId: string;
  notes?: string;
}): Promise<void> {
  const client = requiredClient();
  const user = await currentUser();
  const { error } = await client.from("veroxa_confirmations").insert({
    restaurant_id: input.restaurantId,
    subject_type: "content_item",
    subject_id: input.contentItemId,
    confirmation_kind: "content_direction",
    decision: "confirm",
    proposed_value: { confirmed: true },
    notes: input.notes?.trim() || null,
    status: "pending",
    submitted_by: user.id,
  });
  if (error) throw new Error("content_confirmation_failed");
}

export async function decideMomoApproval(
  approvalId: string,
  status: "approved" | "rejected",
  notes: string,
): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_apply_approval_v1", {
    p_approval_id: approvalId,
    p_decision: status,
    p_decision_notes: notes.trim() || null,
  });
  if (error || !data) throw new Error("approval_decision_failed");
}

export async function scheduleMomoVariant(input: {
  restaurantId: string;
  variantId: string;
  scheduledFor: string;
  timezone: string;
}): Promise<void> {
  const client = requiredClient();
  const user = await currentUser();
  const { data, error } = await client.from("veroxa_content_calendar").insert({
    restaurant_id: input.restaurantId,
    variant_id: input.variantId,
    status: "approved",
    scheduled_for: new Date(input.scheduledFor).toISOString(),
    timezone: input.timezone,
    created_by: user.id,
  }).select("id").single();
  if (error || !data) throw new Error("calendar_save_failed");
}

export async function queueMomoPublication(input: {
  restaurantId: string;
  connectionId: string;
  variantId: string;
  approvalId: string;
  scheduledFor?: string;
}): Promise<void> {
  const client = requiredClient();
  const user = await currentUser();
  const { data, error } = await client.from("veroxa_publish_queue").insert({
    restaurant_id: input.restaurantId,
    connection_id: input.connectionId,
    variant_id: input.variantId,
    approval_id: input.approvalId,
    status: "queued",
    scheduled_for: input.scheduledFor ? new Date(input.scheduledFor).toISOString() : null,
    attempt_count: 0,
    max_attempts: 3,
    created_by: user.id,
  }).select("id").single();
  if (error || !data) throw new Error("publish_queue_failed");
}

export async function createMomoReportDraft(input: {
  restaurantId: string;
  reportType: "weekly" | "monthly";
  periodStart: string;
  periodEnd: string;
  summary: string;
  evidenceEventIds: string[];
}): Promise<void> {
  if (input.evidenceEventIds.length === 0) throw new Error("report_evidence_required");
  const client = requiredClient();
  const user = await currentUser();
  const { data, error } = await client.from("veroxa_reports").insert({
    restaurant_id: input.restaurantId,
    report_type: input.reportType,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    status: "pending",
    summary: { narrative: input.summary.trim() },
    evidence_event_ids: input.evidenceEventIds,
    created_by: user.id,
  }).select("id").single();
  if (error || !data) throw new Error("report_save_failed");
}

export async function createMomoWorkItem(input: {
  restaurantId: string;
  workType: string;
  title: string;
  description: string;
  priority: number;
}): Promise<void> {
  const client = requiredClient();
  const user = await currentUser();
  const { data, error } = await client.from("veroxa_work_items").insert({
    restaurant_id: input.restaurantId,
    work_type: input.workType,
    title: input.title.trim(),
    description: input.description.trim() || null,
    priority: input.priority,
    status: "queued",
    attempt_count: 0,
    max_attempts: 3,
    created_by: user.id,
  }).select("id").single();
  if (error || !data) throw new Error("work_save_failed");
}

export async function retryMomoWorkItem(
  item: Pick<MomoWorkItem, "id" | "attempt_count" | "max_attempts">,
): Promise<void> {
  if (item.attempt_count >= item.max_attempts) throw new Error("retry_limit_reached");
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_retry_work_item_v1", {
    p_work_item_id: item.id,
  });
  if (error || !data) throw new Error("retry_failed");
}
