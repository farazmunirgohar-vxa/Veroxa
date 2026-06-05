export type WeeklyUpdateStatus = "not_started" | "preparing" | "needs_media" | "needs_confirmation" | "ready_for_review" | "ready_to_share" | "shared_preview";

export interface WeeklyUpdateRecord {
  id: string;
  clientId: string;
  weekLabel: string;
  restaurantName: string;
  completedThisWeek: string[];
  preparedThisWeek: string[];
  pendingItems: string[];
  mediaNeeded: string[];
  clientConfirmationsNeeded: string[];
  requestsAnswered: string[];
  nextWeekFocus: string[];
  status: WeeklyUpdateStatus;
  clientSafeSummary: string;
  createdAt: string;
}

export interface WeeklyUpdateReadiness {
  status: WeeklyUpdateStatus;
  label: string;
  nextAction: string;
  canSharePreview: boolean;
  blockers: string[];
}
