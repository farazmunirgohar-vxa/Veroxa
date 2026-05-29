/**
 * Rule-based Visibility Audit Engine.
 *
 * This module is intentionally deterministic and local-only: no network, no
 * model calls, no scraping, no publishing. It turns demo visibility inputs into
 * team-facing findings that can be mapped into Prepared Actions.
 */

import type {
  VisibilityAuditFinding,
  VisibilityAuditInput,
  VisibilityAuditResult,
  VisibilityAuditSeverity,
} from "./types";

const SEVERITY_ORDER: Record<VisibilityAuditSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const MAX_VISIBILITY_FINDINGS_PER_RESTAURANT = 6;

function sortFindings(a: VisibilityAuditFinding, b: VisibilityAuditFinding): number {
  return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
}

function findingBase(input: VisibilityAuditInput, suffix: string) {
  return {
    id: `VA-${input.id}-${suffix}`,
    inputId: input.id,
    clientId: input.clientId,
    restaurantName: input.restaurantName,
  } as const;
}

export function runVisibilityAudit(input: VisibilityAuditInput): VisibilityAuditResult {
  const findings: VisibilityAuditFinding[] = [];

  if (!input.signals.hasGoogleProfileLink) {
    findings.push({
      ...findingBase(input, "google-profile"),
      category: "google_profile",
      severity: "high",
      priority: "high",
      title: "Visibility issue: Google profile link missing",
      issue: "The team does not have a confirmed Google profile link for review.",
      suggestedNextStep: "Confirm the correct profile before preparing any public update.",
      needsClientConfirmation: true,
      confirmationTopic: "business_detail",
      evidenceLabel: "No confirmed Google profile link in the demo input.",
    });
  }

  if (!input.signals.hasVisibleHours) {
    findings.push({
      ...findingBase(input, "hours"),
      category: "hours",
      severity: "high",
      priority: "high",
      title: "Visibility issue: hours need confirmation",
      issue: "Hours are not clearly visible in the current review input.",
      suggestedNextStep: "Ask the restaurant to confirm regular hours before preparing changes.",
      needsClientConfirmation: true,
      confirmationTopic: "hours",
      evidenceLabel: "Visible hours signal is missing.",
    });
  }

  if (!input.signals.hasHolidayHoursNote) {
    findings.push({
      ...findingBase(input, "holiday-hours"),
      category: "hours",
      severity: "medium",
      priority: "medium",
      title: "Visibility issue: holiday hours not confirmed",
      issue: "Holiday hours are not confirmed for upcoming customer planning moments.",
      suggestedNextStep: "Ask for holiday hours before preparing any customer-facing update.",
      needsClientConfirmation: true,
      confirmationTopic: "holiday_hours",
      evidenceLabel: "Holiday hours note is missing.",
    });
  }

  if (!input.signals.hasMenuLink) {
    findings.push({
      ...findingBase(input, "menu"),
      category: "menu",
      severity: "high",
      priority: "high",
      title: "Visibility issue: menu link missing",
      issue: "Customers may not have an easy path to view the menu.",
      suggestedNextStep: "Confirm the current menu link before preparing a menu visibility action.",
      needsClientConfirmation: true,
      confirmationTopic: "menu",
      evidenceLabel: "Menu link signal is missing.",
    });
  }

  if (!input.signals.hasWebsiteLink) {
    findings.push({
      ...findingBase(input, "website"),
      category: "website",
      severity: "medium",
      priority: "medium",
      title: "Visibility issue: website link missing",
      issue: "The team does not have a confirmed website link to reference.",
      suggestedNextStep: "Confirm the best website link before preparing public copy or link updates.",
      needsClientConfirmation: true,
      confirmationTopic: "business_detail",
      evidenceLabel: "Website link signal is missing.",
    });
  }

  if (!input.signals.hasRecentPhotos) {
    findings.push({
      ...findingBase(input, "photos"),
      category: "photos",
      severity: "medium",
      priority: "medium",
      title: "Visibility issue: fresh photos needed",
      issue: "Recent restaurant photos are not available for the next visibility push.",
      suggestedNextStep: "Prepare a low-effort photo request for the restaurant.",
      needsClientConfirmation: false,
      evidenceLabel: "Recent photo signal is missing.",
    });
  }

  if (input.signals.hasUnansweredReviews) {
    findings.push({
      ...findingBase(input, "reviews"),
      category: "reviews",
      severity: "medium",
      priority: "medium",
      title: "Visibility issue: review response ready",
      issue: "A customer review appears to need a calm response draft.",
      suggestedNextStep: "Prepare a review reply for Faraz to review.",
      needsClientConfirmation: false,
      evidenceLabel: "Unanswered review signal is present.",
    });
  }

  if (input.signals.mentionsCatering && !input.signals.cateringDetailsConfirmed) {
    findings.push({
      ...findingBase(input, "catering"),
      category: "catering",
      severity: "medium",
      priority: "medium",
      title: "Visibility issue: catering details need confirmation",
      issue: "Catering is mentioned, but lead time, minimums, or availability are not confirmed.",
      suggestedNextStep: "Ask the restaurant to confirm catering details before preparing public copy.",
      needsClientConfirmation: true,
      confirmationTopic: "catering",
      evidenceLabel: "Catering mentioned without confirmed details.",
    });
  }

  if (
    input.signals.mentionsDietaryOrHealthClaim &&
    !input.signals.dietaryOrHealthClaimConfirmed
  ) {
    findings.push({
      ...findingBase(input, "business-claim"),
      category: "business_claims",
      severity: "high",
      priority: "high",
      title: "Visibility issue: business claim needs confirmation",
      issue: "A dietary or health-related claim appears in the review input without confirmation.",
      suggestedNextStep: "Confirm the exact claim before preparing anything customer-facing.",
      needsClientConfirmation: true,
      confirmationTopic: "dietary_claim",
      evidenceLabel: "Dietary or health claim signal is present but unconfirmed.",
    });
  }

  const sortedFindings = findings
    .sort(sortFindings)
    .slice(0, MAX_VISIBILITY_FINDINGS_PER_RESTAURANT);

  return {
    input,
    findings: sortedFindings,
    preparedActionCount: 0,
  };
}

export function runVisibilityAudits(inputs: VisibilityAuditInput[]): VisibilityAuditResult[] {
  return inputs.map(runVisibilityAudit);
}
