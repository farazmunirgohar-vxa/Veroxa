/**
 * Client Portal Journey — barrel.
 *
 * The single client-safe vocabulary + helpers shared by the /client/* pages.
 * Pure domain layer: no React, no network, no storage. See
 * docs/CLIENT_PORTAL_JOURNEY.md.
 */

export type {
  ClientPortalJourneyStatus,
  ClientPortalJourneyType,
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
} from "./clientSafe";
