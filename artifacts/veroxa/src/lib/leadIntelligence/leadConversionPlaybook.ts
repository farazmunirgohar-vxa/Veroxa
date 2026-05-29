/**
 * leadConversionPlaybook.ts — the lead → audit → onboarding flow.
 *
 * Deterministic, rule-based. Describes the human-run stages that move a lead
 * from first contact to an onboarded client. No auto-send, no provisioning,
 * no payments — every step is reviewed and executed by a person.
 */

import type {
  LeadIntelligenceProfile,
  LeadSegment,
} from "./leadIntelligenceTypes";

export type PlaybookStageId =
  | "identify"
  | "verify_contact"
  | "prepare_outreach"
  | "human_review"
  | "first_contact"
  | "share_audit"
  | "walkthrough"
  | "meeting"
  | "proposal"
  | "onboarding";

export interface PlaybookStage {
  id: PlaybookStageId;
  title: string;
  detail: string;
  /** True when a human must act/approve before anything leaves Veroxa. */
  requiresHumanReview: boolean;
  /** Why this stage matters for this specific lead (segment-aware). */
  rationale: string;
}

const STAGE_TITLES: Record<PlaybookStageId, string> = {
  identify: "Identify & score",
  verify_contact: "Verify public contact path",
  prepare_outreach: "Prepare outreach draft",
  human_review: "Human review",
  first_contact: "First contact",
  share_audit: "Share the free audit",
  walkthrough: "Audit walkthrough",
  meeting: "Meeting",
  proposal: "Proposal",
  onboarding: "Onboarding",
};

function segmentRationale(segment: LeadSegment): string {
  switch (segment) {
    case "no_online_presence_lead":
      return "Big, obvious gaps make a free audit an easy, welcome first value.";
    case "inconsistent_owner_managed_lead":
      return "Owner is likely time-poor — lead with taking work off their plate.";
    case "agency_spend_opportunity_lead":
      return "Be complementary, not competitive — never attack existing help.";
    case "ads_waste_risk_lead":
      return "Frame around making current efforts work harder, carefully.";
    case "strong_fit_pilot_lead":
      return "Reachable and improvable — move toward a small pilot.";
    case "already_strong_low_priority":
      return "Low urgency — nurture and revisit when a real gap appears.";
  }
}

/**
 * Build the ordered playbook for a lead. Lower-priority "already strong" leads
 * get a trimmed nurture-focused flow.
 */
export function buildConversionPlaybook(
  profile: LeadIntelligenceProfile,
): PlaybookStage[] {
  const rationale = segmentRationale(profile.segment);
  const stage = (
    id: PlaybookStageId,
    detail: string,
    requiresHumanReview: boolean,
  ): PlaybookStage => ({
    id,
    title: STAGE_TITLES[id],
    detail,
    requiresHumanReview,
    rationale,
  });

  if (profile.segment === "already_strong_low_priority") {
    return [
      stage("identify", "Scored as already strong — low priority for now.", false),
      stage(
        "verify_contact",
        "Note a public contact path for occasional, useful check-ins.",
        false,
      ),
      stage(
        "human_review",
        "Decide whether to nurture or park this lead for later.",
        true,
      ),
    ];
  }

  return [
    stage(
      "identify",
      "Confirm the segment, score, and top reasons make sense.",
      false,
    ),
    stage(
      "verify_contact",
      "Confirm a public/provided contact path — research manually if missing.",
      false,
    ),
    stage(
      "prepare_outreach",
      "Prepare a cautious, value-based first message (email/call/walk-in).",
      true,
    ),
    stage(
      "human_review",
      "A person reviews tone, claims, and accuracy before anything is sent.",
      true,
    ),
    stage(
      "first_contact",
      "Send/place the reviewed outreach manually — nothing auto-sends.",
      true,
    ),
    stage(
      "share_audit",
      "Share the free audit summary to open a real conversation.",
      true,
    ),
    stage(
      "walkthrough",
      "Offer a short walkthrough of the findings, at their pace.",
      true,
    ),
    stage(
      "meeting",
      "Schedule a meeting if there's genuine interest.",
      true,
    ),
    stage(
      "proposal",
      "Prepare a simple proposal focused on one or two clear improvements.",
      true,
    ),
    stage(
      "onboarding",
      "On a yes, begin the onboarding checklist (no auto-provisioning).",
      true,
    ),
  ];
}
