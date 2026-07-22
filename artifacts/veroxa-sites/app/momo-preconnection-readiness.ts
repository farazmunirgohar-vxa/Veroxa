export type MomoPreconnectionEvidence = {
  clientBundleIsolated: boolean;
  clientSnapshotAllowlisted: boolean;
  releaseTestsAttested: boolean;
  imageEditRendered: boolean;
  renditionLineagePersisted: boolean;
  mediaPlacementContractReady: boolean;
  aiContractRehearsed: boolean;
  multiChannelPublicationRehearsed: boolean;
  publicationFailureMatrixRehearsed: boolean;
  seoBaselinePersisted: boolean;
  seoChangePlanPersisted: boolean;
  trackingMatrixRehearsed: boolean;
  metricsContractRehearsed: boolean;
  automationLifecycleTested: boolean;
  developmentEvidenceIsolated: boolean;
  specificConsentBoundaryReady: boolean;
  growthEvidenceManifestExact: boolean;
  cacheTtlAutomationReady: boolean;
  ownerHandoffContractReady: boolean;
  runtimeControlsLocked: boolean;
  externalConnectionsInactive: boolean;
  activationRemainsBlocked: boolean;
};

export type MomoPreconnectionReadiness = {
  status: "pass" | "blocked";
  canRequestOwnerAccess: boolean;
  canActivate: false;
  checks: Array<{ key: keyof MomoPreconnectionEvidence; passed: boolean; label: string }>;
  blockers: string[];
};

const LABELS: Record<keyof MomoPreconnectionEvidence, string> = {
  clientBundleIsolated: "Client route excludes Team internals",
  clientSnapshotAllowlisted: "Client data is allowlisted",
  releaseTestsAttested: "Release tests are tied to stored artifact hashes",
  imageEditRendered: "An image edit was rendered and its private stored bytes were verified",
  renditionLineagePersisted: "Rendition lineage is durable",
  mediaPlacementContractReady: "Edited media can be attached and tracked safely",
  aiContractRehearsed: "The provider-neutral AI output contract is grounded and Team-only",
  multiChannelPublicationRehearsed: "Facebook, Instagram, and Google publication adapters are rehearsed",
  publicationFailureMatrixRehearsed: "Every publication adapter passed success, retry, and dead-letter tests",
  seoBaselinePersisted: "Public SEO evidence is durable",
  seoChangePlanPersisted: "An SEO change plan and rollback are durable",
  trackingMatrixRehearsed: "PII-screened tracking contracts cover every Momo channel",
  metricsContractRehearsed: "Synthetic metrics normalization and safe aggregation are rehearsed",
  automationLifecycleTested: "Queue, schedule denial, retry, recovery, and activity contracts are tested",
  developmentEvidenceIsolated: "Development evidence is blocked from live use",
  specificConsentBoundaryReady: "Exact owner consent is required for each external action",
  growthEvidenceManifestExact: "The versioned release evidence manifest matches exactly",
  cacheTtlAutomationReady: "External platform cache expiry is automated",
  ownerHandoffContractReady: "Verified-owner authority and account handoff are tested",
  runtimeControlsLocked: "Every live external-write control remains locked",
  externalConnectionsInactive: "External accounts remain disconnected",
  activationRemainsBlocked: "Production activation remains blocked",
};

export function evaluateMomoPreconnectionReadiness(evidence: MomoPreconnectionEvidence): MomoPreconnectionReadiness {
  const checks = (Object.keys(LABELS) as Array<keyof MomoPreconnectionEvidence>).map((key) => ({ key, passed: evidence[key], label: LABELS[key] }));
  const blockers = checks.filter((item) => !item.passed).map((item) => item.label);
  return {
    status: blockers.length === 0 ? "pass" : "blocked",
    canRequestOwnerAccess: blockers.length === 0,
    canActivate: false,
    checks,
    blockers,
  };
}
