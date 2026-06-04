import type {
  ClientRequestType,
  PlanId,
  RequestEligibilityStatus,
} from "../packageBoundary";
export type RequestStatus =
  | "received"
  | "in_review"
  | "needs_client_input"
  | "upgrade_required"
  | "scheduled_for_manual_work"
  | "completed"
  | "declined"
  | "not_supported"
  | "escalated"
  | "paused";
export type SlaStatus =
  | "on_track"
  | "due_soon"
  | "overdue"
  | "completed"
  | "paused"
  | "not_applicable";
export interface PortalRequest {
  id: string;
  clientId: string;
  restaurantName: string;
  plan: PlanId;
  requestType: ClientRequestType;
  title: string;
  clientMessage: string;
  submittedAt: string;
  status: RequestStatus;
  dueAt: string;
  eligibilityStatus: RequestEligibilityStatus;
  packageBoundaryDecisionId: string;
  needsClientConfirmation: boolean;
  teamOwner: string;
  responseSummary: string;
  nextAction: string;
}
export interface SlaEvaluation {
  requestId: string;
  slaStatus: SlaStatus;
  dueLabel: string;
  clientSafeStatus: string;
  teamLabel: string;
  minutesRemaining: number;
}
