import {
  getClientSafeVisibilitySummary,
  shouldShowVisibilityFindingToClient,
} from "@/domain/visibilityAudit/clientSafe";
import type { ClientLocalVisibilityProgress } from "./types";
import { getVisibilityAuditForClient } from "@/lib/visibilityAudit";
import { getClientById } from "@/lib/repositories/clientRepository";

function hasVisibleCategory(clientId: string, category: string): boolean {
  const audit = getVisibilityAuditForClient(clientId);
  return Boolean(
    audit?.result.findings.some(
      (finding) =>
        finding.category === category && shouldShowVisibilityFindingToClient(finding),
    ),
  );
}

/**
 * Client-safe local visibility summary. Deterministic and local-only: it reads
 * the existing demo visibility review output and translates it into calm labels.
 */
export function getClientLocalVisibilityProgress(
  clientId: string,
): ClientLocalVisibilityProgress {
  const audit = getVisibilityAuditForClient(clientId);
  const summary = audit ? getClientSafeVisibilitySummary(audit.result) : null;
  const restaurantName = summary?.restaurantName ?? getClientById(clientId)?.businessName;
  const needsBusinessConfirmation = Boolean(
    audit?.result.findings.some(
      (finding) =>
        finding.recommendation.requiresClientConfirmation &&
        shouldShowVisibilityFindingToClient(finding),
    ),
  );

  return {
    clientId,
    restaurantName,
    googleProfileFreshness: hasVisibleCategory(clientId, "google_business_profile")
      ? "Google profile freshness is being improved."
      : "Google profile freshness is being monitored.",
    reviewResponseProgress: hasVisibleCategory(clientId, "reviews")
      ? "Review response support is in progress."
      : "Review response support is being monitored.",
    photoFreshnessNeed: hasVisibleCategory(clientId, "content_freshness")
      ? "Fresh food photos would help next week's content."
      : "Photo freshness looks steady right now.",
    businessDetailsNeedConfirmation: needsBusinessConfirmation
      ? "Veroxa needs confirmation before updating business details."
      : "No business details need confirmation right now.",
    menuOrOrderingLinkCheck:
      hasVisibleCategory(clientId, "menu_visibility") || hasVisibleCategory(clientId, "website")
        ? "Menu and ordering links are being checked for freshness."
        : "Menu and ordering links are being monitored.",
    localSearchFocus:
      summary?.focusAreas.length
        ? `Local visibility focus: ${summary.focusAreas.slice(0, 3).join(", ")}.`
        : "Local visibility is being monitored for nearby customers.",
    nextVisibilityAction: summary?.status ?? "A visibility update is being prepared.",
  };
}
