/**
 * leadTypes.ts — M028
 *
 * Types for the Veroxa audit lead pipeline. Internal-only lead score,
 * priority, and projected MRR fields are PRIVATE — they must never be
 * shown on the public `/free-audit` page or to restaurants.
 */

import type {
  AuditConfidence,
  RecommendedPackageId,
} from "@/lib/audit/auditTypes";

export type LeadStage =
  | "new_audit"
  | "walkthrough_requested"
  | "needs_manual_review"
  | "ready_to_contact"
  | "contacted"
  | "walkthrough_booked"
  | "proposal_sent"
  | "won"
  | "lost"
  | "nurture_later";

export type LeadPriority =
  | "priority_a"
  | "priority_b"
  | "nurture"
  | "low_priority"
  | "not_current_target";

export type LeadSource =
  | "free_audit"
  | "manual_prospect"
  | "referral"
  | "walk_in"
  | "other";

export type LeadFollowUpStatus =
  | "no_follow_up_needed"
  | "follow_up_due"
  | "follow_up_overdue"
  | "awaiting_restaurant"
  | "closed";

export type PreferredContactMethod = "phone" | "email" | "text" | "any";

export interface AuditLeadContact {
  contactName?: string;
  phone?: string;
  email?: string;
  preferredContactMethod?: PreferredContactMethod;
  bestTimeToContact?: string;
  note?: string;
}

export interface AuditLeadLinks {
  googleListingUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  menuOrderingUrl?: string;
  otherUrl?: string;
}

export interface AuditLeadPublicAuditSnapshot {
  totalScore: number;
  gradeLabel: string;
  auditConfidence: AuditConfidence;
  confidenceLabel: string;
  recommendedPackageId: RecommendedPackageId;
  recommendedPackageLabel: string;
  standardPriceDisplay: string;
  foundingPriceDisplay: string;
  weakSpotTitles: string[];
}

/** Optional internal-only manual flags Veroxa team can set on a prospect. */
export interface AuditLeadInternalFlags {
  warmRelationship?: boolean;
  ownerReachability?: "low" | "medium" | "high";
  contactAvailable?: boolean;
  strategicValueNote?: string;
}

export interface AuditLeadRecord {
  id: string;
  source: LeadSource;
  createdAt: string;
  updatedAt: string;

  restaurantName: string;
  city: string;
  state: string;
  cuisineType: string;
  links: AuditLeadLinks;

  publicAudit: AuditLeadPublicAuditSnapshot;
  contact?: AuditLeadContact;
  internalFlags?: AuditLeadInternalFlags;

  // INTERNAL — never expose on public audit page.
  leadStage: LeadStage;
  leadPriority: LeadPriority;
  internalLeadScore: number;
  projectedMonthlyMrr: number;
  projectedStandardMonthlyMrr: number;
  nextAction: string;
  followUpStatus: LeadFollowUpStatus;
  internalNotes: string[];
}

export interface AuditLeadSummary {
  totalLeads: number;
  walkthroughRequested: number;
  priorityACount: number;
  priorityBCount: number;
  nurtureCount: number;
  followUpNeeded: number;
  wonCount: number;
  lostCount: number;
  projectedFoundingMrr: number;
  projectedStandardMrr: number;
}

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new_audit: "New Audit",
  walkthrough_requested: "Walkthrough Requested",
  needs_manual_review: "Needs Manual Review",
  ready_to_contact: "Ready to Contact",
  contacted: "Contacted",
  walkthrough_booked: "Walkthrough Booked",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
  nurture_later: "Nurture Later",
};

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = {
  priority_a: "Priority A",
  priority_b: "Priority B",
  nurture: "Nurture",
  low_priority: "Low Priority",
  not_current_target: "Not Current Target",
};
