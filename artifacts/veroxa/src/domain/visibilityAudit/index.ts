/**
 * Visibility Audit domain — public surface.
 *
 * Rule-based / fixture-only engine that turns a restaurant's online presence
 * into plain-language findings and prepared actions for the Approval Queue.
 * NO external APIs, NO AI, NO storage, NO side effects.
 */

export * from "./types";
export { runVisibilityAudit } from "./engine";
export {
  generatePreparedActionsFromVisibilityAudit,
  visibilityFindingToPreparedAction,
} from "./preparedActionMapper";
export {
  getClientSafeVisibilitySummary,
  getClientSafeVisibilityStatus,
  getClientSafeVisibilityFinding,
  shouldShowVisibilityFindingToClient,
  type ClientSafeVisibilitySummary,
} from "./clientSafe";
