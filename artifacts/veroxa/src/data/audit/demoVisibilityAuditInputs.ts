import { runVisibilityAudits } from "@/domain/visibilityAudit";
import type { VisibilityAuditInput, VisibilityAuditResult } from "@/domain/visibilityAudit";

export const demoVisibilityAuditInputs: VisibilityAuditInput[] = [
  {
    id: "DEMO-A",
    clientId: "demo-a",
    restaurantName: "Demo Grill House",
    city: "Austin",
    state: "TX",
    observedAtLabel: "Today, 9:15 AM",
    signals: {
      hasGoogleProfileLink: true,
      hasWebsiteLink: true,
      hasMenuLink: false,
      hasVisibleHours: true,
      hasHolidayHoursNote: false,
      hasRecentPhotos: false,
      hasUnansweredReviews: true,
      mentionsCatering: true,
      cateringDetailsConfirmed: false,
      mentionsDietaryOrHealthClaim: true,
      dietaryOrHealthClaimConfirmed: false,
    },
  },
  {
    id: "DEMO-B",
    clientId: "demo-b",
    restaurantName: "Demo Taco Bar",
    city: "Phoenix",
    state: "AZ",
    observedAtLabel: "Today, 9:12 AM",
    signals: {
      hasGoogleProfileLink: true,
      hasWebsiteLink: false,
      hasMenuLink: true,
      hasVisibleHours: false,
      hasHolidayHoursNote: false,
      hasRecentPhotos: true,
      hasUnansweredReviews: false,
      mentionsCatering: true,
      cateringDetailsConfirmed: false,
      mentionsDietaryOrHealthClaim: false,
      dietaryOrHealthClaimConfirmed: false,
    },
  },
  {
    id: "DEMO-C",
    clientId: "demo-c",
    restaurantName: "Demo Brunch Spot",
    city: "Chicago",
    state: "IL",
    observedAtLabel: "Today, 9:08 AM",
    signals: {
      hasGoogleProfileLink: false,
      hasWebsiteLink: true,
      hasMenuLink: true,
      hasVisibleHours: true,
      hasHolidayHoursNote: true,
      hasRecentPhotos: false,
      hasUnansweredReviews: true,
      mentionsCatering: false,
      cateringDetailsConfirmed: false,
      mentionsDietaryOrHealthClaim: false,
      dietaryOrHealthClaimConfirmed: false,
    },
  },
];

export function getDemoVisibilityAuditResults(): VisibilityAuditResult[] {
  return runVisibilityAudits(demoVisibilityAuditInputs);
}

export function getDemoVisibilityAuditFindings() {
  return getDemoVisibilityAuditResults().flatMap((result) => result.findings);
}
