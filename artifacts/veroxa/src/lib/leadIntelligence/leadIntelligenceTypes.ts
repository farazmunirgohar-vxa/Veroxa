/**
 * leadIntelligenceTypes.ts — Lead Intelligence + Outreach Engine (foundation).
 *
 * SAFETY / SCOPE:
 *   - Everything here is rule-based and deterministic. No network, no scraping,
 *     no auto-send, no payments, no guarantees.
 *   - These types describe what Veroxa OBSERVES from public/provided signals and
 *     what it WOULD prepare for a human to review before any outreach happens.
 *   - Marketing-investment signals are always framed as POSSIBLE, never as
 *     confirmed agency spend. Never insult a current vendor/agency.
 *   - All profiles are internal-only. They must never appear on the public
 *     `/free-audit` page or be shown to a restaurant.
 */

// ---------------------------------------------------------------------------
// Segments — how Veroxa classifies a lead for outreach strategy.
// ---------------------------------------------------------------------------

export type LeadSegment =
  | "no_online_presence_lead"
  | "inconsistent_owner_managed_lead"
  | "agency_spend_opportunity_lead"
  | "ads_waste_risk_lead"
  | "strong_fit_pilot_lead"
  | "already_strong_low_priority";

export const LEAD_SEGMENT_LABELS: Record<LeadSegment, string> = {
  no_online_presence_lead: "No / Thin Online Presence",
  inconsistent_owner_managed_lead: "Inconsistent, Owner-Managed",
  agency_spend_opportunity_lead: "Possible Paid-Service Spend",
  ads_waste_risk_lead: "Possible Ad-Spend Waste Risk",
  strong_fit_pilot_lead: "Strong Fit — Pilot Candidate",
  already_strong_low_priority: "Already Strong — Low Priority",
};

export const LEAD_SEGMENT_DESCRIPTIONS: Record<LeadSegment, string> = {
  no_online_presence_lead:
    "Little or no findable online presence — high improvement room, easy to add clear value.",
  inconsistent_owner_managed_lead:
    "Likely owner-managed with inconsistent posting/profile upkeep — strong fit for done-for-you consistency.",
  agency_spend_opportunity_lead:
    "Possible signs of paid marketing help, but execution still looks improvable — worth a careful conversation.",
  ads_waste_risk_lead:
    "Possible paid promotion with weak supporting basics — risk that spend is underperforming.",
  strong_fit_pilot_lead:
    "Clear improvement room plus reachability — a good candidate for an audit-to-pilot conversation.",
  already_strong_low_priority:
    "Already executing well across the basics — lower priority, revisit later.",
};

// ---------------------------------------------------------------------------
// Contact paths — only public/provided routes. NEVER private scraping.
// ---------------------------------------------------------------------------

export type ContactPathType =
  | "business_phone"
  | "website_email"
  | "website_contact_form"
  | "google_profile_phone"
  | "public_owner_or_manager_name"
  | "instagram_contact"
  | "facebook_contact"
  | "linkedin_public_profile"
  | "needs_manual_research";

export const CONTACT_PATH_LABELS: Record<ContactPathType, string> = {
  business_phone: "Business phone",
  website_email: "Website email",
  website_contact_form: "Website contact form",
  google_profile_phone: "Google profile phone",
  public_owner_or_manager_name: "Public owner / manager name",
  instagram_contact: "Instagram (public) message",
  facebook_contact: "Facebook (public) message",
  linkedin_public_profile: "LinkedIn public profile",
  needs_manual_research: "Needs manual research",
};

export type ContactPathConfidence = "available" | "likely" | "needs_research";

export interface ContactPath {
  type: ContactPathType;
  label: string;
  /** How reachable this path looks from public/provided signals only. */
  confidence: ContactPathConfidence;
  /** Short, human checklist instruction. Always manual, never automated. */
  instruction: string;
  /** True only when a concrete public value was provided (e.g. listed phone). */
  valueProvided: boolean;
  /** Optional already-known public value (e.g. a listed business phone). */
  knownValue?: string;
}

// ---------------------------------------------------------------------------
// Signals — cautious, observation-only.
// ---------------------------------------------------------------------------

export type SignalStrength = "low" | "medium" | "high";

export interface MarketingInvestmentSignal {
  /** Whether any POSSIBLE paid-service signal was observed at all. */
  possiblePaidServiceSignal: boolean;
  strength: SignalStrength;
  /** Cautious, non-accusatory observations. Never "confirmed agency spend". */
  observations: string[];
  /** Always true here — these signals must be verified by a human. */
  needsManualVerification: boolean;
}

export interface ExecutionInconsistencySignal {
  /** Whether execution looks inconsistent across surfaces. */
  inconsistent: boolean;
  strength: SignalStrength;
  observations: string[];
}

export interface ReachabilitySignal {
  /** How reachable the lead looks from public/provided paths. */
  level: "low" | "medium" | "high";
  observations: string[];
  /** Count of usable (available or likely) contact paths. */
  usablePathCount: number;
}

// ---------------------------------------------------------------------------
// Scoring — 0..100 per dimension, deterministic.
// ---------------------------------------------------------------------------

export interface ConversionOpportunityScore {
  /** Room to improve the public presence (higher = more room). */
  improvementRoomScore: number;
  /** Likelihood the lead already invests in marketing (possible only). */
  marketingInvestmentSignalScore: number;
  /** How inconsistent current execution appears. */
  inconsistencyScore: number;
  /** How reachable the lead is via public/provided paths. */
  reachabilityScore: number;
  /** How well the lead fits Veroxa's ideal client profile. */
  fitScore: number;
  /** Blended, weighted overall conversion opportunity (0..100). */
  overallConversionOpportunity: number;
}

// ---------------------------------------------------------------------------
// Compliance — guardrail flags attached to every profile.
// ---------------------------------------------------------------------------

export type LeadComplianceFlagType =
  | "no_auto_send"
  | "human_review_required"
  | "no_private_contact_scraping"
  | "no_confirmed_spend_claim"
  | "no_vendor_disparagement"
  | "no_guaranteed_results"
  | "needs_manual_contact_research";

export interface LeadComplianceFlag {
  type: LeadComplianceFlagType;
  note: string;
}

// ---------------------------------------------------------------------------
// Outreach drafts — prepared, never sent.
// ---------------------------------------------------------------------------

export type OutreachChannel =
  | "email"
  | "follow_up_email"
  | "call_opener"
  | "voicemail"
  | "walk_in"
  | "meeting_agenda";

export const OUTREACH_CHANNEL_LABELS: Record<OutreachChannel, string> = {
  email: "Cold email draft",
  follow_up_email: "Follow-up email draft",
  call_opener: "Call opener",
  voicemail: "Voicemail script",
  walk_in: "Walk-in opener",
  meeting_agenda: "Meeting / audit agenda",
};

export interface OutreachDraft {
  channel: OutreachChannel;
  label: string;
  /** Optional subject line (email channels). */
  subject?: string;
  /** Main draft body. Plain text, owner-friendly, cautious. */
  body: string;
  /** Optional short talking points / agenda items. */
  points?: string[];
}

export interface OutreachDraftSet {
  restaurantName: string;
  segment: LeadSegment;
  drafts: OutreachDraft[];
  /** Standard guardrail reminders shown next to every draft set. */
  guardrails: string[];
  humanReviewRequired: true;
}

// ---------------------------------------------------------------------------
// Next actions — lead → audit → onboarding flow.
// ---------------------------------------------------------------------------

export type LeadNextActionKind =
  | "verify_contact_path"
  | "prepare_outreach"
  | "send_after_review"
  | "book_audit_walkthrough"
  | "run_or_share_audit"
  | "schedule_meeting"
  | "prepare_proposal"
  | "begin_onboarding"
  | "nurture_later";

export const LEAD_NEXT_ACTION_LABELS: Record<LeadNextActionKind, string> = {
  verify_contact_path: "Verify a public contact path",
  prepare_outreach: "Prepare outreach draft",
  send_after_review: "Send after human review",
  book_audit_walkthrough: "Book an audit walkthrough",
  run_or_share_audit: "Run / share the audit",
  schedule_meeting: "Schedule a meeting",
  prepare_proposal: "Prepare a proposal",
  begin_onboarding: "Begin onboarding checklist",
  nurture_later: "Nurture for later",
};

export interface LeadNextAction {
  kind: LeadNextActionKind;
  label: string;
  detail: string;
  /** True when a human must act/approve before anything leaves Veroxa. */
  requiresHumanReview: boolean;
}

// ---------------------------------------------------------------------------
// Profile — the full intelligence record for a single lead.
// ---------------------------------------------------------------------------

export type LeadFitTier = "ideal_fit" | "good_fit" | "possible_fit" | "weak_fit";

export const LEAD_FIT_TIER_LABELS: Record<LeadFitTier, string> = {
  ideal_fit: "Ideal Fit",
  good_fit: "Good Fit",
  possible_fit: "Possible Fit",
  weak_fit: "Weak Fit",
};

export interface LeadIntelligenceProfile {
  restaurantName: string;
  location: string;
  segment: LeadSegment;
  segmentLabel: string;
  segmentDescription: string;
  fitTier: LeadFitTier;
  score: ConversionOpportunityScore;
  marketingInvestment: MarketingInvestmentSignal;
  inconsistency: ExecutionInconsistencySignal;
  reachability: ReachabilitySignal;
  contactPaths: ContactPath[];
  /** Top reasons this lead is worth (or not worth) pursuing now. */
  topReasons: string[];
  /** A single cautious, value-based angle for the first conversation. */
  recommendedSalesAngle: string;
  /** Ordered next steps in the lead → audit → onboarding flow. */
  nextActions: LeadNextAction[];
  complianceFlags: LeadComplianceFlag[];
}
