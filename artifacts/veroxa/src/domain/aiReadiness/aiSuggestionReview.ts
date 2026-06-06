// Dormant readiness only — no live AI call is made here.

import type { AiClientVisibilityValidationResult, AiReadinessSuggestion, AiReviewRequirement } from "./types";

const clientVisibilityReviewOrder: AiReviewRequirement[] = [
  "blocked",
  "business_truth_confirmation",
  "client_confirmation",
  "faraz_review",
  "veroxa_team_review",
];

const forbiddenProofMathPatterns = [
  /\$9,?900/i,
  /requiredDailyOrders/i,
  /net margin/i,
  /profit math/i,
  /break[- ]even/i,
  /5% margin/i,
];

const guaranteedOutcomePatterns = [
  /guarantee(?:d|s)?\s+(?:orders|customers|revenue|rankings|walk-ins|roi|profit|growth)/i,
  /will\s+(?:increase|grow|drive|generate)\s+(?:orders|customers|revenue|walk-ins|profit)/i,
  /generated\s+sales/i,
  /extra\s+new\s+sales/i,
];

const liveExecutionPatterns = [
  /publish(?:ed|es)?\s+automatically/i,
  /automatic(?:ally)?\s+publish/i,
  /live\s+(?:publishing|execution|connector|integration)/i,
  /customer-visible automated execution/i,
];

const unconfirmedBusinessTruthPatterns = [
  /\b(?:offer|discount|bogo|price|prices|\$\d+|halal|organic|healthy|health claim|holiday hours|menu item)\b/i,
];

function suggestionText(suggestion: AiReadinessSuggestion): string {
  return JSON.stringify(suggestion).toLowerCase();
}

function firstRequiredReview(requiredReviews: AiReviewRequirement[]): AiReviewRequirement | null {
  for (const review of clientVisibilityReviewOrder) {
    if (requiredReviews.includes(review)) return review;
  }
  return null;
}

export function validateAiSuggestionForClientVisibility(
  suggestion: AiReadinessSuggestion,
): AiClientVisibilityValidationResult {
  const reasons: string[] = [];
  const text = suggestionText(suggestion);

  if (suggestion.visibility !== "client_visible_after_review") {
    reasons.push(`Suggestion visibility is ${suggestion.visibility}.`);
  }

  if (suggestion.requiredReviews.length > 0) {
    reasons.push("Required reviews are still present.");
  }

  if (suggestion.requiredReviews.includes("business_truth_confirmation")) {
    reasons.push("Business-truth confirmation is required before client visibility.");
  }

  if (suggestion.blockedReasons.length > 0) {
    reasons.push("Blocked reasons must be resolved before client visibility.");
  }

  if (unconfirmedBusinessTruthPatterns.some((pattern) => pattern.test(text))) {
    const hasConfirmation =
      text.includes("confirmed") &&
      !suggestion.requiredReviews.includes("business_truth_confirmation") &&
      !suggestion.blockedReasons.some((reason) => /confirm/i.test(reason));
    if (!hasConfirmation) {
      reasons.push("Suggestion references offers, discounts, prices, or claims without clear confirmation.");
    }
  }

  if (forbiddenProofMathPatterns.some((pattern) => pattern.test(text))) {
    reasons.push("Suggestion contains forbidden internal proof math terms.");
  }

  if (guaranteedOutcomePatterns.some((pattern) => pattern.test(text))) {
    reasons.push("Suggestion implies guaranteed outcomes or generated-sales claims.");
  }

  if (liveExecutionPatterns.some((pattern) => pattern.test(text))) {
    reasons.push("Suggestion implies live publishing or automatic execution.");
  }

  return {
    canShowToClient: reasons.length === 0,
    reasons,
    requiredNextReview: firstRequiredReview(suggestion.requiredReviews),
  };
}
