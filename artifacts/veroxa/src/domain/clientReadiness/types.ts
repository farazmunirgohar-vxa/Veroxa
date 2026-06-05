export type ClientReadinessAreaId =
  | "onboarding"
  | "media_supply"
  | "request_channel"
  | "weekly_updates"
  | "monthly_reports"
  | "website_alignment"
  | "google_maps_local_visibility"
  | "facebook_instagram_content"
  | "add_ons"
  | "missing_confirmations"
  | "account_activation_state";

export type ClientSafeReadinessStatus =
  | "Getting prepared"
  | "Needs your input"
  | "Ready for Veroxa review"
  | "In review"
  | "Prepared by Veroxa"
  | "Waiting on media"
  | "Waiting on access"
  | "Ready for weekly update"
  | "Ready for monthly report"
  | "Add-on available"
  | "Coming soon";

export type ClientReadinessScoreLabel = "Setup starting" | "Some items ready" | "Almost ready" | "Ready for Veroxa review";

export interface ClientReadinessAreaInput {
  id: ClientReadinessAreaId;
  label: string;
  status: ClientSafeReadinessStatus;
  detail: string;
  nextAction?: string;
  required: boolean;
  weight: number;
}

export interface ClientReadinessSnapshot {
  clientId: string;
  restaurantName: string;
  areas: ClientReadinessAreaInput[];
  completedWeight: number;
  totalWeight: number;
  readinessPercent: number;
  scoreLabel: ClientReadinessScoreLabel;
  nextAction: string;
  clientSafeMessage: string;
  reviewNotice: string;
  updatedAt: string;
}

export interface ClientReadinessChecklistItem {
  id: ClientReadinessAreaId;
  label: string;
  status: ClientSafeReadinessStatus;
  detail: string;
  nextAction: string;
  required: boolean;
}

export interface ClientReadinessSummaryCard {
  id: ClientReadinessAreaId;
  title: string;
  status: ClientSafeReadinessStatus;
  body: string;
  nextAction: string;
  tone: "neutral" | "needs_input" | "ready" | "waiting" | "coming_soon";
}
