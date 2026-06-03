import type {
  AccountPlanState,
  ActivityLogRecord,
  ApprovalDecisionRecord,
  ClientRequest,
  CreateActivityLogInput,
  ManualExecutionEventRecord,
  MediaAsset,
  OpportunityScoreRecord,
  PreparedActionRecord,
  ReportRecord,
  RestaurantAccount,
  RestaurantId,
  RestaurantProfile,
  SaasDataMode,
} from "./saasTypes";

export interface ClientPortalRepositoryState {
  restaurant: RestaurantAccount | null;
  profile: RestaurantProfile | null;
  accountPlan: AccountPlanState | null;
  mediaAssets: MediaAsset[];
  requests: ClientRequest[];
  reports: ReportRecord[];
  dataMode: SaasDataMode;
  isLiveDataConnected: boolean;
  emptyStateTitle: string;
  emptyStateBody: string;
}

export interface TeamRestaurantOverview {
  restaurantId: RestaurantId;
  restaurantName: string;
  status: string;
  dataMode: SaasDataMode;
  repositoryMode: "placeholder repository" | "demo repository";
  nextAction: string;
}

export interface RestaurantRepository {
  getRestaurantById(restaurantId: RestaurantId): Promise<RestaurantAccount | null>;
  getRestaurantProfile(restaurantId: RestaurantId): Promise<RestaurantProfile | null>;
  getAccountPlanState(restaurantId: RestaurantId): Promise<AccountPlanState | null>;
}

export interface ClientPortalRepository {
  getClientDashboardState(restaurantId: RestaurantId): Promise<ClientPortalRepositoryState>;
  getClientMediaAssets(restaurantId: RestaurantId): Promise<MediaAsset[]>;
  getClientRequests(restaurantId: RestaurantId): Promise<ClientRequest[]>;
  getClientReports(restaurantId: RestaurantId): Promise<ReportRecord[]>;
}

export interface TeamPortalRepository {
  getTeamRestaurantOverview(): Promise<TeamRestaurantOverview[]>;
  getPreparedActions(restaurantId?: RestaurantId): Promise<PreparedActionRecord[]>;
  getApprovalDecisions(restaurantId?: RestaurantId): Promise<ApprovalDecisionRecord[]>;
  getManualExecutionEvents(restaurantId?: RestaurantId): Promise<ManualExecutionEventRecord[]>;
  getOpportunityScores(restaurantId?: RestaurantId): Promise<OpportunityScoreRecord[]>;
}

export interface ActivityLogRepository {
  listActivityLogs(restaurantId: RestaurantId): Promise<ActivityLogRecord[]>;
  appendActivityLog(input: CreateActivityLogInput): Promise<ActivityLogRecord>;
}
