/**
 * outreachDraftEngine.ts — deterministic, rule-based outreach drafts.
 *
 * SAFETY:
 *   - Drafts are PREPARED, never sent. A human reviews and sends manually.
 *   - Cautious, value-based language. Never claims confirmed agency spend,
 *     never criticises a current vendor, never guarantees results.
 *   - Uses only provided/observed signals. No invented metrics or claims.
 *
 * These drafts are the safe fallback that always works without the AI helper.
 * The AI draft path (server-side) sits alongside this and uses the same tone.
 */

import {
  OUTREACH_CHANNEL_LABELS,
  SEGMENT_OUTREACH_ANGLE_ID,
  type LeadIntelligenceProfile,
  type LeadSegment,
  type OutreachChannel,
  type OutreachDraft,
  type OutreachDraftSet,
} from "./leadIntelligenceTypes";

/** A channel draft before its segment angle id is attached. */
type DraftWithoutAngle = Omit<OutreachDraft, "angleId">;

const GUARDRAILS = [
  "Human review required before sending — nothing auto-sends.",
  "No guaranteed results (no promised walk-ins, sales, or rankings).",
  "Never claim confirmed marketing/agency spend — possible signals only.",
  "Never criticise a current agency, vendor, or staff member.",
  "Use only known/provided details — invent nothing.",
];

/** A short, segment-specific value hook used across channels. */
function valueHook(segment: LeadSegment, name: string): string {
  switch (segment) {
    case "no_online_presence_lead":
      return `helping ${name} show up online clearly and consistently`;
    case "inconsistent_owner_managed_lead":
      return `taking the day-to-day posting and profile upkeep off your plate`;
    case "agency_spend_opportunity_lead":
      return `tightening the small details that make your online presence work harder`;
    case "ads_waste_risk_lead":
      return `making sure the basics behind your promotions are pulling their weight`;
    case "strong_fit_pilot_lead":
      return `a short, focused improvement we could pilot together`;
    case "already_strong_low_priority":
      return `sharing the occasional idea that might be useful down the line`;
  }
}

function emailDraft(profile: LeadIntelligenceProfile): DraftWithoutAngle {
  const name = profile.restaurantName;
  const hook = valueHook(profile.segment, name);
  const where = profile.location ? ` in ${profile.location}` : "";
  return {
    channel: "email",
    label: OUTREACH_CHANNEL_LABELS.email,
    subject: `A quick idea for ${name}`,
    body: [
      `Hi there,`,
      ``,
      `I came across ${name}${where} and put together a quick, no-cost look at how the restaurant shows up online.`,
      ``,
      `If it's useful, I'd be glad to share what I found — the focus is ${hook}, at your pace and with no pressure.`,
      ``,
      `Would it be alright to send over the short summary?`,
      ``,
      `Thank you for your time,`,
      `[Your name] — Veroxa`,
    ].join("\n"),
  };
}

function followUpDraft(profile: LeadIntelligenceProfile): DraftWithoutAngle {
  const name = profile.restaurantName;
  return {
    channel: "follow_up_email",
    label: OUTREACH_CHANNEL_LABELS.follow_up_email,
    subject: `Following up — ${name}`,
    body: [
      `Hi again,`,
      ``,
      `Just floating my earlier note back up in case it got buried — no worries at all if now isn't the right time.`,
      ``,
      `If helpful, I can send the short audit summary for ${name} so you can glance at it whenever suits you.`,
      ``,
      `Happy to step back if you'd prefer I check in later instead.`,
      ``,
      `Best,`,
      `[Your name] — Veroxa`,
    ].join("\n"),
  };
}

function callOpenerDraft(profile: LeadIntelligenceProfile): DraftWithoutAngle {
  const name = profile.restaurantName;
  return {
    channel: "call_opener",
    label: OUTREACH_CHANNEL_LABELS.call_opener,
    body: [
      `Hi, is the owner or manager around? I'll keep it quick.`,
      ``,
      `My name's [Your name] with Veroxa — I help local restaurants show up better online. I took a quick look at ${name} and noticed a couple of small things that might be easy wins.`,
      ``,
      `Would it be alright if I sent over a short, free summary for you to look at when you have a minute?`,
    ].join("\n"),
    points: [
      "Ask for the owner/manager politely; respect a busy moment.",
      "Lead with a free, low-pressure summary — not a pitch.",
      "If now is bad, offer to call back at a better time.",
    ],
  };
}

function voicemailDraft(profile: LeadIntelligenceProfile): DraftWithoutAngle {
  const name = profile.restaurantName;
  return {
    channel: "voicemail",
    label: OUTREACH_CHANNEL_LABELS.voicemail,
    body: [
      `Hi, this is [Your name] with Veroxa. I put together a quick, free look at how ${name} shows up online and thought it might be useful.`,
      ``,
      `No pressure at all — if you'd like the short summary, you can reach me at [phone] or [email]. Thanks, and have a great day.`,
    ].join("\n"),
  };
}

function walkInDraft(profile: LeadIntelligenceProfile): DraftWithoutAngle {
  const name = profile.restaurantName;
  return {
    channel: "walk_in",
    label: OUTREACH_CHANNEL_LABELS.walk_in,
    body: [
      `Hi — I won't take much of your time. I'm [Your name] with Veroxa; we help local spots like ${name} show up better online.`,
      ``,
      `I did a quick free look and found a couple of small things that might help. Could I leave a short summary, or email it to whoever handles that?`,
    ].join("\n"),
    points: [
      "Visit during off-peak hours; never during a rush.",
      "Be brief and respectful; leave something useful behind.",
      "Ask for the best email/contact rather than pushing for a decision.",
    ],
  };
}

function meetingAgendaDraft(profile: LeadIntelligenceProfile): DraftWithoutAngle {
  const name = profile.restaurantName;
  return {
    channel: "meeting_agenda",
    label: OUTREACH_CHANNEL_LABELS.meeting_agenda,
    body: `Short audit walkthrough for ${name} (15–20 min, no obligation).`,
    points: [
      "Walk through what the free audit found (the basics first).",
      "Listen: how is posting and profile upkeep handled today?",
      "Highlight one or two clear, realistic improvements.",
      "Explain how Veroxa would take that work off their plate.",
      "Agree a small, optional next step — no pressure to commit.",
    ],
  };
}

const BUILDERS: Record<
  OutreachChannel,
  (profile: LeadIntelligenceProfile) => DraftWithoutAngle
> = {
  email: emailDraft,
  follow_up_email: followUpDraft,
  call_opener: callOpenerDraft,
  voicemail: voicemailDraft,
  walk_in: walkInDraft,
  meeting_agenda: meetingAgendaDraft,
};

/** Build a single channel draft. */
export function buildOutreachDraft(
  profile: LeadIntelligenceProfile,
  channel: OutreachChannel,
): OutreachDraft {
  const angleId = SEGMENT_OUTREACH_ANGLE_ID[profile.segment];
  return { ...BUILDERS[channel](profile), angleId };
}

/** Build the full set of rule-based outreach drafts for a lead. */
export function buildOutreachDraftSet(
  profile: LeadIntelligenceProfile,
): OutreachDraftSet {
  const channels: OutreachChannel[] = [
    "email",
    "follow_up_email",
    "call_opener",
    "voicemail",
    "walk_in",
    "meeting_agenda",
  ];
  const angleId = SEGMENT_OUTREACH_ANGLE_ID[profile.segment];
  return {
    restaurantName: profile.restaurantName,
    segment: profile.segment,
    angleId,
    drafts: channels.map((c) => ({ ...BUILDERS[c](profile), angleId })),
    guardrails: GUARDRAILS,
    humanReviewRequired: true,
  };
}
