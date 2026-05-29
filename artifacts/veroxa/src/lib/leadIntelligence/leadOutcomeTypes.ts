/**
 * leadOutcomeTypes.ts — what actually happened after a human reached out.
 *
 * SAFETY / SCOPE:
 *   - These records describe REAL, human-executed outreach outcomes the team
 *     logs manually. Nothing here sends, calls, texts, or schedules anything.
 *   - Outcomes feed the self-improving engine (learning signals + cautious
 *     score adjustments). They are internal-only and never client-visible.
 *   - Language stays cautious: a paid-service signal is "possible", a lead that
 *     didn't convert is not "bad", and nothing is ever a guaranteed pattern.
 */

import type { LeadSegment, OutreachChannel } from "./leadIntelligenceTypes";
import type { ObjectionType } from "./leadObjectionPatterns";

/** Whether the lead responded to a human-sent outreach attempt. */
export type OutreachResponseStatus =
  | "no_response"
  | "responded_positive"
  | "responded_neutral"
  | "responded_negative"
  | "bounced_or_wrong_contact";

export const OUTREACH_RESPONSE_LABELS: Record<OutreachResponseStatus, string> = {
  no_response: "No response",
  responded_positive: "Responded — positive",
  responded_neutral: "Responded — neutral",
  responded_negative: "Responded — not now",
  bounced_or_wrong_contact: "Wrong contact / bounced",
};

/** The furthest stage a lead reached after outreach began. */
export type LeadOutcomeStage =
  | "not_contacted"
  | "contacted"
  | "conversation_started"
  | "audit_shared"
  | "walkthrough_booked"
  | "meeting_held"
  | "proposal_sent"
  | "won"
  | "lost"
  | "parked";

export const LEAD_OUTCOME_STAGE_LABELS: Record<LeadOutcomeStage, string> = {
  not_contacted: "Not contacted",
  contacted: "Contacted",
  conversation_started: "Conversation started",
  audit_shared: "Audit shared",
  walkthrough_booked: "Walkthrough booked",
  meeting_held: "Meeting held",
  proposal_sent: "Proposal sent",
  won: "Won",
  lost: "Lost",
  parked: "Parked",
};

/** Ordered ranking of outcome stages, for "furthest reached" comparisons. */
export const LEAD_OUTCOME_STAGE_ORDER: LeadOutcomeStage[] = [
  "not_contacted",
  "contacted",
  "conversation_started",
  "audit_shared",
  "walkthrough_booked",
  "meeting_held",
  "proposal_sent",
  "won",
];

/**
 * A single logged outreach outcome for a lead. Production-shaped: stable id,
 * timestamps, and explicit segment/angle/channel so the learning layer can
 * group by any of them later (and a backend table can mirror this 1:1).
 */
export interface LeadOutcomeRecord {
  id: string;
  /** The lead this outcome belongs to (AuditLeadRecord.id when available). */
  leadId: string;
  createdAt: string;
  updatedAt: string;

  /** Snapshot of how the lead was classified at outreach time. */
  segment: LeadSegment;
  /** The outreach angle id used (see outreachDraftEngine angle ids). */
  outreachAngleId?: string;
  /** The channel a human actually used. */
  channel?: OutreachChannel;

  responseStatus: OutreachResponseStatus;
  /** Furthest stage this lead reached. */
  stageReached: LeadOutcomeStage;
  /** The objection observed, if any (cautious, human-judged). */
  objection?: ObjectionType;

  /**
   * The overall conversion-opportunity score this lead had when it was scored,
   * captured so the engine can compare predicted vs. actual without re-deriving.
   */
  predictedOpportunityAtOutreach?: number;

  /** Optional free-text note from the team member. Internal only. */
  note?: string;
  /** Who logged it (free text initials/name). Internal only. */
  loggedBy?: string;
}

/** Fields needed to create a new outcome record (ids/timestamps added by store). */
export interface CreateLeadOutcomeInput {
  leadId: string;
  segment: LeadSegment;
  outreachAngleId?: string;
  channel?: OutreachChannel;
  responseStatus: OutreachResponseStatus;
  stageReached: LeadOutcomeStage;
  objection?: ObjectionType;
  predictedOpportunityAtOutreach?: number;
  note?: string;
  loggedBy?: string;
}

/** A "win" for learning purposes — reached a real conversion-ish milestone. */
export function isPositiveOutcome(stage: LeadOutcomeStage): boolean {
  return (
    stage === "walkthrough_booked" ||
    stage === "meeting_held" ||
    stage === "proposal_sent" ||
    stage === "won"
  );
}

/** A meeting-or-better milestone, used for meeting-rate learning. */
export function isMeetingOrBetter(stage: LeadOutcomeStage): boolean {
  return (
    stage === "walkthrough_booked" ||
    stage === "meeting_held" ||
    stage === "proposal_sent" ||
    stage === "won"
  );
}

export function stageRank(stage: LeadOutcomeStage): number {
  const i = LEAD_OUTCOME_STAGE_ORDER.indexOf(stage);
  return i === -1 ? 0 : i;
}
