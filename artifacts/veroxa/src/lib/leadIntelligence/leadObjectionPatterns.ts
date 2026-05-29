/**
 * leadObjectionPatterns.ts — the objections Veroxa sees and how to respond.
 *
 * SAFETY / SCOPE:
 *   - Deterministic, rule-based reference data. No network, no writes.
 *   - Rebuttal guidance is cautious and respectful: never pushy, never a
 *     guarantee, never criticism of a current vendor/agency or of the owner.
 *   - These are PREPARATION notes for a human. The human decides what to say
 *     and always reviews before any outreach. Nothing here auto-sends.
 */

/** The objection types Veroxa commonly encounters on outreach. */
export type ObjectionType =
  | "price"
  | "already_has_agency"
  | "no_time"
  | "not_interested"
  | "wants_guarantees"
  | "needs_partner_approval"
  | "bad_past_experience"
  | "wants_ads_only"
  | "interested_later"
  | "no_response"
  | "wrong_contact";

export const OBJECTION_LABELS: Record<ObjectionType, string> = {
  price: "Price / budget concern",
  already_has_agency: "Already has an agency / vendor",
  no_time: "No time to deal with it",
  not_interested: "Not interested right now",
  wants_guarantees: "Wants guaranteed results",
  needs_partner_approval: "Needs a partner / owner to approve",
  bad_past_experience: "Bad past experience with marketing help",
  wants_ads_only: "Only wants ads, not management",
  interested_later: "Interested, but later",
  no_response: "No response yet",
  wrong_contact: "Reached the wrong contact",
};

/**
 * Cautious response guidance for a single objection. Every field is a
 * preparation note for a human reviewer — not a script to fire automatically.
 */
export interface ObjectionPlaybookEntry {
  type: ObjectionType;
  label: string;
  /** What the lead is really signalling (read charitably). */
  whatItUsuallyMeans: string;
  /** A calm, respectful framing the team can adapt. Never pushy. */
  cautiousResponseAngle: string;
  /** Concrete things NOT to say — keeps the team inside the guardrails. */
  avoid: string[];
  /** A safe, low-pressure next step that keeps the door open. */
  suggestedNextStep: string;
}

export const OBJECTION_PLAYBOOK: Record<ObjectionType, ObjectionPlaybookEntry> = {
  price: {
    type: "price",
    label: OBJECTION_LABELS.price,
    whatItUsuallyMeans:
      "They are unsure the value is worth the spend yet, or budget is tight.",
    cautiousResponseAngle:
      "Lead with the free audit and one small, clear improvement — let value come before any price conversation.",
    avoid: [
      "Pressuring on price or discounting to close.",
      "Promising a specific return to justify the cost.",
    ],
    suggestedNextStep:
      "Offer the free audit summary so they can judge the value at no risk.",
  },
  already_has_agency: {
    type: "already_has_agency",
    label: OBJECTION_LABELS.already_has_agency,
    whatItUsuallyMeans:
      "They have existing help and don't want a conflict or a sales fight.",
    cautiousResponseAngle:
      "Be complementary, never competitive. Offer a neutral second look that could make their current efforts work harder.",
    avoid: [
      "Any criticism of their current agency or vendor.",
      "Suggesting their current help is failing or wasting money.",
    ],
    suggestedNextStep:
      "Offer the audit as a friendly second opinion they can share with whoever helps them.",
  },
  no_time: {
    type: "no_time",
    label: OBJECTION_LABELS.no_time,
    whatItUsuallyMeans:
      "They are busy running the floor — bandwidth, not disinterest.",
    cautiousResponseAngle:
      "Acknowledge how busy a restaurant is and frame Veroxa as taking work off their plate, on their schedule.",
    avoid: ["Asking for a long meeting up front.", "Adding pressure to decide now."],
    suggestedNextStep:
      "Offer to send the short summary so they can glance at it whenever suits.",
  },
  not_interested: {
    type: "not_interested",
    label: OBJECTION_LABELS.not_interested,
    whatItUsuallyMeans:
      "Timing or fit feels off, or the message didn't land as useful.",
    cautiousResponseAngle:
      "Respect the no, leave value behind, and keep the door open without pushing.",
    avoid: ["Trying to overcome the no.", "Repeated follow-ups after a clear no."],
    suggestedNextStep:
      "Thank them, leave the audit offer open, and note to revisit much later only if appropriate.",
  },
  wants_guarantees: {
    type: "wants_guarantees",
    label: OBJECTION_LABELS.wants_guarantees,
    whatItUsuallyMeans:
      "They've been burned by big promises and want certainty.",
    cautiousResponseAngle:
      "Be honest that no one can guarantee outcomes; offer a small, low-risk first step instead of a promise.",
    avoid: [
      "Promising walk-ins, sales, rankings, or any specific result.",
      "Implying results are certain.",
    ],
    suggestedNextStep:
      "Propose a small pilot focused on one clear improvement they can judge for themselves.",
  },
  needs_partner_approval: {
    type: "needs_partner_approval",
    label: OBJECTION_LABELS.needs_partner_approval,
    whatItUsuallyMeans:
      "There is another decision-maker who needs to be included.",
    cautiousResponseAngle:
      "Make it easy to share — give them a clean, simple summary they can pass along.",
    avoid: ["Going around the contact.", "Pressuring for a decision before the partner sees it."],
    suggestedNextStep:
      "Send a shareable audit summary and offer a short walkthrough for both when convenient.",
  },
  bad_past_experience: {
    type: "bad_past_experience",
    label: OBJECTION_LABELS.bad_past_experience,
    whatItUsuallyMeans:
      "A previous provider let them down — trust is the real barrier.",
    cautiousResponseAngle:
      "Acknowledge the experience, ask what went wrong, and lead with proof of value before any commitment.",
    avoid: [
      "Criticising the previous provider.",
      "Over-promising to win back trust.",
    ],
    suggestedNextStep:
      "Offer the free audit and a small, reversible first step — no long commitment.",
  },
  wants_ads_only: {
    type: "wants_ads_only",
    label: OBJECTION_LABELS.wants_ads_only,
    whatItUsuallyMeans:
      "They equate growth with ad spend and may overlook the basics.",
    cautiousResponseAngle:
      "Gently note that ads work better when the basics behind them are strong — offer to check those first.",
    avoid: [
      "Dismissing ads.",
      "Claiming their ad spend is wasted.",
    ],
    suggestedNextStep:
      "Offer to review whether the basics supporting their promotions are solid.",
  },
  interested_later: {
    type: "interested_later",
    label: OBJECTION_LABELS.interested_later,
    whatItUsuallyMeans:
      "Genuine interest but the timing isn't right yet.",
    cautiousResponseAngle:
      "Agree on a respectful, specific time to revisit and leave something useful behind.",
    avoid: ["Vague 'I'll keep bugging you'.", "Frequent check-ins."],
    suggestedNextStep:
      "Note a future revisit date and share the audit so it's ready when they are.",
  },
  no_response: {
    type: "no_response",
    label: OBJECTION_LABELS.no_response,
    whatItUsuallyMeans:
      "The message may have been missed — not necessarily a no.",
    cautiousResponseAngle:
      "One light, value-led follow-up, then step back. Never chase.",
    avoid: ["Multiple rapid follow-ups.", "Guilt or urgency tactics."],
    suggestedNextStep:
      "Send a single gentle follow-up offering the summary, then pause.",
  },
  wrong_contact: {
    type: "wrong_contact",
    label: OBJECTION_LABELS.wrong_contact,
    whatItUsuallyMeans:
      "This person isn't the decision-maker for this.",
    cautiousResponseAngle:
      "Politely ask for the best person or contact, without pushing.",
    avoid: ["Pressing the wrong contact.", "Assuming or guessing private details."],
    suggestedNextStep:
      "Ask for the best public contact / email for whoever handles this.",
  },
};

/** Whether an objection is a hard no that should stop active outreach. */
export function isHardNoObjection(type: ObjectionType): boolean {
  return type === "not_interested";
}

export function getObjectionEntry(type: ObjectionType): ObjectionPlaybookEntry {
  return OBJECTION_PLAYBOOK[type];
}
