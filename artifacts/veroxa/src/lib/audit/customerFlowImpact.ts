/**
 * customerFlowImpact.ts — M026B
 *
 * Customer-flow framework: Visibility → Trust → Reminder → Action → Retention.
 * Veroxa improves the *online conditions and daily opportunities* that
 * influence customer flow. It does not guarantee customer influx.
 */

import type {
  AuditCategoryId,
  AuditCustomerFlowImpact,
  AuditCustomerFlowStage,
  AuditGrade,
} from "./auditTypes";

export const CUSTOMER_FLOW_STAGES: AuditCustomerFlowImpact[] = [
  {
    stage: "visibility",
    stageLabel: "Visibility",
    stageDescription: "Can people find you?",
    veroxaHelps:
      "Veroxa improves Google search visibility, Maps presence, fresh photos, local keywords, and consistent posting.",
    possibleIndicators: [
      "Google profile views",
      "search impressions",
      "direction clicks",
      "website/menu clicks",
    ],
  },
  {
    stage: "trust",
    stageLabel: "Trust",
    stageDescription: "Do people feel confident choosing you?",
    veroxaHelps:
      "Veroxa improves reviews, review responses, fresh content, clear menu, strong photos, and a professional online presence.",
    possibleIndicators: [
      "review engagement",
      "photo views",
      "profile interactions",
      "lower customer confusion",
    ],
  },
  {
    stage: "reminder",
    stageLabel: "Reminder",
    stageDescription: "Do people remember you when they are hungry?",
    veroxaHelps:
      "Veroxa improves social posting consistency, Reels/TikToks, weekly specials, lunch/dinner reminders, and catering reminders.",
    possibleIndicators: [
      "post reach",
      "engagement",
      "messages",
      "repeat profile visits",
    ],
  },
  {
    stage: "action",
    stageLabel: "Action",
    stageDescription:
      "Can customers quickly call, visit, order, reserve, or inquire?",
    veroxaHelps:
      "Veroxa improves CTA clarity, menu visibility, hours/location clarity, offer clarity, Google buttons, and social links.",
    possibleIndicators: [
      "calls",
      "direction clicks",
      "website clicks",
      "online order clicks",
      "reservation clicks",
      "catering inquiries",
    ],
  },
  {
    stage: "retention",
    stageLabel: "Retention",
    stageDescription: "Do customers come back?",
    veroxaHelps:
      "Veroxa improves weekly reminders, new item/special campaigns, review-based trust, customer education, and seasonal content.",
    possibleIndicators: [
      "repeat engagement",
      "returning customers mentioning posts",
      "repeat orders",
      "event/catering inquiries",
    ],
  },
];

const CATEGORY_TO_STAGE: Record<AuditCategoryId, AuditCustomerFlowStage> = {
  search_visibility_readiness: "visibility",
  google_maps_conversion_readiness: "action",
  social_reminder_system: "reminder",
  content_persuasion_quality: "trust",
  action_path_clarity: "action",
  review_trust_strength: "trust",
  growth_leverage_opportunity: "retention",
};

export function getCustomerFlowStageExplanation(
  stage: AuditCustomerFlowStage,
): AuditCustomerFlowImpact {
  const found = CUSTOMER_FLOW_STAGES.find((s) => s.stage === stage);
  if (!found) throw new Error(`Unknown customer flow stage: ${stage}`);
  return found;
}

export function getCategoryCustomerFlowImpact(
  categoryId: AuditCategoryId,
): AuditCustomerFlowImpact {
  return getCustomerFlowStageExplanation(CATEGORY_TO_STAGE[categoryId]);
}

export function getScoreMeaningByGrade(grade: AuditGrade): string {
  switch (grade) {
    case "strong_foundation":
      return "Your online presence is well prepared to help customers find, trust, remember, and choose your restaurant. Most weak spots are about consistency rather than missing fundamentals.";
    case "good_missed_consistency":
      return "Your foundation is in place, but consistency gaps may be quietly reducing daily customer-flow opportunities.";
    case "clear_gap":
      return "There are clear gaps in how prepared your online presence is to convert searchers, remind regulars, and guide action. A focused system would likely change daily customer-flow conditions.";
    case "underbuilt":
      return "Several core pieces of an online customer-flow system are missing or weak. Fixing the foundation comes before pushing reach or ads.";
    case "foundational_problem":
      return "The basic online foundation customers rely on to find, trust, and choose a restaurant is not yet in place. This is the most impactful place to start.";
  }
}
