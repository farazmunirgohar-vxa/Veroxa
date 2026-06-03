import type { SaasRepositoryBundle } from "./repositoryProvider";
import type {
  ApprovalDecisionRecord,
  ManualExecutionEventRecord,
  OpportunityScoreRecord,
  PreparedActionRecord,
  SaasDataMode,
} from "./saasTypes";
import type { TeamRestaurantOverview } from "./repositoryContracts";
import type { ProfitValidationSnapshotRecord } from "./profitValidationPersistence";

export interface TeamPortalRepositoryState {
  dataMode: SaasDataMode;
  repositoryModeLabel: string;
  demoFixturesAllowed: boolean;
  authenticatedClientDataConnected: boolean;
  authenticatedTeamDataConnected: boolean;
  activityLogsPersisted: boolean;
  productionAdapterConnected: boolean;
  restaurants: TeamRestaurantOverview[];
  pendingPreparedActions: PreparedActionRecord[];
  pendingApprovals: ApprovalDecisionRecord[];
  manualExecutionEvents: ManualExecutionEventRecord[];
  opportunityScores: OpportunityScoreRecord[];
  profitValidationSnapshots: ProfitValidationSnapshotRecord[];
  warnings: string[];
  nextAction: string;
}

export interface BuildTeamPortalRepositoryStateInput {
  dataMode: SaasDataMode;
  repositoryModeLabel: string;
  restaurants?: TeamRestaurantOverview[];
  pendingPreparedActions?: PreparedActionRecord[];
  pendingApprovals?: ApprovalDecisionRecord[];
  manualExecutionEvents?: ManualExecutionEventRecord[];
  opportunityScores?: OpportunityScoreRecord[];
  profitValidationSnapshots?: ProfitValidationSnapshotRecord[];
}

export function buildTeamPortalRepositoryState(
  input: SaasRepositoryBundle | BuildTeamPortalRepositoryStateInput,
): TeamPortalRepositoryState {
  const dataMode = input.dataMode;
  const repositoryModeLabel = "repositoryMode" in input ? input.repositoryMode : input.repositoryModeLabel;
  const productionAdapterConnected = dataMode === "future_live_integration";
  const warnings: string[] = [];

  if (dataMode === "demo") warnings.push("Demo fixtures are visible only for labeled preview surfaces.");
  if (dataMode !== "demo") warnings.push("Authenticated persistence is not connected; keep real routes safe and empty.");
  if (productionAdapterConnected) warnings.push("Future live integration mode is blocked until RR-approved production work.");

  return {
    dataMode,
    repositoryModeLabel,
    demoFixturesAllowed: dataMode === "demo",
    authenticatedClientDataConnected: false,
    authenticatedTeamDataConnected: false,
    activityLogsPersisted: false,
    productionAdapterConnected: false,
    restaurants: "restaurants" in input ? input.restaurants ?? [] : [],
    pendingPreparedActions: "pendingPreparedActions" in input ? input.pendingPreparedActions ?? [] : [],
    pendingApprovals: "pendingApprovals" in input ? input.pendingApprovals ?? [] : [],
    manualExecutionEvents: "manualExecutionEvents" in input ? input.manualExecutionEvents ?? [] : [],
    opportunityScores: "opportunityScores" in input ? input.opportunityScores ?? [] : [],
    profitValidationSnapshots: "profitValidationSnapshots" in input ? input.profitValidationSnapshots ?? [] : [],
    warnings,
    nextAction: productionAdapterConnected
      ? "Stop and request RR approval before any production adapter wiring."
      : dataMode === "demo"
        ? "Use demo repository output for product review only."
        : "Keep building repository-driven placeholders until production persistence is approved.",
  };
}

export function getTeamDataModeSummary(state: TeamPortalRepositoryState): string {
  return `${state.repositoryModeLabel} · ${state.dataMode} · demo fixtures ${state.demoFixturesAllowed ? "allowed" : "blocked"} · persisted activity logs: no`;
}

export function getTeamRepositoryWarnings(state: TeamPortalRepositoryState): string[] {
  return state.warnings.length > 0
    ? state.warnings
    : ["No warnings in this deterministic repository state preview."];
}

export function getTeamRepositoryNextAction(state: TeamPortalRepositoryState): string {
  return state.nextAction;
}
