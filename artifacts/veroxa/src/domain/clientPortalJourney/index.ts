/** Client Portal Journey — barrel for client-safe journey/report foundations. */

export type {
  ClientJourneyItem,
  ClientJourneyItemType,
  ClientJourneyStatus,
  ClientJourneySource,
  ClientJourneyPriority,
  ClientReportInclusionState,
  ClientVisibilityCategory,
  ClientNeedFromClient,
  ClientProgressSummary,
  ClientNextStep,
  ClientVisibilityProgress,
  ClientLocalVisibilityProgress,
  ClientReportSummary,
  ClientWeeklyUpdate,
  ClientMonthlyReport,
  ClientPortalJourneyStatus,
  ClientPortalJourneyType,
  ClientPortalJourneySource,
  ClientPortalJourneyPriority,
  ClientPortalStatusTone,
  ClientPortalJourneyItem,
  ClientPortalNeedFromClient,
  ClientPortalNextStep,
  ClientPortalProgressSummary,
} from "./types";

export {
  getClientPortalStatusTone,
  getClientStatusTone,
  describeClientPortalStatus,
  getClientStatusDescription,
  statusNeedsClientInput,
  isClientActionNeeded,
  statusIsComplete,
  isClientWorkComplete,
  statusIsInProgress,
  isClientWorkInProgress,
  isReportEligible,
  getClientNextActionLabel,
  getClientPortalTypeLabel,
  buildClientPortalProgressSummary,
  createDefaultVisibilityProgress,
  createDefaultReportSummary,
} from "./clientSafe";

export {
  getClientPortalJourney,
  getClientProgressSummary,
  getClientNeedsFromYou,
  getClientRecentProgress,
  getClientVisibilityProgress,
  getClientNextSteps,
} from "./repository";

export { generateClientWeeklyUpdate } from "./weeklyUpdate";
export { generateClientMonthlyReport } from "./monthlyReport";
export { getClientLocalVisibilityProgress } from "./localVisibility";
export {
  CLIENT_SAFE_COPY_DENYLIST,
  findClientSafeLanguageViolations,
  assertClientSafeLanguage,
  isClientSafeLanguage,
} from "./languageSafety";

export type {
  ClientPlanSlug,
  PremiumEligibilityStatus,
  ClientPackageReadinessInput,
} from "./packageReadiness";
export {
  getCurrentPlanLabel,
  getPackagePostingLimitSummary,
  getRestaurantResponsibilitySummary,
  getVeroxaResponsibilitySummary,
  getPremiumEligibilityState,
  getPremiumEligibilityLabel,
  getFirstClientDiscountState,
  getMediaDependencyReminder,
  buildClientPackageReadiness,
  DEFAULT_CLIENT_PACKAGE_READINESS,
} from "./packageReadiness";
export type {
  FirstFiveCondition,
  FirstFiveClientReadinessFixture,
  FirstFiveReadinessStatus,
} from "./firstFiveReadiness";
export {
  FIRST_FIVE_CLIENT_READINESS_FIXTURES,
  getFirstFiveClientReadinessStatus,
  getFirstFiveReadinessStatuses,
} from "./firstFiveReadiness";
