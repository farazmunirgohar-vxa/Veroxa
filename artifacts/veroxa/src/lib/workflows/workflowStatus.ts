/**
 * workflowStatus.ts — M009
 *
 * Label / tone / sort / group utilities for the shared client-team
 * workflow model. Pure functions. No I/O. No writes.
 *
 * Two label vocabularies are kept side-by-side so the same workflow
 * row can be rendered with very different language depending on
 * audience:
 *
 *   - Client labels:  simple, friendly, no internal jargon, no IDs.
 *   - Team labels:    operational, action-oriented.
 *
 * Internal notes and staff-only fields are never derived here.
 */

import type {
  WorkflowItem,
  WorkflowPriority,
  WorkflowStage,
  WorkflowType,
} from "@/data/workflows/clientTeamWorkflow";

export type WorkflowTone = "info" | "success" | "warning" | "danger" | "neutral";

const CLIENT_LABELS: Record<WorkflowStage, string> = {
  client_media_received: "Uploaded",
  media_review_needed:   "Being reviewed",
  media_accepted:        "Approved for content",
  needs_better_photo:    "Needs a better photo",
  draft_needed:          "We're writing your post",
  draft_ready:           "Draft being reviewed",
  team_review:           "Draft being reviewed",
  scheduled:             "Scheduled",
  marked_complete:       "Posted",
  needs_client_action:   "Waiting on you",
};

const TEAM_LABELS: Record<WorkflowStage, string> = {
  client_media_received: "New upload — needs first look",
  media_review_needed:   "Review uploaded media",
  media_accepted:        "Accepted — ready for draft",
  needs_better_photo:    "Request better photo from client",
  draft_needed:          "Draft needed",
  draft_ready:           "Draft ready for team review",
  team_review:           "Final team review",
  scheduled:             "Scheduled",
  marked_complete:       "Posted & confirmed",
  needs_client_action:   "Client action needed",
};

const STAGE_TONE: Record<WorkflowStage, WorkflowTone> = {
  client_media_received: "info",
  media_review_needed:   "info",
  media_accepted:        "success",
  needs_better_photo:    "warning",
  draft_needed:          "info",
  draft_ready:           "info",
  team_review:           "info",
  scheduled:             "success",
  marked_complete:       "neutral",
  needs_client_action:   "danger",
};

export function getClientStatusLabel(stage: WorkflowStage): string {
  return CLIENT_LABELS[stage] ?? "In progress";
}

export function getTeamStatusLabel(stage: WorkflowStage): string {
  return TEAM_LABELS[stage] ?? "In progress";
}

export function getWorkflowTone(stage: WorkflowStage): WorkflowTone {
  return STAGE_TONE[stage] ?? "neutral";
}

export function isClientActionNeeded(stage: WorkflowStage): boolean {
  return stage === "needs_better_photo" || stage === "needs_client_action";
}

export function isTeamActionNeeded(stage: WorkflowStage): boolean {
  switch (stage) {
    case "client_media_received":
    case "media_review_needed":
    case "draft_needed":
    case "draft_ready":
    case "team_review":
      return true;
    default:
      return false;
  }
}

const PRIORITY_RANK: Record<WorkflowPriority, number> = {
  urgent: 0,
  high:   1,
  normal: 2,
  low:    3,
};

/**
 * Sort by: (1) priority, (2) team-action-needed first, (3) stable by id.
 * Returns a new array.
 */
export function sortWorkflowItems(items: WorkflowItem[]): WorkflowItem[] {
  return [...items].sort((a, b) => {
    const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pr !== 0) return pr;
    const teamA = isTeamActionNeeded(a.stage) ? 0 : 1;
    const teamB = isTeamActionNeeded(b.stage) ? 0 : 1;
    if (teamA !== teamB) return teamA - teamB;
    return a.id.localeCompare(b.id);
  });
}

export type TeamGroupKey =
  | "media_review"
  | "draft_needed"
  | "review_ready"
  | "scheduling"
  | "client_action_needed";

export interface TeamGroup {
  key: TeamGroupKey;
  title: string;
  description: string;
  items: WorkflowItem[];
}

function teamGroupForStage(stage: WorkflowStage): TeamGroupKey | null {
  switch (stage) {
    case "client_media_received":
    case "media_review_needed":
      return "media_review";
    case "media_accepted":
    case "draft_needed":
      return "draft_needed";
    case "draft_ready":
    case "team_review":
      return "review_ready";
    case "scheduled":
      return "scheduling";
    case "needs_better_photo":
    case "needs_client_action":
      return "client_action_needed";
    case "marked_complete":
      // Completed work is not surfaced in the team's actionable groups.
      return null;
  }
}

/**
 * Group workflow items into the columns the team work queue displays.
 * Stable, priority-sorted within each group.
 */
export function groupWorkflowItemsForTeam(items: WorkflowItem[]): TeamGroup[] {
  const groups: Record<TeamGroupKey, WorkflowItem[]> = {
    media_review: [],
    draft_needed: [],
    review_ready: [],
    scheduling:   [],
    client_action_needed: [],
  };

  for (const item of items) {
    const key = teamGroupForStage(item.stage);
    if (key) groups[key].push(item);
  }

  const meta: Record<TeamGroupKey, { title: string; description: string }> = {
    media_review:         { title: "Media Review",          description: "Uploads awaiting first review."        },
    draft_needed:         { title: "Draft Needed",          description: "Accepted media that needs a caption."  },
    review_ready:         { title: "Review Ready",          description: "Drafts ready for team approval."       },
    scheduling:           { title: "Scheduling",            description: "Approved posts waiting for a slot."    },
    client_action_needed: { title: "Client Action Needed",  description: "Blocked on the client — chase gently." },
  };

  const ordered: TeamGroupKey[] = [
    "media_review",
    "draft_needed",
    "review_ready",
    "scheduling",
    "client_action_needed",
  ];

  return ordered.map((key) => ({
    key,
    title: meta[key].title,
    description: meta[key].description,
    items: sortWorkflowItems(groups[key]),
  }));
}

// Re-export type aliases so consumers can import everything from one path.
export type { WorkflowItem, WorkflowPriority, WorkflowStage, WorkflowType };
