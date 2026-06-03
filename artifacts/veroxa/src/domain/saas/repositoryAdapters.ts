import { demoMenuItems, demoRestaurants } from "@/data/demo/demoClients";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import { VEROXA_PLANS } from "@/data/pricing/veroxaPricing";
import type {
  ActivityLogRepository,
  ClientPortalRepository,
  ClientPortalRepositoryState,
  TeamPortalRepository,
  TeamRestaurantOverview,
} from "./repositoryContracts";
import type {
  AccountPlanState,
  ActivityLogRecord,
  ClientRequest,
  CreateActivityLogInput,
  MediaAsset,
  PreparedActionRecord,
  ReportRecord,
  RestaurantAccount,
  RestaurantId,
  RestaurantProfile,
} from "./saasTypes";

const DEMO_NOW = "2026-06-03T00:00:00.000Z";

function createPlaceholderDashboardState(): ClientPortalRepositoryState {
  return {
    restaurant: null,
    profile: null,
    accountPlan: null,
    mediaAssets: [],
    requests: [],
    reports: [],
    dataMode: "placeholder_review",
    isLiveDataConnected: false,
    emptyStateTitle: "Live client data is not connected yet.",
    emptyStateBody:
      "This portal will show verified media, requests, updates, and reports once the account is active.",
  };
}

// Placeholder repositories are intentionally empty and are not production persistence.
export function createPlaceholderClientPortalRepository(): ClientPortalRepository {
  return {
    async getClientDashboardState() {
      return createPlaceholderDashboardState();
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

function findDemoClient(restaurantId: RestaurantId) {
  return demoRestaurants.find((client) => client.id === restaurantId) ?? demoRestaurants[0];
}

function getDemoMenuNames(restaurantId: RestaurantId): string[] {
  return demoMenuItems
    .filter((item) => item.clientId === restaurantId)
    .map((item) => item.name);
}

function buildDemoRestaurant(restaurantId: RestaurantId): RestaurantAccount {
  const client = findDemoClient(restaurantId);
  return {
    id: client.id,
    name: client.name,
    slug: client.id,
    timezone: "America/New_York",
    cuisineType: client.cuisine,
    status: "demo",
    dataMode: "demo",
    createdAt: DEMO_NOW,
    updatedAt: DEMO_NOW,
  };
}

function buildDemoProfile(restaurantId: RestaurantId): RestaurantProfile {
  const client = findDemoClient(restaurantId);
  return {
    restaurantId: client.id,
    bestSellers: getDemoMenuNames(client.id).slice(0, 3),
    customerTypes: ["Demo guest profile"],
    busyDays: ["Friday", "Saturday"],
    busyTimes: ["Dinner"],
    preferredPostingDays: ["Tuesday", "Thursday"],
    preferredPostingTimes: ["Afternoon"],
    brandVoiceNotes: "Demo profile only — not active client data.",
    updatedAt: DEMO_NOW,
  };
}

function buildDemoPlan(restaurantId: RestaurantId): AccountPlanState {
  const client = findDemoClient(restaurantId);
  const plan: "growth" = "growth";
  return {
    restaurantId: client.id,
    currentPlanId: plan,
    planStatus: "demo",
    billingMode: "manual",
    monthlyPriceCents: VEROXA_PLANS[plan].priceMonthly * 100,
    foundingDiscountEligible: true,
    foundingDiscountActive: false,
    premiumReadinessStatus: "not_eligible",
    adBudgetConfirmed: false,
    createdAt: DEMO_NOW,
    updatedAt: DEMO_NOW,
  };
}

function buildDemoMedia(restaurantId: RestaurantId): MediaAsset[] {
  const client = findDemoClient(restaurantId);
  return getDemoMenuNames(client.id).slice(0, 3).map((item, index) => ({
    id: `${client.id}-demo-media-${index + 1}`,
    restaurantId: client.id,
    dataMode: "demo",
    source: "demo_fixture",
    displayName: item,
    mediaType: "image",
    clientNote: "Demo media fixture for portal review.",
    bestUse: "Good for visibility update",
    status: index === 0 ? "usable" : "team_review_needed",
    createdAt: DEMO_NOW,
    updatedAt: DEMO_NOW,
  }));
}

function buildDemoReports(restaurantId: RestaurantId): ReportRecord[] {
  const client = findDemoClient(restaurantId);
  return [
    {
      id: `${client.id}-demo-report-1`,
      restaurantId: client.id,
      dataMode: "demo",
      reportType: "monthly",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      status: "ready_for_review",
      summary: "Demo report preview for SaaS repository scaffolding.",
      workCompleted: ["Visibility review prepared", "Media guidance drafted"],
      mediaUsed: [],
      visibilityNotes: ["Demo Google Maps readiness note"],
      clientNeeds: ["Keep sending clear food photos"],
      honestLimitations: ["No live account data is connected in this scaffold."],
      createdAt: DEMO_NOW,
      updatedAt: DEMO_NOW,
    },
  ];
}

// Demo repositories may read fixtures, but are explicitly dataMode: "demo".
export function createDemoClientPortalRepository(): ClientPortalRepository {
  return {
    async getClientDashboardState(restaurantId) {
      return {
        restaurant: buildDemoRestaurant(restaurantId),
        profile: buildDemoProfile(restaurantId),
        accountPlan: buildDemoPlan(restaurantId),
        mediaAssets: buildDemoMedia(restaurantId),
        requests: [],
        reports: buildDemoReports(restaurantId),
        dataMode: "demo",
        isLiveDataConnected: false,
        emptyStateTitle: "Demo repository active",
        emptyStateBody: "This is sample data only.",
      };
    },
    async getClientMediaAssets(restaurantId) {
      return buildDemoMedia(restaurantId);
    },
    async getClientRequests() {
      return [] as ClientRequest[];
    },
    async getClientReports(restaurantId) {
      return buildDemoReports(restaurantId);
    },
  };
}

// Placeholder team repository keeps real internal routes empty until approved persistence exists.
export function createPlaceholderTeamPortalRepository(): TeamPortalRepository {
  return {
    async getTeamRestaurantOverview() {
      return [];
    },
    async getPreparedActions() {
      return [];
    },
    async getApprovalDecisions() {
      return [];
    },
    async getManualExecutionEvents() {
      return [];
    },
    async getOpportunityScores() {
      return [];
    },
  };
}

function buildDemoTeamOverview(): TeamRestaurantOverview[] {
  return demoRestaurants.slice(0, 5).map((client) => ({
    restaurantId: client.id,
    restaurantName: client.name,
    status: "demo",
    dataMode: "demo",
    repositoryMode: "demo repository",
    nextAction: "Review demo readiness only — not active client data.",
  }));
}

function buildDemoPreparedActions(restaurantId?: RestaurantId): PreparedActionRecord[] {
  return demoClientTeamWorkflow
    .filter((item) => !restaurantId || item.clientId === restaurantId)
    .slice(0, 5)
    .map((item) => ({
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

// Demo team repository is fixture-backed and must never be selected for authenticated modes.
export function createDemoTeamPortalRepository(): TeamPortalRepository {
  return {
    async getTeamRestaurantOverview() {
      return buildDemoTeamOverview();
    },
    async getPreparedActions(restaurantId) {
      return buildDemoPreparedActions(restaurantId);
    },
    async getApprovalDecisions() {
      return [];
    },
    async getManualExecutionEvents() {
      return [];
    },
    async getOpportunityScores() {
      return [];
    },
  };
}

export function createNoopActivityLogRepository(): ActivityLogRepository {
  return {
    async listActivityLogs() {
      return [];
    },
    async appendActivityLog(input: CreateActivityLogInput): Promise<ActivityLogRecord> {
      return {
        id: `noop-activity-${Date.now()}`,
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
        createdAt: new Date().toISOString(),
      };
    },
  };
}

export function createDemoActivityLogRepository(): ActivityLogRepository {
  return {
    async listActivityLogs(restaurantId) {
      return [
        {
          id: `${restaurantId}-demo-activity-1`,
          restaurantId,
          dataMode: "demo",
          entityType: "prepared_action",
          entityId: `${restaurantId}-demo-action`,
          action: "created",
          actorLabel: "Veroxa demo",
          summary: "Demo prepared action activity preview.",
          visibility: "team_internal",
          isPersisted: false,
          createdAt: DEMO_NOW,
        },
      ];
    },
    async appendActivityLog(input) {
      return {
        id: `demo-activity-${Date.now()}`,
        restaurantId: input.restaurantId,
        dataMode: "demo",
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        actorUserId: input.actorUserId,
        actorLabel: input.actorLabel ?? "Veroxa demo",
        summary: input.summary,
        visibility: input.visibility ?? "team_internal",
        metadata: input.metadata,
        isPersisted: false,
        createdAt: new Date().toISOString(),
      };
    },
  };
}
