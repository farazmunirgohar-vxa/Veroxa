/**
 * Canonical Veroxa MVP domain types.
 *
 * These records are intentionally internal and production-shaped. Client-facing
 * pages must consume the DTOs in `clientSafe.ts`, not these raw records.
 */

export type VeroxaId = string;
export type ISODateTime = string;
export type DataConfidence = "real" | "demo" | "sample" | "unavailable";

export type ClientLifecycleStatus =
  | "lead"
  | "signed"
  | "onboarding"
  | "active"
  | "paused"
  | "offboarded";

export type PlatformKind =
  | "google_business_profile"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "website"
  | "ordering"
  | "other";

export type PlatformConnectionStatus =
  | "not_started"
  | "needs_client_input"
  | "in_review"
  | "connected"
  | "paused"
  | "unavailable";

export type OnboardingStatus =
  | "not_started"
  | "needs_client_input"
  | "in_progress"
  | "veroxa_review"
  | "complete"
  | "blocked";

export type MediaAssetStatus =
  | "uploaded"
  | "ai_reviewed"
  | "team_review"
  | "usable"
  | "needs_client_input"
  | "held"
  | "archived";

export type MediaAssetKind = "photo" | "video" | "design" | "document";

export type ContentConceptStatus =
  | "prepared"
  | "team_review"
  | "approved"
  | "held"
  | "archived";

export type DraftSetStatus =
  | "not_started"
  | "generated"
  | "team_review"
  | "needs_client_confirmation"
  | "approved"
  | "held";

export type DraftVariantStatus =
  | "drafted"
  | "team_review"
  | "approved"
  | "held"
  | "archived";

export type PostStatus =
  | "ready_for_review"
  | "approved"
  | "queued_for_later"
  | "scheduled"
  | "published"
  | "failed"
  | "held";

export type PostSlotStatus =
  | "open"
  | "reserved"
  | "queued_for_later"
  | "scheduled"
  | "published"
  | "missed";

export type NotificationAudience = "client" | "team";
export type NotificationStatus = "unread" | "read" | "dismissed";
export type NotificationKind =
  | "upload_reminder"
  | "post_published"
  | "content_supply_low"
  | "weekly_report"
  | "monthly_report"
  | "client_input_needed"
  | "team_review";

export type WeeklyReportStatus =
  | "drafted"
  | "team_validation"
  | "team_validated"
  | "client_ready"
  | "published"
  | "held";

export type MonthlyReportStatus =
  | "drafted"
  | "team_drafted"
  | "team_review"
  | "team_approved"
  | "client_ready"
  | "published"
  | "needs_revision";

export type ActivityLogActor = "client" | "team" | "system";
export type ActivityLogVisibility = "internal" | "client_safe";

export interface TimestampedRecord {
  id: VeroxaId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Client extends TimestampedRecord {
  businessName: string;
  primaryContactName?: string;
  status: ClientLifecycleStatus;
  planName?: string;
  timezone?: string;
}

export interface ClientOwnedRecord extends TimestampedRecord {
  clientId: VeroxaId;
}

export interface ClientPlatform extends ClientOwnedRecord {
  platform: PlatformKind;
  displayName: string;
  status: PlatformConnectionStatus;
  clientSafeNote?: string;
  internalConnectionReference?: string;
}

export interface OnboardingItem extends ClientOwnedRecord {
  title: string;
  status: OnboardingStatus;
  requiredFromClient: boolean;
  completedAt?: ISODateTime;
  clientSafeNextStep?: string;
  internalNotes?: string;
}

export interface MediaAsset extends ClientOwnedRecord {
  kind: MediaAssetKind;
  title: string;
  status: MediaAssetStatus;
  uploadedAt: ISODateTime;
  usedInPostIds: VeroxaId[];
  publicPreviewUrl?: string;
  internalQualityNotes?: string;
  internalRejectionReason?: string;
}

export interface ContentConcept extends ClientOwnedRecord {
  title: string;
  status: ContentConceptStatus;
  sourceMediaAssetIds: VeroxaId[];
  clientSafeSummary?: string;
  internalStrategyNotes?: string;
}

export interface DraftSet extends ClientOwnedRecord {
  conceptId: VeroxaId;
  status: DraftSetStatus;
  generatedAt?: ISODateTime;
  approvedVariantId?: VeroxaId;
  internalPromptNotes?: string;
}

export interface DraftVariant extends ClientOwnedRecord {
  draftSetId: VeroxaId;
  status: DraftVariantStatus;
  caption: string;
  creativeDirection?: string;
  internalReviewNotes?: string;
}

export interface Post extends ClientOwnedRecord {
  draftVariantId?: VeroxaId;
  mediaAssetIds: VeroxaId[];
  platform: PlatformKind;
  status: PostStatus;
  scheduledFor?: ISODateTime;
  publishedAt?: ISODateTime;
  clientSafeSummary: string;
  internalFailureReason?: string;
}

export interface PostSlot extends ClientOwnedRecord {
  postId?: VeroxaId;
  platform: PlatformKind;
  status: PostSlotStatus;
  scheduledFor: ISODateTime;
}

export interface Notification extends ClientOwnedRecord {
  audience: NotificationAudience;
  kind: NotificationKind;
  status: NotificationStatus;
  title: string;
  message: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ReportMetric {
  label: string;
  value: number | string | null;
  confidence: DataConfidence;
  note?: string;
}

export interface WeeklyReport extends ClientOwnedRecord {
  status: WeeklyReportStatus;
  weekStart: ISODateTime;
  weekEnd: ISODateTime;
  postsPlanned: number;
  postsPublished: number;
  uploadsReceived: number | null;
  topContentSummary?: string;
  trendIndicators: ReportMetric[];
  teamValidatedAt?: ISODateTime;
}

export interface MonthlyReport extends ClientOwnedRecord {
  status: MonthlyReportStatus;
  monthKey: string;
  summary: string;
  insights: string[];
  opportunities: string[];
  nextMonthPlan: string[];
  clientActions: string[];
  metrics: ReportMetric[];
  teamApprovedAt?: ISODateTime;
  internalDraftNotes?: string;
}

export interface ActivityLog extends ClientOwnedRecord {
  actor: ActivityLogActor;
  visibility: ActivityLogVisibility;
  action: string;
  summary: string;
  createdAt: ISODateTime;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface VeroxaRepository<T extends ClientOwnedRecord | Client> {
  list(clientId?: VeroxaId): Promise<T[]>;
  getById(id: VeroxaId): Promise<T | null>;
}

export interface VeroxaMvpRepositories {
  clients: VeroxaRepository<Client>;
  platforms: VeroxaRepository<ClientPlatform>;
  onboarding: VeroxaRepository<OnboardingItem>;
  mediaAssets: VeroxaRepository<MediaAsset>;
  concepts: VeroxaRepository<ContentConcept>;
  draftSets: VeroxaRepository<DraftSet>;
  draftVariants: VeroxaRepository<DraftVariant>;
  posts: VeroxaRepository<Post>;
  postSlots: VeroxaRepository<PostSlot>;
  notifications: VeroxaRepository<Notification>;
  weeklyReports: VeroxaRepository<WeeklyReport>;
  monthlyReports: VeroxaRepository<MonthlyReport>;
  activityLogs: VeroxaRepository<ActivityLog>;
}
