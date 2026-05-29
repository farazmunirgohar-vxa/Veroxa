/**
 * contentDraftPreviewEngine.ts — rule-based, deterministic content draft
 * pipeline. Mirrors the style of aiAgentPreviewEngine.ts.
 *
 * SIMULATED ONLY. No live model calls, no network, no Supabase, no writes.
 * Pure transformation over existing submission / work-item shapes. Output is
 * a DRAFT the Veroxa team must review before anything reaches a client.
 *
 * Caption safety: drafts here never assert discounts/specials, halal/authentic/
 * family-owned, medical/health benefits, invented menu items, or guaranteed
 * results. Those require explicit client confirmation.
 */

import type { ClientTeamSubmission } from "@/data/demo/demoClientTeamWork";
import type { TeamWorkItem } from "@/lib/repositories/clientTeamWorkRepository";
import type { AiAgentStatus } from "@/lib/ai/aiAgentTypes";
import {
  CAPTION_DRAFT_STATUS_LABELS,
  CONTENT_DRAFT_STAGE_LABELS,
  type CaptionDraftStatus,
  type ClientContentStatus,
  type ContentDraftPreview,
  type ContentDraftStage,
} from "./contentDraftTypes";

// ---------------------------------------------------------------------------
// Tiny deterministic hash — keeps angle/caption choices stable per id.
// NOT cryptographic.
// ---------------------------------------------------------------------------

function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const CAPTION_SAFETY_NOTES = [
  "No discounts, specials, or prices added unless the client provides them.",
  "No halal / authentic / family-owned or health claims unless confirmed by the client.",
  "No invented menu items and no guaranteed results.",
];

const ANGLES = [
  "Hero dish, single frame, owner-voice caption — weekend feature.",
  "Behind-the-scenes kitchen clip, short and vertical, sound-on.",
  "Carousel of 3 customer favourites with one calm caption.",
  "Local-moment shot (interior + service) with a warm, simple caption.",
];

function angleForId(id: string): string {
  return ANGLES[stableHash(id) % ANGLES.length] as string;
}

function captionDraftsForName(name: string, seed: number): string[] {
  const sets: string[][] = [
    [
      `Fresh from our kitchen today — come see what's on at ${name}.`,
      `A little something we're proud of. Visit ${name} this week.`,
    ],
    [
      `Made with care, served with a smile — ${name}.`,
      `Your next favourite might be waiting at ${name}.`,
    ],
    [
      `Good food, good company. That's ${name}.`,
      `Stop by ${name} and make it a great week.`,
    ],
  ];
  return sets[seed % sets.length] as string[];
}

function clientStatusForStage(stage: ContentDraftStage): ClientContentStatus {
  switch (stage) {
    case "media_received":
      return "Uploaded";
    case "needs_client_context":
      return "Needs your input";
    case "approved_for_schedule":
      return "Prepared by Veroxa";
    case "ai_angle_prepared":
    case "caption_draft_ready":
    case "team_review_needed":
    case "not_recommended":
    default:
      return "Being reviewed";
  }
}

// ---------------------------------------------------------------------------
// Submission-driven preview (Team Upload Inbox, Client Media).
// ---------------------------------------------------------------------------

export function previewContentDraftForSubmission(
  submission: Pick<ClientTeamSubmission, "id" | "description" | "status">,
): ContentDraftPreview {
  const hasContext = submission.description.trim().length >= 30;
  const name = "your restaurant";
  const seed = stableHash(submission.id);

  let stage: ContentDraftStage;
  let status: AiAgentStatus;
  let captionStatus: CaptionDraftStatus;
  let recommendedUsage: string;
  let nextHumanAction: string;

  if (submission.status === "blocked") {
    stage = "not_recommended";
    status = "blocked";
    captionStatus = "not_recommended";
    recommendedUsage = "Not recommended — resolve blocker first.";
    nextHumanAction = "Clear the blocker, then re-review this item.";
  } else if (
    submission.status === "needs_client_clarification" ||
    !hasContext
  ) {
    stage = "needs_client_context";
    status = "manual_review_needed";
    captionStatus = "needs_context";
    recommendedUsage = "Needs context — ask the client a short question.";
    nextHumanAction =
      "Send a short, specific question to the client before drafting captions.";
  } else if (
    submission.status === "completed" ||
    submission.status === "archived"
  ) {
    stage = "approved_for_schedule";
    status = "approved";
    captionStatus = "draft_ready";
    recommendedUsage = "Approved — ready to move into scheduling prep.";
    nextHumanAction = "Confirm the slot in the scheduling-prep queue.";
  } else if (
    submission.status === "in_progress" ||
    submission.status === "accepted"
  ) {
    stage = "caption_draft_ready";
    status = "needs_human_review";
    captionStatus = "draft_ready";
    recommendedUsage = "Caption draft ready — team review required.";
    nextHumanAction = "Review the caption draft, then approve or revise.";
  } else {
    stage = "ai_angle_prepared";
    status = "ready";
    captionStatus = "draft_ready";
    recommendedUsage = "Angle + caption drafted — team review required.";
    nextHumanAction = "Review the angle and caption draft.";
  }

  const needsClientContext = stage === "needs_client_context";

  return {
    submissionId: submission.id,
    stage,
    stageLabel: CONTENT_DRAFT_STAGE_LABELS[stage],
    status,
    suggestedAngle: angleForId(submission.id),
    captionDrafts: needsClientContext
      ? []
      : captionDraftsForName(name, seed),
    captionStatus,
    captionStatusLabel: CAPTION_DRAFT_STATUS_LABELS[captionStatus],
    recommendedUsage,
    needsClientContext,
    nextHumanAction,
    safetyNotes: CAPTION_SAFETY_NOTES,
    teamReviewRequired: true,
    clientStatus: clientStatusForStage(stage),
  };
}

// ---------------------------------------------------------------------------
// Work-item-driven preview (Team Work Queue) — compact.
// ---------------------------------------------------------------------------

export interface CompactContentDraftPreview {
  submissionId: string;
  suggestedAngle: string;
  captionPreview: string;
  captionStatusLabel: string;
  nextHumanAction: string;
  status: AiAgentStatus;
  teamReviewRequired: true;
}

export function previewCompactContentDraft(
  item: TeamWorkItem,
): CompactContentDraftPreview {
  const seed = stableHash(item.submissionId);
  const isContent =
    item.workType === "content" || item.workType === "media_review";

  let captionStatus: CaptionDraftStatus;
  let status: AiAgentStatus;
  let nextHumanAction: string;

  if (item.teamWorkStatus === "waiting_on_client") {
    captionStatus = "needs_context";
    status = "manual_review_needed";
    nextHumanAction = item.nextClientAction
      ? `Nudge client: ${item.nextClientAction}`
      : "Send a short follow-up to unblock the draft.";
  } else if (item.teamWorkStatus === "ready_for_review") {
    captionStatus = "draft_ready";
    status = "needs_human_review";
    nextHumanAction = "Team review: approve or revise the caption draft.";
  } else if (item.teamWorkStatus === "completed") {
    captionStatus = "draft_ready";
    status = "approved";
    nextHumanAction = "Move approved content into scheduling prep.";
  } else {
    captionStatus = "draft_ready";
    status = "ready";
    nextHumanAction = item.nextTeamAction || "Prepare the caption draft.";
  }

  const drafts = captionDraftsForName("your restaurant", seed);
  const captionPreview =
    captionStatus === "needs_context"
      ? "Caption on hold — waiting on client context."
      : (drafts[0] ?? "Caption draft pending.");

  return {
    submissionId: item.submissionId,
    suggestedAngle: isContent
      ? angleForId(item.submissionId)
      : "Profile / operational update — no social caption needed.",
    captionPreview,
    captionStatusLabel: CAPTION_DRAFT_STATUS_LABELS[captionStatus],
    nextHumanAction,
    status,
    teamReviewRequired: true,
  };
}
