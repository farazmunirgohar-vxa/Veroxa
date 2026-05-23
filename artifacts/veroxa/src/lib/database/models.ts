import type {
  ClientStatus,
  PlanType,
  ServicePackage,
  ContentHealthStatus,
  RiskStatus,
  PlatformName,
  PlatformAccessStatus,
  OnboardingItemStatus,
  MediaFileType,
  MediaSourceType,
  MediaQualityAIFlag,
  MediaReviewStatus,
  ContentGoal,
  ConceptStatus,
  DraftSetStatus,
  DraftVariantType,
  DraftVariantStatus,
  PostStatus,
  PostSlotStatus,
  NotificationTargetRole,
  NotificationStatus,
  WeeklyReportStatus,
  MonthlyReportStatus,
  ActivityEntityType,
  PerformedByRole,
} from "./enums";

// All `id` fields are strings here; in the real database these become UUID primary keys.

export interface Client {
  id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string | null;
  suburb: string | null;
  city: string;
  country: string;
  status: ClientStatus;
  planType: PlanType;
  servicePackage: ServicePackage;
  postingFrequencyWeekly: number;
  monthlyRetainerCents: number;
  contentHealthStatus: ContentHealthStatus;
  riskStatus: RiskStatus;
  signedAt: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPlatform {
  id: string;
  clientId: string;
  platformName: PlatformName;
  handle: string | null;
  accessStatus: PlatformAccessStatus;
  accessGrantedAt: string | null;
  verifiedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingItem {
  id: string;
  clientId: string;
  label: string;
  status: OnboardingItemStatus;
  completedAt: string | null;
  blockedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  clientId: string;
  fileType: MediaFileType;
  sourceType: MediaSourceType;
  storageUrl: string;
  thumbnailUrl: string | null;
  aiQualityFlag: MediaQualityAIFlag | null;
  aiQualityNotes: string | null;
  reviewStatus: MediaReviewStatus;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  usedInPostId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentConcept {
  id: string;
  clientId: string;
  mediaAssetId: string | null;
  goal: ContentGoal;
  conceptTitle: string;
  conceptBody: string;
  status: ConceptStatus;
  generatedByAI: boolean;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DraftSet {
  id: string;
  clientId: string;
  conceptId: string;
  status: DraftSetStatus;
  generatedAt: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DraftVariant {
  id: string;
  clientId: string;
  draftSetId: string;
  variantType: DraftVariantType;
  captionText: string;
  hashtags: string[];
  status: DraftVariantStatus;
  usedInPostId: string | null;
  approvedByUserId: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  clientId: string;
  platformName: PlatformName;
  mediaAssetId: string | null;
  draftVariantId: string | null;
  postSlotId: string | null;
  status: PostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostSlot {
  id: string;
  clientId: string;
  platformName: PlatformName;
  slotDate: string;
  slotTime: string | null;
  status: PostSlotStatus;
  postId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  clientId: string;
  targetRole: NotificationTargetRole;
  targetUserId: string | null;
  subject: string;
  body: string;
  status: NotificationStatus;
  sentAt: string | null;
  seenAt: string | null;
  escalatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReport {
  id: string;
  clientId: string;
  weekStartDate: string;
  weekEndDate: string;
  status: WeeklyReportStatus;
  postsPublished: number;
  postsPlanned: number;
  completionRate: number;
  summaryText: string | null;
  generatedAt: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReport {
  id: string;
  clientId: string;
  month: number;
  year: number;
  status: MonthlyReportStatus;
  postsPublished: number;
  postsPlanned: number;
  completionRate: number;
  summaryText: string | null;
  operatorReviewedAt: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  clientId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: string;
  performedByRole: PerformedByRole;
  performedByUserId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
