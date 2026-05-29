/**
 * contentDraftTypes.ts — type contracts for the AI-assisted content draft
 * pipeline (media → angle → caption draft → team review).
 *
 * SIMULATED / RULE-BASED ONLY. No publishing, no auto-messaging, no writes.
 * Every output is a DRAFT that requires Veroxa team review before use.
 */

import type { AiAgentStatus } from "@/lib/ai/aiAgentTypes";

// ---------------------------------------------------------------------------
// Content draft lifecycle — where a piece of content sits in the pipeline.
// ---------------------------------------------------------------------------

export type ContentDraftStage =
  | "media_received"
  | "ai_angle_prepared"
  | "caption_draft_ready"
  | "team_review_needed"
  | "approved_for_schedule"
  | "needs_client_context"
  | "not_recommended";

export const CONTENT_DRAFT_STAGE_LABELS: Record<ContentDraftStage, string> = {
  media_received: "Media received",
  ai_angle_prepared: "AI angle prepared",
  caption_draft_ready: "Caption draft ready",
  team_review_needed: "Team review needed",
  approved_for_schedule: "Approved for schedule",
  needs_client_context: "Needs client context",
  not_recommended: "Not recommended",
};

// ---------------------------------------------------------------------------
// Caption draft status — the narrower state of the caption itself.
// ---------------------------------------------------------------------------

export type CaptionDraftStatus =
  | "not_started"
  | "draft_ready"
  | "needs_context"
  | "not_recommended";

export const CAPTION_DRAFT_STATUS_LABELS: Record<CaptionDraftStatus, string> = {
  not_started: "Not started",
  draft_ready: "Draft ready",
  needs_context: "Needs context",
  not_recommended: "Not recommended",
};

// ---------------------------------------------------------------------------
// Client-safe status — the ONLY content statuses a client may ever see.
// ---------------------------------------------------------------------------

export type ClientContentStatus =
  | "Uploaded"
  | "Being reviewed"
  | "Needs your input"
  | "Prepared by Veroxa";

// ---------------------------------------------------------------------------
// The deterministic content draft preview for a single submission/work item.
// ---------------------------------------------------------------------------

export interface ContentDraftPreview {
  submissionId: string;
  stage: ContentDraftStage;
  stageLabel: string;
  status: AiAgentStatus;
  /** AI-prepared content angle (draft). */
  suggestedAngle: string;
  /** Short caption draft preview lines (team review required). */
  captionDrafts: string[];
  captionStatus: CaptionDraftStatus;
  captionStatusLabel: string;
  /** Recommended usage label for the team. */
  recommendedUsage: string;
  /** True when the client must add context before drafting can finish. */
  needsClientContext: boolean;
  /** The next concrete human action. */
  nextHumanAction: string;
  /** Caption safety notes applied to this draft. */
  safetyNotes: string[];
  /** True for every content draft — nothing is final without team review. */
  teamReviewRequired: true;
  /** Client-safe single status — never expose internal mechanics. */
  clientStatus: ClientContentStatus;
}
