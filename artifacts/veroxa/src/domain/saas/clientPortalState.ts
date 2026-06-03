import type { AccountActivationResult } from "./accountActivation";
import { evaluateAccountActivation } from "./accountActivation";
import type {
  AccountPlanState,
  ActivityLogRecord,
  ClientRequestRecord,
  MediaAssetRecord,
  ReportRecord,
  RestaurantAccount,
  RestaurantProfile,
  SaasDataMode,
} from "./saasTypes";

export type ClientPortalPageName = "dashboard" | "media" | "requests" | "updates" | "reports";

export interface ClientPortalPageState {
  dataMode: SaasDataMode;
  accountActivation: AccountActivationResult;
  restaurant: RestaurantAccount | null;
  profile: RestaurantProfile | null;
  plan: AccountPlanState | null;
  mediaAssets: MediaAssetRecord[];
  clientRequests: ClientRequestRecord[];
  reports: ReportRecord[];
  activityPreview: ActivityLogRecord[];
  isDemoData: boolean;
  isPlaceholderOnly: boolean;
  canShowRealData: boolean;
  clientSafeMessage: string;
}

export interface BuildClientPortalPageStateInput {
  dataMode: SaasDataMode;
  restaurant: RestaurantAccount | null;
  profile: RestaurantProfile | null;
  plan: AccountPlanState | null;
  mediaAssets?: MediaAssetRecord[];
  clientRequests?: ClientRequestRecord[];
  reports?: ReportRecord[];
  activityPreview?: ActivityLogRecord[];
}

function hasPublishedReport(reports: ReportRecord[]): boolean {
  return reports.some((report) => report.status === "published_to_client");
}

export function buildClientPortalPageState(
  input: BuildClientPortalPageStateInput,
): ClientPortalPageState {
  const mediaAssets = input.mediaAssets ?? [];
  const clientRequests = input.clientRequests ?? [];
  const reports = input.reports ?? [];
  const activityPreview = input.activityPreview ?? [];
  const isDemoData = input.dataMode === "demo";
  const isPlaceholderOnly = input.dataMode !== "demo" && input.dataMode !== "authenticated_client";
  const accountActivation = evaluateAccountActivation({
    restaurantStatus: input.restaurant?.status ?? (isDemoData ? "demo" : "prospect"),
    planStatus: input.plan?.planStatus,
    hasActiveClientMembership: isDemoData || input.dataMode === "authenticated_client",
    hasRestaurantProfile: Boolean(input.profile),
    hasConfirmedBusinessTruth: Boolean(input.profile?.clientConfirmedAt),
    hasUsableMedia: mediaAssets.some((asset) => asset.status === "usable" || asset.status === "manually_used"),
    hasPublishedClientReport: hasPublishedReport(reports),
    hasActivityLogScaffold: activityPreview.length > 0 || isDemoData,
    dataMode: input.dataMode,
  });

  const canShowRealData = input.dataMode === "authenticated_client" && accountActivation.canShowClientPortalData;

  return {
    dataMode: input.dataMode,
    accountActivation,
    restaurant: isDemoData || canShowRealData ? input.restaurant : null,
    profile: isDemoData || canShowRealData ? input.profile : null,
    plan: isDemoData || canShowRealData ? input.plan : null,
    mediaAssets: isDemoData || canShowRealData ? mediaAssets : [],
    clientRequests: isDemoData || canShowRealData ? clientRequests : [],
    reports: isDemoData || canShowRealData ? reports : [],
    activityPreview: isDemoData ? activityPreview.filter((log) => log.visibility === "client_safe") : [],
    isDemoData,
    isPlaceholderOnly,
    canShowRealData,
    clientSafeMessage: isDemoData
      ? "This preview uses sample data."
      : canShowRealData
        ? "Your Veroxa account details are ready for review."
        : "Your account setup will appear here once your restaurant portal is active.",
  };
}

const pageEmptyCopy: Record<ClientPortalPageName, string> = {
  dashboard: "Your account setup will appear here once your restaurant portal is active.",
  media: "Once your account is active, your restaurant media will appear here. Media uploads are not connected yet.",
  requests: "Requests appear here after your Veroxa team review workflow is active.",
  updates: "Updates appear after Veroxa reviews and prepares verified progress notes.",
  reports: "Reports appear after Veroxa reviews and publishes verified updates.",
};

export function getClientSafeEmptyStateForPage(
  pageName: ClientPortalPageName,
  state: ClientPortalPageState,
): string {
  if (state.isDemoData) return "This preview uses sample data.";
  if (state.canShowRealData) return "No items are ready for this page yet.";
  return pageEmptyCopy[pageName];
}

export function getClientPortalDataModeNotice(state: ClientPortalPageState): string {
  if (state.isDemoData) return "Sample preview only — not an active restaurant account.";
  if (state.canShowRealData) return "Verified account data only appears after Veroxa team review.";
  return "For now, this page shows a safe setup state while your restaurant portal is prepared.";
}

export function getClientPortalReadinessSummary(state: ClientPortalPageState): string {
  if (state.isDemoData) return "Demo preview ready for walkthrough.";
  if (state.accountActivation.blockers.length > 0) {
    return "Veroxa is still preparing the account setup before showing restaurant details.";
  }
  return state.accountActivation.clientVisibleStatus;
}
