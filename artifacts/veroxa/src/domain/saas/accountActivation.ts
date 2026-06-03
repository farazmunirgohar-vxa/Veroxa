import type {
  AccountPlanStatus,
  RestaurantStatus,
  SaasDataMode,
} from "./saasTypes";

export type AccountActivationStage =
  | "demo_only"
  | "prospect_review"
  | "pending_onboarding"
  | "onboarding_in_progress"
  | "client_portal_ready"
  | "team_review_ready"
  | "active_manual_service"
  | "paused"
  | "canceled"
  | "archived";

export type AccountActivationReadiness =
  | "not_ready"
  | "ready_for_demo"
  | "ready_for_feedback"
  | "ready_for_manual_service"
  | "blocked";

export interface AccountActivationInput {
  restaurantStatus: RestaurantStatus;
  planStatus?: AccountPlanStatus;
  hasActiveClientMembership?: boolean;
  hasRestaurantProfile?: boolean;
  hasConfirmedBusinessTruth?: boolean;
  hasUsableMedia?: boolean;
  hasPublishedClientReport?: boolean;
  hasActivityLogScaffold?: boolean;
  dataMode: SaasDataMode;
}

export interface AccountActivationResult {
  stage: AccountActivationStage;
  readiness: AccountActivationReadiness;
  clientVisibleStatus: string;
  teamVisibleStatus: string;
  blockers: string[];
  nextAction: string;
  canShowClientPortalData: boolean;
  canShowTeamOperationalData: boolean;
  canAcceptClientUploadsLater: boolean;
  internalOnlyNote: string;
}

function baseResult(input: AccountActivationInput): AccountActivationResult {
  return {
    stage: "prospect_review",
    readiness: "not_ready",
    clientVisibleStatus: "Account setup in review",
    teamVisibleStatus: "Prospect review",
    blockers: [],
    nextAction: "Confirm restaurant profile, plan, and client readiness before showing account data.",
    canShowClientPortalData: false,
    canShowTeamOperationalData: false,
    canAcceptClientUploadsLater: false,
    internalOnlyNote:
      "Internal only activation model. Deterministic preview only; no production persistence, auth, storage, billing, live AI, or integrations are connected.",
  };
}

export function evaluateAccountActivation(
  input: AccountActivationInput,
): AccountActivationResult {
  if (input.dataMode === "demo" || input.restaurantStatus === "demo") {
    return {
      ...baseResult(input),
      stage: "demo_only",
      readiness: "ready_for_demo",
      clientVisibleStatus: "Sample portal preview",
      teamVisibleStatus: "Demo-only account preview",
      nextAction: "Use this as sample data only. Do not treat demo fixtures as active restaurant data.",
      canShowClientPortalData: true,
      canShowTeamOperationalData: true,
      canAcceptClientUploadsLater: false,
    };
  }

  if (input.restaurantStatus === "archived") {
    return {
      ...baseResult(input),
      stage: "archived",
      readiness: "blocked",
      clientVisibleStatus: "Account archived",
      teamVisibleStatus: "Archived account",
      blockers: ["Account is archived."],
      nextAction: "Do not reactivate without Faraz review and explicit approval.",
    };
  }

  if (input.restaurantStatus === "canceled" || input.planStatus === "canceled") {
    return {
      ...baseResult(input),
      stage: "canceled",
      readiness: "blocked",
      clientVisibleStatus: "Account not active",
      teamVisibleStatus: "Canceled account",
      blockers: ["Plan or restaurant account is canceled."],
      nextAction: "Keep the portal in a safe inactive state unless the restaurant re-enters review.",
    };
  }

  if (input.restaurantStatus === "paused" || input.planStatus === "paused") {
    return {
      ...baseResult(input),
      stage: "paused",
      readiness: "blocked",
      clientVisibleStatus: "Account paused",
      teamVisibleStatus: "Paused account",
      blockers: ["Service is paused."],
      nextAction: "Review what is needed before manual service resumes.",
      canShowClientPortalData: input.dataMode === "authenticated_client",
      canShowTeamOperationalData: input.dataMode === "authenticated_team",
    };
  }

  const blockers: string[] = [];
  if (!input.hasRestaurantProfile) blockers.push("Restaurant profile is missing.");
  if (!input.hasConfirmedBusinessTruth) blockers.push("Business truth still needs confirmation.");
  if (!input.hasActiveClientMembership) blockers.push("Client membership is not active.");
  if (!input.hasActivityLogScaffold) blockers.push("Activity log preview/scaffold is not ready for this account.");

  if (input.dataMode === "placeholder_review") {
    return {
      ...baseResult(input),
      stage: input.restaurantStatus === "prospect" ? "prospect_review" : "pending_onboarding",
      readiness: input.restaurantStatus === "prospect" ? "ready_for_feedback" : "not_ready",
      clientVisibleStatus: "Account setup will appear here once your restaurant portal is active.",
      teamVisibleStatus: "Placeholder review — no live account data connected",
      blockers: blockers.length ? blockers : ["Live account data is not connected yet."],
      nextAction: "Keep real client routes in safe placeholder state until production persistence is approved.",
      canShowClientPortalData: false,
      canShowTeamOperationalData: false,
      canAcceptClientUploadsLater: false,
    };
  }

  if (input.dataMode === "future_live_integration") {
    return {
      ...baseResult(input),
      stage: "team_review_ready",
      readiness: "blocked",
      clientVisibleStatus: "Account setup in review",
      teamVisibleStatus: "Future live integration blocked pending RR approval",
      blockers: ["Future production adapter requires explicit RR approval."],
      nextAction: "Do not connect production adapters in this phase.",
    };
  }

  if (input.restaurantStatus === "prospect") {
    return {
      ...baseResult(input),
      stage: "prospect_review",
      readiness: "ready_for_feedback",
      clientVisibleStatus: "Account setup in review",
      teamVisibleStatus: "Prospect review",
      blockers: blockers.filter((blocker) => blocker !== "Client membership is not active."),
      nextAction: "Confirm right-fit profile, media supply, and order/contact paths before onboarding.",
      canShowTeamOperationalData: input.dataMode === "authenticated_team",
    };
  }

  if (input.restaurantStatus === "onboarding" || input.planStatus === "onboarding") {
    const readyForPortal = blockers.length === 0;
    return {
      ...baseResult(input),
      stage: readyForPortal ? "client_portal_ready" : "onboarding_in_progress",
      readiness: readyForPortal ? "ready_for_manual_service" : "not_ready",
      clientVisibleStatus: readyForPortal ? "Portal setup ready for review" : "Account setup in progress",
      teamVisibleStatus: readyForPortal ? "Client portal ready" : "Onboarding in progress",
      blockers,
      nextAction: readyForPortal
        ? "Review final client-facing setup, then begin manual service cadence."
        : "Resolve onboarding blockers before client portal data is shown.",
      canShowClientPortalData: readyForPortal && input.dataMode === "authenticated_client",
      canShowTeamOperationalData: input.dataMode === "authenticated_team",
      canAcceptClientUploadsLater: readyForPortal,
    };
  }

  if (input.restaurantStatus === "active" && input.planStatus === "active") {
    const activeBlockers = [...blockers];
    if (!input.hasUsableMedia) activeBlockers.push("Usable media supply is low or missing.");
    return {
      ...baseResult(input),
      stage: activeBlockers.length ? "team_review_ready" : "active_manual_service",
      readiness: activeBlockers.length ? "ready_for_feedback" : "ready_for_manual_service",
      clientVisibleStatus: "Account active",
      teamVisibleStatus: activeBlockers.length ? "Active account needs team review" : "Active manual service",
      blockers: activeBlockers,
      nextAction: activeBlockers.length
        ? "Resolve account readiness gaps before expanding manual service cadence."
        : "Continue manual service with approval gates and honest reporting.",
      canShowClientPortalData: input.dataMode === "authenticated_client" && activeBlockers.length === 0,
      canShowTeamOperationalData: input.dataMode === "authenticated_team",
      canAcceptClientUploadsLater: true,
    };
  }

  return {
    ...baseResult(input),
    blockers,
  };
}

export function formatAccountActivationForClient(
  result: AccountActivationResult,
): string {
  return `${result.clientVisibleStatus}. ${result.nextAction}`;
}

export function formatAccountActivationForTeam(
  result: AccountActivationResult,
): string {
  const blockers = result.blockers.length
    ? ` Blockers: ${result.blockers.join(" ")}`
    : " No activation blockers in this deterministic preview.";
  return `${result.teamVisibleStatus}. Stage: ${result.stage}. Readiness: ${result.readiness}.${blockers}`;
}

export function getAccountActivationBadgeTone(
  result: AccountActivationResult,
): "success" | "info" | "warning" | "danger" | "neutral" | "accent" {
  if (result.stage === "active_manual_service") return "success";
  if (result.stage === "demo_only") return "accent";
  if (result.readiness === "blocked") return "danger";
  if (result.readiness === "ready_for_manual_service") return "success";
  if (result.readiness === "ready_for_feedback") return "info";
  if (result.blockers.length > 0) return "warning";
  return "neutral";
}
