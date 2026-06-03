import type { ActionSignalConfidence } from "@/domain/onlineInfluencedActions";
import {
  evaluateVeroxaProfitValidation,
  formatVeroxaProfitValidation,
  type VeroxaValidationPhase,
  type VeroxaValidationStatus,
} from "@/domain/profitValidation";
import type { RestaurantId, SaasDataMode } from "./saasTypes";

export interface ProfitValidationSnapshotRecord {
  id: string;
  restaurantId: RestaurantId;
  dataMode: SaasDataMode;
  daysSinceStart?: number;
  monthlyFee: number;
  averageTicket?: number;
  estimatedNetMargin?: number;
  onlineInfluencedActionsPerDay?: number;
  trackingConfidence?: ActionSignalConfidence;
  requiredOrdersPerDay: number;
  starterMinimumTarget: number;
  validationPhase: VeroxaValidationPhase;
  validationStatus: VeroxaValidationStatus;
  createdAt: string;
}

export interface BuildProfitValidationSnapshotInput {
  restaurantId: RestaurantId;
  dataMode?: SaasDataMode;
  daysSinceStart?: number;
  monthlyFee: number;
  averageTicket?: number;
  estimatedNetMargin?: number;
  onlineInfluencedActionsPerDay?: number;
  hasCapacityForMoreOrders?: boolean;
  trackingConfidence?: ActionSignalConfidence;
  createdAt?: string;
}

// Internal/team-only future persistence hook. This creates a deterministic
// record shape but does not write to a database, API, storage, or connector.
export function buildProfitValidationSnapshot(
  input: BuildProfitValidationSnapshotInput,
): ProfitValidationSnapshotRecord {
  const result = evaluateVeroxaProfitValidation(input);
  return {
    id: `profit-validation-${input.restaurantId}-${input.createdAt ?? "preview"}`,
    restaurantId: input.restaurantId,
    dataMode: input.dataMode ?? "placeholder_review",
    daysSinceStart: input.daysSinceStart,
    monthlyFee: input.monthlyFee,
    averageTicket: input.averageTicket,
    estimatedNetMargin: input.estimatedNetMargin,
    onlineInfluencedActionsPerDay: input.onlineInfluencedActionsPerDay,
    trackingConfidence: input.trackingConfidence,
    requiredOrdersPerDay: result.requiredOrdersPerDay,
    starterMinimumTarget: result.starterMinimumTarget,
    validationPhase: result.phase,
    validationStatus: result.status,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function formatProfitValidationSnapshot(
  record: ProfitValidationSnapshotRecord,
): string {
  return formatVeroxaProfitValidation({
    phase: record.validationPhase,
    status: record.validationStatus,
    requiredOrdersPerDay: record.requiredOrdersPerDay,
    currentOnlineInfluencedActionsPerDay: record.onlineInfluencedActionsPerDay,
    starterMinimumTarget: record.starterMinimumTarget,
    headline: `Internal profit validation snapshot is ${record.validationStatus.replaceAll("_", " ")}.`,
    nextAction: "Use this as a team-only persistence preview; do not expose exact proof math to clients.",
    internalOnlyDisclaimer:
      "Internal only Veroxa planning model for online-influenced orders/actions. This is not public/client-facing guarantee language and does not promise exact attribution, orders, profit, revenue, ROI, rankings, customers, or walk-ins.",
  });
}
