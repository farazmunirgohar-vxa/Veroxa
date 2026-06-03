import type { ClientConfirmationStatus, ManualExecutionPack, ManualExecutionRiskTone } from "./types";

const businessTruthPatterns = [
  /\bhours?\b/i,
  /holiday hours/i,
  /menu/i,
  /price|\$\d|dollar/i,
  /discount|offer|promo|special/i,
  /catering/i,
  /halal|organic|healthy|health/i,
  /complaint|refund/i,
  /ad budget|ads readiness|premium/i,
  /confirm|unclear|exact/i,
] as const;

export function getBusinessTruthItemsToConfirm(pack: ManualExecutionPack): readonly string[] {
  const explicit = pack.businessTruthItemsToConfirm;
  if (explicit.length > 0) return explicit;

  const searchable = [
    pack.title,
    pack.clientSafeSummary,
    pack.teamInstructions,
    pack.copyPasteCaption ?? "",
    pack.copyPasteGoogleUpdate ?? "",
  ].join(" ");

  if (!businessTruthPatterns.some((pattern) => pattern.test(searchable))) return [];
  return ["Exact restaurant detail needs client confirmation before manual execution."];
}

export function requiresClientConfirmation(pack: ManualExecutionPack): boolean {
  return (
    pack.confirmationStatus !== "not_required" ||
    pack.riskFlags.includes("needs_business_truth_confirmation") ||
    pack.riskFlags.includes("sensitive_offer_or_discount") ||
    pack.riskFlags.includes("possible_unverified_claim") ||
    pack.riskFlags.includes("premium_ads_requires_approval") ||
    getBusinessTruthItemsToConfirm(pack).length > 0
  );
}

export function buildClientConfirmationRequestDraft(pack: ManualExecutionPack): string {
  const items = getBusinessTruthItemsToConfirm(pack);
  const itemLine = items.length > 0 ? items.join("; ") : "the exact restaurant detail";
  return [
    `Hi — Veroxa is preparing this update for review: ${pack.clientSafeSummary}`,
    `Before Veroxa prepares this update for posting, please confirm: ${itemLine}.`,
    "This helps us avoid sharing anything inaccurate. Nothing goes live without Veroxa team review.",
  ].join("\n\n");
}

export function buildTeamConfirmationInstruction(pack: ManualExecutionPack): string {
  if (!requiresClientConfirmation(pack)) {
    return "No client confirmation required before team review; still verify the copy and media manually.";
  }
  return `Business detail needs confirmation before manual execution: ${getBusinessTruthItemsToConfirm(pack).join("; ")}. Hold until client confirms.`;
}

export function getConfirmationStatusTone(status: ClientConfirmationStatus): ManualExecutionRiskTone {
  if (status === "confirmed" || status === "not_required") return "success";
  if (status === "required" || status === "requested" || status === "unclear") return "warning";
  if (status === "rejected") return "danger";
  return "neutral";
}

export function getClientSafeConfirmationLabel(status: ClientConfirmationStatus): string {
  const labels: Record<ClientConfirmationStatus, string> = {
    not_required: "Ready for team review",
    required: "Needs your confirmation",
    requested: "Confirmation requested",
    confirmed: "Confirmed for review",
    rejected: "Needs revision",
    unclear: "Needs your confirmation",
  };
  return labels[status];
}
