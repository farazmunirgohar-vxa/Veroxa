import type { ManualExecutionLaunchGateSignal, ManualExecutionPack } from "./types";
import { filterExecutionPacksForLaunchGate, groupExecutionPacksByStatus } from "./executionPackBuilder";

export function evaluateManualExecutionLaunchGate(packs: readonly ManualExecutionPack[]): ManualExecutionLaunchGateSignal {
  const launchPacks = filterExecutionPacksForLaunchGate(packs);
  const grouped = groupExecutionPacksByStatus(launchPacks);
  const readyToCopyCount = grouped.readyToCopy.length;
  const needsClientConfirmationCount = grouped.needsClientConfirmation.length;
  const blockedByMediaOrContextCount = grouped.needsMediaOrContext.length;
  const heldForLaterCount = grouped.heldForLater.length;
  const completedPreviewCount = grouped.completedPreview.length;
  const demoWalkthroughReady = readyToCopyCount > 0 && launchPacks.length >= 5;
  const feedbackConversationReady = demoWalkthroughReady && needsClientConfirmationCount > 0;
  const firstPaidClientReadyLater = false;

  let summary = "Manual execution ready for review in pre-live mode.";
  let recommendedNextAction = "Review ready-to-copy packs, then handle client confirmation items before manual execution.";

  if (blockedByMediaOrContextCount >= readyToCopyCount) {
    summary = "Manual execution needs caution because media/context blockers are high.";
    recommendedNextAction = "Resolve missing media/context before treating manual execution as first-client ready.";
  } else if (needsClientConfirmationCount > 0) {
    summary = "Client confirmation needed before manual execution for business-truth items.";
    recommendedNextAction = "Send simple confirmation requests manually and hold those packs until clients reply.";
  } else if (readyToCopyCount > 2) {
    summary = "Several packs are ready to copy for Faraz review.";
  }

  return {
    readyToCopyCount,
    needsClientConfirmationCount,
    blockedByMediaOrContextCount,
    heldForLaterCount,
    completedPreviewCount,
    demoWalkthroughReady,
    feedbackConversationReady,
    firstPaidClientReadyLater,
    summary,
    recommendedNextAction,
  };
}
