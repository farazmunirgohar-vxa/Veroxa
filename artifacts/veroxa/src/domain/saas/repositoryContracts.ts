import type { AccountActivationResult } from "./accountActivation";
import type { ClientPortalPageState } from "./clientPortalState";
import type { TeamPortalRepositoryState } from "./teamPortalState";
import type { ProfitValidationSnapshotRecord } from "./profitValidationPersistence";
import type {
  AccountPlanState,
  ActivityLogRecord,
  ApprovalDecisionRecord,
  ClientRequestRecord,
  CreateActivityLogInput,
  ManualExecutionEventRecord,
  MediaAssetRecord,
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
  mediaAssets: MediaAssetRecord[];
  requests: ClientRequestRecord[];
  reports: ReportRecord[];
  dataMode: SaasDataMode;
  isLiveDataConnected: boolean;
  emptyStateTitle: string;
  emptyStateBody: string;
}

export interface ClientDashboardSummary {
  accountStatus: string;
  planLabel: string;
  onlinePresenceProgress: string;
  mediaCount: number;
  requestCount: number;
  reportCount: number;
  nextClientAction: string;
}

export interface ClientMediaSummary {
  total: number;
  usable: number;
  needsBetterMedia: number;
  used: number;
  uploadReadinessNotice: string;
}

export interface ClientRequestSummary {
  total: number;
  open: number;
  needsClientConfirmation: number;
  resolved: number;
  nextAction: string;
}

export interface ClientUpdateSummary {
  id: string;
  title: string;
  completed: string[];
  waitingOnClient: string[];
  nextDirection: string;
  sourceLabel: "demo" | "placeholder" | "future_authenticated";
}

export interface ClientReportSummary {
  id: string;
  title: string;
  reportType: "weekly" | "monthly" | "custom";
  status: string;
  summary: string;
  sourceLabel: "demo" | "placeholder" | "future_authenticated";
}

export interface AccountActivationSummary {
  restaurantId: RestaurantId;
  restaurantName: string;
  planId?: string;
  result: AccountActivationResult;
}

export interface TeamRestaurantOverview {
  restaurantId: RestaurantId;
  restaurantName: string;
  status: string;
  dataMode: SaasDataMode;
  repositoryMode: "placeholder repository" | "demo repository";
  nextAction: string;
  activation?: AccountActivationResult;
}

export interface RestaurantRepository {
  getRestaurantById(restaurantId: RestaurantId): Promise<RestaurantAccount | null>;
  getRestaurantProfile(restaurantId: RestaurantId): Promise<RestaurantProfile | null>;
  getAccountPlanState(restaurantId: RestaurantId): Promise<AccountPlanState | null>;
}

export interface ClientPortalRepository {
  getClientDashboardState(restaurantId: RestaurantId): Promise<ClientPortalRepositoryState>;
  getClientPortalPageState(restaurantId: RestaurantId): Promise<ClientPortalPageState>;
  getClientDashboardSummary(restaurantId: RestaurantId): Promise<ClientDashboardSummary>;
  getClientUpdateSummaries(restaurantId: RestaurantId): Promise<ClientUpdateSummary[]>;
  getClientReportSummaries(restaurantId: RestaurantId): Promise<ClientReportSummary[]>;
  getClientMediaSummary(restaurantId: RestaurantId): Promise<ClientMediaSummary>;
  getClientRequestSummary(restaurantId: RestaurantId): Promise<ClientRequestSummary>;
  getClientMediaAssets(restaurantId: RestaurantId): Promise<MediaAssetRecord[]>;
  getClientRequests(restaurantId: RestaurantId): Promise<ClientRequestRecord[]>;
  getClientReports(restaurantId: RestaurantId): Promise<ReportRecord[]>;
}

export interface TeamPortalRepository {
  getTeamPortalRepositoryState(): Promise<TeamPortalRepositoryState>;
  getTeamRestaurantOverview(): Promise<TeamRestaurantOverview[]>;
  getPreparedActions(restaurantId?: RestaurantId): Promise<PreparedActionRecord[]>;
  getApprovalDecisions(restaurantId?: RestaurantId): Promise<ApprovalDecisionRecord[]>;
  getManualExecutionEvents(restaurantId?: RestaurantId): Promise<ManualExecutionEventRecord[]>;
  getOpportunityScores(restaurantId?: RestaurantId): Promise<OpportunityScoreRecord[]>;
  getAccountActivationSummaries(): Promise<AccountActivationSummary[]>;
  getProfitValidationSnapshots(): Promise<ProfitValidationSnapshotRecord[]>;
  getActivityLogPreviews(): Promise<ActivityLogRecord[]>;
}

export interface BuildNonPersistedActivityPreviewInput extends CreateActivityLogInput {
  createdAt?: string;
}

export interface ActivityLogRepository {
  listActivityLogs(restaurantId: RestaurantId): Promise<ActivityLogRecord[]>;
  previewActivityLogs(restaurantId: RestaurantId): Promise<ActivityLogRecord[]>;
  appendActivityLog(input: CreateActivityLogInput): Promise<ActivityLogRecord>;
  buildNonPersistedActivityPreview(input: BuildNonPersistedActivityPreviewInput): ActivityLogRecord;
}
