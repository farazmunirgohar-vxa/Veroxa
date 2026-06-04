import type { ClientSafeWeeklyUpdateDraft, FirstClientOperatingSnapshot, TeamWeeklyUpdateDraft, WeeklyUpdateStatus } from "./types";

export function getWeeklyUpdateReadiness(
  snapshot: FirstClientOperatingSnapshot,
): WeeklyUpdateStatus {
  if (snapshot.weeklyUpdateStatus.status === "blocked") return snapshot.weeklyUpdateStatus;
  if (snapshot.blockers.length > 0 && snapshot.clientConfirmationStatus === "needed") {
    return {
      status: "draft_needed",
      readinessLabel: "Draft can be prepared after confirmation language is checked",
      nextAction: "Prepare a cautious draft and ask for client confirmation before anything is used publicly.",
    };
  }
  if (snapshot.lifecycleStage === "weekly_update_due") {
    return {
      status: "draft_ready",
      readinessLabel: "Weekly update draft ready for team review",
      nextAction: "Review the team draft, simplify the client version, then copy manually if approved.",
    };
  }
  return snapshot.weeklyUpdateStatus;
}

export function getWeeklyUpdateNextAction(snapshot: FirstClientOperatingSnapshot): string {
  return getWeeklyUpdateReadiness(snapshot).nextAction;
}

export function buildTeamWeeklyUpdateDraft(
  snapshot: FirstClientOperatingSnapshot,
): TeamWeeklyUpdateDraft {
  const needsConfirmation = snapshot.onboardingStatus.itemsRequiringConfirmation.length > 0
    ? snapshot.onboardingStatus.itemsRequiringConfirmation
    : snapshot.clientConfirmationStatus === "needed"
      ? ["Confirm business detail before public-facing work is prepared."]
      : [];

  const mediaNeeded = snapshot.mediaRhythmStatus.shouldSlowPostingDueToMedia
    ? [snapshot.mediaRhythmStatus.nextMediaRequest]
    : snapshot.mediaRhythmStatus.contentSupplyStatus === "thin"
      ? ["Ask for a light media refresh so prepared posts do not become repetitive."]
      : [];

  return {
    preparedThisWeek: [
      "Reviewed onboarding readiness and service-start inputs.",
      "Prepared local visibility and content direction notes for team review.",
      "Checked whether manual execution packs should move forward or hold for later.",
    ],
    readyForManualExecution:
      snapshot.manualExecutionStatus === "ready_for_manual_execution"
        ? ["Manual execution pack is ready for Faraz to review and copy manually."]
        : ["No public-facing execution should move forward until the next action is cleared."],
    needsClientConfirmation: needsConfirmation,
    mediaNeeded,
    heldForLater: snapshot.blockers.length > 0
      ? snapshot.blockers.map((blocker) => `Held for later: ${blocker}`)
      : ["No major hold-for-later item beyond normal team review."],
    reviewedNext: [
      snapshot.nextBestAction,
      "Review the next local visibility cleanup or content preparation task.",
    ],
    internalBlockersAndWarnings: [...snapshot.blockers, ...snapshot.warnings],
    draftOnlyLabel: "Draft only — not sent",
  };
}

export function buildClientSafeWeeklyUpdate(
  snapshot: FirstClientOperatingSnapshot,
): ClientSafeWeeklyUpdateDraft {
  const needFromClient = [
    ...snapshot.onboardingStatus.itemsRequiringConfirmation.map(
      (item) => `Please confirm ${item.toLowerCase()} before Veroxa uses it in public-facing work.`,
    ),
  ];
  if (snapshot.mediaRhythmStatus.shouldSlowPostingDueToMedia) {
    needFromClient.push(snapshot.mediaRhythmStatus.nextMediaRequest);
  }
  if (needFromClient.length === 0) {
    needFromClient.push("No urgent input is needed right now. Fresh usable photos are always helpful when available.");
  }

  return {
    workingOn: [
      "Veroxa is reviewing your online presence setup and preparing the next visibility-focused work for team review.",
      snapshot.clientSafeSummary,
    ],
    needFromClient,
    nextPlannedFocus: [
      "Keep business details accurate before any public-facing update is used.",
      "Prepare the next calm, useful visibility or content update after team review.",
    ],
    closingNote:
      "This is a prepared update draft. Nothing is sent or published from this screen.",
    draftOnlyLabel: "Draft only — not sent",
  };
}
