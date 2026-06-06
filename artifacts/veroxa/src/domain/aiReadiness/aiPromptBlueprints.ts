// Dormant readiness only — no live AI call is made here.

import type { AiPromptBlueprint, AiReadinessAssistantType } from "./types";

const blockedClaims = [
  "guaranteed orders, customers, walk-ins, rankings, revenue, profit, ROI, or growth",
  "generated sales or extra new sales claims",
  "$9,900, requiredDailyOrders, margin, break-even, or profit math",
  "automatic publishing, live execution, or platform changes",
  "invented discounts, BOGO offers, price cuts, lower prices, or new promotions",
];

const clientSafeLanguageRules = [
  "Use calm client-safe wording such as Prepared by Veroxa, In review, Needs your input, or Included in report.",
  "Do not mention AI internals, OpenAI, backend, connector, raw scoring, or internal proof math on client-visible surfaces.",
  "Clearly say when data is limited or confirmation is needed.",
];

const businessTruthRules = [
  "Require confirmation for hours, holiday hours, menu items, prices, offers, ordering links, dietary claims, and sensitive replies.",
  "Never invent restaurant facts or promotional terms.",
  "Treat uncertain business details as blockers until Faraz or the client confirms them.",
];

function baseBlueprint(assistantType: AiReadinessAssistantType): Pick<AiPromptBlueprint, "blockedClaims" | "clientSafeLanguageRules" | "businessTruthRules" | "futureActivationNotes"> & { assistantType: AiReadinessAssistantType } {
  return {
    assistantType,
    blockedClaims,
    clientSafeLanguageRules,
    businessTruthRules,
    futureActivationNotes: [
      "Future activation requires RR approval before implementation or wiring.",
      "Future activation requires production auth, database/storage architecture, logs, rollback plan, QA, and guardrails.",
      "This blueprint is not a prompt execution path and is not connected to UI or automation.",
    ],
  };
}

export function buildMediaReviewPromptBlueprint(): AiPromptBlueprint {
  return {
    ...baseBlueprint("media_review"),
    purpose: "Suggest how useful reviewed media may be and what to ask the client for next.",
    allowedInputs: ["media type", "category", "quality notes", "best use", "warnings", "client-safe summary"],
    forbiddenInputs: ["private customer data", "unreviewed claims", "live platform credentials"],
    requiredContext: ["media category", "quality status", "known warnings", "current launch scope"],
    outputShape: ["usefulness suggestion", "next client ask", "possible content direction", "blocked reasons"],
    reviewGate: ["veroxa_team_review", "faraz_review"],
    existingServerRouteMapping: "No direct current mapping; existing openAiDrafts.ts can draft content_angle only if routes and key are enabled later.",
  };
}

export function buildCaptionDraftPromptBlueprint(): AiPromptBlueprint {
  return {
    ...baseBlueprint("caption_draft"),
    purpose: "Prepare 2-3 caption options from confirmed restaurant/media context for later human review.",
    allowedInputs: ["restaurant name", "confirmed item", "confirmed offer if any", "brand tone", "platform", "media context"],
    forbiddenInputs: ["unconfirmed offers", "unconfirmed prices", "unconfirmed dietary or health claims", "unconfirmed hours", "unconfirmed menu items"],
    requiredContext: ["confirmed item", "platform", "media context", "business-truth confirmation state"],
    outputShape: ["2-3 caption drafts", "business-truth needs", "blocked reasons"],
    reviewGate: ["veroxa_team_review", "faraz_review", "business_truth_confirmation"],
    existingServerRouteMapping: "Related to existing caption_drafts in openAiDrafts.ts; this contract remains dormant and stricter.",
  };
}

export function buildWeeklyUpdatePromptBlueprint(): AiPromptBlueprint {
  return {
    ...baseBlueprint("weekly_update_draft"),
    purpose: "Draft a weekly client update from confirmed completed work, pending work, media needs, and next focus.",
    allowedInputs: ["completed work", "prepared work", "pending items", "requests answered", "media needed", "confirmations needed", "next week focus"],
    forbiddenInputs: ["fake metrics", "guaranteed outcomes", "unreviewed sensitive claims"],
    requiredContext: ["week label", "reviewed work records", "known blockers", "next week focus"],
    outputShape: ["weekly update draft", "missing inputs", "blocked reasons"],
    reviewGate: ["veroxa_team_review", "faraz_review"],
    existingServerRouteMapping: "Related to existing client_update in openAiDrafts.ts; future use needs RR approval and logs.",
  };
}

export function buildMonthlyReportPromptBlueprint(): AiPromptBlueprint {
  return {
    ...baseBlueprint("monthly_report_draft"),
    purpose: "Draft a monthly report from reviewed activity, limitations, action signals, and next-month focus.",
    allowedInputs: ["handled work", "Google/Maps/local search progress", "website alignment", "Facebook/Instagram progress", "media used", "media learnings", "reach/action signals", "limitations", "next month focus"],
    forbiddenInputs: ["$9,900", "requiredDailyOrders", "margin", "profit math", "generated-sales claims", "fake metrics"],
    requiredContext: ["confirmed work handled", "known data limitations", "enough-data flag", "next month focus"],
    outputShape: ["monthly report draft", "data limitations", "blocked reasons"],
    reviewGate: ["veroxa_team_review", "faraz_review"],
    existingServerRouteMapping: "Related to existing report_summary in openAiDrafts.ts; this blueprint adds proof-math and data-limit rules.",
  };
}

export function buildRequestClassificationPromptBlueprint(): AiPromptBlueprint {
  return {
    ...baseBlueprint("request_classification"),
    purpose: "Suggest a portal request classification while deferring to packageBoundary domain rules.",
    allowedInputs: ["request title", "request message", "current plan"],
    forbiddenInputs: ["payment details", "checkout instructions", "automatic upgrades", "unapproved add-on charges"],
    requiredContext: ["current launch offer", "packageBoundary rules", "coming-soon list", "not-included list"],
    outputShape: ["suggested classification", "packageBoundary rule", "review needs", "blocked reasons"],
    reviewGate: ["veroxa_team_review", "faraz_review", "client_confirmation"],
    existingServerRouteMapping: "No direct current mapping; openAiDrafts.ts does not classify package boundaries.",
  };
}

export function buildInternalQaPromptBlueprint(): AiPromptBlueprint {
  return {
    ...baseBlueprint("internal_qa"),
    purpose: "Produce an internal checklist of copy/policy issues for Faraz to review.",
    allowedInputs: ["draft copy", "target surface", "risk flags", "policy boundaries"],
    forbiddenInputs: ["commands to alter public/client copy automatically", "live execution requests", "credentials"],
    requiredContext: ["target surface", "known policy boundaries", "reviewer decision owner"],
    outputShape: ["QA checklist", "risk summary", "blocked reasons"],
    reviewGate: ["veroxa_team_review", "faraz_review"],
    existingServerRouteMapping: "No direct current mapping; this is a future review layer around all drafts.",
  };
}

export function buildAiPromptBlueprint(assistantType: AiReadinessAssistantType): AiPromptBlueprint {
  switch (assistantType) {
    case "media_review":
      return buildMediaReviewPromptBlueprint();
    case "caption_draft":
      return buildCaptionDraftPromptBlueprint();
    case "weekly_update_draft":
      return buildWeeklyUpdatePromptBlueprint();
    case "monthly_report_draft":
      return buildMonthlyReportPromptBlueprint();
    case "request_classification":
      return buildRequestClassificationPromptBlueprint();
    case "internal_qa":
      return buildInternalQaPromptBlueprint();
  }
}
