import type { ClientSafeMonthlyReportDraft, FirstClientOperatingSnapshot, MonthlyReportStatus, TeamMonthlyReportDraft } from "./types";

export function getMonthlyReportBlockers(
  snapshot: FirstClientOperatingSnapshot,
): readonly string[] {
  const blockers: string[] = [];
  if (snapshot.mediaRhythmStatus.contentSupplyStatus === "blocked" || snapshot.mediaRhythmStatus.contentSupplyStatus === "low") {
    blockers.push("Media supply is too thin for a complete monthly narrative.");
  }
  if (snapshot.onboardingStatus.itemsRequiringConfirmation.length > 0) {
    blockers.push("Business detail confirmation is still needed.");
  }
  if (snapshot.manualExecutionStatus === "not_ready" || snapshot.manualExecutionStatus === "blocked") {
    blockers.push("Manual execution work is not ready enough to summarize as completed.");
  }
  return blockers;
}

export function getMonthlyReportReadiness(
  snapshot: FirstClientOperatingSnapshot,
): MonthlyReportStatus {
  const blockers = getMonthlyReportBlockers(snapshot);
  if (snapshot.lifecycleStage === "monthly_report_due" && blockers.length === 0) {
    return {
      status: "draft_ready",
      readinessLabel: "Monthly report draft ready for team review",
      blockers,
    };
  }
  if (snapshot.lifecycleStage === "monthly_report_due") {
    return {
      status: "draft_needed",
      readinessLabel: "Monthly report needs context before it is client-ready",
      blockers,
    };
  }
  return {
    ...snapshot.monthlyReportStatus,
    blockers,
  };
}

export function buildTeamMonthlyReportDraft(
  snapshot: FirstClientOperatingSnapshot,
): TeamMonthlyReportDraft {
  const blockers = getMonthlyReportBlockers(snapshot);
  return {
    workCompleted: [
      "Reviewed onboarding, media rhythm, and manual execution readiness.",
      "Prepared visibility/profile cleanup notes for manual review.",
      snapshot.manualExecutionStatus === "ready_for_manual_execution"
        ? "Manual execution pack is ready for review and copy-by-team flow."
        : "Manual execution pack remains held until the next action is cleared.",
    ],
    preparedManualExecutionPacks: [
      "Social/local visibility update pack prepared as manual-only work.",
      "Review or confirmation pack prepared where business details need checking.",
    ],
    mediaSupplyNotes: [
      `${snapshot.mediaRhythmStatus.usableMediaCount} usable media items in this review snapshot.`,
      `${snapshot.mediaRhythmStatus.lowQualityMediaCount} low-quality media items need review or replacement.`,
      snapshot.mediaRhythmStatus.nextMediaRequest,
    ],
    visibilityProfileCleanupNotes: [
      "Check Google Business Profile link, website, menu/order path, and best-seller visibility before reporting externally.",
      "Keep all notes framed as preparation and review, not live platform execution.",
    ],
    clientConfirmationDelays:
      snapshot.onboardingStatus.itemsRequiringConfirmation.length > 0
        ? snapshot.onboardingStatus.itemsRequiringConfirmation.map(
            (item) => `Delay: ${item} needs confirmation.`,
          )
        : ["No specific client-confirmation delay in this snapshot."],
    reportDataLimitations: [
      "No live metrics are connected in this pre-live view.",
      "Report draft should summarize prepared work, input needs, and honest limitations only.",
      ...blockers,
    ],
    nextMonthRecommendation: snapshot.nextBestAction,
    internalServiceHealth: `Internal service health: ${snapshot.serviceHealthStatus.replaceAll("_", " ")}.`,
    internalProfitValidationNote:
      "Internal-only: cost-justification signals can be reviewed later when verified action data exists; no client-facing math is included here.",
    draftOnlyLabel: "Draft only — not published",
  };
}

export function buildClientSafeMonthlyReportDraft(
  snapshot: FirstClientOperatingSnapshot,
): ClientSafeMonthlyReportDraft {
  return {
    progressSummary:
      "Veroxa is preparing a plain-language monthly progress draft based on reviewed work, available media, and next input needs. No unverified numbers are included.",
    workCompleted: [
      "Reviewed your online presence setup and prepared the next service steps for team review.",
      "Checked business detail readiness, media supply, and visibility-focused work that may be prepared next.",
    ],
    needsClientInput:
      snapshot.onboardingStatus.itemsRequiringConfirmation.length > 0
        ? snapshot.onboardingStatus.itemsRequiringConfirmation.map(
            (item) => `Please confirm ${item.toLowerCase()} before it is used in public-facing work.`,
          )
        : snapshot.mediaRhythmStatus.shouldSlowPostingDueToMedia
          ? [snapshot.mediaRhythmStatus.nextMediaRequest]
          : ["No urgent input is needed right now. Fresh usable photos are helpful when available."],
    recommendedNext: [
      "Keep key business details accurate.",
      "Provide usable photos when available so Veroxa can prepare stronger work for review.",
      "Review any Veroxa confirmation requests before public-facing updates are used.",
    ],
    mediaGuidance: snapshot.mediaRhythmStatus.nextMediaRequest,
    draftOnlyLabel: "Draft only — not published",
  };
}
