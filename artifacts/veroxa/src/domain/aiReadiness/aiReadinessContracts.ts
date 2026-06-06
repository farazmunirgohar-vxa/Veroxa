// Dormant readiness only — no live AI call is made here.

import type { AiAssistantCatalogItem, AiReviewRequirement } from "./types";

const sharedBlockedBehavior = [
  "No automatic publishing or customer-visible execution.",
  "No invented offers, discounts, prices, menu items, hours, or claims.",
  "No guaranteed outcomes for orders, rankings, revenue, customers, walk-ins, ROI, profit, or growth.",
  "No public/client exposure of internal proof math, requiredDailyOrders, margin, or $9,900 value baselines.",
  "No live platform API actions for Google, Meta, Yelp, TikTok, YouTube, websites, payments, webhooks, cron, or background jobs.",
  "No bypass of Veroxa team review, Faraz review, business-truth confirmation, or client confirmation when required.",
];

export function getAiBlockedBehaviorList(): string[] {
  return [...sharedBlockedBehavior];
}

export function getAiHumanReviewRequirements(): AiReviewRequirement[] {
  return [
    "veroxa_team_review",
    "faraz_review",
    "business_truth_confirmation",
    "client_confirmation",
    "blocked",
  ];
}

export function getAiReadinessAssistantCatalog(): AiAssistantCatalogItem[] {
  return [
    {
      assistantType: "media_review",
      label: "Media Review Assistant",
      status: "dormant",
      futureTrigger: "A reviewed media item needs an internal usefulness suggestion.",
      humanReviewGate: ["veroxa_team_review", "faraz_review"],
      blockedBehavior: sharedBlockedBehavior,
      failureMode: "If media context is incomplete, mark the suggestion low confidence and ask for better media or confirmation.",
      requiredLogsLater: ["input media id", "suggestion id", "reviewer", "decision", "rollback marker"],
      rollbackRequirementLater: "Any surfaced suggestion must be removable from client-facing surfaces without affecting media records.",
      existingServerRouteMapping: "No direct current mapping; openAiDrafts.ts has generic content_angle drafts only.",
    },
    {
      assistantType: "caption_draft",
      label: "Caption Draft Assistant",
      status: "dormant",
      futureTrigger: "Confirmed media and business-truth context need caption options for review.",
      humanReviewGate: ["veroxa_team_review", "faraz_review", "business_truth_confirmation"],
      blockedBehavior: sharedBlockedBehavior,
      failureMode: "If item, offer, price, dietary claim, hours, or platform context is uncertain, block client visibility until confirmation.",
      requiredLogsLater: ["prompt context id", "draft id", "reviewer edits", "approval state", "rollback marker"],
      rollbackRequirementLater: "Drafts must stay editable and removable before any future connector can use them.",
      existingServerRouteMapping: "Related to existing caption_drafts in openAiDrafts.ts, but this contract is dormant and not wired.",
    },
    {
      assistantType: "weekly_update_draft",
      label: "Weekly Update Draft Assistant",
      status: "dormant",
      futureTrigger: "A weekly update has completed work, pending items, and next-week focus ready for drafting.",
      humanReviewGate: ["veroxa_team_review", "faraz_review"],
      blockedBehavior: sharedBlockedBehavior,
      failureMode: "If work records are missing, state what is missing instead of inventing progress or metrics.",
      requiredLogsLater: ["weekly update id", "draft id", "reviewer", "client visibility decision", "rollback marker"],
      rollbackRequirementLater: "Draft text must be replaceable with a manual update before client sharing.",
      existingServerRouteMapping: "Related to existing client_update in openAiDrafts.ts, but this blueprint adds stricter weekly-update fields.",
    },
    {
      assistantType: "monthly_report_draft",
      label: "Monthly Report Draft Assistant",
      status: "dormant",
      futureTrigger: "A monthly report has reviewed activity, limitations, and next-month focus ready for drafting.",
      humanReviewGate: ["veroxa_team_review", "faraz_review"],
      blockedBehavior: sharedBlockedBehavior,
      failureMode: "If data is not enough, clearly say there is not enough data and avoid generated-sales claims.",
      requiredLogsLater: ["monthly report id", "draft id", "source signals", "reviewer", "rollback marker"],
      rollbackRequirementLater: "Report drafts must be revertible to deterministic/manual sections before sharing.",
      existingServerRouteMapping: "Related to existing report_summary in openAiDrafts.ts, but this contract blocks proof-math leakage.",
    },
    {
      assistantType: "request_classification",
      label: "Request Classification Assistant",
      status: "dormant",
      futureTrigger: "A portal request needs a suggested included/add-on/coming-soon/not-included/needs-review classification.",
      humanReviewGate: ["veroxa_team_review", "faraz_review", "client_confirmation"],
      blockedBehavior: sharedBlockedBehavior,
      failureMode: "If package boundary rules are ambiguous, classify as needs_review and defer to packageBoundary domain rules.",
      requiredLogsLater: ["request id", "suggested classification", "packageBoundary rule", "reviewer decision", "rollback marker"],
      rollbackRequirementLater: "Classification suggestions must not mutate request state until manual approval.",
      existingServerRouteMapping: "No direct current mapping; openAiDrafts.ts does not enforce packageBoundary rules.",
    },
    {
      assistantType: "internal_qa",
      label: "Internal QA Assistant",
      status: "dormant",
      futureTrigger: "Draft copy needs an internal checklist before Faraz approves it.",
      humanReviewGate: ["veroxa_team_review", "faraz_review"],
      blockedBehavior: sharedBlockedBehavior,
      failureMode: "If policy boundaries are unclear, return a review checklist and block automatic client output changes.",
      requiredLogsLater: ["target surface", "risk flags", "qa checklist", "reviewer decision", "rollback marker"],
      rollbackRequirementLater: "QA flags must be advisory and removable without altering the underlying copy automatically.",
      existingServerRouteMapping: "No direct current mapping; this is a future QA layer around drafts.",
    },
  ];
}
