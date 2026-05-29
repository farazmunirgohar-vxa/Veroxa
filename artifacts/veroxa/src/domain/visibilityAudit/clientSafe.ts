/** Client-safe visibility helpers. Never expose rule names or evidence labels. */

import type { VisibilityAuditFinding } from "./types";

export interface ClientSafeVisibilityItem {
  title: string;
  summary: string;
  needsConfirmation: boolean;
}

export function toClientSafeVisibilityItem(
  finding: VisibilityAuditFinding,
): ClientSafeVisibilityItem {
  return {
    title: "Visibility improvement",
    summary: finding.needsClientConfirmation
      ? "Veroxa may ask you to confirm one business detail before preparing the next step."
      : "Veroxa is preparing a small visibility improvement for review.",
    needsConfirmation: finding.needsClientConfirmation,
  };
}

export function toClientSafeVisibilityItems(
  findings: VisibilityAuditFinding[],
): ClientSafeVisibilityItem[] {
  return findings.map(toClientSafeVisibilityItem);
}
