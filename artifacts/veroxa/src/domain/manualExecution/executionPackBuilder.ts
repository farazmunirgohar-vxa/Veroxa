import type {
  BuildManualExecutionPacksInput,
  GroupedManualExecutionPacks,
  ManualExecutionInputWorkItem,
  ManualExecutionPack,
  ManualExecutionPlatform,
  ManualExecutionRiskTone,
  ManualExecutionType,
} from "./types";
import {
  getManualPublishingBlockers,
  getManualPublishingChecklist,
} from "./manualPublishingTracker";
import {
  isClientConfirmationPending,
  isClientConfirmationRejected,
  requiresClientConfirmation,
} from "./clientConfirmationWorkflow";

const createdAt = "2026-06-03T00:00:00.000Z";

const sampleWorkItems: readonly ManualExecutionInputWorkItem[] = [
  {
    id: "wf-002",
    clientId: "demo-a",
    title: "Chef plating clip (Reel)",
    type: "media",
    stage: "media_accepted",
    priority: "normal",
    dueLabel: "This week",
  },
  {
    id: "visibility-001",
    clientId: "demo-a",
    title: "Google profile freshness update",
    type: "visibility",
    stage: "ready",
    priority: "high",
    dueLabel: "Today",
  },
  {
    id: "wf-005",
    clientId: "demo-a",
    title: "Weekend family offer detail",
    type: "draft",
    stage: "draft_ready",
    priority: "normal",
    dueLabel: "Tomorrow",
  },
  {
    id: "wf-003",
    clientId: "demo-a",
    title: "Storefront wide shot",
    type: "media",
    stage: "needs_better_photo",
    priority: "high",
    dueLabel: "By Friday",
  },
  {
    id: "wf-011",
    clientId: "demo-a",
    title: "Weekly performance summary",
    type: "report",
    stage: "draft_needed",
    priority: "normal",
    dueLabel: "Fri 5pm",
  },
  {
    id: "premium-001",
    clientId: "demo-e",
    title: "Premium readiness review",
    type: "premium",
    stage: "assessment_needed",
    priority: "normal",
    dueLabel: "Later",
  },
];

const defaultRestaurantNames: Record<string, string> = {
  "demo-a": "Review demo restaurant",
  "demo-b": "Low-media benchmark restaurant",
  "demo-c": "Growth media benchmark restaurant",
  "demo-d": "Inconsistent-upload benchmark restaurant",
  "demo-e": "Premium assessment benchmark restaurant",
};

function basePack(
  item: ManualExecutionInputWorkItem,
  restaurantNameByClientId: Record<string, string>,
): Omit<
  ManualExecutionPack,
  | "platform"
  | "executionType"
  | "title"
  | "clientSafeSummary"
  | "teamInstructions"
  | "copyPasteCaption"
  | "copyPasteGoogleUpdate"
  | "copyPasteHashtags"
  | "suggestedMediaUse"
  | "suggestedPublishWindow"
  | "businessTruthItemsToConfirm"
  | "riskFlags"
  | "approvalStatus"
  | "confirmationStatus"
  | "manualPublishStatus"
  | "blockedReason"
  | "nextAction"
> {
  return {
    id: `manual-pack-${item.id}`,
    sourceWorkItemId: item.id,
    clientId: item.clientId,
    restaurantName:
      restaurantNameByClientId[item.clientId] ?? "Review benchmark restaurant",
    planFit:
      item.type === "premium"
        ? "premium_candidate"
        : item.clientId === "demo-a"
          ? "growth"
          : "review_only",
    createdAt,
    updatedAt: createdAt,
  };
}

function buildPackForItem(
  item: ManualExecutionInputWorkItem,
  restaurantNameByClientId: Record<string, string>,
): ManualExecutionPack {
  const base = basePack(item, restaurantNameByClientId);

  if (item.type === "visibility") {
    return {
      ...base,
      platform: "google_business_profile",
      executionType: "google_update",
      title: "Google profile freshness update",
      clientSafeSummary:
        "Prepared by Veroxa: visibility update for team review.",
      teamInstructions:
        "Copy/paste execution pack for a manual Google update. Verify profile access and business facts first.",
      copyPasteGoogleUpdate:
        "Fresh from the kitchen this week: a simple highlight of guest favorites and updated food photos. Check today’s menu before visiting or ordering.",
      copyPasteHashtags: [
        "#LocalRestaurant",
        "#FreshFood",
        "#NeighborhoodFavorite",
      ],
      suggestedMediaUse:
        "Use a current food photo that the client already provided and Faraz reviewed.",
      suggestedPublishWindow: item.dueLabel ?? "Today after team review",
      businessTruthItemsToConfirm: [],
      riskFlags: ["platform_access_needed"],
      approvalStatus: "ready_to_copy",
      confirmationStatus: "not_required",
      manualPublishStatus: "ready_for_manual_execution",
      nextAction: "Ready to copy after Faraz verifies manual platform access.",
    };
  }

  if (
    item.type === "draft" &&
    /offer|promo|special|menu|hours/i.test(item.title)
  ) {
    return {
      ...base,
      platform: "instagram",
      executionType: "social_post",
      title: "Offer/menu detail confirmation pack",
      clientSafeSummary:
        "Needs your confirmation before Veroxa prepares this update.",
      teamInstructions:
        "Business-truth confirmation required. Hold until client confirms the exact offer/menu detail.",
      copyPasteCaption:
        "Weekend family meal idea: bring everyone together around a shareable favorite. Please confirm the exact offer/menu detail before this is used.",
      copyPasteHashtags: ["#FamilyMeal", "#LocalFood", "#DinnerIdea"],
      suggestedMediaUse:
        "Use reviewed food media only after the offer/menu detail is confirmed.",
      suggestedPublishWindow: item.dueLabel ?? "Hold until client confirms",
      businessTruthItemsToConfirm: [
        "Exact offer/menu detail",
        "Whether any discount, price, or date limit is mentioned",
      ],
      riskFlags: [
        "needs_business_truth_confirmation",
        "sensitive_offer_or_discount",
      ],
      approvalStatus: "needs_client_confirmation",
      confirmationStatus: "required",
      manualPublishStatus: "not_ready",
      blockedReason:
        "Business detail needs confirmation before manual execution.",
      nextAction: "Hold until client confirms the exact business detail.",
    };
  }

  if (
    item.type === "media" &&
    /better|storefront/i.test(`${item.stage} ${item.title}`)
  ) {
    return {
      ...base,
      platform: "instagram",
      executionType: "social_post",
      title: "Storefront media hold pack",
      clientSafeSummary:
        "More media needed before this can be prepared for posting.",
      teamInstructions:
        "Do not copy for posting yet. Ask client for a clearer storefront photo before manual execution.",
      copyPasteCaption: "",
      copyPasteHashtags: [],
      suggestedMediaUse:
        "Request a clearer storefront photo with good lighting and no obstructions.",
      suggestedPublishWindow: "Hold for later",
      businessTruthItemsToConfirm: [],
      riskFlags: ["missing_media", "low_media_quality"],
      approvalStatus: "held_for_later",
      confirmationStatus: "not_required",
      manualPublishStatus: "blocked",
      blockedReason: "More media needed before manual execution.",
      nextAction: "Ask client for better storefront media.",
    };
  }

  if (item.type === "report") {
    return {
      ...base,
      platform: "internal_report",
      executionType: "weekly_update",
      title: "Weekly update report draft pack",
      clientSafeSummary: "Included in next report after Veroxa team review.",
      teamInstructions:
        "Prepare a calm weekly update. Do not invent metrics; include only reviewed work and honest next steps.",
      copyPasteCaption:
        "Weekly Veroxa update: reviewed media, prepared visibility notes, and next steps are ready for team review. Items needing client confirmation will be separated before anything goes live.",
      copyPasteHashtags: [],
      suggestedMediaUse:
        "Reference reviewed media only; no proof upload is connected.",
      suggestedPublishWindow: item.dueLabel ?? "Friday report review",
      businessTruthItemsToConfirm: [],
      riskFlags: [],
      approvalStatus: "ready_to_copy",
      confirmationStatus: "not_required",
      manualPublishStatus: "ready_for_manual_execution",
      nextAction: "Copy into the draft report manually after Faraz review.",
    };
  }

  if (item.type === "premium") {
    return {
      ...base,
      platform: "internal_report",
      executionType: "premium_readiness_review",
      title: "Premium readiness assessment pack",
      clientSafeSummary:
        "Premium readiness requires assessment, client approval, and an agreed ad budget.",
      teamInstructions:
        "Premium is not automatic. Review readiness, ask client before any ad-related planning, and keep ad spend separate.",
      copyPasteCaption:
        "Premium readiness note: this account needs a Veroxa readiness assessment, client approval, and an agreed ad budget before any advanced support is considered.",
      copyPasteHashtags: [],
      suggestedMediaUse:
        "Use only reviewed account context; no live ad account is connected.",
      suggestedPublishWindow: "Hold for later after assessment",
      businessTruthItemsToConfirm: [
        "Client approval for Premium readiness discussion",
        "Agreed ad budget if Premium support is later approved",
      ],
      riskFlags: ["premium_ads_requires_approval", "platform_access_needed"],
      approvalStatus: "needs_client_confirmation",
      confirmationStatus: "required",
      manualPublishStatus: "not_ready",
      blockedReason:
        "Premium readiness requires assessment, client approval, and an agreed ad budget.",
      nextAction:
        "Hold until readiness assessment and client approval are complete.",
    };
  }

  return {
    ...base,
    platform: inferPlatform(item),
    executionType: inferExecutionType(item),
    title: `${item.title} manual execution pack`,
    clientSafeSummary: "Prepared by Veroxa for team review.",
    teamInstructions:
      "Review the copy, verify media, then copy manually if still appropriate. Not connected to live publishing.",
    copyPasteCaption:
      "A fresh look from the kitchen: simple, appetizing, and ready for team review before any manual posting.",
    copyPasteHashtags: [
      "#LocalFood",
      "#RestaurantUpdate",
      "#FreshFromTheKitchen",
    ],
    suggestedMediaUse:
      "Use the reviewed client-provided media tied to this work item.",
    suggestedPublishWindow: item.dueLabel ?? "Next reviewed posting window",
    businessTruthItemsToConfirm: [],
    riskFlags: ["platform_access_needed"],
    approvalStatus: "ready_to_copy",
    confirmationStatus: "not_required",
    manualPublishStatus: "ready_for_manual_execution",
    nextAction: "Ready to copy after Faraz review.",
  };
}

function inferPlatform(
  item: ManualExecutionInputWorkItem,
): ManualExecutionPlatform {
  if (item.type === "visibility") return "google_business_profile";
  if (item.type === "report") return "internal_report";
  if (item.title.toLowerCase().includes("tiktok")) return "tiktok";
  if (item.title.toLowerCase().includes("facebook")) return "facebook";
  return "instagram";
}

function inferExecutionType(
  item: ManualExecutionInputWorkItem,
): ManualExecutionType {
  if (item.type === "report") return "weekly_update";
  if (item.type === "visibility") return "profile_cleanup";
  if (item.type === "request") return "best_seller_visibility";
  return "social_post";
}

export function buildManualExecutionPacks(
  input: BuildManualExecutionPacksInput = {},
): readonly ManualExecutionPack[] {
  const restaurantNameByClientId = {
    ...defaultRestaurantNames,
    ...input.restaurantNameByClientId,
  };
  return (input.workItems ?? sampleWorkItems).map((item) =>
    buildPackForItem(item, restaurantNameByClientId),
  );
}

export function getExecutionPackPriority(pack: ManualExecutionPack): number {
  if (pack.approvalStatus === "needs_client_confirmation") return 90;
  if (pack.approvalStatus === "ready_to_copy") return 80;
  if (pack.manualPublishStatus === "blocked") return 70;
  if (pack.approvalStatus === "held_for_later") return 50;
  if (pack.approvalStatus === "manually_completed") return 20;
  return 40;
}

export function getExecutionPackReadinessLabel(
  pack: ManualExecutionPack,
): string {
  if (isClientConfirmationRejected(pack)) return "Needs revision";
  if (isClientConfirmationPending(pack) && requiresClientConfirmation(pack))
    return "Needs client confirmation";
  if (
    pack.confirmationStatus === "confirmed" &&
    pack.approvalStatus === "needs_client_confirmation"
  )
    return "Ready for team review";
  if (pack.approvalStatus === "ready_to_copy") return "Ready to copy";
  if (pack.approvalStatus === "held_for_later") return "Hold for later";
  if (pack.approvalStatus === "manually_completed")
    return "Manually completed preview";
  if (pack.approvalStatus === "not_recommended") return "Not recommended";
  return "Team review required";
}

export function getExecutionPackNextAction(pack: ManualExecutionPack): string {
  const blockers = getManualPublishingBlockers(pack);
  if (blockers.length > 0) return blockers[0];
  if (isClientConfirmationRejected(pack))
    return "Revise this pack before manual execution.";
  if (isClientConfirmationPending(pack) && requiresClientConfirmation(pack))
    return "Hold until client confirms.";
  if (
    pack.confirmationStatus === "confirmed" &&
    /hold until client confirms/i.test(pack.nextAction)
  )
    return "Client confirmed; ready for Veroxa team review before manual execution.";
  return pack.nextAction;
}

export function getExecutionPackRiskTone(
  pack: ManualExecutionPack,
): ManualExecutionRiskTone {
  if (isClientConfirmationRejected(pack)) return "danger";
  if (pack.riskFlags.includes("no_usable_action")) return "danger";
  if (
    pack.riskFlags.includes("missing_media") ||
    pack.riskFlags.includes("low_media_quality")
  )
    return "warning";
  if (isClientConfirmationPending(pack) && requiresClientConfirmation(pack))
    return "warning";
  if (pack.confirmationStatus === "confirmed") return "success";
  if (pack.approvalStatus === "ready_to_copy") return "success";
  return "info";
}

export function groupExecutionPacksByStatus(
  packs: readonly ManualExecutionPack[],
): GroupedManualExecutionPacks {
  return {
    readyToCopy: packs.filter(
      (pack) =>
        pack.approvalStatus === "ready_to_copy" ||
        (pack.approvalStatus === "needs_client_confirmation" &&
          pack.confirmationStatus === "confirmed"),
    ),
    needsClientConfirmation: packs.filter(
      (pack) =>
        isClientConfirmationPending(pack) && requiresClientConfirmation(pack),
    ),
    needsMediaOrContext: packs.filter(
      (pack) =>
        isClientConfirmationRejected(pack) ||
        pack.manualPublishStatus === "blocked" ||
        pack.riskFlags.includes("missing_media") ||
        pack.riskFlags.includes("insufficient_context"),
    ),
    heldForLater: packs.filter(
      (pack) => pack.approvalStatus === "held_for_later",
    ),
    completedPreview: packs.filter(
      (pack) =>
        pack.approvalStatus === "manually_completed" ||
        pack.manualPublishStatus === "manually_logged",
    ),
  };
}

export function filterExecutionPacksForLaunchGate(
  packs: readonly ManualExecutionPack[],
): readonly ManualExecutionPack[] {
  return packs.filter((pack) => pack.approvalStatus !== "not_recommended");
}

export function buildCopyPasteExecutionBlock(
  pack: ManualExecutionPack,
): string {
  const verifyItems = [
    ...(pack.businessTruthItemsToConfirm.length > 0
      ? pack.businessTruthItemsToConfirm
      : ["No extra client business detail currently listed."]),
    ...getManualPublishingBlockers(pack),
  ];
  return [
    "COPY/PASTE EXECUTION PACK — Manual execution only",
    `Client / restaurant: ${pack.restaurantName}`,
    `Platform: ${pack.platform.replaceAll("_", " ")}`,
    `What to do manually: ${pack.teamInstructions}`,
    `Caption/update copy: ${pack.copyPasteCaption || pack.copyPasteGoogleUpdate || "No public copy recommended yet."}`,
    `Suggested media: ${pack.suggestedMediaUse}`,
    `Suggested timing: ${pack.suggestedPublishWindow}`,
    `Client confirmation required: ${isClientConfirmationPending(pack) && requiresClientConfirmation(pack) ? "Yes — pending" : pack.confirmationStatus === "confirmed" ? "Confirmed" : isClientConfirmationRejected(pack) ? "Rejected — revise" : "No"}`,
    `Items to verify before posting: ${verifyItems.join("; ")}`,
    `Manual log checklist: ${getManualPublishingChecklist(pack).join(" | ")}`,
    "Safe note: This is prepared work and not auto-posted. This does not publish anything automatically.",
  ].join("\n");
}
