import { determineLifecycleStage } from "./lifecycleStageEngine";
import { evaluateMediaRhythm } from "./mediaRhythmEngine";
import { evaluateOnboardingReadiness } from "./onboardingReadinessEngine";
import { evaluateServiceHealth } from "./serviceHealthEngine";
import type { DraftStatus, FirstClientOperatingSeed, FirstClientOperatingSnapshot, MonthlyReportStatus, WeeklyUpdateStatus } from "./types";

function buildBlockers(seed: FirstClientOperatingSeed, onboardingMissing: readonly string[], needsConfirmation: readonly string[], shouldSlowPosting: boolean): string[] {
  const blockers: string[] = [];
  if (onboardingMissing.length > 0) blockers.push(`Missing onboarding item: ${onboardingMissing[0]}.`);
  if (needsConfirmation.length > 0) blockers.push(`Client confirmation needed: ${needsConfirmation[0]}.`);
  if (shouldSlowPosting) blockers.push("Usable media supply is too low for the planned posting rhythm.");
  if (seed.manualExecutionStatus === "blocked") blockers.push("Manual execution pack is blocked until context improves.");
  return blockers;
}

function getWeeklyStatus(seed: FirstClientOperatingSeed): WeeklyUpdateStatus {
  if (seed.servicePaused) return { status: "blocked", readinessLabel: "Paused", nextAction: "Hold weekly update draft while service is paused." };
  if (seed.weeklyUpdateDue) return { status: "draft_ready", readinessLabel: "Weekly update draft ready", nextAction: "Review and copy manually if approved." };
  return { status: "not_due", readinessLabel: "Weekly update not due", nextAction: "Continue preparing work and review again later." };
}

function getMonthlyStatus(seed: FirstClientOperatingSeed): MonthlyReportStatus {
  const status: DraftStatus = seed.monthlyReportDue ? "draft_ready" : "not_due";
  return {
    status,
    readinessLabel: seed.monthlyReportDue ? "Monthly report draft ready" : "Monthly report not due",
    blockers: [],
  };
}

function getNextBestAction(snapshot: Omit<FirstClientOperatingSnapshot, "nextBestAction" | "clientSafeSummary" | "teamInternalSummary">): string {
  if (snapshot.serviceHealthStatus === "paused") return "Hold service and review restart readiness later.";
  if (snapshot.onboardingStatus.itemsRequiringConfirmation.length > 0) return `Confirm ${snapshot.onboardingStatus.itemsRequiringConfirmation[0]} with the restaurant before preparing public-facing work.`;
  if (snapshot.onboardingStatus.missingItems.length > 0) return `Collect ${snapshot.onboardingStatus.missingItems[0]} for onboarding readiness.`;
  if (snapshot.mediaRhythmStatus.shouldSlowPostingDueToMedia) return "Request usable media before keeping the planned posting rhythm.";
  if (snapshot.lifecycleStage === "monthly_report_due") return "Draft the monthly report for team review without adding unverified numbers.";
  if (snapshot.lifecycleStage === "weekly_update_due") return "Draft the weekly update and keep it in draft-only review mode.";
  if (snapshot.manualExecutionStatus === "ready_for_manual_execution") return "Review the manual execution pack and copy manually only if approved.";
  if (snapshot.packageFit === "Premium assessment") return "Review Premium readiness carefully before any advanced support is discussed.";
  return "Review service health and prepare the next calm manual service step.";
}

function buildClientSafeSummary(snapshot: Omit<FirstClientOperatingSnapshot, "nextBestAction" | "clientSafeSummary" | "teamInternalSummary">): string {
  if (snapshot.mediaRhythmStatus.shouldSlowPostingDueToMedia) {
    return "Veroxa is preparing your next work, but stronger usable media would help keep the service rhythm smooth.";
  }
  if (snapshot.onboardingStatus.itemsRequiringConfirmation.length > 0) {
    return "Veroxa is preparing the next steps and may ask you to confirm business details before anything public-facing is used.";
  }
  if (snapshot.manualExecutionStatus === "ready_for_manual_execution") {
    return "Veroxa has work prepared for team review before anything is used publicly.";
  }
  return "Veroxa is reviewing your online presence setup and preparing the next calm service step.";
}

function buildSnapshot(seed: FirstClientOperatingSeed): FirstClientOperatingSnapshot {
  const onboardingStatus = evaluateOnboardingReadiness(seed.onboarding);
  const mediaRhythmStatus = evaluateMediaRhythm(seed.media);
  const blockers = buildBlockers(
    seed,
    onboardingStatus.missingItems,
    onboardingStatus.itemsRequiringConfirmation,
    mediaRhythmStatus.shouldSlowPostingDueToMedia,
  );
  const serviceHealthStatus = evaluateServiceHealth({ seed, onboardingStatus, mediaRhythmStatus, blockers });
  const partial = {
    clientId: seed.clientId,
    restaurantName: seed.restaurantName,
    packageFit: seed.packageFit,
    lifecycleStage: "prospect_review" as const,
    onboardingStatus,
    mediaRhythmStatus,
    manualExecutionStatus: seed.manualExecutionStatus,
    weeklyUpdateStatus: getWeeklyStatus(seed),
    monthlyReportStatus: getMonthlyStatus(seed),
    clientConfirmationStatus: seed.clientConfirmationStatus,
    serviceHealthStatus,
    blockers,
    warnings: seed.warnings ?? [],
    readySignals: seed.readySignals ?? [],
    updatedAt: seed.updatedAt,
  };
  const lifecycleStage = determineLifecycleStage({ seed, onboardingStatus, mediaRhythmStatus, serviceHealthStatus });
  const withStage = { ...partial, lifecycleStage };
  const nextBestAction = getNextBestAction(withStage);
  return {
    ...withStage,
    nextBestAction,
    clientSafeSummary: buildClientSafeSummary(withStage),
    teamInternalSummary: [
      `${seed.restaurantName} is in ${lifecycleStage.replaceAll("_", " ")} for ${seed.packageFit}.`,
      ...(seed.internalNotes ?? []),
    ].join(" "),
  };
}

const benchmarkSeeds: readonly FirstClientOperatingSeed[] = [
  {
    clientId: "starter-healthy-benchmark",
    restaurantName: "Starter healthy benchmark",
    packageFit: "Starter",
    onboarding: {
      businessName: "Starter healthy benchmark",
      address: "Confirmed address",
      phone: "Confirmed phone",
      website: "Confirmed website",
      googleBusinessProfileLink: "Confirmed profile link",
      instagramLink: "Confirmed Instagram",
      facebookLink: "Confirmed Facebook",
      menuLinkOrImages: "Menu link present",
      orderingLink: "Ordering link present",
      topMenuItems: ["Signature bowl", "Family platter"],
      bestSellers: ["Signature bowl"],
      brandToneNotes: "Warm, simple, local.",
      mediaGuidanceGiven: true,
      postingPreferences: "Starter rhythm, up to 3 posts per week when usable media exists.",
    },
    media: { usableMediaCount: 9, lowQualityMediaCount: 1, missingMediaCount: 0, lastMediaUploadLabel: "Fresh upload this week" },
    manualExecutionStatus: "ready_for_manual_execution",
    weeklyUpdateDue: true,
    monthlyReportDue: false,
    clientConfirmationStatus: "not_required",
    readySignals: ["Onboarding details present", "Usable media available", "Manual pack ready"],
    internalNotes: ["Healthy Starter benchmark for first-client walkthrough."],
    updatedAt: "2026-06-04T00:00:00.000Z",
  },
  {
    clientId: "starter-low-media-benchmark",
    restaurantName: "Starter low-media benchmark",
    packageFit: "Starter",
    onboarding: {
      businessName: "Starter low-media benchmark",
      address: "Confirmed address",
      phone: "Confirmed phone",
      website: "Confirmed website",
      googleBusinessProfileLink: "Confirmed profile link",
      menuLinkOrImages: "Menu image present",
      orderingLink: "Ordering link present",
      topMenuItems: ["Lunch plate"],
      bestSellers: ["Lunch plate"],
      brandToneNotes: "Casual neighborhood tone.",
      mediaGuidanceGiven: true,
      postingPreferences: "Starter rhythm only when usable media exists.",
    },
    media: { usableMediaCount: 2, lowQualityMediaCount: 5, missingMediaCount: 7, lastMediaUploadLabel: "No strong upload this week" },
    manualExecutionStatus: "not_ready",
    weeklyUpdateDue: false,
    monthlyReportDue: false,
    clientConfirmationStatus: "not_required",
    warnings: ["Posting rhythm should slow until better media arrives."],
    updatedAt: "2026-06-04T00:00:00.000Z",
  },
  {
    clientId: "growth-media-ready-benchmark",
    restaurantName: "Growth media-ready benchmark",
    packageFit: "Growth",
    onboarding: {
      businessName: "Growth media-ready benchmark",
      address: "Confirmed address",
      phone: "Confirmed phone",
      website: "Confirmed website",
      googleBusinessProfileLink: "Confirmed profile link",
      instagramLink: "Confirmed Instagram",
      facebookLink: "Confirmed Facebook",
      menuLinkOrImages: "Menu link present",
      orderingLink: "Ordering link present",
      topMenuItems: ["Catering tray", "Dinner special", "House dessert"],
      bestSellers: ["Catering tray", "Dinner special"],
      brandToneNotes: "Premium, food-first, calm.",
      mediaGuidanceGiven: true,
      postingPreferences: "Growth rhythm, up to 1 post per day when usable media exists.",
    },
    media: { usableMediaCount: 16, lowQualityMediaCount: 1, missingMediaCount: 0, lastMediaUploadLabel: "Strong upload this week" },
    manualExecutionStatus: "ready_for_manual_execution",
    weeklyUpdateDue: false,
    monthlyReportDue: true,
    clientConfirmationStatus: "not_required",
    readySignals: ["Strong media supply", "Cooperative upload rhythm", "Report draft can be prepared"],
    updatedAt: "2026-06-04T00:00:00.000Z",
  },
  {
    clientId: "growth-inconsistent-upload-benchmark",
    restaurantName: "Growth inconsistent-upload benchmark",
    packageFit: "Growth",
    onboarding: {
      businessName: "Growth inconsistent-upload benchmark",
      address: "Confirmed address",
      phone: "Confirmed phone",
      website: "Confirmed website",
      googleBusinessProfileLink: "Confirmed profile link",
      instagramLink: "Confirmed Instagram",
      menuLinkOrImages: "Menu link present",
      orderingLink: "Ordering link present",
      topMenuItems: ["Weekend special", "Lunch combo"],
      bestSellers: ["Weekend special"],
      brandToneNotes: "Friendly and practical.",
      mediaGuidanceGiven: true,
      postingPreferences: "Growth rhythm should slow when usable media is unavailable.",
      itemsRequiringConfirmation: ["holiday hours"],
    },
    media: { usableMediaCount: 4, lowQualityMediaCount: 4, missingMediaCount: 6, lastMediaUploadLabel: "Inconsistent upload rhythm" },
    manualExecutionStatus: "queued_for_later",
    weeklyUpdateDue: true,
    monthlyReportDue: false,
    clientConfirmationStatus: "needed",
    warnings: ["Client confirmation and stronger media are both needed."],
    updatedAt: "2026-06-04T00:00:00.000Z",
  },
  {
    clientId: "premium-readiness-benchmark",
    restaurantName: "Premium readiness benchmark",
    packageFit: "Premium assessment",
    onboarding: {
      businessName: "Premium readiness benchmark",
      address: "Confirmed address",
      phone: "Confirmed phone",
      website: "Confirmed website",
      googleBusinessProfileLink: "Confirmed profile link",
      instagramLink: "Confirmed Instagram",
      facebookLink: "Confirmed Facebook",
      menuLinkOrImages: "Menu link present",
      orderingLink: "Ordering link present",
      topMenuItems: ["Chef platter", "Private event tray"],
      bestSellers: ["Chef platter"],
      brandToneNotes: "Premium but simple.",
      mediaGuidanceGiven: true,
      postingPreferences: "Premium may be assessed only after readiness review and client approval.",
      requiresPremiumReadiness: true,
      premiumReadinessNotes: "Candidate for readiness conversation; not automatic.",
      itemsRequiringConfirmation: ["ad budget readiness and approval"],
    },
    media: { usableMediaCount: 12, lowQualityMediaCount: 2, missingMediaCount: 1, lastMediaUploadLabel: "Good premium assessment media" },
    manualExecutionStatus: "not_ready",
    weeklyUpdateDue: false,
    monthlyReportDue: true,
    clientConfirmationStatus: "needed",
    warnings: ["Premium remains assessment-only and requires approval before any advanced support."],
    updatedAt: "2026-06-04T00:00:00.000Z",
  },
];

export const firstClientOperatingSnapshots: readonly FirstClientOperatingSnapshot[] = benchmarkSeeds.map(buildSnapshot);

export function getFirstClientOperatingSnapshots(): readonly FirstClientOperatingSnapshot[] {
  return firstClientOperatingSnapshots;
}

export function getFirstClientOperatingSnapshotById(clientId: string): FirstClientOperatingSnapshot | undefined {
  return firstClientOperatingSnapshots.find((snapshot) => snapshot.clientId === clientId);
}

export function getFirstClientOpsSummary(snapshots: readonly FirstClientOperatingSnapshot[] = firstClientOperatingSnapshots) {
  return {
    total: snapshots.length,
    healthy: snapshots.filter((snapshot) => snapshot.serviceHealthStatus === "healthy").length,
    needingMedia: snapshots.filter((snapshot) => snapshot.mediaRhythmStatus.shouldSlowPostingDueToMedia).length,
    needingConfirmation: snapshots.filter((snapshot) => snapshot.clientConfirmationStatus === "needed" || snapshot.onboardingStatus.itemsRequiringConfirmation.length > 0).length,
    readyForManualExecution: snapshots.filter((snapshot) => snapshot.manualExecutionStatus === "ready_for_manual_execution").length,
    atRiskOrBlocked: snapshots.filter((snapshot) => ["urgent", "blocked", "paused", "review_needed"].includes(snapshot.serviceHealthStatus)).length,
  };
}

export function getFirstClientOpsTopActions(limit = 3, snapshots: readonly FirstClientOperatingSnapshot[] = firstClientOperatingSnapshots) {
  const ranked = [...snapshots].sort((a, b) => {
    const priority = (snapshot: FirstClientOperatingSnapshot) =>
      (snapshot.mediaRhythmStatus.shouldSlowPostingDueToMedia ? 30 : 0) +
      (snapshot.clientConfirmationStatus === "needed" ? 25 : 0) +
      (snapshot.monthlyReportStatus.status === "draft_ready" ? 15 : 0) +
      (snapshot.weeklyUpdateStatus.status === "draft_ready" ? 10 : 0) +
      (snapshot.manualExecutionStatus === "ready_for_manual_execution" ? 20 : 0);
    return priority(b) - priority(a);
  });
  return ranked.slice(0, limit).map((snapshot) => ({
    clientId: snapshot.clientId,
    restaurantName: snapshot.restaurantName,
    action: snapshot.nextBestAction,
    stage: snapshot.lifecycleStage,
  }));
}
