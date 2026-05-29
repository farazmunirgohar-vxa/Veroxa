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
  type ContactPath,
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
