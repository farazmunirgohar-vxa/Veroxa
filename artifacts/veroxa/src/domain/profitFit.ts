import {
  VEROXA_PLANS,
  type CurrentPublicPlanId,
} from "@/data/pricing/veroxaPricing";

export const DEFAULT_AVERAGE_TICKET = 15;
export const DEFAULT_NET_MARGIN = 0.05;
export const DAYS_PER_MONTH = 30;

export const PROFIT_FIT_PLAN_MONTHLY_FEES: Record<CurrentPublicPlanId, number> =
  {
    starter: VEROXA_PLANS.starter.priceMonthly,
    growth: VEROXA_PLANS.growth.priceMonthly,
    premium: VEROXA_PLANS.premium.priceMonthly,
  };

export type ProfitFitStatus =
  | "strong_profit_fit"
  | "viable_fit"
  | "volume_dependent_fit"
  | "low_ticket_risk"
  | "not_current_target"
  | "needs_more_info";

export type ProfitFitDependency = "low" | "medium" | "high" | "unknown";

export interface ProfitFitInput {
  monthlyFee: number;
  averageTicket?: number;
  estimatedNetMargin?: number;
  contributionMargin?: number;
  estimatedOnlineInfluencedOrdersPerDay?: number;
  hasCapacityForMoreOrders?: boolean;
  discountDependency?: ProfitFitDependency;
  deliveryAppDependency?: ProfitFitDependency;
  repeatCustomerPotential?: ProfitFitDependency;
}

export interface ProfitFitResult {
  averageTicketUsed: number;
  netMarginUsed: number;
  monthlyFee: number;
  requiredMonthlyRevenue: number;
  requiredOrdersPerMonth: number;
  requiredOrdersPerDay: number;
  estimatedOnlineInfluencedOrdersPerDay?: number;
  estimatedMonthlyOnlineInfluencedRevenue?: number;
  estimatedNetProfitFromOnlineInfluencedOrders?: number;
  estimatedNetProfitAfterVeroxa?: number;
  status: ProfitFitStatus;
  mainRisk: string;
  suggestedNextAction: string;
  internalOnlyDisclaimer: string;
}

const INTERNAL_ONLY_DISCLAIMER =
  "Internal Veroxa planning model only. This is not public/client-facing guidance and does not promise orders, profit, revenue, ROI, rankings, or customers.";

function positiveOrDefault(
  value: number | undefined,
  fallback: number,
): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function normalizeMargin(input: ProfitFitInput): number {
  const margin = input.contributionMargin ?? input.estimatedNetMargin;
  return positiveOrDefault(margin, DEFAULT_NET_MARGIN);
}

function roundOne(n: number): number {
  return Math.round(n * 10) / 10;
}

function roundDollars(n: number): number {
  return Math.round(n);
}

export function calculateBreakEvenOrders(
  input: ProfitFitInput,
): Pick<
  ProfitFitResult,
  | "averageTicketUsed"
  | "netMarginUsed"
  | "monthlyFee"
  | "requiredMonthlyRevenue"
  | "requiredOrdersPerMonth"
  | "requiredOrdersPerDay"
> {
  const monthlyFee = positiveOrDefault(input.monthlyFee, 0);
  const averageTicketUsed = positiveOrDefault(
    input.averageTicket,
    DEFAULT_AVERAGE_TICKET,
  );
  const netMarginUsed = normalizeMargin(input);

  if (monthlyFee <= 0 || averageTicketUsed <= 0 || netMarginUsed <= 0) {
    return {
      averageTicketUsed,
      netMarginUsed,
      monthlyFee,
      requiredMonthlyRevenue: 0,
      requiredOrdersPerMonth: 0,
      requiredOrdersPerDay: 0,
    };
  }

  const requiredMonthlyRevenue = monthlyFee / netMarginUsed;
  const requiredOrdersPerMonth = requiredMonthlyRevenue / averageTicketUsed;
  const requiredOrdersPerDay = requiredOrdersPerMonth / DAYS_PER_MONTH;

  return {
    averageTicketUsed,
    netMarginUsed,
    monthlyFee,
    requiredMonthlyRevenue: roundDollars(requiredMonthlyRevenue),
    requiredOrdersPerMonth: roundOne(requiredOrdersPerMonth),
    requiredOrdersPerDay: roundOne(requiredOrdersPerDay),
  };
}

function classifyProfitFit(
  input: ProfitFitInput,
  base: ReturnType<typeof calculateBreakEvenOrders>,
): ProfitFitStatus {
  const estimated = input.estimatedOnlineInfluencedOrdersPerDay;
  const hasEstimate =
    typeof estimated === "number" &&
    Number.isFinite(estimated) &&
    estimated >= 0;
  const capacityMissing = input.hasCapacityForMoreOrders !== true;
  const highDependency =
    input.deliveryAppDependency === "high" ||
    input.discountDependency === "high";
  const lowTicketHighVolume =
    base.averageTicketUsed < DEFAULT_AVERAGE_TICKET &&
    base.requiredOrdersPerDay >= 15;

  if (input.hasCapacityForMoreOrders === false) return "not_current_target";
  if (!hasEstimate) {
    if (lowTicketHighVolume || highDependency) return "low_ticket_risk";
    return "needs_more_info";
  }
  if (lowTicketHighVolume || highDependency) return "low_ticket_risk";
  if (estimated >= base.requiredOrdersPerDay * 1.5 && !capacityMissing) {
    return "strong_profit_fit";
  }
  if (estimated >= base.requiredOrdersPerDay) return "viable_fit";
  if (estimated >= base.requiredOrdersPerDay * 0.7)
    return "volume_dependent_fit";
  return "not_current_target";
}

function mainRiskFor(status: ProfitFitStatus, input: ProfitFitInput): string {
  if (input.hasCapacityForMoreOrders === false) {
    return "No confirmed capacity for more orders/actions; do not sell until capacity changes.";
  }
  if (input.deliveryAppDependency === "high") {
    return "High delivery-app dependency may compress margin; confirm direct/order mix before selling.";
  }
  if (input.discountDependency === "high") {
    return "High discount dependency may compress margin; confirm unit economics before selling.";
  }
  switch (status) {
    case "strong_profit_fit":
      return "Current assumptions show room above the break-even order target, if capacity and economics are confirmed.";
    case "viable_fit":
      return "Current assumptions meet the break-even order target, but margin and capacity should still be confirmed.";
    case "volume_dependent_fit":
      return "Close to break-even, but the restaurant likely needs steady online-influenced volume to justify the fee.";
    case "low_ticket_risk":
      return "Low ticket or margin pressure creates a high daily order requirement.";
    case "not_current_target":
      return "Current assumptions do not show a realistic near-term path to covering the monthly fee.";
    case "needs_more_info":
      return "Average ticket, margin, order source mix, or capacity is not confirmed yet.";
  }
}

function nextActionFor(status: ProfitFitStatus): string {
  switch (status) {
    case "strong_profit_fit":
      return "Proceed with internal review; Growth is usually the main package unless Premium readiness is explicitly confirmed.";
    case "viable_fit":
      return "Confirm average ticket, margin, and capacity before recommending the package.";
    case "volume_dependent_fit":
      return "Treat as volume-dependent; start lower-friction or gather stronger order-source evidence.";
    case "low_ticket_risk":
      return "Confirm direct-order margin and reduce delivery/discount risk before selling.";
    case "not_current_target":
      return "Do not actively sell right now; revisit if capacity, ticket size, or margin improves.";
    case "needs_more_info":
      return "Ask simple intake questions about average ticket, margin, capacity, discounts, and delivery-app reliance.";
  }
}

export function evaluateProfitFit(input: ProfitFitInput): ProfitFitResult {
  const base = calculateBreakEvenOrders(input);
  const estimated = input.estimatedOnlineInfluencedOrdersPerDay;
  const hasEstimate =
    typeof estimated === "number" &&
    Number.isFinite(estimated) &&
    estimated >= 0;
  const status = classifyProfitFit(input, base);

  const estimatedMonthlyOnlineInfluencedRevenue = hasEstimate
    ? roundDollars(estimated * base.averageTicketUsed * DAYS_PER_MONTH)
    : undefined;
  const estimatedNetProfitFromOnlineInfluencedOrders = hasEstimate
    ? roundDollars(
        estimated *
          base.averageTicketUsed *
          DAYS_PER_MONTH *
          base.netMarginUsed,
      )
    : undefined;
  const estimatedNetProfitAfterVeroxa = hasEstimate
    ? roundDollars(
        (estimatedNetProfitFromOnlineInfluencedOrders ?? 0) - base.monthlyFee,
      )
    : undefined;

  return {
    ...base,
    estimatedOnlineInfluencedOrdersPerDay: hasEstimate ? estimated : undefined,
    estimatedMonthlyOnlineInfluencedRevenue,
    estimatedNetProfitFromOnlineInfluencedOrders,
    estimatedNetProfitAfterVeroxa,
    status,
    mainRisk: mainRiskFor(status, input),
    suggestedNextAction: nextActionFor(status),
    internalOnlyDisclaimer: INTERNAL_ONLY_DISCLAIMER,
  };
}

export function formatProfitFitSummary(result: ProfitFitResult): string {
  const estimate =
    result.estimatedOnlineInfluencedOrdersPerDay === undefined
      ? "estimated order/action target not confirmed"
      : `estimated ${roundOne(result.estimatedOnlineInfluencedOrdersPerDay)} online-influenced orders/actions/day`;
  return `Profit fit: ${result.status.replaceAll("_", " ")}. Break-even target is about ${result.requiredOrdersPerDay} online-influenced orders/actions/day at $${result.averageTicketUsed} average ticket and ${(result.netMarginUsed * 100).toFixed(1)}% net margin; ${estimate}. Main risk: ${result.mainRisk}`;
}
