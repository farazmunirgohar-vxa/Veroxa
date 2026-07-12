export type MomoReadinessStatus =
  | "not_started"
  | "foundation_ready"
  | "in_progress"
  | "blocked"
  | "ready_for_review"
  | "verified";

export type MomoReadinessTracker = {
  restaurant: string;
  milestone: string;
  overallStatus: MomoReadinessStatus;
  overallRule: string;
  dimensions: Record<string, {
    label: string;
    required: boolean;
    status: MomoReadinessStatus;
    evidence: string[];
    blockers: string[];
    nextAction: string;
  }>;
};
