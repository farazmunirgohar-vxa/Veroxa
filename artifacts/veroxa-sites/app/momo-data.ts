import type { User } from "@supabase/supabase-js";
import { getVeroxaSupabase } from "./veroxa-supabase.ts";
import {
  MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION,
  MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_SHA256,
  MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_VERSION,
  isMomoContentHash,
  isMomoContentUuid,
  type MomoContentAiPackageOutput,
  type MomoContentPlatform,
} from "./momo-content-ai-contract.ts";
import { finalizeMomoMediaUpload } from "./momo-media-finalize-client.ts";

export type MomoWorkspaceSection =
  | "dashboard"
  | "requests"
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
  intake_notes?: string | null;
  mime_type: string;
  file_size: number;
  width?: number | null;
  height?: number | null;
  content_sha256?: string | null;
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
  attestation_version: string | null;
  attestation_sha256: string | null;
  valid_from: string | null;
  expires_at: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  evidence_class?: "unknown" | "development_proxy" | "synthetic" | "real_owner";
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

export type MomoMediaIntakeVerification = {
  id: string;
  restaurant_id: string;
  asset_id: string;
  detected_mime_type: string;
  file_size: number;
  width: number;
  height: number;
  content_sha256: string;
  verifier_version: string;
  status: "verified";
  verified_at: string;
};

export type MomoContentAiRun = {
  id: string;
  restaurant_id: string;
  source_asset_id: string;
  intake_verification_id: string;
  source_storage_path: string;
  source_storage_object_id: string;
  source_storage_object_version: string;
  source_mime_type: "image/jpeg";
  source_file_size: number;
  source_width: number;
  source_height: number;
  source_content_sha256: string;
  rights_id: string;
  rights_attestation_sha256: string;
  review_id: string | null;
  request_hash: string;
  target_platforms: MomoContentPlatform[];
  truth_snapshot: unknown;
  truth_snapshot_sha256: string;
  status: "reserved" | "provider_running" | "result_staged" | "pending_review" | "materialized" | "rejected" | "failed";
  model: string;
  prompt_version: string;
  validator_version: string;
  output_payload: MomoContentAiPackageOutput | null;
  output_sha256: string | null;
  validation_report: unknown;
  provider_error_code: string | null;
  provider_started_at: string | null;
  accounted_microusd: number | null;
  team_decided_at: string | null;
  decision_mode: "team_review_v1" | "automation_policy_v2";
  automation_policy_version: string | null;
  automation_identity_id: string | null;
  automation_initiated_by: string | null;
  automation_retry_of_run_id: string | null;
  automation_retry_generation: 0 | 1;
  created_at?: string;
  requested_at: string;
  updated_at: string;
};

export type MomoReadyPackage = {
  id: string;
  restaurant_id: string;
  content_ai_run_id: string;
  source_asset_id: string;
  source_storage_path: string;
  source_storage_object_id: string;
  source_storage_object_version: string;
  source_mime_type: "image/jpeg";
  source_file_size: number;
  source_width: number;
  source_height: number;
  source_content_sha256: string;
  review_id: string;
  approved_payload: MomoContentAiPackageOutput;
  approved_payload_sha256: string;
  schedule_snapshot: Record<string, string>;
  status: "ready_to_post";
  approved_by: string;
  ready_at: string;
};

export type MomoReadyPackageVariant = {
  id: string;
  restaurant_id: string;
  ready_package_id: string;
  platform: MomoContentPlatform;
  media_source_kind: "original_accepted";
  media_asset_id: string;
  media_review_id: string;
  media_storage_path: string;
  media_storage_object_id: string;
  media_storage_object_version: string;
  media_mime_type: "image/jpeg";
  media_file_size: number;
  media_width: number;
  media_height: number;
  media_content_sha256: string;
  caption: string;
  hashtags: string[];
  seo_phrases: string[];
  alt_text: string;
  call_to_action: { kind?: string; text?: string };
  scheduled_for: string;
  timezone: "America/Chicago";
  status: "ready_to_post";
};

export type MomoReadyPackageStatus = {
  ready_package_id: string;
  effective_status: "ready_to_post" | "blocked";
  blockers: string[];
};

export type MomoMediaIdentityLinkV2 = {
  id: string;
  restaurant_id: string;
  identity_id: string;
  asset_id: string;
  verification_id: string;
  canonical_asset_id: string;
  link_kind: "canonical" | "exact_duplicate";
  content_sha256: string;
  rights_id: string;
  rights_attestation_sha256: string;
  created_at: string;
};

export type MomoExceptionIncidentV2 = {
  id: string;
  restaurant_id: string;
  canonical_asset_id: string;
  stage: "media_intake" | "rights_reconciliation" | "automation_reservation" | "content_processing" | "content_validation";
  policy_version: string;
  blocker_set_sha256: string;
  status: "open" | "resolved";
  blockers: unknown;
  warnings: unknown;
  evidence_sha256: string;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  external_write_allowed: false;
};

export type MomoExceptionEventV2 = {
  id: string;
  incident_id: string;
  restaurant_id: string;
  canonical_asset_id: string;
  source_asset_id: string | null;
  content_ai_run_id: string | null;
  stage: MomoExceptionIncidentV2["stage"];
  event_kind: "opened" | "repeated" | "resolved";
  policy_version: string;
  blockers: unknown;
  warnings: unknown;
  evidence_sha256: string;
  occurred_at: string;
};

export type MomoVeroxaReadyPackageV2 = {
  id: string;
  restaurant_id: string;
  content_ai_run_id: string;
  identity_id: string;
  canonical_asset_id: string;
  source_asset_id: string;
  intake_verification_id: string;
  rights_id: string;
  rights_attestation_sha256: string;
  truth_snapshot_sha256: string;
  source_storage_path: string;
  source_storage_object_id: string;
  source_storage_object_version: string;
  source_mime_type: "image/jpeg";
  source_file_size: number;
  source_width: number;
  source_height: number;
  source_content_sha256: string;
  output_payload: MomoContentAiPackageOutput;
  output_sha256: string;
  validation_report: unknown;
  validation_sha256: string;
  decision_mode: "automation_policy_v2";
  policy_version: "momo-upload-veroxa-ready-2026-08-02-v2";
  status: "veroxa_ready";
  external_write_allowed: false;
  ready_at: string;
};

export type MomoVeroxaReadyVariantV2 = {
  id: string;
  restaurant_id: string;
  ready_package_id: string;
  platform: MomoContentPlatform;
  caption: string;
  hashtags: string[];
  seo_phrases: string[];
  alt_text: string;
  call_to_action: { kind?: string; text?: string };
  claim_ids: string[];
  status: "veroxa_ready";
  external_write_allowed: false;
  created_at: string;
};

export type MomoReadyReviewStateV2 =
  | "awaiting_team_review"
  | "approved_for_manual_export"
  | "discarded"
  | "blocked";

export type MomoReadyReviewStatusV2 = {
  ready_package_id: string;
  review_state: MomoReadyReviewStateV2;
  terminal_decision: "approved_for_manual_export" | "discarded" | null;
  decision_review_snapshot_sha256: string | null;
  decision_id: string | null;
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  inspection_attestation_version: string | null;
  inspection_attestation_text: string | null;
  inspection_attestation_sha256: string | null;
  current_review_snapshot_sha256: string;
  snapshot_current: boolean;
  can_manual_export: boolean;
  external_write_allowed: false;
  blocker_codes: string[];
};

export type MomoReadyReviewDecisionV2 = {
  decision_id: string;
  ready_package_id: string;
  review_state: "approved_for_manual_export" | "discarded" | "blocked";
  terminal_decision: "approved_for_manual_export" | "discarded";
  decision_review_snapshot_sha256: string;
  replayed: boolean;
  decided_by: string;
  decided_at: string;
  decision_reason: string | null;
  inspection_attestation_version: string | null;
  inspection_attestation_text: string | null;
  inspection_attestation_sha256: string | null;
  current_review_snapshot_sha256: string;
  snapshot_current: boolean;
  can_manual_export: boolean;
  external_write_allowed: false;
  blocker_codes: string[];
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
  superseded_by_job_id: string | null;
  superseded_at: string | null;
  supersession_reason: string | null;
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
  manual_pillar: string | null;
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
  manual_pillar: string | null;
  media_display_file_name: string | null;
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
  eligible_capabilities?: unknown;
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
  client_request_id?: string | null;
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

export type MomoClientRequest = {
  id: string;
  requestType: "onboarding" | "truth_update" | "media" | "content" | "website" | "reporting" | "support";
  title: string;
  details: string;
  priority: "normal" | "urgent";
  status: "open" | "acknowledged" | "in_progress" | "completed" | "cancelled";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type MomoRequestMessage = {
  id: string;
  senderId: string;
  senderRole: "team" | "client";
  body: string;
  createdAt: string;
};

export type MomoActivityEvent = {
  id: string;
  event_type: string;
  subject_type: string | null;
  subject_id: string | null;
  actor_id: string | null;
  visibility: string;
  report_eligible: boolean;
  payload: unknown;
  occurred_at: string;
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

export type MomoContentInputLedgerEntry = {
  id: string;
  restaurant_id: string;
  content_item_id: string;
  input_kind: string;
  truth_field_id: string | null;
  media_asset_id: string | null;
  truth_value_sha256: string | null;
  rights_attestation_version: string | null;
  rights_attestation_sha256: string | null;
  input_sha256: string;
  recorded_by: string;
  recorded_at: string;
};

export type MomoActivationDecision = {
  id: string;
  restaurant_id: string;
  gate_run_id: string;
  mode: string;
  decision: string;
  reason: string;
  blocker_snapshot: unknown;
  decided_by: string;
  decided_at: string;
  created_at: string;
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
  mediaIntake: MomoMediaIntakeVerification[];
  mediaIdentityLinksV2: MomoMediaIdentityLinkV2[];
  aiJobs: MomoAiJob[];
  contentAiRuns: MomoContentAiRun[];
  readyPackages: MomoReadyPackage[];
  readyPackageVariants: MomoReadyPackageVariant[];
  readyPackageStatuses: MomoReadyPackageStatus[];
  exceptionIncidentsV2: MomoExceptionIncidentV2[];
  exceptionEventsV2: MomoExceptionEventV2[];
  veroxaReadyPackagesV2: MomoVeroxaReadyPackageV2[];
  veroxaReadyVariantsV2: MomoVeroxaReadyVariantV2[];
  readyReviewStatusesV2: MomoReadyReviewStatusV2[];
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
  contentInputs: MomoContentInputLedgerEntry[];
  activationDecisions: MomoActivationDecision[];
};

export const emptyMomoWorkspaceData = (): MomoWorkspaceData => ({
  truth: [], contacts: [], onboarding: [], presence: [], confirmations: [],
  readiness: [], readinessGate: null, media: [], mediaRights: [], mediaReviews: [],
  mediaTags: [], mediaAssetTags: [], mediaUsage: [], mediaIntake: [], mediaIdentityLinksV2: [], aiJobs: [],
  contentAiRuns: [], readyPackages: [], readyPackageVariants: [], readyPackageStatuses: [],
  exceptionIncidentsV2: [], exceptionEventsV2: [], veroxaReadyPackagesV2: [], veroxaReadyVariantsV2: [], readyReviewStatusesV2: [], strategies: [],
  contentItems: [], pendingContentConfirmations: [], variants: [], approvals: [], calendar: [], connections: [],
  publishQueue: [], localChecks: [], reviews: [], visibility: [], work: [],
  activity: [], reports: [], monitors: [], alerts: [], recovery: [],
  contentInputs: [], activationDecisions: [],
});

type QueryDefinition = {
  key: keyof MomoWorkspaceData;
  table: string;
  columns: string;
  order?: string;
  ascending?: boolean;
  secondaryOrder?: string;
  secondaryAscending?: boolean;
  limit?: number;
  equals?: Record<string, string | boolean>;
  isNull?: string;
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
  { key: "media", table: "veroxa_media_assets", columns: "id, restaurant_id, storage_path, original_file_name, intake_notes, mime_type, file_size, width, height, content_sha256, uploaded_by, status, reuse_count, last_used_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "mediaRights", table: "veroxa_media_rights", columns: "id, restaurant_id, asset_id, rights_status, usage_scope, attestation_version, attestation_sha256, valid_from, expires_at, confirmed_by, confirmed_at, evidence_class, created_at, updated_at", order: "created_at", ascending: false },
  { key: "mediaReviews", table: "veroxa_media_reviews", columns: "id, restaurant_id, asset_id, status, quality_score, quality_notes, public_use_approved, is_current, reviewed_by, reviewed_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "mediaTags", table: "veroxa_media_tags", columns: "id, restaurant_id, slug, label, source, created_at, updated_at", order: "label" },
  { key: "mediaAssetTags", table: "veroxa_media_asset_tags", columns: "restaurant_id, asset_id, tag_id, source, confidence, created_at", order: "created_at", ascending: false },
  { key: "mediaUsage", table: "veroxa_media_usage", columns: "id, restaurant_id, asset_id, content_item_id, platform, usage_kind, used_at, external_reference, created_at", order: "used_at", ascending: false },
  { key: "mediaIntake", table: "veroxa_momo_media_intake_verifications", columns: "id, restaurant_id, asset_id, detected_mime_type, file_size, width, height, content_sha256, verifier_version, status, verified_at", order: "verified_at", ascending: false },
  { key: "mediaIdentityLinksV2", table: "veroxa_momo_media_asset_identity_links_v2", columns: "id, restaurant_id, identity_id, asset_id, verification_id, canonical_asset_id, link_kind, content_sha256, rights_id, rights_attestation_sha256, created_at", order: "created_at", ascending: false, limit: 200 },
  { key: "contentAiRuns", table: "veroxa_momo_content_ai_runs", columns: "id, restaurant_id, source_asset_id, intake_verification_id, source_storage_path, source_storage_object_id, source_storage_object_version, source_mime_type, source_file_size, source_width, source_height, source_content_sha256, rights_id, rights_attestation_sha256, review_id, request_hash, target_platforms, truth_snapshot, truth_snapshot_sha256, status, model, prompt_version, validator_version, output_payload, output_sha256, validation_report, provider_error_code, provider_started_at, accounted_microusd, team_decided_at, decision_mode, automation_policy_version, automation_identity_id, automation_initiated_by, automation_retry_of_run_id, automation_retry_generation, requested_at, updated_at", order: "requested_at", ascending: false },
  { key: "aiJobs", table: "veroxa_ai_jobs", columns: "id, restaurant_id, job_kind, subject_type, subject_id, status, provider_key, model_key, prompt_version, input_payload, output_payload, safety_flags, attempt_count, max_attempts, next_attempt_at, last_error, superseded_by_job_id, superseded_at, supersession_reason, created_at, updated_at", order: "created_at", ascending: false, isNull: "superseded_by_job_id" },
  { key: "exceptionIncidentsV2", table: "veroxa_momo_exception_incidents_v2", columns: "id, restaurant_id, canonical_asset_id, stage, policy_version, blocker_set_sha256, status, blockers, warnings, evidence_sha256, occurrence_count, first_seen_at, last_seen_at, resolved_at, external_write_allowed", order: "last_seen_at", ascending: false, equals: { status: "open", external_write_allowed: false } },
  // Routine Team reads keep immutable lineage bounded and omit the large
  // evidence snapshot/canonical payload; hashes preserve audit correlation.
  { key: "exceptionEventsV2", table: "veroxa_momo_exception_events_v2", columns: "id, incident_id, restaurant_id, canonical_asset_id, source_asset_id, content_ai_run_id, stage, event_kind, policy_version, blockers, warnings, evidence_sha256, occurred_at", order: "occurred_at", ascending: false, limit: 200 },
];

const contentQueries: QueryDefinition[] = [
  { key: "readyPackages", table: "veroxa_momo_ready_packages", columns: "id, restaurant_id, content_ai_run_id, source_asset_id, source_storage_path, source_storage_object_id, source_storage_object_version, source_mime_type, source_file_size, source_width, source_height, source_content_sha256, review_id, approved_payload, approved_payload_sha256, schedule_snapshot, status, approved_by, ready_at", order: "ready_at", ascending: false },
  { key: "readyPackageVariants", table: "veroxa_momo_ready_package_variants", columns: "id, restaurant_id, ready_package_id, platform, media_source_kind, media_asset_id, media_review_id, media_storage_path, media_storage_object_id, media_storage_object_version, media_mime_type, media_file_size, media_width, media_height, media_content_sha256, caption, hashtags, seo_phrases, alt_text, call_to_action, scheduled_for, timezone, status", order: "scheduled_for" },
  { key: "veroxaReadyPackagesV2", table: "veroxa_momo_ready_packages_v2", columns: "id, restaurant_id, content_ai_run_id, identity_id, canonical_asset_id, source_asset_id, intake_verification_id, rights_id, rights_attestation_sha256, truth_snapshot_sha256, source_storage_path, source_storage_object_id, source_storage_object_version, source_mime_type, source_file_size, source_width, source_height, source_content_sha256, output_payload, output_sha256, validation_report, validation_sha256, decision_mode, policy_version, status, external_write_allowed, ready_at", order: "ready_at", ascending: false, secondaryOrder: "id", secondaryAscending: true, limit: 50, equals: { status: "veroxa_ready", external_write_allowed: false } },
  { key: "veroxaReadyVariantsV2", table: "veroxa_momo_ready_variants_v2", columns: "id, restaurant_id, ready_package_id, platform, caption, hashtags, seo_phrases, alt_text, call_to_action, claim_ids, status, external_write_allowed, created_at", order: "platform", equals: { status: "veroxa_ready", external_write_allowed: false } },
  { key: "strategies", table: "veroxa_content_strategies", columns: "id, restaurant_id, title, status, goals, pillars, brand_voice_snapshot, approved_by, approved_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "contentItems", table: "veroxa_content_items", columns: "id, restaurant_id, strategy_id, primary_media_asset_id, title, concept, master_caption, manual_pillar, status, requires_owner_confirmation, created_by, approved_by, approved_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "variants", table: "veroxa_content_variants", columns: "id, restaurant_id, content_item_id, platform, caption, metadata, status, approved_by, approved_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "approvals", table: "veroxa_approvals", columns: "id, restaurant_id, subject_type, subject_id, approval_kind, status, requested_by, requested_at, decided_by, decided_at, decision_notes, created_at, updated_at", order: "requested_at", ascending: false },
  { key: "calendar", table: "veroxa_content_calendar", columns: "id, restaurant_id, variant_id, status, scheduled_for, timezone, published_at, created_at, updated_at", order: "scheduled_for" },
  { key: "connections", table: "veroxa_provider_connections", columns: "id, restaurant_id, provider, external_account_id, display_label, status, capabilities, scopes, owner_authorized_by, owner_authorized_at, last_verified_at, last_error, created_at, updated_at", order: "provider" },
  { key: "publishQueue", table: "veroxa_publish_queue", columns: "id, restaurant_id, connection_id, variant_id, approval_id, status, scheduled_for, attempt_count, max_attempts, next_attempt_at, external_post_id, last_error, created_at, updated_at", order: "created_at", ascending: false },
  { key: "contentInputs", table: "veroxa_content_input_ledger", columns: "id, restaurant_id, content_item_id, input_kind, truth_field_id, media_asset_id, truth_value_sha256, rights_attestation_version, rights_attestation_sha256, input_sha256, recorded_by, recorded_at", order: "recorded_at", ascending: false },
];

const operationsQueries: QueryDefinition[] = [
  { key: "localChecks", table: "veroxa_local_presence_checks", columns: "id, restaurant_id, presence_profile_id, check_type, status, observed_at, evidence, findings, recommended_actions, created_at, updated_at", order: "observed_at", ascending: false },
  { key: "reviews", table: "veroxa_review_records", columns: "id, restaurant_id, provider, external_review_id, rating, review_observed_at, review_excerpt, response_status, response_draft, approval_id, response_published_at, created_at, updated_at", order: "review_observed_at", ascending: false },
  { key: "visibility", table: "veroxa_visibility_snapshots", columns: "id, restaurant_id, source, period_start, period_end, metrics, evidence, captured_at, created_at", order: "captured_at", ascending: false },
  { key: "work", table: "veroxa_work_items", columns: "id, restaurant_id, client_request_id, work_type, title, description, priority, status, subject_type, subject_id, due_at, assigned_to, blocked_reason, attempt_count, max_attempts, next_attempt_at, created_at, updated_at", order: "created_at", ascending: false },
  { key: "activity", table: "veroxa_activity_events", columns: "id, restaurant_id, event_type, subject_type, subject_id, actor_id, visibility, report_eligible, payload, occurred_at, created_at", order: "occurred_at", ascending: false },
  { key: "reports", table: "veroxa_reports", columns: "id, restaurant_id, report_type, period_start, period_end, status, summary, evidence_event_ids, approved_by, approved_at, published_at, created_at, updated_at", order: "period_end", ascending: false },
  { key: "monitors", table: "veroxa_monitor_checks", columns: "id, restaurant_id, check_key, status, details, checked_at, next_check_at, created_at, updated_at", order: "checked_at", ascending: false },
  { key: "alerts", table: "veroxa_alerts", columns: "id, restaurant_id, monitor_check_id, severity, status, title, message, opened_at, acknowledged_by, acknowledged_at, resolved_by, resolved_at, created_at, updated_at", order: "opened_at", ascending: false },
  { key: "recovery", table: "veroxa_recovery_runs", columns: "id, restaurant_id, subject_type, subject_id, action_key, status, attempt_count, max_attempts, next_attempt_at, last_error, initiated_by, started_at, completed_at, created_at, updated_at", order: "created_at", ascending: false },
];

const readinessQueries: QueryDefinition[] = [
  { key: "activationDecisions", table: "veroxa_activation_decisions", columns: "id, restaurant_id, gate_run_id, mode, decision, reason, blocker_snapshot, decided_by, decided_at, created_at", order: "decided_at", ascending: false },
];

function queriesForSection(section: MomoWorkspaceSection): QueryDefinition[] {
  if (section === "requests") return [];
  if (section === "intelligence") return intelligenceQueries;
  if (section === "media") return [
    ...mediaQueries,
    ...contentQueries.filter((query) => ["readyPackages", "readyPackageVariants", "veroxaReadyPackagesV2", "veroxaReadyVariantsV2"].includes(query.key)),
  ];
  if (section === "content") return [
    ...intelligenceQueries.filter((query) => query.key === "truth" || query.key === "confirmations"),
    ...mediaQueries,
    ...contentQueries,
  ];
  if (section === "connections") return [...intelligenceQueries, ...contentQueries, ...operationsQueries.slice(0, 3)];
  if (section === "operations") return [...operationsQueries, contentQueries.find((query) => query.key === "approvals")!];
  if (section === "readiness") return [...intelligenceQueries, ...operationsQueries.slice(6), ...readinessQueries];
  return [...intelligenceQueries, ...mediaQueries, ...contentQueries, ...operationsQueries, ...readinessQueries];
}

export const MOMO_CLIENT_SNAPSHOT_UNKNOWN_STATUS = "unknown";

const clientSnapshotString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const clientSnapshotStatus = (value: unknown): string =>
  clientSnapshotString(value) ?? MOMO_CLIENT_SNAPSHOT_UNKNOWN_STATUS;

export function hydrateMomoClientSnapshot(raw: Record<string, unknown>, restaurantId: string): MomoWorkspaceData {
  const result = emptyMomoWorkspaceData();
  const onboarding = raw.onboarding && typeof raw.onboarding === "object"
    ? raw.onboarding as Record<string, unknown>
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
  result.confirmations = rows(raw.confirmations).map((item) => ({
    id: String(item.id), subject_type: String(item.subjectType),
    subject_id: item.subjectId ? String(item.subjectId) : null,
    confirmation_kind: String(item.kind), decision: item.decision ? String(item.decision) : null,
    proposed_value: item.proposedValue, notes: item.notes ? String(item.notes) : null,
    status: String(item.status), submitted_by: "", reviewed_by: null,
    reviewed_at: item.reviewedAt ? String(item.reviewedAt) : null,
    created_at: item.submittedAt ? String(item.submittedAt) : "",
  }));
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
      id: item.rightsId ? String(item.rightsId) : "", asset_id: assetId, rights_status: String(item.rightsStatus),
      usage_scope: Array.isArray(item.usageScope) ? item.usageScope : [],
      attestation_version: item.attestationVersion ? String(item.attestationVersion) : null,
      attestation_sha256: null,
      valid_from: item.validFrom ? String(item.validFrom) : null,
      expires_at: item.expiresAt ? String(item.expiresAt) : null,
      confirmed_by: null,
      confirmed_at: item.confirmedAt ? String(item.confirmedAt) : null,
    });
    if (item.reviewStatus) result.mediaReviews.push({
      id: `${assetId}:review`, asset_id: assetId,
      status: String(item.reviewStatus), quality_score: null, quality_notes: null,
      public_use_approved: Boolean(item.publicUseApproved), is_current: true,
      reviewed_by: null, reviewed_at: null,
    });
  }
  for (const item of rows(raw.contentCalendar)) {
    const itemId = clientSnapshotString(item.contentItemId);
    const title = clientSnapshotString(item.title);
    const variantId = clientSnapshotString(item.variantId);
    const platform = clientSnapshotString(item.platform);
    const caption = clientSnapshotString(item.caption);
    const calendarStatus = clientSnapshotString(item.calendarStatus);
    if (!itemId || !title || !variantId || !platform || !caption || !calendarStatus
      || !["scheduled", "published"].includes(calendarStatus)) continue;
    if (!result.contentItems.some((content) => content.id === itemId)) result.contentItems.push({
      id: itemId, strategy_id: null, primary_media_asset_id: null, title,
      // Client calendar visibility is not approval evidence for either source row.
      concept: "", master_caption: null, manual_pillar: null, status: clientSnapshotStatus(item.contentItemStatus), requires_owner_confirmation: false,
      created_by: "", approved_by: null, approved_at: null, created_at: "", updated_at: "",
    });
    result.variants.push({
      id: variantId, content_item_id: itemId, platform,
      caption, metadata: {}, status: clientSnapshotStatus(item.variantStatus),
      approved_by: null, approved_at: null, created_at: "", updated_at: "",
    });
    result.calendar.push({
      id: variantId, variant_id: variantId, status: calendarStatus,
      scheduled_for: item.scheduledFor ? String(item.scheduledFor) : null,
      timezone: String(item.timezone || "America/Chicago"),
      published_at: item.publishedAt ? String(item.publishedAt) : null,
    });
  }
  result.pendingContentConfirmations = rows(raw.pendingContentConfirmations).map((item) => ({
    content_item_id: String(item.contentItemId || item.id),
    title: String(item.title || "Content direction"),
    concept: String(item.concept || ""),
    master_caption: item.masterCaption ? String(item.masterCaption) : null,
    manual_pillar: item.manualPillar ? String(item.manualPillar) : null,
    media_display_file_name: item.mediaDisplayFileName ? String(item.mediaDisplayFileName) : null,
    confirmation_status: item.confirmationStatus
      ? String(item.confirmationStatus)
      : result.confirmations.find((confirmation) => confirmation.subject_type === "content_item" && confirmation.subject_id === String(item.contentItemId || item.id))?.status || null,
  }));
  for (const item of rows(raw.reports)) {
    const id = clientSnapshotString(item.id);
    const reportType = clientSnapshotString(item.reportType);
    const periodStart = clientSnapshotString(item.periodStart);
    const periodEnd = clientSnapshotString(item.periodEnd);
    const status = clientSnapshotString(item.status);
    if (!id || !reportType || !periodStart || !periodEnd || !status) continue;
    result.reports.push({
      id, report_type: reportType, period_start: periodStart, period_end: periodEnd,
      status, summary: item.summary, evidence_event_ids: [],
      approved_by: null, approved_at: item.approvedAt ? String(item.approvedAt) : null,
      published_at: item.publishedAt ? String(item.publishedAt) : null,
      created_at: "", updated_at: item.updatedAt ? String(item.updatedAt) : "",
    });
  }
  return result;
}

const MOMO_READY_REVIEW_STATES_V2 = new Set<MomoReadyReviewStateV2>([
  "awaiting_team_review",
  "approved_for_manual_export",
  "discarded",
  "blocked",
]);

const nullableReadyReviewString = (value: unknown): string | null =>
  value === null || value === undefined
    ? null
    : typeof value === "string" && value === value.trim() && value.length > 0
    ? value
    : null;

export function parseMomoReadyReviewStatusV2(
  raw: unknown,
): MomoReadyReviewStatusV2 | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const expectedKeys = [
    "ready_package_id", "review_state", "terminal_decision",
    "decision_review_snapshot_sha256", "decision_id", "decided_by",
    "decided_at", "decision_reason", "inspection_attestation_version",
    "inspection_attestation_text", "inspection_attestation_sha256",
    "current_review_snapshot_sha256",
    "snapshot_current", "can_manual_export", "external_write_allowed",
    "blocker_codes",
  ].sort();
  if (Object.keys(row).sort().join(",") !== expectedKeys.join(",")) return null;
  const reviewState = row.review_state;
  const blockers = row.blocker_codes;
  if (!isMomoContentUuid(row.ready_package_id) ||
    typeof reviewState !== "string" ||
    !MOMO_READY_REVIEW_STATES_V2.has(reviewState as MomoReadyReviewStateV2) ||
    !isMomoContentHash(row.current_review_snapshot_sha256) ||
    typeof row.snapshot_current !== "boolean" ||
    typeof row.can_manual_export !== "boolean" ||
    row.external_write_allowed !== false ||
    !Array.isArray(blockers) || blockers.length > 12 ||
    !blockers.every((item) => typeof item === "string" && item.length > 0 && item.length < 80) ||
    new Set(blockers).size !== blockers.length) {
    return null;
  }
  const decisionId = nullableReadyReviewString(row.decision_id);
  const terminalDecision = nullableReadyReviewString(row.terminal_decision);
  const decisionSnapshotSha256 = nullableReadyReviewString(
    row.decision_review_snapshot_sha256,
  );
  const decidedBy = nullableReadyReviewString(row.decided_by);
  const decidedAt = nullableReadyReviewString(row.decided_at);
  const decisionReason = nullableReadyReviewString(row.decision_reason);
  const attestationVersion = nullableReadyReviewString(row.inspection_attestation_version);
  const attestationText = nullableReadyReviewString(row.inspection_attestation_text);
  const attestationSha256 = nullableReadyReviewString(row.inspection_attestation_sha256);
  const decisionMetadataCount = [decisionId, decidedBy, decidedAt]
    .filter(Boolean).length;
  const attestationMetadataCount = [attestationVersion, attestationText, attestationSha256]
    .filter(Boolean).length;
  const attestationExact = attestationVersion === MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_VERSION &&
    attestationText === MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION &&
    attestationSha256 === MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_SHA256;
  if ([
    "terminal_decision", "decision_review_snapshot_sha256",
    "decision_id", "decided_by", "decided_at", "decision_reason",
    "inspection_attestation_version", "inspection_attestation_text",
    "inspection_attestation_sha256",
  ].some((field) =>
    row[field] !== null && row[field] !== undefined && nullableReadyReviewString(row[field]) === null
  ) ||
    (terminalDecision !== null &&
      !["approved_for_manual_export", "discarded"].includes(terminalDecision)) ||
    (decisionSnapshotSha256 !== null &&
      !isMomoContentHash(decisionSnapshotSha256)) ||
    ((terminalDecision === null) !== (decisionSnapshotSha256 === null)) ||
    ![0, 3].includes(attestationMetadataCount) ||
    (attestationMetadataCount === 3 && !attestationExact) ||
    (decisionId && !isMomoContentUuid(decisionId)) ||
    (decidedBy && !isMomoContentUuid(decidedBy)) ||
    (decidedAt && Number.isNaN(Date.parse(decidedAt))) ||
    (decisionReason && decisionReason.length > 500) ||
    (reviewState !== "approved_for_manual_export" && row.can_manual_export) ||
    ((terminalDecision === null && decisionMetadataCount !== 0) ||
      (terminalDecision !== null && decisionMetadataCount !== 3)) ||
    (terminalDecision !== null && row.snapshot_current !==
      (decisionSnapshotSha256 === row.current_review_snapshot_sha256)) ||
    (reviewState === "awaiting_team_review" &&
      (terminalDecision !== null || decisionSnapshotSha256 !== null ||
        Boolean(decisionId || decidedBy || decidedAt || decisionReason) ||
        attestationMetadataCount !== 0 || !row.snapshot_current || blockers.length !== 0)) ||
    (reviewState === "approved_for_manual_export" &&
      (terminalDecision !== "approved_for_manual_export" ||
        decisionReason !== null || !row.snapshot_current || !row.can_manual_export ||
        blockers.length !== 0 || !attestationExact)) ||
    (reviewState === "discarded" &&
      (terminalDecision !== "discarded" || !decisionReason ||
        decisionReason.length < 4 || row.can_manual_export ||
        attestationMetadataCount !== 0 ||
        (!row.snapshot_current && blockers.length === 0))) ||
    (reviewState === "blocked" &&
      (row.can_manual_export || blockers.length === 0 ||
        (terminalDecision === null &&
          (decisionSnapshotSha256 !== null || decisionMetadataCount !== 0 ||
            decisionReason !== null || attestationMetadataCount !== 0 ||
            !row.snapshot_current)) ||
        (terminalDecision !== null &&
          (terminalDecision !== "approved_for_manual_export" ||
            decisionMetadataCount !== 3 || decisionReason !== null ||
            !attestationExact || row.snapshot_current))))) {
    return null;
  }
  return {
    ready_package_id: row.ready_package_id.toLowerCase(),
    review_state: reviewState as MomoReadyReviewStateV2,
    terminal_decision: terminalDecision as
      | "approved_for_manual_export"
      | "discarded"
      | null,
    decision_review_snapshot_sha256: decisionSnapshotSha256,
    decision_id: decisionId,
    decided_by: decidedBy,
    decided_at: decidedAt,
    decision_reason: decisionReason,
    inspection_attestation_version: attestationVersion,
    inspection_attestation_text: attestationText,
    inspection_attestation_sha256: attestationSha256,
    current_review_snapshot_sha256: row.current_review_snapshot_sha256,
    snapshot_current: row.snapshot_current,
    can_manual_export: row.can_manual_export,
    external_write_allowed: false,
    blocker_codes: [...new Set(blockers)].sort(),
  };
}

export function momoReadyReviewAllowsManualExport(
  status: MomoReadyReviewStatusV2 | null | undefined,
): boolean {
  return Boolean(status &&
    status.review_state === "approved_for_manual_export" &&
    status.terminal_decision === "approved_for_manual_export" &&
    status.decision_review_snapshot_sha256 ===
      status.current_review_snapshot_sha256 &&
    isMomoContentUuid(status.ready_package_id) &&
    isMomoContentUuid(status.decision_id) &&
    isMomoContentUuid(status.decided_by) &&
    typeof status.decided_at === "string" &&
    !Number.isNaN(Date.parse(status.decided_at)) &&
    status.decision_reason === null &&
    status.snapshot_current &&
    status.can_manual_export &&
    status.blocker_codes.length === 0 &&
    status.inspection_attestation_version === MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_VERSION &&
    status.inspection_attestation_text === MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION &&
    status.inspection_attestation_sha256 === MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_SHA256 &&
    status.external_write_allowed === false &&
    isMomoContentHash(status.current_review_snapshot_sha256));
}

export function momoReadyReviewCanApprove(
  status: MomoReadyReviewStatusV2 | null | undefined,
): boolean {
  return Boolean(status && status.review_state === "awaiting_team_review" &&
    status.terminal_decision === null &&
    status.decision_review_snapshot_sha256 === null &&
    status.decision_id === null && status.decided_by === null &&
    status.decided_at === null && status.decision_reason === null &&
    status.inspection_attestation_version === null &&
    status.inspection_attestation_text === null &&
    status.inspection_attestation_sha256 === null &&
    status.snapshot_current && status.blocker_codes.length === 0 &&
    status.external_write_allowed === false &&
    isMomoContentHash(status.current_review_snapshot_sha256));
}

export function momoReadyReviewCanDiscard(
  status: MomoReadyReviewStatusV2 | null | undefined,
): boolean {
  if (!status || status.review_state === "discarded" ||
    status.external_write_allowed !== false ||
    !isMomoContentHash(status.current_review_snapshot_sha256)) return false;
  const undecided = status.terminal_decision === null &&
    status.decision_review_snapshot_sha256 === null &&
    status.decision_id === null && status.decided_by === null &&
    status.decided_at === null && status.decision_reason === null &&
    status.inspection_attestation_version === null &&
    status.inspection_attestation_text === null &&
    status.inspection_attestation_sha256 === null && status.snapshot_current &&
    ((status.review_state === "awaiting_team_review" &&
      status.blocker_codes.length === 0) ||
      (status.review_state === "blocked" &&
        status.blocker_codes.length > 0));
  const approved = status.terminal_decision ===
      "approved_for_manual_export" &&
    isMomoContentHash(status.decision_review_snapshot_sha256) &&
    isMomoContentUuid(status.decision_id) &&
    isMomoContentUuid(status.decided_by) &&
    typeof status.decided_at === "string" &&
    !Number.isNaN(Date.parse(status.decided_at)) &&
    status.decision_reason === null &&
    status.inspection_attestation_version ===
      MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_VERSION &&
    status.inspection_attestation_text ===
      MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION &&
    status.inspection_attestation_sha256 ===
      MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_SHA256 &&
    ((status.review_state === "approved_for_manual_export" &&
      status.blocker_codes.length === 0) ||
      (status.review_state === "blocked" &&
        status.blocker_codes.length > 0));
  return undecided || approved;
}

export async function getMomoReadyReviewStatusV2(input: {
  restaurantId: string;
  readyPackageId: string;
}): Promise<MomoReadyReviewStatusV2> {
  if (!isMomoContentUuid(input.restaurantId) ||
    !isMomoContentUuid(input.readyPackageId)) {
    throw new Error("ready_review_status_unavailable");
  }
  const { data, error } = await requiredClient().rpc(
    "veroxa_momo_ready_review_status_v2",
    {
      p_restaurant_id: input.restaurantId.toLowerCase(),
      p_ready_package_id: input.readyPackageId.toLowerCase(),
    },
  );
  if (error) throw new Error("ready_review_status_unavailable");
  const matches = (Array.isArray(data) ? data : data ? [data] : [])
    .map(parseMomoReadyReviewStatusV2)
    .filter((status): status is MomoReadyReviewStatusV2 =>
      Boolean(status && status.ready_package_id === input.readyPackageId.toLowerCase())
    );
  if (matches.length !== 1) throw new Error("ready_review_status_unavailable");
  return matches[0];
}

function unavailableMomoReadyReviewStatus(
  readyPackageId: string,
): MomoReadyReviewStatusV2 {
  return {
    ready_package_id: readyPackageId,
    review_state: "blocked",
    terminal_decision: null,
    decision_review_snapshot_sha256: null,
    decision_id: null,
    decided_by: null,
    decided_at: null,
    decision_reason: null,
    inspection_attestation_version: null,
    inspection_attestation_text: null,
    inspection_attestation_sha256: null,
    current_review_snapshot_sha256: "",
    snapshot_current: false,
    can_manual_export: false,
    external_write_allowed: false,
    blocker_codes: ["review_status_unavailable"],
  };
}

export async function loadMomoWorkspaceData(
  restaurantId: string,
  section: MomoWorkspaceSection,
  role: "team" | "client",
): Promise<MomoWorkspaceData> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  // Requests and messages are private tables. Their dedicated panel loads only
  // through the bounded list/thread RPCs below.
  if (section === "requests") return emptyMomoWorkspaceData();
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
  const requestedDefinitions = queriesForSection(section);
  const shouldLoadReadyVariantsV2 = requestedDefinitions.some(
    (definition) => definition.key === "veroxaReadyVariantsV2",
  );
  const definitions = requestedDefinitions.filter(
    (definition) => definition.key !== "veroxaReadyVariantsV2",
  );
  const responses = await Promise.all(definitions.map(async (definition) => {
    let query = client.from(definition.table).select(definition.columns).eq("restaurant_id", restaurantId);
    for (const [column, value] of Object.entries(definition.equals ?? {})) query = query.eq(column, value);
    if (definition.isNull) query = query.is(definition.isNull, null);
    if (definition.order) {
      query = query.order(definition.order, { ascending: definition.ascending ?? true });
    }
    if (definition.secondaryOrder) {
      query = query.order(definition.secondaryOrder, {
        ascending: definition.secondaryAscending ?? true,
      });
    }
    if (definition.limit) query = query.limit(definition.limit);
    const response = await query;
    return { definition, response };
  }));
  for (const { definition, response } of responses) {
    if (response.error) throw new Error("workspace_data_unavailable");
    (result[definition.key] as unknown[]) = response.data ?? [];
  }
  if (shouldLoadReadyVariantsV2 && result.veroxaReadyPackagesV2.length > 0) {
    const readyPackageIds = result.veroxaReadyPackagesV2.map((item) => item.id);
    const definition = contentQueries.find(
      (item) => item.key === "veroxaReadyVariantsV2",
    )!;
    const { data, error } = await client.from(definition.table)
      .select(definition.columns)
      .eq("restaurant_id", restaurantId)
      .eq("status", "veroxa_ready")
      .eq("external_write_allowed", false)
      .in("ready_package_id", readyPackageIds)
      .order("ready_package_id", { ascending: true })
      .order("platform", { ascending: true })
      .limit(Math.min(readyPackageIds.length * 3, 150));
    if (error) throw new Error("workspace_data_unavailable");
    const variants = (data ?? []) as unknown as MomoVeroxaReadyVariantV2[];
    const counts = new Map<string, number>();
    for (const variant of variants) {
      if (!readyPackageIds.includes(variant.ready_package_id)) {
        throw new Error("workspace_data_unavailable");
      }
      const count = (counts.get(variant.ready_package_id) ?? 0) + 1;
      if (count > 3) throw new Error("workspace_data_unavailable");
      counts.set(variant.ready_package_id, count);
    }
    result.veroxaReadyVariantsV2 = variants;
  }
  if (result.readyPackages.length > 0) {
    const statuses = await Promise.all(result.readyPackages.map(async (readyPackage) => {
      const { data, error } = await client.rpc("veroxa_momo_ready_package_status_v1", {
        p_ready_package_id: readyPackage.id,
      });
      if (error) throw new Error("workspace_data_unavailable");
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || typeof row !== "object") throw new Error("workspace_data_unavailable");
      const value = row as Record<string, unknown>;
      return {
        ready_package_id: String(value.ready_package_id || ""),
        effective_status: value.effective_status === "ready_to_post" ? "ready_to_post" as const : "blocked" as const,
        blockers: Array.isArray(value.blockers) ? value.blockers.filter((item): item is string => typeof item === "string") : ["readiness_unknown"],
      };
    }));
    result.readyPackageStatuses = statuses.filter((item) => item.ready_package_id);
  }
  if (result.veroxaReadyPackagesV2.length > 0) {
    const { data, error } = await client.rpc("veroxa_momo_ready_review_status_v2", {
      p_restaurant_id: restaurantId,
    });
    if (error) throw new Error("workspace_data_unavailable");
    const parsed = (Array.isArray(data) ? data : data ? [data] : [])
      .map(parseMomoReadyReviewStatusV2)
      .filter((item): item is MomoReadyReviewStatusV2 => Boolean(item));
    if (new Set(parsed.map((item) => item.ready_package_id)).size !== parsed.length) {
      throw new Error("workspace_data_unavailable");
    }
    const byPackageId = new Map(parsed.map((item) => [item.ready_package_id, item]));
    result.readyReviewStatusesV2 = result.veroxaReadyPackagesV2.map((readyPackage) =>
      byPackageId.get(readyPackage.id) ?? unavailableMomoReadyReviewStatus(readyPackage.id)
    );
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

const requestTypes = new Set<MomoClientRequest["requestType"]>([
  "onboarding", "truth_update", "media", "content", "website", "reporting", "support",
]);
const requestStatuses = new Set<MomoClientRequest["status"]>([
  "open", "acknowledged", "in_progress", "completed", "cancelled",
]);

const requestRpcError = (error: unknown, fallback: string) => {
  const message = error && typeof error === "object" && "message" in error
    ? String((error as { message?: unknown }).message || "")
    : "";
  const known = [
    "active_client_request_author_required",
    "invalid_client_request_payload",
    "client_request_idempotency_conflict",
    "client_request_rate_or_open_limit_reached",
    "request_thread_access_denied",
    "request_thread_is_closed",
    "invalid_request_message_payload",
    "request_message_idempotency_conflict",
    "request_message_rate_or_thread_limit_reached",
    "momo_team_request_transition_required",
    "invalid_client_request_transition",
    "client_request_transition_idempotency_conflict",
    "invalid_client_request_state_transition",
    "momo_team_client_request_work_required",
    "invalid_client_request_work_payload",
    "client_request_work_idempotency_conflict",
    "request_list_access_or_limit_denied",
    "request_thread_access_or_limit_denied",
  ].find((code) => message.includes(code));
  return new Error(known || fallback);
};

const jsonRows = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) throw new Error("request_data_invalid");
  if (value.some((item) => !item || typeof item !== "object" || Array.isArray(item))) throw new Error("request_data_invalid");
  return value as Record<string, unknown>[];
};

const singleRpcRow = (value: unknown): Record<string, unknown> => {
  const row = Array.isArray(value) ? (value.length === 1 ? value[0] : null) : value;
  if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("request_data_invalid");
  return row as Record<string, unknown>;
};

const requestFromJson = (row: Record<string, unknown>): MomoClientRequest | null => {
  const requestType = row.requestType;
  const status = row.status;
  const priority = row.priority;
  if (typeof row.id !== "string" || typeof requestType !== "string" || !requestTypes.has(requestType as MomoClientRequest["requestType"])
    || typeof row.title !== "string" || typeof row.details !== "string"
    || (priority !== "normal" && priority !== "urgent")
    || typeof status !== "string" || !requestStatuses.has(status as MomoClientRequest["status"])
    || typeof row.createdBy !== "string" || typeof row.createdAt !== "string"
    || typeof row.updatedAt !== "string" || (row.completedAt !== null && typeof row.completedAt !== "string")) return null;
  return {
    id: row.id,
    requestType: requestType as MomoClientRequest["requestType"],
    title: row.title,
    details: row.details,
    priority,
    status: status as MomoClientRequest["status"],
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt as string | null,
  };
};

const messageFromJson = (row: Record<string, unknown>): MomoRequestMessage | null => {
  if (typeof row.id !== "string" || typeof row.senderId !== "string"
    || (row.senderRole !== "team" && row.senderRole !== "client")
    || typeof row.body !== "string" || typeof row.createdAt !== "string") return null;
  return {
    id: row.id,
    senderId: row.senderId,
    senderRole: row.senderRole,
    body: row.body,
    createdAt: row.createdAt,
  };
};

export const newMomoRequestIdempotencyKey = (scope: "request" | "message" | "transition" | "work") =>
  `${scope}:${crypto.randomUUID()}`;

export async function loadMomoClientRequests(input: {
  restaurantId: string;
  before?: string;
  limit?: number;
}): Promise<MomoClientRequest[]> {
  const limit = input.limit ?? 25;
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error("invalid_request_list_limit");
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_list_client_requests_v1", {
    p_restaurant_id: input.restaurantId,
    p_before: input.before || null,
    p_limit: limit,
  });
  if (error) throw requestRpcError(error, "request_list_failed");
  const rows = jsonRows(data);
  const requests = rows.map(requestFromJson);
  if (requests.some((request) => request === null)) throw new Error("request_data_invalid");
  return requests as MomoClientRequest[];
}

export async function loadMomoRequestThread(input: {
  requestId: string;
  before?: string;
  limit?: number;
}): Promise<MomoRequestMessage[]> {
  const limit = input.limit ?? 50;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("invalid_request_thread_limit");
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_request_thread_v1", {
    p_request_id: input.requestId,
    p_before: input.before || null,
    p_limit: limit,
  });
  if (error) throw requestRpcError(error, "request_thread_failed");
  const rows = jsonRows(data);
  const messages = rows.map(messageFromJson);
  if (messages.some((message) => message === null)) throw new Error("request_data_invalid");
  return messages as MomoRequestMessage[];
}

export async function createMomoClientRequest(input: {
  restaurantId: string;
  requestType: MomoClientRequest["requestType"];
  title: string;
  details: string;
  priority: MomoClientRequest["priority"];
  idempotencyKey: string;
}): Promise<string> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_create_client_request_v1", {
    p_restaurant_id: input.restaurantId,
    p_request_type: input.requestType,
    p_title: input.title.trim(),
    p_details: input.details.trim(),
    p_priority: input.priority,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw requestRpcError(error, "client_request_create_failed");
  const row = singleRpcRow(data);
  if (typeof row.request_id !== "string"
    || typeof row.status !== "string"
    || !requestStatuses.has(row.status as MomoClientRequest["status"])
    || typeof row.created_at !== "string") throw new Error("client_request_create_failed");
  return row.request_id;
}

export async function appendMomoRequestMessage(input: {
  requestId: string;
  body: string;
  idempotencyKey: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_append_request_message_v1", {
    p_request_id: input.requestId,
    p_body: input.body.trim(),
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw requestRpcError(error, "request_message_failed");
  const row = singleRpcRow(data);
  if (typeof row.message_id !== "string" || typeof row.created_at !== "string") throw new Error("request_message_failed");
}

export async function transitionMomoClientRequest(input: {
  requestId: string;
  targetStatus: "acknowledged" | "in_progress" | "completed" | "cancelled";
  notes: string;
  idempotencyKey: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_transition_client_request_v1", {
    p_request_id: input.requestId,
    p_target_status: input.targetStatus,
    p_notes: input.notes.trim(),
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw requestRpcError(error, "client_request_transition_failed");
  const row = singleRpcRow(data);
  if (row.request_id !== input.requestId || row.status !== input.targetStatus || typeof row.transitioned_at !== "string") throw new Error("client_request_transition_failed");
}

export async function createMomoClientRequestWork(input: {
  requestId: string;
  workType: string;
  title: string;
  description: string;
  priority: number;
  idempotencyKey: string;
  dueAt?: string;
}): Promise<string> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_create_client_request_work_v1", {
    p_request_id: input.requestId,
    p_work_type: input.workType,
    p_title: input.title.trim(),
    p_description: input.description.trim(),
    p_priority: input.priority,
    p_idempotency_key: input.idempotencyKey,
    p_subject_type: null,
    p_subject_id: null,
    p_due_at: input.dueAt ? new Date(input.dueAt).toISOString() : null,
  });
  if (error || typeof data !== "string") throw requestRpcError(error, "client_request_work_failed");
  return data;
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
  if (input.role === "client") {
    if (!input.existingId) throw new Error("team_prefill_required");
    return submitMomoConfirmation({
      restaurantId: input.restaurantId,
      subjectType: "truth_field",
      subjectId: input.existingId,
      confirmationKind: "business_truth",
      decision: "correct",
      proposedValue: input.value,
    });
  }
  if (input.existingId && input.existingStatus === "owner_confirmed") {
    throw new Error("owner_confirmation_locked");
  }
  const response = await client.rpc("veroxa_create_truth_revisions_v1", {
    p_restaurant_id: input.restaurantId,
    p_revisions: [{
      existing_id: input.existingId || null,
      field_key: input.fieldKey,
      section: input.section,
      value_json: input.value,
      source: "team",
    }],
  });
  if (response.error || !response.data) throw new Error("truth_save_failed");
}

export async function saveMomoTruthRevisions(input: {
  restaurantId: string;
  revisions: Array<{
    existingId?: string;
    existingStatus?: string;
    fieldKey: string;
    section: string;
    value: unknown;
  }>;
}): Promise<void> {
  if (input.revisions.length === 0) return;
  if (input.revisions.some((revision) => revision.existingStatus === "owner_confirmed")) {
    throw new Error("owner_confirmation_locked");
  }
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_create_truth_revisions_v1", {
    p_restaurant_id: input.restaurantId,
    p_revisions: input.revisions.map((revision) => ({
      existing_id: revision.existingId || null,
      field_key: revision.fieldKey,
      section: revision.section,
      value_json: revision.value,
      source: "team",
    })),
  });
  if (error || !data) throw new Error("truth_save_failed");
}

export type MomoOwnerDecision = "confirm" | "correct" | "reject" | "needs_help";

export async function submitMomoConfirmation(input: {
  restaurantId: string;
  subjectType: "truth_field" | "contact" | "onboarding_step" | "presence_profile" | "media_rights" | "content_item";
  subjectId: string;
  confirmationKind: "business_truth" | "contact" | "onboarding" | "presence" | "usage_rights" | "content_direction";
  decision: MomoOwnerDecision;
  proposedValue?: unknown;
  notes?: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_submit_momo_confirmation_v1", {
    p_restaurant_id: input.restaurantId,
    p_subject_type: input.subjectType,
    p_subject_id: input.subjectId,
    p_confirmation_kind: input.confirmationKind,
    p_decision: input.decision,
    p_proposed_value: input.proposedValue ?? null,
    p_notes: input.notes?.trim() || null,
  });
  if (error || !data) throw new Error("confirmation_save_failed");
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
    return submitMomoConfirmation({
      restaurantId: input.restaurantId,
      subjectType: "contact",
      subjectId: input.existingId,
      confirmationKind: "contact",
      decision: "correct",
      proposedValue: {
        name: proposed.name,
        email: proposed.email,
        phone: proposed.phone,
        isPrimary: proposed.is_primary,
      },
      notes: "Owner submitted a contact correction.",
    });
  }
  if (input.existingId && input.existingStatus === "owner_confirmed") {
    throw new Error("owner_confirmation_locked");
  }
  const response = await client.rpc("veroxa_save_momo_contact_prefill_v1", {
    p_restaurant_id: input.restaurantId,
    p_contact_id: input.existingId || null,
    p_contact_kind: proposed.contact_kind,
    p_name: proposed.name,
    p_email: proposed.email,
    p_phone: proposed.phone,
    p_is_primary: proposed.is_primary,
  });
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

export async function updateMomoOnboardingStep(input: {
  restaurantId: string;
  stepId: string;
  status: "not_started" | "foundation_ready" | "in_progress" | "blocked" | "ready_for_review" | "verified";
  completionEvidence: unknown[];
  blockerReason?: string;
  confirmationId?: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_update_momo_onboarding_step_v1", {
    p_restaurant_id: input.restaurantId,
    p_step_id: input.stepId,
    p_status: input.status,
    p_completion_evidence: input.completionEvidence,
    p_blocker_reason: input.blockerReason?.trim() || null,
    p_confirmation_id: input.confirmationId || null,
  });
  if (error || !data) throw new Error("onboarding_update_failed");
}

export async function updateMomoPresenceProfile(input: {
  restaurantId: string;
  presenceProfileId: string;
  publicUrl?: string;
  accessStatus: "not_connected" | "awaiting_owner_access" | "connected" | "degraded" | "revoked";
  truthStatus: "unverified" | "team_prefilled" | "needs_owner_confirmation" | "owner_confirmed" | "rejected" | "superseded";
  notes?: string;
  confirmationId?: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_update_momo_presence_v1", {
    p_restaurant_id: input.restaurantId,
    p_presence_profile_id: input.presenceProfileId,
    p_public_url: input.publicUrl?.trim() || null,
    p_access_status: input.accessStatus,
    p_truth_status: input.truthStatus,
    p_notes: input.notes?.trim() || null,
    p_confirmation_id: input.confirmationId || null,
  });
  if (error || !data) throw new Error("presence_update_failed");
}

function safeMediaExtension(file: File): string {
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
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
  if (input.file.size < 10 * 1024 || input.file.size > 5 * 1024 * 1024) throw new Error("invalid_media_size");
  if (input.file.type !== "image/jpeg") throw new Error("invalid_media_type");
  const usageScope = [...new Set(input.usageScope)];
  if (usageScope.length < 1 || usageScope.some((scope) => !["facebook", "instagram", "google_business"].includes(scope))) {
    throw new Error("invalid_media_scope");
  }
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
  const registration = await client.rpc("veroxa_register_momo_media_v2", {
    p_restaurant_id: input.restaurantId,
    p_storage_path: storagePath,
    p_mime_type: input.file.type,
    p_file_size: input.file.size,
    p_original_file_name: input.file.name,
    p_intake_notes: null,
    p_usage_scope: usageScope,
    p_expires_on: input.expiresAt || null,
  });
  if (registration.error || !registration.data) {
    await client.storage.from("restaurant-media").remove([storagePath]);
    throw new Error("media_registration_failed");
  }
  const registered = Array.isArray(registration.data)
    ? registration.data[0]
    : registration.data;
  const assetId = registered && typeof registered === "object"
    && typeof (registered as { asset_id?: unknown }).asset_id === "string"
    ? (registered as { asset_id: string }).asset_id
    : "";
  if (!assetId) throw new Error("media_registration_failed");
  await finalizeMomoMediaUpload({ restaurantId: input.restaurantId, assetId, storagePath });
}

export async function retryMomoMediaVerification(input: {
  restaurantId: string;
  assetId: string;
  storagePath: string;
}): Promise<void> {
  await finalizeMomoMediaUpload(input);
}

export async function reviewMomoMedia(input: {
  restaurantId: string;
  assetId: string;
  status: string;
  qualityScore: number;
  qualityNotes: string;
  publicUseApproved: boolean;
}): Promise<string> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_review_momo_media_v1", {
    p_asset_id: input.assetId,
    p_status: input.status,
    p_quality_score: input.qualityScore,
    p_quality_notes: input.qualityNotes.trim() || null,
    p_public_use_approved: input.publicUseApproved,
  });
  if (error || !data) throw new Error("media_review_failed");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object" || typeof (row as { review_id?: unknown }).review_id !== "string") {
    throw new Error("media_review_failed");
  }
  return (row as { review_id: string }).review_id;
}

async function boundedPortalJson(
  response: Response,
  onErrorBody?: (body: Record<string, unknown>) => void,
): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text || text.length > 300000) throw new Error("portal_response_invalid");
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error("portal_response_invalid"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("portal_response_invalid");
  if (!response.ok) {
    onErrorBody?.(value as Record<string, unknown>);
    const code = typeof (value as { error?: unknown }).error === "string"
      ? (value as { error: string }).error
      : "portal_action_failed";
    throw new Error(code);
  }
  return value as Record<string, unknown>;
}

export async function generateMomoContentPackage(input: {
  restaurantId: string;
  assetId: string;
  idempotencyKey: string;
}): Promise<{ runId: string; status: "queued" | "provider_running" | "finalizing" | "pending_team_review" | "pending_review" | "materialized" | "rejected" }> {
  const idempotencyKey = input.idempotencyKey;
  const response = await fetch("/api/team/content-ai/package", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify({
      restaurantId: input.restaurantId,
      assetId: input.assetId,
      standingAutomation: true,
      idempotencyKey,
    }),
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = await boundedPortalJson(response);
  const status = typeof body.status === "string" ? body.status : "";
  const allowedStatuses = [
    "queued",
    "provider_running",
    "finalizing",
    "pending_team_review",
    "pending_review",
    "materialized",
    "rejected",
  ] as const;
  if (typeof body.runId !== "string" || !allowedStatuses.includes(
    status as typeof allowedStatuses[number],
  )) {
    throw new Error("content_package_response_invalid");
  }
  return {
    runId: body.runId,
    status: status as typeof allowedStatuses[number],
  };
}

export async function approveMomoContentPackage(input: {
  restaurantId: string;
  runId: string;
  schedules: Record<MomoContentPlatform, string> | Partial<Record<MomoContentPlatform, string>>;
  inspectionAttestation: boolean;
}): Promise<string> {
  if (input.inspectionAttestation !== true) throw new Error("package_inspection_required");
  const response = await fetch("/api/team/content-ai/approve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      restaurantId: input.restaurantId,
      runId: input.runId,
      schedules: input.schedules,
      inspectionAttestation: input.inspectionAttestation,
    }),
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = await boundedPortalJson(response);
  if (typeof body.readyPackageId !== "string") throw new Error("ready_package_response_invalid");
  return body.readyPackageId;
}

export async function getMomoReadyPackageStatus(readyPackageId: string): Promise<"ready_to_post" | "blocked"> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_momo_ready_package_status_v1", {
    p_ready_package_id: readyPackageId,
  });
  if (error) throw new Error("ready_status_unavailable");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") throw new Error("ready_status_unavailable");
  const status = (row as { effective_status?: unknown }).effective_status;
  if (status !== "ready_to_post" && status !== "blocked") throw new Error("ready_status_unavailable");
  return status;
}

export function parseMomoReadyReviewDecisionV2(
  raw: unknown,
  expected: {
    readyPackageId: string;
    decision: "approved_for_manual_export" | "discarded";
    expectedReviewSnapshotSha256: string;
    reason?: string | null;
  },
): MomoReadyReviewDecisionV2 | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) ||
    !isMomoContentUuid(expected.readyPackageId) ||
    !isMomoContentHash(expected.expectedReviewSnapshotSha256)) return null;
  const reason = expected.reason?.trim() || null;
  if (expected.decision === "discarded" &&
    (!reason || reason.length < 4 || reason.length > 500)) return null;
  const row = raw as Record<string, unknown>;
  const expectedKeys = [
    "decision_id", "ready_package_id", "review_state", "terminal_decision",
    "decision_review_snapshot_sha256", "replayed",
    "decided_by", "decided_at", "decision_reason",
    "inspection_attestation_version", "inspection_attestation_text",
    "inspection_attestation_sha256",
    "current_review_snapshot_sha256", "snapshot_current",
    "can_manual_export", "external_write_allowed", "blocker_codes",
  ].sort();
  const responseReason = nullableReadyReviewString(row.decision_reason);
  const responseAttestationVersion = nullableReadyReviewString(row.inspection_attestation_version);
  const responseAttestationText = nullableReadyReviewString(row.inspection_attestation_text);
  const responseAttestationSha256 = nullableReadyReviewString(row.inspection_attestation_sha256);
  const responseDecisionSnapshotSha256 = nullableReadyReviewString(
    row.decision_review_snapshot_sha256,
  );
  const responseAttestationExact =
    responseAttestationVersion === MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_VERSION &&
    responseAttestationText === MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION &&
    responseAttestationSha256 === MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION_SHA256;
  if (Object.keys(row).sort().join(",") !== expectedKeys.join(",") ||
    !isMomoContentUuid(row.decision_id) ||
    row.ready_package_id !== expected.readyPackageId.toLowerCase() ||
    row.terminal_decision !== expected.decision ||
    responseDecisionSnapshotSha256 !== expected.expectedReviewSnapshotSha256 ||
    !["approved_for_manual_export", "discarded", "blocked"].includes(
      String(row.review_state),
    ) ||
    typeof row.replayed !== "boolean" ||
    !isMomoContentUuid(row.decided_by) ||
    typeof row.decided_at !== "string" || Number.isNaN(Date.parse(row.decided_at)) ||
    !isMomoContentHash(row.current_review_snapshot_sha256) ||
    typeof row.snapshot_current !== "boolean" ||
    row.snapshot_current !==
      (row.current_review_snapshot_sha256 === responseDecisionSnapshotSha256) ||
    typeof row.can_manual_export !== "boolean" ||
    row.external_write_allowed !== false ||
    !Array.isArray(row.blocker_codes) || row.blocker_codes.length > 12 ||
    !row.blocker_codes.every((item) => typeof item === "string" && item.length > 0 && item.length < 80) ||
    new Set(row.blocker_codes).size !== row.blocker_codes.length ||
    (!row.snapshot_current && row.blocker_codes.length === 0) ||
    (!row.replayed && (!row.snapshot_current ||
      row.current_review_snapshot_sha256 !== expected.expectedReviewSnapshotSha256)) ||
    (expected.decision === "approved_for_manual_export" &&
      (row.decision_reason !== null || !responseAttestationExact ||
        (row.review_state === "approved_for_manual_export"
          ? (!row.can_manual_export || !row.snapshot_current ||
            row.blocker_codes.length !== 0)
          : row.review_state === "blocked"
          ? (!row.replayed || row.can_manual_export || row.snapshot_current ||
            row.blocker_codes.length === 0)
          : true))) ||
    (expected.decision === "discarded" &&
      (row.review_state !== "discarded" || row.can_manual_export ||
        !responseReason || responseReason.length < 4 ||
        responseReason.length > 500 || responseReason !== reason ||
        row.inspection_attestation_version !== null ||
        row.inspection_attestation_text !== null ||
        row.inspection_attestation_sha256 !== null))) return null;
  return {
    decision_id: row.decision_id.toLowerCase(),
    ready_package_id: row.ready_package_id,
    review_state: row.review_state as MomoReadyReviewDecisionV2["review_state"],
    terminal_decision: expected.decision,
    decision_review_snapshot_sha256: responseDecisionSnapshotSha256,
    replayed: row.replayed,
    decided_by: row.decided_by.toLowerCase(),
    decided_at: row.decided_at,
    decision_reason: responseReason,
    inspection_attestation_version: responseAttestationVersion,
    inspection_attestation_text: responseAttestationText,
    inspection_attestation_sha256: responseAttestationSha256,
    current_review_snapshot_sha256: row.current_review_snapshot_sha256,
    snapshot_current: row.snapshot_current,
    can_manual_export: row.can_manual_export,
    external_write_allowed: false,
    blocker_codes: [...row.blocker_codes],
  };
}

export async function decideMomoReadyPackageV2(input: {
  readyPackageId: string;
  decision: "approved_for_manual_export" | "discarded";
  expectedReviewSnapshotSha256: string;
  reason?: string | null;
}): Promise<MomoReadyReviewDecisionV2> {
  if (!isMomoContentUuid(input.readyPackageId) ||
    !isMomoContentHash(input.expectedReviewSnapshotSha256)) {
    throw new Error("ready_review_input_invalid");
  }
  const reason = input.reason?.trim() || null;
  if (input.decision === "discarded" &&
    (!reason || reason.length < 4 || reason.length > 500)) {
    throw new Error("ready_review_discard_reason_required");
  }
  const { data, error } = await requiredClient().rpc(
    "veroxa_decide_momo_ready_package_v2",
    {
      p_ready_package_id: input.readyPackageId.toLowerCase(),
      p_decision: input.decision,
      p_expected_review_snapshot_sha256: input.expectedReviewSnapshotSha256,
      p_reason: input.decision === "discarded" ? reason : null,
      p_inspection_attestation: input.decision === "approved_for_manual_export"
        ? MOMO_READY_V2_TEAM_INSPECTION_ATTESTATION
        : null,
    },
  );
  if (error) throw new Error("ready_review_decision_failed");
  const raw = Array.isArray(data) ? data[0] : data;
  const parsed = parseMomoReadyReviewDecisionV2(raw, input);
  if (!parsed) throw new Error("ready_review_decision_failed");
  return parsed;
}

export async function requestMomoContentPackageRevision(input: {
  runId: string;
  notes: string;
}): Promise<void> {
  if (input.notes.trim().length < 10) throw new Error("revision_note_required");
  const { data, error } = await requiredClient().rpc(
    "veroxa_reject_momo_content_ai_run_v1",
    { p_run_id: input.runId, p_notes: input.notes.trim() },
  );
  if (error || typeof data !== "string") throw new Error("content_package_revision_failed");
}

export async function revokeMomoMediaRights(input: {
  restaurantId: string;
  mediaRightsId: string;
  reason: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_revoke_momo_media_rights_v1", {
    p_restaurant_id: input.restaurantId,
    p_media_rights_id: input.mediaRightsId,
    p_reason: input.reason.trim(),
  });
  if (error || !data) throw new Error("media_rights_revoke_failed");
}

export async function addMomoMediaTag(input: {
  restaurantId: string;
  assetId: string;
  label: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_add_momo_media_tag_v1", {
    p_restaurant_id: input.restaurantId,
    p_asset_id: input.assetId,
    p_label: input.label.trim(),
  });
  if (error || !data) throw new Error("tag_save_failed");
}

export async function getMomoMediaPreviewUrl(storagePath: string): Promise<string> {
  const client = requiredClient();
  const { data, error } = await client.storage.from("restaurant-media").createSignedUrl(storagePath, 300);
  if (error || !data?.signedUrl) throw new Error("media_preview_failed");
  return data.signedUrl;
}

export async function getMomoVerifiedMediaPreviewObjectUrl(input: {
  storagePath: string;
  contentSha256: string;
  fileSize: number;
  mimeType: "image/jpeg";
}): Promise<string> {
  const signedUrl = await getMomoMediaPreviewUrl(input.storagePath);
  const response = await fetch(signedUrl, { cache: "no-store", credentials: "omit" });
  if (!response.ok) throw new Error("media_preview_verification_failed");
  const blob = await response.blob();
  if (blob.size !== input.fileSize || blob.type.split(";", 1)[0].trim() !== input.mimeType) {
    throw new Error("media_preview_verification_failed");
  }
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()));
  const contentSha256 = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (contentSha256 !== input.contentSha256) throw new Error("media_preview_verification_failed");
  return URL.createObjectURL(blob);
}

export async function recordMomoMediaReuse(input: {
  restaurantId: string;
  assetId: string;
  contentItemId?: string;
  platform?: "facebook" | "instagram" | "google_business" | "website" | "internal";
  usageKind: "draft" | "scheduled" | "published" | "report" | "internal_reference";
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_record_momo_media_reuse_v1", {
    p_restaurant_id: input.restaurantId,
    p_asset_id: input.assetId,
    p_content_item_id: input.contentItemId || null,
    p_platform: input.platform || "internal",
    p_usage_kind: input.usageKind,
  });
  if (error || !data) throw new Error("media_reuse_failed");
}

export async function prepareMomoAiJob(
  restaurantId: string,
  jobKind: string,
  subjectType: string,
  subjectId: string,
): Promise<void> {
  const { data, error } = await requiredClient().rpc("veroxa_prepare_momo_ai_job_v1", {
    p_restaurant_id: restaurantId,
    p_job_kind: jobKind,
    p_subject_type: subjectType,
    p_subject_id: subjectId,
  });
  if (error || typeof data !== "string") throw new Error("ai_job_prepare_failed");
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
  truthFieldIds: string[];
  pillar: string;
  title: string;
  concept: string;
  masterCaption: string;
  requiresOwnerConfirmation: boolean;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_create_manual_content_draft_v1", {
    p_restaurant_id: input.restaurantId,
    p_strategy_id: input.strategyId || null,
    p_primary_media_asset_id: input.mediaAssetId || null,
    p_title: input.title.trim(),
    p_concept: input.concept.trim(),
    p_master_caption: input.masterCaption.trim(),
    p_requires_owner_confirmation: input.requiresOwnerConfirmation,
    p_truth_field_ids: input.truthFieldIds,
    p_pillar: input.pillar,
  });
  if (error || !data) throw new Error("content_save_failed");
}

export async function createMomoPlatformVariant(input: {
  restaurantId: string;
  contentItemId: string;
  platform: string;
  caption: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_create_manual_variant_v1", {
    p_restaurant_id: input.restaurantId,
    p_content_item_id: input.contentItemId,
    p_platform: input.platform,
    p_caption: input.caption.trim(),
  });
  if (error || !data) throw new Error("variant_save_failed");
}

type MomoApprovalRequestKind =
  | { subjectType: "content_strategy"; approvalKind: "team_review" }
  | { subjectType: "content_item"; approvalKind: "team_review" }
  | { subjectType: "content_variant"; approvalKind: "team_review" | "publishing" }
  | { subjectType: "report"; approvalKind: "report_release" };

export async function requestMomoApproval(input: MomoApprovalRequestKind & {
  restaurantId: string;
  subjectId: string;
}): Promise<void> {
  const client = requiredClient();
  const allowedPair = new Set([
    "content_strategy:team_review",
    "content_item:team_review",
    "content_variant:team_review",
    "content_variant:publishing",
    "report:report_release",
  ]);
  if (!allowedPair.has(`${input.subjectType}:${input.approvalKind}`)) throw new Error("approval_kind_not_allowed");
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
  return submitMomoConfirmation({
    restaurantId: input.restaurantId,
    subjectType: "content_item",
    subjectId: input.contentItemId,
    confirmationKind: "content_direction",
    decision: "confirm",
    proposedValue: { confirmed: true },
    notes: input.notes,
  });
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
  const { data, error } = await client.rpc("veroxa_schedule_momo_variant_v1", {
    p_restaurant_id: input.restaurantId,
    p_variant_id: input.variantId,
    p_local_scheduled_at: input.scheduledFor,
    p_timezone: input.timezone,
  });
  if (error || !data) throw new Error("calendar_save_failed");
}

export async function queueMomoPublication(input: {
  restaurantId: string;
  connectionId: string;
  variantId: string;
  approvalId: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_queue_momo_publication_v1", {
    p_restaurant_id: input.restaurantId,
    p_connection_id: input.connectionId,
    p_variant_id: input.variantId,
    p_approval_id: input.approvalId,
  });
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
  const { data, error } = await client.rpc("veroxa_create_momo_report_draft_v1", {
    p_restaurant_id: input.restaurantId,
    p_report_type: input.reportType,
    p_period_start: input.periodStart,
    p_period_end: input.periodEnd,
    p_summary: { narrative: input.summary.trim() },
    p_evidence_event_ids: input.evidenceEventIds,
  });
  if (error || !data) throw new Error("report_save_failed");
}

export async function reviseMomoReportDraft(input: {
  reportId: string;
  summary: string;
  evidenceEventIds: string[];
}): Promise<void> {
  if (input.evidenceEventIds.length === 0) throw new Error("report_evidence_required");
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_revise_momo_report_draft_v1", {
    p_report_id: input.reportId,
    p_summary: { narrative: input.summary.trim() },
    p_evidence_event_ids: input.evidenceEventIds,
  });
  if (error || !data) throw new Error("report_revision_failed");
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

export async function transitionMomoWorkItem(input: {
  workItemId: string;
  targetStatus: "in_progress" | "blocked" | "completed" | "failed" | "cancelled";
  reason?: string;
  visibility?: "team" | "client" | "both";
  reportEligible?: boolean;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_transition_work_item_v1", {
    p_work_item_id: input.workItemId,
    p_target_status: input.targetStatus,
    p_reason: input.reason?.trim() || null,
    p_visibility: input.visibility || "team",
    p_report_eligible: input.reportEligible || false,
    p_payload: input.payload || {},
  });
  if (error || !data) throw new Error("work_transition_failed");
}

export async function recordMomoMonitorCheck(input: {
  restaurantId: string;
  checkKey: string;
  status: "healthy" | "warning" | "critical";
  details: string;
  nextCheckAt?: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_record_monitor_check_v1", {
    p_restaurant_id: input.restaurantId,
    p_check_key: input.checkKey.trim(),
    p_status: input.status,
    p_details: { note: input.details.trim(), source: "team_manual_check" },
    p_next_check_at: input.nextCheckAt ? new Date(input.nextCheckAt).toISOString() : null,
  });
  if (error || !data) throw new Error("monitor_check_failed");
}

export async function transitionMomoAlert(input: {
  alertId: string;
  targetStatus: "acknowledged" | "resolved";
  notes: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_transition_momo_alert_v1", {
    p_alert_id: input.alertId,
    p_target_status: input.targetStatus,
    p_notes: input.notes.trim(),
  });
  if (error || !data) throw new Error("alert_transition_failed");
}

export async function startMomoRecoveryRun(input: {
  workItemId: string;
  actionKey: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_start_recovery_run_v1", {
    p_work_item_id: input.workItemId,
    p_action_key: input.actionKey.trim(),
    p_max_attempts: 1,
  });
  if (error || !data) throw new Error("recovery_start_failed");
}

export async function completeMomoRecoveryRun(input: {
  recoveryRunId: string;
  succeeded: boolean;
  notes: string;
  visibility?: "team" | "client" | "both";
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_complete_recovery_run_v1", {
    p_recovery_run_id: input.recoveryRunId,
    p_succeeded: input.succeeded,
    p_notes: input.notes.trim() || null,
    p_visibility: input.visibility || "team",
  });
  if (error || !data) throw new Error("recovery_completion_failed");
}

export type MomoProviderPreflight = {
  provider: string;
  connection_status: string;
  allowed: boolean;
  blockers: unknown;
};

export async function runMomoProviderPreflight(input: {
  restaurantId: string;
  provider: "meta" | "google_business";
  requiredCapability: string;
}): Promise<MomoProviderPreflight> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_provider_preflight_v1", {
    p_restaurant_id: input.restaurantId,
    p_provider: input.provider,
    p_required_capability: input.requiredCapability,
  });
  const result = (Array.isArray(data) ? data[0] : data) as MomoProviderPreflight | null;
  if (error || !result) throw new Error("provider_preflight_failed");
  return result;
}

export type MomoReadinessGateRun = {
  gate_run_id: string;
  status: string;
  required_count: number;
  verified_count: number;
  blocker_count: number;
  can_activate: boolean;
};

export type MomoNoGoRehearsalResult = MomoReadinessGateRun & { decision_id: string | null };

export async function runMomoReadinessGate(restaurantId: string): Promise<MomoReadinessGateRun> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_run_momo_readiness_gate_v1", {
    p_restaurant_id: restaurantId,
  });
  const result = (Array.isArray(data) ? data[0] : data) as MomoReadinessGateRun | null;
  if (error || !result) throw new Error("readiness_gate_failed");
  return result;
}

export async function recordMomoNoGo(input: {
  restaurantId: string;
  gateRunId: string;
  reason: string;
}): Promise<void> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_record_momo_no_go_v1", {
    p_restaurant_id: input.restaurantId,
    p_gate_run_id: input.gateRunId,
    p_reason: input.reason.trim(),
    p_rehearsal: true,
  });
  if (error || !data) throw new Error("no_go_record_failed");
}

export async function runMomoNoGoRehearsal(input: {
  restaurantId: string;
  reason: string;
}): Promise<MomoNoGoRehearsalResult> {
  const client = requiredClient();
  const { data, error } = await client.rpc("veroxa_run_momo_no_go_rehearsal_v1", {
    p_restaurant_id: input.restaurantId,
    p_reason: input.reason.trim(),
  });
  const result = (Array.isArray(data) ? data[0] : data) as MomoNoGoRehearsalResult | null;
  if (error || !result) throw new Error("no_go_rehearsal_failed");
  return result;
}
