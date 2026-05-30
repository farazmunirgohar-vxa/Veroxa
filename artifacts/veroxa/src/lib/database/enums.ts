export const ClientStatus = {
  lead: "lead",
  signed: "signed",
  onboarding: "onboarding",
  active: "active",
  needs_attention: "needs_attention",
  at_risk: "at_risk",
  paused: "paused",
  closed: "closed",
} as const;
export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];

export const PlanType = {
  three_month: "three_month",
  six_month: "six_month",
  twelve_month: "twelve_month",
  no_contract: "no_contract",
} as const;
export type PlanType = (typeof PlanType)[keyof typeof PlanType];

// ServicePackage values are legacy database placeholders. Current public pricing
// is Essential ($497/mo), Growth ($697/mo), and Premium ($997/mo); ad spend is
// separate. Do not use these enum keys to render public pricing labels.
export const ServicePackage = {
  presence: "presence",
  ads_addon: "ads_addon",
  ads_only: "ads_only",
} as const;
export type ServicePackage = (typeof ServicePackage)[keyof typeof ServicePackage];

export const ContentHealthStatus = {
  healthy: "healthy",
  caution: "caution",
  urgent: "urgent",
  broken: "broken",
} as const;
export type ContentHealthStatus = (typeof ContentHealthStatus)[keyof typeof ContentHealthStatus];

export const RiskStatus = {
  good: "good",
  risk: "risk",
  at_risk: "at_risk",
} as const;
export type RiskStatus = (typeof RiskStatus)[keyof typeof RiskStatus];

export const PlatformName = {
  instagram: "instagram",
  facebook: "facebook",
  google_business: "google_business",
  tiktok: "tiktok",
  other: "other",
} as const;
export type PlatformName = (typeof PlatformName)[keyof typeof PlatformName];

export const PlatformAccessStatus = {
  pending: "pending",
  granted: "granted",
  verified: "verified",
  revoked: "revoked",
} as const;
export type PlatformAccessStatus = (typeof PlatformAccessStatus)[keyof typeof PlatformAccessStatus];

export const OnboardingItemStatus = {
  not_started: "not_started",
  pending: "pending",
  complete: "complete",
  blocked: "blocked",
} as const;
export type OnboardingItemStatus = (typeof OnboardingItemStatus)[keyof typeof OnboardingItemStatus];

export const MediaFileType = {
  image: "image",
  video: "video",
} as const;
export type MediaFileType = (typeof MediaFileType)[keyof typeof MediaFileType];

export const MediaSourceType = {
  client_upload: "client_upload",
  legacy_reuse: "legacy_reuse",
  team_upload: "team_upload",
} as const;
export type MediaSourceType = (typeof MediaSourceType)[keyof typeof MediaSourceType];

export const MediaQualityAIFlag = {
  likely_usable: "likely_usable",
  borderline: "borderline",
  likely_reject: "likely_reject",
} as const;
export type MediaQualityAIFlag = (typeof MediaQualityAIFlag)[keyof typeof MediaQualityAIFlag];

export const MediaReviewStatus = {
  uploaded: "uploaded",
  ai_reviewed: "ai_reviewed",
  team_review_pending: "team_review_pending",
  rejected: "rejected",
  usable: "usable",
  shortlisted: "shortlisted",
  drafted: "drafted",
  approved: "approved",
  scheduled: "scheduled",
  used: "used",
  reusable_archive: "reusable_archive",
} as const;
export type MediaReviewStatus = (typeof MediaReviewStatus)[keyof typeof MediaReviewStatus];

export const ContentGoal = {
  awareness: "awareness",
  engagement: "engagement",
  conversion: "conversion",
  announcement: "announcement",
  credibility: "credibility",
} as const;
export type ContentGoal = (typeof ContentGoal)[keyof typeof ContentGoal];

export const ConceptStatus = {
  generated: "generated",
  under_review: "under_review",
  rejected: "rejected",
  approved: "approved",
} as const;
export type ConceptStatus = (typeof ConceptStatus)[keyof typeof ConceptStatus];

export const DraftSetStatus = {
  generated: "generated",
  under_review: "under_review",
  needs_regeneration: "needs_regeneration",
  approved: "approved",
  archived: "archived",
} as const;
export type DraftSetStatus = (typeof DraftSetStatus)[keyof typeof DraftSetStatus];

export const DraftVariantType = {
  safe: "safe",
  engagement: "engagement",
  sales: "sales",
} as const;
export type DraftVariantType = (typeof DraftVariantType)[keyof typeof DraftVariantType];

export const DraftVariantStatus = {
  generated: "generated",
  under_review: "under_review",
  approved: "approved",
  archived: "archived",
  used: "used",
} as const;
export type DraftVariantStatus = (typeof DraftVariantStatus)[keyof typeof DraftVariantStatus];

export const PostStatus = {
  planning: "planning",
  awaiting_content: "awaiting_content",
  ready_for_review: "ready_for_review",
  approved: "approved",
  ready_to_schedule: "ready_to_schedule",
  scheduled: "scheduled",
  published: "published",
  failed: "failed",
  reschedule_required: "reschedule_required",
  archived: "archived",
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const PostSlotStatus = {
  open: "open",
  reserved: "reserved",
  scheduled: "scheduled",
  completed: "completed",
  skipped: "skipped",
} as const;
export type PostSlotStatus = (typeof PostSlotStatus)[keyof typeof PostSlotStatus];

export const NotificationTargetRole = {
  client: "client",
  team: "team",
} as const;
export type NotificationTargetRole = (typeof NotificationTargetRole)[keyof typeof NotificationTargetRole];

export const NotificationStatus = {
  created: "created",
  sent: "sent",
  seen: "seen",
  dismissed: "dismissed",
  escalated: "escalated",
} as const;
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

export const WeeklyReportStatus = {
  drafted: "drafted",
  validated: "validated",
  published: "published",
} as const;
export type WeeklyReportStatus = (typeof WeeklyReportStatus)[keyof typeof WeeklyReportStatus];

export const MonthlyReportStatus = {
  drafting: "drafting",
  team_review: "team_review",
  team_approved: "team_approved",
  client_ready: "client_ready",
  published: "published",
  needs_revision: "needs_revision",
} as const;
export type MonthlyReportStatus = (typeof MonthlyReportStatus)[keyof typeof MonthlyReportStatus];

export const ActivityEntityType = {
  client: "client",
  media: "media",
  concept: "concept",
  draft_set: "draft_set",
  draft_variant: "draft_variant",
  post: "post",
  report: "report",
  notification: "notification",
} as const;
export type ActivityEntityType = (typeof ActivityEntityType)[keyof typeof ActivityEntityType];

export const PerformedByRole = {
  system: "system",
  client: "client",
  team: "team",
} as const;
export type PerformedByRole = (typeof PerformedByRole)[keyof typeof PerformedByRole];
