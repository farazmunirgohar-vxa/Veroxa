/**
 * contactPathEngine.ts — build a public-only contact-path checklist.
 *
 * SAFETY: Uses ONLY public/provided signals. Never scrapes private contact
 * details. Every path is a manual, human-executed step. When nothing public is
 * available, the path is "needs_manual_research" — never a guess at private
 * info.
 */

import {
  CONTACT_PATH_LABELS,
  CONTACT_PATH_QUALITY_LABELS,
  type ContactPath,
  type ContactPathQuality,
  type ContactPathQualityTier,
  type ContactPathType,
} from "./leadIntelligenceTypes";
import type { LeadIntelligenceInput } from "./leadScoringEngine";

function path(
  type: ContactPathType,
  confidence: ContactPath["confidence"],
  instruction: string,
  valueProvided: boolean,
  knownValue?: string,
): ContactPath {
  return {
    type,
    label: CONTACT_PATH_LABELS[type],
    confidence,
    instruction,
    valueProvided,
    knownValue,
  };
}

/**
 * Build an ordered contact-path checklist from public/provided signals only.
 * The order reflects the most direct, owner-respectful routes first.
 */
export function buildContactPaths(input: LeadIntelligenceInput): ContactPath[] {
  const paths: ContactPath[] = [];

  if (input.listedPhone) {
    paths.push(
      path(
        "business_phone",
        "available",
        "Call the listed business number during off-peak hours; ask for the owner/manager.",
        true,
        input.listedPhone,
      ),
    );
  } else if (input.hasGoogleListing) {
    paths.push(
      path(
        "google_profile_phone",
        "likely",
        "Check the Google Business profile for a public phone number, then call off-peak.",
        false,
      ),
    );
  }

  if (input.websiteEmailProvided) {
    paths.push(
      path(
        "website_email",
        "available",
        "Email the public business address with a short, value-based note (human-sent).",
        true,
      ),
    );
  } else if (input.websiteFound) {
    paths.push(
      path(
        "website_contact_form",
        "likely",
        "Look for a public contact form or email on the website's contact page.",
        false,
      ),
    );
  }

  if (input.publicOwnerOrManagerName) {
    paths.push(
      path(
        "public_owner_or_manager_name",
        "available",
        "Reference the publicly listed owner/manager name to personalise outreach.",
        true,
        input.publicOwnerOrManagerName,
      ),
    );
  }

  if (input.hasInstagram) {
    paths.push(
      path(
        "instagram_contact",
        "likely",
        "Send a short, respectful public Instagram message — no spam, no pressure.",
        false,
      ),
    );
  }
  if (input.hasFacebook) {
    paths.push(
      path(
        "facebook_contact",
        "likely",
        "Use the public Facebook page message option with a brief, friendly note.",
        false,
      ),
    );
  }
  if (input.linkedinPublicProfileProvided) {
    paths.push(
      path(
        "linkedin_public_profile",
        "likely",
        "Connect via the public LinkedIn profile with a personalised note.",
        false,
      ),
    );
  }

  if (paths.length === 0) {
    paths.push(
      path(
        "needs_manual_research",
        "needs_research",
        "No public contact path found yet — research a public number/email manually before outreach.",
        false,
      ),
    );
  }

  return paths;
}

/** Relative quality weight per path type (a direct phone beats a DM). */
const PATH_TYPE_WEIGHT: Record<ContactPathType, number> = {
  business_phone: 30,
  public_owner_or_manager_name: 22,
  website_email: 20,
  google_profile_phone: 18,
  website_contact_form: 12,
  linkedin_public_profile: 12,
  instagram_contact: 8,
  facebook_contact: 8,
  needs_manual_research: 0,
};

const CONFIDENCE_MULTIPLIER: Record<ContactPath["confidence"], number> = {
  available: 1,
  likely: 0.6,
  needs_research: 0,
};

function qualityTier(
  score: number,
  usablePathCount: number,
): ContactPathQualityTier {
  if (usablePathCount === 0) return "needs_research";
  if (score >= 60) return "strong";
  if (score >= 35) return "workable";
  return "thin";
}

/**
 * Score how good the route to a real decision-maker looks, using ONLY public/
 * provided paths. Returns a recommended first method and a manual verification
 * checklist a human must complete before any outreach. Never auto-acts.
 */
export function computeContactPathQuality(
  input: LeadIntelligenceInput,
  paths?: ContactPath[],
): ContactPathQuality {
  const built = paths ?? buildContactPaths(input);
  const usable = built.filter((p) => p.confidence !== "needs_research");

  let raw = 0;
  for (const p of usable) {
    raw += PATH_TYPE_WEIGHT[p.type] * CONFIDENCE_MULTIPLIER[p.confidence];
  }
  // Reaching an actual decision-maker matters: a named owner/manager or a
  // warm/known-reachable owner lifts quality.
  if (input.publicOwnerOrManagerName) raw += 10;
  if (input.warmRelationship) raw += 12;
  if (input.ownerReachability === "high") raw += 8;
  else if (input.ownerReachability === "medium") raw += 4;

  const score = Math.max(0, Math.min(100, Math.round(raw)));

  // Recommended first method: highest-weighted usable path.
  const ranked = [...usable].sort(
    (a, b) =>
      PATH_TYPE_WEIGHT[b.type] * CONFIDENCE_MULTIPLIER[b.confidence] -
      PATH_TYPE_WEIGHT[a.type] * CONFIDENCE_MULTIPLIER[a.confidence],
  );
  const first = ranked[0];

  const tier = qualityTier(score, usable.length);

  const checklist: string[] = [
    "Confirm the contact path is current and publicly listed (no private scraping).",
    "Confirm you are reaching the owner/manager or the right person to ask.",
  ];
  if (!input.publicOwnerOrManagerName) {
    checklist.push("Find the decision-maker's name from public sources if possible.");
  }
  if (usable.length === 0) {
    checklist.push(
      "No usable public path yet — research a public number/email before any outreach.",
    );
  }
  checklist.push("Have a human review the draft before sending — nothing auto-sends.");

  const summary =
    usable.length === 0
      ? "No usable public contact path yet — manual research is required first."
      : `${tier === "strong" ? "A clear" : tier === "workable" ? "A workable" : "A thin"} public route exists (${usable.length} usable path${usable.length === 1 ? "" : "s"}). Verify manually before outreach.`;

  return {
    score,
    tier,
    tierLabel: CONTACT_PATH_QUALITY_LABELS[tier],
    recommendedFirstMethod: first?.type,
    recommendedFirstMethodLabel: first?.label,
    usablePathCount: usable.length,
    manualVerificationChecklist: checklist,
    summary,
  };
}
