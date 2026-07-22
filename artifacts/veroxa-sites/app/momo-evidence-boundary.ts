export type MomoEvidenceClass = "unknown" | "development_proxy" | "synthetic" | "public_evidence" | "real_owner";
export type MomoExecutionContext = "preconnection_rehearsal" | "live";

export type MomoEvidenceDecision = {
  allowed: boolean;
  classification: MomoEvidenceClass;
  context: MomoExecutionContext;
  code: "allowed" | "unknown_evidence" | "non_owner_evidence_live_blocked";
  explanation: string;
};

export function evaluateMomoEvidenceUse(
  classification: MomoEvidenceClass,
  context: MomoExecutionContext,
): MomoEvidenceDecision {
  if (classification === "unknown") return {
    allowed: false,
    classification,
    context,
    code: "unknown_evidence",
    explanation: "Evidence without an explicit classification cannot be used.",
  };
  if (context === "live" && classification !== "real_owner") return {
    allowed: false,
    classification,
    context,
    code: "non_owner_evidence_live_blocked",
    explanation: "Development and synthetic evidence is rehearsal-only and cannot authorize live work.",
  };
  return {
    allowed: true,
    classification,
    context,
    code: "allowed",
    explanation: context === "live"
      ? "Current real-owner evidence may be evaluated by the separate live gates."
      : "Classified evidence may be used inside an isolated preconnection rehearsal.",
  };
}

export function assertMomoEvidenceUse(
  classification: MomoEvidenceClass,
  context: MomoExecutionContext,
): void {
  const result = evaluateMomoEvidenceUse(classification, context);
  if (!result.allowed) throw new Error(result.code);
}
