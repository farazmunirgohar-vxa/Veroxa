/**
 * leadTypes.ts — M028 / M033
 *
 * Types for the Veroxa audit lead pipeline. Internal-only lead score,
 * priority, projected MRR, and source quality fields are PRIVATE — they
 * must never be shown on the public `/free-audit` page or to restaurants.
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

// ── M033: Expanded Lead Source taxonomy ─────────────────────────────────────

export type LeadSource =
  // Direct outreach
  | "walk_in"
  | "phone_call"
  | "cold_email"
  | "instagram_dm"
  | "facebook_dm"
  | "google_maps_manual_search"
  | "manual_prospect"
  | "area_scan"
  // Website / self-selling
  | "free_audit"
  | "guided_demo"
  | "pricing_page"
  | "contact_page"
  | "qr_code"
  | "flyer"
  | "niche_landing_page"
  | "seasonal_landing_page"
  | "google_profile_health_check"
  | "slow_day_visibility_check"
  | "content_readiness_check"
  // Relationship
  | "founder_network"
  | "family_friend_referral"
  | "client_referral"
  | "restaurant_owner_referral"
  | "community_referral"
  | "mosque_community_center"
  | "halal_network"
  | "pakistani_community_network"
  | "turkish_mediterranean_network"
  | "vendor_partner"
  | "pos_partner"
  | "menu_printer"
  | "food_supplier"
  | "commercial_realtor"
  | "accountant_bookkeeper"
  // Proof / case-study
  | "case_study"
  | "before_after_report"
  | "monthly_result_snapshot"
  | "client_testimonial"
  | "referral_from_success"
  | "restaurant_seen_on_social"
  // Campaign / event
  | "ramadan_campaign"
  | "eid_campaign"
  | "holiday_catering_campaign"
  | "lunch_traffic_campaign"
  | "slow_day_campaign"
  | "new_restaurant_opening"
  | "grand_opening"
  | "food_festival"
  | "local_event"
  | "seasonal_offer"
  // Legacy / catch-all
  | "referral"
  | "other";

export type LeadSourceCategory =
  | "direct_outreach"
  | "website_self_selling"
  | "relationship"
  | "proof_based"
  | "campaign_event"
  | "other";

export const LEAD_SOURCE_CATEGORY_LABELS: Record<LeadSourceCategory, string> = {
  direct_outreach: "Direct Outreach",
  website_self_selling: "Website / Self-Selling",
  relationship: "Relationship",
  proof_based: "Proof / Case Study",
  campaign_event: "Campaign / Event",
  other: "Other",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  // Direct outreach
  walk_in: "Walk-in",
  phone_call: "Phone Call",
  cold_email: "Cold Email",
  instagram_dm: "Instagram DM",
  facebook_dm: "Facebook DM",
  google_maps_manual_search: "Google Maps Manual Search",
  manual_prospect: "Manual Prospect",
  area_scan: "Area Scan",
  // Website / self-selling
  free_audit: "Free Audit",
  guided_demo: "Guided Demo",
  pricing_page: "Pricing Page",
  contact_page: "Contact Page",
  qr_code: "QR Code",
  flyer: "Flyer",
  niche_landing_page: "Niche Landing Page",
  seasonal_landing_page: "Seasonal Landing Page",
  google_profile_health_check: "Google Profile Health Check",
  slow_day_visibility_check: "Slow Day Visibility Check",
  content_readiness_check: "Content Readiness Check",
  // Relationship
  founder_network: "Founder Network",
  family_friend_referral: "Family / Friend Referral",
  client_referral: "Client Referral",
  restaurant_owner_referral: "Restaurant Owner Referral",
  community_referral: "Community Referral",
  mosque_community_center: "Mosque / Community Centre",
  halal_network: "Halal Network",
  pakistani_community_network: "Pakistani Community Network",
  turkish_mediterranean_network: "Turkish / Mediterranean Network",
  vendor_partner: "Vendor Partner",
  pos_partner: "POS Partner",
  menu_printer: "Menu Printer",
  food_supplier: "Food Supplier",
  commercial_realtor: "Commercial Realtor",
  accountant_bookkeeper: "Accountant / Bookkeeper",
  // Proof / case-study
  case_study: "Case Study",
  before_after_report: "Before / After Report",
  monthly_result_snapshot: "Monthly Result Snapshot",
  client_testimonial: "Client Testimonial",
  referral_from_success: "Referral from Success",
  restaurant_seen_on_social: "Restaurant Seen on Social",
  // Campaign / event
  ramadan_campaign: "Ramadan Campaign",
  eid_campaign: "Eid Campaign",
  holiday_catering_campaign: "Holiday Catering Campaign",
  lunch_traffic_campaign: "Lunch Traffic Campaign",
  slow_day_campaign: "Slow Day Campaign",
  new_restaurant_opening: "New Restaurant Opening",
  grand_opening: "Grand Opening",
  food_festival: "Food Festival",
  local_event: "Local Event",
  seasonal_offer: "Seasonal Offer",
  // Legacy / catch-all
  referral: "Referral",
  other: "Other",
};

export const LEAD_SOURCE_CATEGORY: Record<LeadSource, LeadSourceCategory> = {
  // Direct outreach
  walk_in: "direct_outreach",
  phone_call: "direct_outreach",
  cold_email: "direct_outreach",
  instagram_dm: "direct_outreach",
  facebook_dm: "direct_outreach",
  google_maps_manual_search: "direct_outreach",
  manual_prospect: "direct_outreach",
  area_scan: "direct_outreach",
  // Website / self-selling
  free_audit: "website_self_selling",
  guided_demo: "website_self_selling",
  pricing_page: "website_self_selling",
  contact_page: "website_self_selling",
  qr_code: "website_self_selling",
  flyer: "website_self_selling",
  niche_landing_page: "website_self_selling",
  seasonal_landing_page: "website_self_selling",
  google_profile_health_check: "website_self_selling",
  slow_day_visibility_check: "website_self_selling",
  content_readiness_check: "website_self_selling",
  // Relationship
  founder_network: "relationship",
  family_friend_referral: "relationship",
  client_referral: "relationship",
  restaurant_owner_referral: "relationship",
  community_referral: "relationship",
  mosque_community_center: "relationship",
  halal_network: "relationship",
  pakistani_community_network: "relationship",
  turkish_mediterranean_network: "relationship",
  vendor_partner: "relationship",
  pos_partner: "relationship",
  menu_printer: "relationship",
  food_supplier: "relationship",
  commercial_realtor: "relationship",
  accountant_bookkeeper: "relationship",
  // Proof / case-study
  case_study: "proof_based",
  before_after_report: "proof_based",
  monthly_result_snapshot: "proof_based",
  client_testimonial: "proof_based",
  referral_from_success: "proof_based",
  restaurant_seen_on_social: "proof_based",
  // Campaign / event
  ramadan_campaign: "campaign_event",
  eid_campaign: "campaign_event",
  holiday_catering_campaign: "campaign_event",
  lunch_traffic_campaign: "campaign_event",
  slow_day_campaign: "campaign_event",
  new_restaurant_opening: "campaign_event",
  grand_opening: "campaign_event",
  food_festival: "campaign_event",
  local_event: "campaign_event",
  seasonal_offer: "campaign_event",
  // Legacy / catch-all
  referral: "relationship",
  other: "other",
};

/** Safe label lookup — returns "Unknown / Other" for any legacy value not in map. */
export function getLeadSourceLabel(source: string): string {
  return (LEAD_SOURCE_LABELS as Record<string, string>)[source] ?? "Unknown / Other";
}

export function getLeadSourceCategory(source: string): LeadSourceCategory {
  return (LEAD_SOURCE_CATEGORY as Record<string, LeadSourceCategory>)[source] ?? "other";
}

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
