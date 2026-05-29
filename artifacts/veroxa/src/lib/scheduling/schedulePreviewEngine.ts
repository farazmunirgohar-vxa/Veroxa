/**
 * schedulePreviewEngine.ts — rule-based, deterministic scheduling /
 * publishing-prep engine. Mirrors aiAgentPreviewEngine.ts style.
 *
 * PREP ONLY. No real publishing, no social APIs, no auto-messaging, no writes.
 * Every recommendation is a DRAFT slot the Veroxa team must approve.
 */

import type { TeamWorkItem } from "@/lib/repositories/clientTeamWorkRepository";
import type { AiAgentStatus } from "@/lib/ai/aiAgentTypes";
import {
  SCHEDULE_CONTENT_TYPE_LABELS,
  SCHEDULE_STAGE_LABELS,
  type ScheduleContentType,
  type SchedulePreviewItem,
  type ScheduleStage,
} from "./schedulePreviewTypes";

function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const CONTENT_TYPES: ScheduleContentType[] = [
  "lunch_reminder",
  "dinner_craving",
  "weekend_family_meal",
  "special_menu_feature",
  "behind_the_scenes",
  "trust_review_story",
];

const WINDOW_BY_TYPE: Record<ScheduleContentType, { window: string; reason: string }> =
  {
    lunch_reminder: {
      window: "Weekday late morning (around 11:00–11:30)",
      reason: "Catches people deciding where to eat just before lunch.",
    },
    dinner_craving: {
      window: "Weekday late afternoon (around 16:30–17:30)",
      reason: "Lands while people plan dinner after work.",
    },
    weekend_family_meal: {
      window: "Saturday late morning (around 10:30–11:30)",
      reason: "Reaches families planning a weekend meal out.",
    },
    special_menu_feature: {
      window: "Thursday early evening (around 17:00)",
      reason: "Builds anticipation heading into the weekend.",
    },
    behind_the_scenes: {
      window: "Midweek midday (around 13:00)",
      reason: "Lighter content performs well in the midweek lull.",
    },
    trust_review_story: {
      window: "Sunday early evening (around 18:00)",
      reason: "Reflective, trust-building content suits a calmer slot.",
    },
  };

function contentTypeForItem(item: TeamWorkItem): ScheduleContentType {
  if (item.submissionType === "promotion") return "special_menu_feature";
  if (item.submissionType === "menu_update") return "special_menu_feature";
  if (item.workType === "media_review") return "behind_the_scenes";
  return CONTENT_TYPES[stableHash(item.submissionId) % CONTENT_TYPES.length] as ScheduleContentType;
}

function stageForItem(item: TeamWorkItem): {
  stage: ScheduleStage;
  status: AiAgentStatus;
  approvalState: string;
} {
  switch (item.teamWorkStatus) {
    case "waiting_on_client":
      return {
        stage: "blocked_missing_media_or_context",
        status: "manual_review_needed",
        approvalState: "Blocked — needs client media or context first.",
      };
    case "ready_for_review":
      return {
        stage: "needs_team_review",
        status: "needs_human_review",
        approvalState: "Awaiting team review before a slot is locked.",
      };
    case "completed":
      return {
        stage: "scheduled_placeholder",
        status: "approved",
        approvalState: "Approved — placeholder slot held (no real publishing).",
      };
    case "in_progress":
      return {
        stage: "suggested_slot_ready",
        status: "ready",
        approvalState: "Suggested slot ready — team approval required.",
      };
    case "ready_for_team":
    default:
      return {
        stage: "draft_ready",
        status: "ready",
        approvalState: "Draft slot prepared — team review required.",
      };
  }
}

export function previewScheduleItem(
  item: TeamWorkItem,
  restaurantName: string,
): SchedulePreviewItem {
  const contentType = contentTypeForItem(item);
  const { window, reason } = WINDOW_BY_TYPE[contentType];
  const { stage, status, approvalState } = stageForItem(item);

  return {
    submissionId: item.submissionId,
    restaurantName,
    stage,
    stageLabel: SCHEDULE_STAGE_LABELS[stage],
    status,
    contentType,
    contentTypeLabel: SCHEDULE_CONTENT_TYPE_LABELS[contentType],
    recommendedWindow: window,
    reason,
    approvalState,
    approvalRequired: true,
  };
}

export function previewScheduleItems(
  items: TeamWorkItem[],
  restaurantName: string,
): SchedulePreviewItem[] {
  return items.map((item) => previewScheduleItem(item, restaurantName));
}
