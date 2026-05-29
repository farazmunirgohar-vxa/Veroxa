/**
 * schedulePreviewTypes.ts — type contracts for the scheduling /
 * publishing-prep queue.
 *
 * SIMULATED / PREP ONLY. There is NO real publishing, NO social API
 * connection, NO auto-messaging, and NO writes. Every slot is a DRAFT
 * recommendation that requires Veroxa team approval before any future
 * publishing connector could ever act on it.
 */

import type { AiAgentStatus } from "@/lib/ai/aiAgentTypes";

// ---------------------------------------------------------------------------
// Scheduling lifecycle.
// ---------------------------------------------------------------------------

export type ScheduleStage =
  | "draft_ready"
  | "needs_team_review"
  | "approved_for_schedule"
  | "suggested_slot_ready"
  | "blocked_missing_media_or_context"
  | "scheduled_placeholder";

export const SCHEDULE_STAGE_LABELS: Record<ScheduleStage, string> = {
  draft_ready: "Draft ready",
  needs_team_review: "Needs team review",
  approved_for_schedule: "Approved for schedule",
  suggested_slot_ready: "Suggested slot ready",
  blocked_missing_media_or_context: "Blocked — missing media/context",
  scheduled_placeholder: "Scheduled (placeholder)",
};

// ---------------------------------------------------------------------------
// Content categories used for posting-window reasoning.
// ---------------------------------------------------------------------------

export type ScheduleContentType =
  | "lunch_reminder"
  | "dinner_craving"
  | "weekend_family_meal"
  | "special_menu_feature"
  | "behind_the_scenes"
  | "trust_review_story";

export const SCHEDULE_CONTENT_TYPE_LABELS: Record<ScheduleContentType, string> =
  {
    lunch_reminder: "Lunch reminder",
    dinner_craving: "Dinner craving",
    weekend_family_meal: "Weekend family meal",
    special_menu_feature: "Special / menu feature",
    behind_the_scenes: "Behind-the-scenes",
    trust_review_story: "Trust / review / story",
  };

// ---------------------------------------------------------------------------
// A single scheduling-prep recommendation.
// ---------------------------------------------------------------------------

export interface SchedulePreviewItem {
  submissionId: string;
  /** Restaurant / client display name (team surfaces only). */
  restaurantName: string;
  stage: ScheduleStage;
  stageLabel: string;
  status: AiAgentStatus;
  contentType: ScheduleContentType;
  contentTypeLabel: string;
  /** Human-readable recommended posting window (no exact promise). */
  recommendedWindow: string;
  /** Why this window was suggested. */
  reason: string;
  /** Approval state in plain words. */
  approvalState: string;
  /** True for every prep item — publishing is never automatic. */
  approvalRequired: true;
}

// ---------------------------------------------------------------------------
// Standing notices shown wherever scheduling prep is surfaced.
// ---------------------------------------------------------------------------

export const SCHEDULING_PREP_NOTICES = [
  "Publishing connection is not active yet.",
  "This is scheduling prep only.",
  "Team approval required before any future publishing.",
];

// ---------------------------------------------------------------------------
// Client-safe scheduling status — calm, no exact promises.
// ---------------------------------------------------------------------------

export type ClientScheduleStatus =
  | "Veroxa is preparing upcoming content."
  | "Next content window is being planned.";
