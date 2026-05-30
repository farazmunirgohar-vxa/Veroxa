/** Client Portal Journey — barrel for client-safe journey/report foundations. */

export type {
  ClientJourneyItem,
  ClientJourneyItemType,
  ClientJourneyStatus,
  ClientJourneySource,
  ClientJourneyPriority,
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
  describeClientPortalStatus,
  statusNeedsClientInput,
  statusIsComplete,
  statusIsInProgress,
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
