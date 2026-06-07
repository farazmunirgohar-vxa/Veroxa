import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { VEROXA_PLANS } from "@/data/pricing/veroxaPricing";
import { demoSaasPlans, demoSaasProfiles, demoSaasRestaurants, demoAccountActivationSummaries } from "@/data/demo/demoSaasAccounts";
import { getDemoActivityLogs } from "@/data/demo/demoActivityLogs";
import { demoProfitValidationSnapshots } from "@/data/demo/demoProfitSnapshots";
import { MOMO_HOUSE_RESTAURANT_ID, momoHousePilotPlan, momoHousePilotProfile, momoHousePilotRestaurant } from "./preLivePilotData";
import { buildClientPortalPageState } from "./clientPortalState";
import { buildTeamPortalRepositoryState } from "./teamPortalState";
import type {
  ActivityLogRepository,
  BuildNonPersistedActivityPreviewInput,
  ClientDashboardSummary,
  ClientMediaSummary,
  ClientPortalRepository,
  ClientPortalRepositoryState,
  ClientReportSummary,
  ClientRequestSummary,
  ClientUpdateSummary,
  TeamPortalRepository,
  TeamRestaurantOverview,
} from "./repositoryContracts";
import type {
  ActivityLogRecord,
  ClientRequestRecord,
  CreateActivityLogInput,
  MediaAssetRecord,
  PreparedActionRecord,
  ReportRecord,
  RestaurantId,
} from "./saasTypes";

const DEMO_NOW = "2026-06-03T00:00:00.000Z";

function emptyDashboardState(dataMode = "placeholder_review" as const): ClientPortalRepositoryState {
  return {
    restaurant: momoHousePilotRestaurant,
    profile: momoHousePilotProfile,
    accountPlan: momoHousePilotPlan,
    mediaAssets: [],
    requests: [],
    reports: [],
    dataMode,
    isLiveDataConnected: false,
    emptyStateTitle: "Momo House San Antonio pilot in review",
    emptyStateBody: "Internal unpaid cooperation pilot data is prefilled from audit/public information and needs owner/team verification.",
  };
}

const emptyDashboardSummary: ClientDashboardSummary = {
  accountStatus: "Momo House pilot onboarding review",
  planLabel: "Internal unpaid cooperation pilot — not a public pricing change",
  onlinePresenceProgress: "Audit-prefilled profile ready for owner/team verification.",
  mediaCount: 0,
  requestCount: 0,
  reportCount: 0,
  nextClientAction: "Review prefilled details, confirm contacts, platform access, hours, menu/order links, catering details, and usable media.",
};

const emptyMediaSummary: ClientMediaSummary = {
  total: 0,
  usable: 0,
  needsBetterMedia: 0,
  used: 0,
  uploadReadinessNotice: "Media sending instructions will appear after setup review.",
};

const emptyRequestSummary: ClientRequestSummary = {
  total: 0,
  open: 0,
  needsClientConfirmation: 0,
  resolved: 0,
  nextAction: "Requests appear here after the account review workflow is active.",
};

export function createPlaceholderClientPortalRepository(): ClientPortalRepository {
  return {
    async getClientDashboardState() {
      return emptyDashboardState();
    },
    async getClientPortalPageState() {
      return buildClientPortalPageState({ dataMode: "placeholder_review", restaurant: momoHousePilotRestaurant, profile: momoHousePilotProfile, plan: momoHousePilotPlan });
    },
    async getClientDashboardSummary() {
      return emptyDashboardSummary;
    },
    async getClientUpdateSummaries() {
      return [];
    },
    async getClientReportSummaries() {
      return [];
    },
    async getClientMediaSummary() {
      return emptyMediaSummary;
    },
    async getClientRequestSummary() {
      return emptyRequestSummary;
    },
    async getClientMediaAssets() {
      return [];
    },
    async getClientRequests() {
      return [];
    },
    async getClientReports() {
      return [];
    },
  };
}

function findRestaurant(restaurantId: RestaurantId) {
  return demoSaasRestaurants.find((restaurant) => restaurant.id === restaurantId) ?? demoSaasRestaurants[0];
}

function getDemoPlan(restaurantId: RestaurantId) {
  return demoSaasPlans.find((plan) => plan.restaurantId === restaurantId) ?? demoSaasPlans[0];
}

function getDemoProfile(restaurantId: RestaurantId) {
  return demoSaasProfiles.find((profile) => profile.restaurantId === restaurantId) ?? demoSaasProfiles[0];
}

function buildDemoMedia(restaurantId: RestaurantId): MediaAssetRecord[] {
  const restaurant = findRestaurant(restaurantId);
  return [
    { id: `${restaurant.id}-media-hero`, restaurantId: restaurant.id, dataMode: "demo", source: "demo_fixture", displayName: "Best-seller counter photo", mediaType: "image", clientNote: "Use this photo next if helpful.", bestUse: "Google visibility update", status: "usable", createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
    { id: `${restaurant.id}-media-dining-room`, restaurantId: restaurant.id, dataMode: "demo", source: "demo_fixture", displayName: "Dining room atmosphere", mediaType: "image", clientNote: "Shows the space clearly.", bestUse: "Instagram or Facebook reminder", status: "prepared_for_post", createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
    { id: `${restaurant.id}-media-night`, restaurantId: restaurant.id, dataMode: "demo", source: "demo_fixture", displayName: "Low-light dinner plate", mediaType: "image", clientNote: "May need brighter replacement.", bestUse: "Needs better media before use", status: "needs_better_media", createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
  ];
}

function buildDemoRequests(restaurantId: RestaurantId): ClientRequestRecord[] {
  const restaurant = findRestaurant(restaurantId);
  return [
    { id: `${restaurant.id}-request-photo`, restaurantId: restaurant.id, dataMode: "demo", requestType: "media_direction", message: "Please use the best-seller photo next if it fits this week.", preferredTiming: "This week", status: "needs_team_review", clientVisibleStatus: "In review", teamNextAction: "Review photo direction and decide whether to prepare action.", requiresClientConfirmation: false, createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
    { id: `${restaurant.id}-request-menu-link`, restaurantId: restaurant.id, dataMode: "demo", requestType: "menu_update", message: "Can Veroxa review whether the menu link is easy to find?", status: "needs_client_confirmation", clientVisibleStatus: "Needs your input", teamNextAction: "Confirm current menu link before preparing a visibility task.", requiresClientConfirmation: true, createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
    { id: `${restaurant.id}-request-report`, restaurantId: restaurant.id, dataMode: "demo", requestType: "report_question", message: "Can you explain what signals were included in the report?", status: "resolved", clientVisibleStatus: "Included in report", teamNextAction: "No action needed in demo.", requiresClientConfirmation: false, createdAt: DEMO_NOW, updatedAt: DEMO_NOW, resolvedAt: DEMO_NOW },
  ];
}

function buildDemoReports(restaurantId: RestaurantId): ReportRecord[] {
  const restaurant = findRestaurant(restaurantId);
  return [
    { id: `${restaurant.id}-weekly-report`, restaurantId: restaurant.id, dataMode: "demo", reportType: "weekly", periodStart: "2026-05-25", periodEnd: "2026-05-31", status: "published_to_client", summary: "Sample weekly update showing completed Veroxa review work and honest next steps.", workCompleted: ["Reviewed Google profile freshness", "Prepared best-seller visibility update", "Sorted usable media"], mediaUsed: [`${restaurant.id}-media-hero`], visibilityNotes: ["Online presence signals can be reviewed when connected."], clientNeeds: ["Send brighter dinner photos this week"], honestLimitations: ["This is sample data only and not live account reporting."], publishedToClientAt: DEMO_NOW, createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
    { id: `${restaurant.id}-monthly-report`, restaurantId: restaurant.id, dataMode: "demo", reportType: "monthly", periodStart: "2026-05-01", periodEnd: "2026-05-31", status: "ready_for_review", summary: "Sample monthly report preview for Veroxa team review.", workCompleted: ["Local visibility cleanup checklist prepared", "Media rhythm reviewed"], mediaUsed: [], visibilityNotes: ["Calls, directions, menu visits, and order-path activity may be reviewed when connected."], clientNeeds: ["Confirm best sellers and current menu link"], honestLimitations: ["Available signals will be reported honestly when connected."], createdAt: DEMO_NOW, updatedAt: DEMO_NOW },
  ];
}

function buildDashboardSummary(restaurantId: RestaurantId): ClientDashboardSummary {
  const restaurant = findRestaurant(restaurantId);
  const plan = getDemoPlan(restaurant.id);
  const media = buildDemoMedia(restaurant.id);
  const requests = buildDemoRequests(restaurant.id);
  const reports = buildDemoReports(restaurant.id);
  return {
    accountStatus: "Sample portal preview",
    planLabel: "Complete Online Presence sample plan",
    onlinePresenceProgress: "Veroxa has sample visibility, media, request, and report items ready for review.",
    mediaCount: media.length,
    requestCount: requests.length,
    reportCount: reports.length,
    nextClientAction: "Send clear photos of best sellers and confirm any business-truth changes before Veroxa uses them.",
  };
}

function buildMediaSummary(restaurantId: RestaurantId): ClientMediaSummary {
  const media = buildDemoMedia(restaurantId);
  return {
    total: media.length,
    usable: media.filter((item) => item.status === "usable" || item.status === "prepared_for_post").length,
    needsBetterMedia: media.filter((item) => item.status === "needs_better_media").length,
    used: media.filter((item) => item.status === "manually_used").length,
    uploadReadinessNotice: "For now, this page shows sample media or a safe setup state. Media sending instructions will appear after setup review.",
  };
}

function buildRequestSummary(restaurantId: RestaurantId): ClientRequestSummary {
  const requests = buildDemoRequests(restaurantId);
  return {
    total: requests.length,
    open: requests.filter((item) => item.status !== "resolved" && item.status !== "held").length,
    needsClientConfirmation: requests.filter((item) => item.requiresClientConfirmation).length,
    resolved: requests.filter((item) => item.status === "resolved").length,
    nextAction: "Veroxa reviews requests and may ask for confirmation before business-truth changes.",
  };
}

export function createDemoClientPortalRepository(): ClientPortalRepository {
  return {
    async getClientDashboardState(restaurantId) {
      const restaurant = findRestaurant(restaurantId);
      return { restaurant, profile: getDemoProfile(restaurant.id), accountPlan: getDemoPlan(restaurant.id), mediaAssets: buildDemoMedia(restaurant.id), requests: buildDemoRequests(restaurant.id), reports: buildDemoReports(restaurant.id), dataMode: "demo", isLiveDataConnected: false, emptyStateTitle: "Sample portal preview", emptyStateBody: "This preview uses sample data." };
    },
    async getClientPortalPageState(restaurantId) {
      const restaurant = findRestaurant(restaurantId);
      return buildClientPortalPageState({ dataMode: "demo", restaurant, profile: getDemoProfile(restaurant.id), plan: getDemoPlan(restaurant.id), mediaAssets: buildDemoMedia(restaurant.id), clientRequests: buildDemoRequests(restaurant.id), reports: buildDemoReports(restaurant.id), activityPreview: getDemoActivityLogs(restaurant.id) });
    },
    async getClientDashboardSummary(restaurantId) {
      return buildDashboardSummary(restaurantId);
    },
    async getClientUpdateSummaries(restaurantId) {
      return [{ id: `${restaurantId}-weekly-update`, title: "Sample weekly update", completed: ["Prepared visibility update", "Reviewed media supply"], waitingOnClient: ["Send brighter dinner photos", "Confirm current menu link if changed"], nextDirection: "Keep best-seller and restaurant-space photos coming.", sourceLabel: "demo" }] satisfies ClientUpdateSummary[];
    },
    async getClientReportSummaries(restaurantId) {
      return buildDemoReports(restaurantId).map((report) => ({ id: report.id, title: `${report.reportType} report · ${report.periodStart} to ${report.periodEnd}`, reportType: report.reportType, status: report.status, summary: report.summary ?? "Report preview prepared for review.", sourceLabel: "demo" })) satisfies ClientReportSummary[];
    },
    async getClientMediaSummary(restaurantId) {
      return buildMediaSummary(restaurantId);
    },
    async getClientRequestSummary(restaurantId) {
      return buildRequestSummary(restaurantId);
    },
    async getClientMediaAssets(restaurantId) {
      return buildDemoMedia(restaurantId);
    },
    async getClientRequests(restaurantId) {
      return buildDemoRequests(restaurantId);
    },
    async getClientReports(restaurantId) {
      return buildDemoReports(restaurantId);
    },
  };
}

function buildDemoPreparedActions(restaurantId?: RestaurantId): PreparedActionRecord[] {
  return demoClientTeamWorkflow.filter((item) => !restaurantId || item.clientId === restaurantId).slice(0, 6).map((item) => ({
    id: `demo-prepared-${item.id}`,
    restaurantId: item.clientId,
    dataMode: "demo",
    sourceType: "team_manual",
    sourceId: item.id,
    actionType: item.type,
    channel: "internal",
    title: item.title,
    preparedCopy: `${item.title} · ${item.dueLabel}`,
    riskLevel: item.priority === "urgent" || item.priority === "high" ? "medium" : "low",
    requiresClientConfirmation: item.stage === "needs_client_action",
    status: "needs_approval",
    createdAt: DEMO_NOW,
    updatedAt: DEMO_NOW,
  }));
}

export function createPlaceholderTeamPortalRepository(): TeamPortalRepository {
  return {
    async getTeamPortalRepositoryState() { return buildTeamPortalRepositoryState({ dataMode: "placeholder_review", repositoryModeLabel: "placeholder repository" }); },
    async getTeamRestaurantOverview() { return [{ restaurantId: MOMO_HOUSE_RESTAURANT_ID, restaurantName: "Momo House San Antonio", status: "onboarding", dataMode: "placeholder_review", repositoryMode: "placeholder repository", nextAction: "Team Faraz: verify audit prefill, owner gaps, platform access, media/content workflow, and first-month report readiness." }]; },
    async getPreparedActions() { return []; },
    async getApprovalDecisions() { return []; },
    async getManualExecutionEvents() { return []; },
    async getOpportunityScores() { return []; },
    async getAccountActivationSummaries() { return []; },
    async getProfitValidationSnapshots() { return []; },
    async getActivityLogPreviews() { return []; },
  };
}

function buildDemoTeamOverview(): TeamRestaurantOverview[] {
  return demoSaasRestaurants.map((restaurant) => ({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    status: restaurant.status,
    dataMode: "demo",
    repositoryMode: "demo repository",
    nextAction: "Review demo account readiness only — not active client data.",
    activation: demoAccountActivationSummaries.find((summary) => summary.restaurantId === restaurant.id)?.result,
  }));
}

export function createDemoTeamPortalRepository(): TeamPortalRepository {
  return {
    async getTeamPortalRepositoryState() {
      return buildTeamPortalRepositoryState({ dataMode: "demo", repositoryModeLabel: "demo repository", restaurants: buildDemoTeamOverview(), pendingPreparedActions: buildDemoPreparedActions(), profitValidationSnapshots: demoProfitValidationSnapshots });
    },
    async getTeamRestaurantOverview() { return buildDemoTeamOverview(); },
    async getPreparedActions(restaurantId) { return buildDemoPreparedActions(restaurantId); },
    async getApprovalDecisions() { return []; },
    async getManualExecutionEvents() { return []; },
    async getOpportunityScores() { return []; },
    async getAccountActivationSummaries() { return demoAccountActivationSummaries; },
    async getProfitValidationSnapshots() { return demoProfitValidationSnapshots; },
    async getActivityLogPreviews() { return getDemoActivityLogs(); },
  };
}

function buildPreview(input: BuildNonPersistedActivityPreviewInput): ActivityLogRecord {
  return {
    id: `activity-preview-${input.restaurantId}-${input.entityType}-${input.entityId}`,
    restaurantId: input.restaurantId,
    dataMode: input.dataMode ?? "placeholder_review",
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    actorUserId: input.actorUserId,
    actorLabel: input.actorLabel ?? "Veroxa team",
    summary: input.summary,
    visibility: input.visibility ?? "team_internal",
    metadata: input.metadata,
    isPersisted: false,
    createdAt: input.createdAt ?? DEMO_NOW,
  };
}

export function createNoopActivityLogRepository(): ActivityLogRepository {
  return {
    async listActivityLogs() { return []; },
    async previewActivityLogs() { return []; },
    async appendActivityLog(input: CreateActivityLogInput) { return buildPreview(input); },
    buildNonPersistedActivityPreview(input) { return buildPreview(input); },
  };
}

export function createDemoActivityLogRepository(): ActivityLogRepository {
  return {
    async listActivityLogs(restaurantId) { return getDemoActivityLogs(restaurantId); },
    async previewActivityLogs(restaurantId) { return getDemoActivityLogs(restaurantId); },
    async appendActivityLog(input) { return buildPreview({ ...input, dataMode: "demo" }); },
    buildNonPersistedActivityPreview(input) { return buildPreview({ ...input, dataMode: "demo" }); },
  };
}
