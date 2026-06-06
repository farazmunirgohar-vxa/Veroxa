// Dormant readiness only — no live AI call is made here.

import { getAiBlockedBehaviorList, getAiHumanReviewRequirements, getAiReadinessAssistantCatalog } from "./aiReadinessContracts";
import { buildAiPromptBlueprint } from "./aiPromptBlueprints";
import type { AiReadinessAssistantType } from "./types";

export interface AiReadinessSummary {
  status: "dormant_readiness_only";
  liveAiActive: false;
  liveAutomationActive: false;
  protectedServerAiInventoryDocumented: boolean;
  assistantCount: number;
  assistantTypes: AiReadinessAssistantType[];
  reviewRequirements: string[];
  blockedBehaviors: string[];
  opsSummary: string;
}

export function summarizeAiReadinessForOps(): string {
  return "AI readiness is documented as dormant prompt contracts, review gates, validation rules, and guardrails only. No live AI, automation, production auth, database/storage, payments, connectors, webhooks, cron, or background jobs are active.";
}

export function buildAiReadinessSummary(): AiReadinessSummary {
  const catalog = getAiReadinessAssistantCatalog();
  return {
    status: "dormant_readiness_only",
    liveAiActive: false,
    liveAutomationActive: false,
    protectedServerAiInventoryDocumented: true,
    assistantCount: catalog.length,
    assistantTypes: catalog.map((item) => item.assistantType),
    reviewRequirements: getAiHumanReviewRequirements(),
    blockedBehaviors: getAiBlockedBehaviorList(),
    opsSummary: summarizeAiReadinessForOps(),
  };
}

export function buildAiReadinessBlueprintSet() {
  return getAiReadinessAssistantCatalog().map((item) => buildAiPromptBlueprint(item.assistantType));
}
