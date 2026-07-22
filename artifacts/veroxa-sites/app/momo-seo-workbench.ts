import type { MomoEvidenceClass } from "./momo-evidence-boundary.ts";
import { evaluateMomoEvidenceUse } from "./momo-evidence-boundary.ts";
import { momoSha256 } from "./momo-media-workflow.ts";

export type MomoSeoPageEvidence = {
  url: string;
  observedAt: string;
  title: string;
  text: string;
  listedAddress?: string;
  listedHours?: string[];
  menuPrices?: string[];
  orderingClosed?: boolean;
};

export type MomoSeoFinding = {
  code: string;
  severity: "critical" | "high" | "medium" | "opportunity";
  title: string;
  evidenceUrl: string;
  evidence: string;
  recommendedAction: string;
};

export type MomoSeoChangePlan = {
  schemaVersion: "momo-seo-change-plan-v1";
  executionMode: "rehearsal";
  externalWriteAllowed: false;
  baselineSha256: string;
  proposedSha256: string;
  targetUrl: string;
  changes: Array<{ field: string; before: string | null; after: string; rationale: string }>;
  structuredDataDraft: Record<string, unknown>;
  rollbackSnapshot: Record<string, unknown>;
  blockedLiveReasons: string[];
};

const unique = <T,>(values: T[]) => [...new Set(values)];

export function analyzeMomoSeoEvidence(pages: MomoSeoPageEvidence[]): MomoSeoFinding[] {
  const findings: MomoSeoFinding[] = [];
  for (const page of pages) {
    if (/non live location/i.test(page.text)) findings.push({
      code: "non_live_location_banner",
      severity: "critical",
      title: "Public page says the restaurant location is not live",
      evidenceUrl: page.url,
      evidence: "The rendered public page contains a non-live location notice.",
      recommendedAction: "Confirm the location state with the owner, then remove or correct the notice before promotion.",
    });
    if (page.menuPrices?.some((price) => /^\$?0(?:\.00)?$/.test(price.trim()))) findings.push({
      code: "zero_price_menu_items",
      severity: "high",
      title: "Menu items display a zero price",
      evidenceUrl: page.url,
      evidence: "At least one public menu price is shown as $0.00.",
      recommendedAction: "Confirm real prices and correct the menu before sending search or social traffic.",
    });
    if (page.orderingClosed) findings.push({
      code: "ordering_closed",
      severity: "medium",
      title: "Online ordering is shown as closed",
      evidenceUrl: page.url,
      evidence: "The public menu indicates ordering is closed at observation time.",
      recommendedAction: "Verify whether this is schedule-based or a configuration problem and document the result.",
    });
    if (/\bbest\b/i.test(page.title)) findings.push({
      code: "unsupported_title_superlative",
      severity: "medium",
      title: "Page title uses an unsupported superlative",
      evidenceUrl: page.url,
      evidence: `Observed title: ${page.title}`,
      recommendedAction: "Use a clear local, cuisine-led title unless the owner supplies support for the superlative.",
    });
    if (page.title.length > 60) findings.push({
      code: "long_page_title",
      severity: "opportunity",
      title: "Page title is longer than a concise search title",
      evidenceUrl: page.url,
      evidence: `Observed ${page.title.length} characters.`,
      recommendedAction: "Draft a shorter restaurant, cuisine, and location title for owner review.",
    });
  }
  const hours = unique(pages.flatMap((page) => page.listedHours || []).filter(Boolean));
  if (hours.length > 1) findings.push({
    code: "conflicting_hours",
    severity: "critical",
    title: "Public pages list conflicting hours",
    evidenceUrl: pages.find((page) => page.listedHours?.length)?.url || pages[0]?.url || "",
    evidence: hours.join(" | "),
    recommendedAction: "Obtain one owner-confirmed hours schedule, then align the website and connected profiles.",
  });
  return findings.sort((left, right) => ["critical", "high", "medium", "opportunity"].indexOf(left.severity) - ["critical", "high", "medium", "opportunity"].indexOf(right.severity) || left.code.localeCompare(right.code));
}

export async function buildMomoSeoChangePlan(input: {
  pages: MomoSeoPageEvidence[];
  evidenceClass: MomoEvidenceClass;
  restaurantName: string;
  locality: string;
  cuisine: string;
  address: string;
}): Promise<MomoSeoChangePlan> {
  if (input.pages.length === 0) throw new Error("seo_baseline_required");
  const evidence = evaluateMomoEvidenceUse(input.evidenceClass, "preconnection_rehearsal");
  if (!evidence.allowed) throw new Error(evidence.code);
  const home = input.pages[0];
  const baseline = JSON.stringify(input.pages);
  const changes = [
    {
      field: "title",
      before: home.title || null,
      after: `${input.restaurantName} | ${input.cuisine} in ${input.locality}`.slice(0, 60),
      rationale: "Replace title stuffing and an unsupported superlative with a clear local description.",
    },
    {
      field: "meta_description",
      before: null,
      after: `Explore ${input.cuisine.toLowerCase()} from ${input.restaurantName} in ${input.locality}. View the menu, location details, and current ordering information.`.slice(0, 160),
      rationale: "Provide a concise local description without unverified ranking or performance claims.",
    },
  ];
  const structuredDataDraft = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: input.restaurantName,
    address: { "@type": "PostalAddress", streetAddress: input.address, addressLocality: input.locality },
    servesCuisine: input.cuisine,
    url: home.url,
  };
  const proposedSha256 = await momoSha256(JSON.stringify({ changes, structuredDataDraft }));
  return {
    schemaVersion: "momo-seo-change-plan-v1",
    executionMode: "rehearsal",
    externalWriteAllowed: false,
    baselineSha256: await momoSha256(baseline),
    proposedSha256,
    targetUrl: home.url,
    changes,
    structuredDataDraft,
    rollbackSnapshot: { title: home.title, pageEvidence: input.pages },
    blockedLiveReasons: [
      "real_owner_evidence_required",
      "website_access_not_authorized",
      "change_set_approval_required",
      "external_writes_disabled",
    ],
  };
}
