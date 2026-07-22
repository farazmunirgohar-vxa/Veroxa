export type MomoMediaWorkflowAction =
  | "upload"
  | "confirm_rights"
  | "team_review"
  | "improve"
  | "ready";

export type MomoMediaWorkflow = {
  uploaded: boolean;
  rightsConfirmed: boolean;
  reviewApproved: boolean;
  improvementReady: boolean;
  ready: boolean;
  nextAction: MomoMediaWorkflowAction;
};

export function momoMediaReviewCanSave(input: {
  hasRights: boolean;
  previewRendered: boolean;
  inspectionConfirmed: boolean;
  notes: string;
}): boolean {
  return input.hasRights
    && input.previewRendered
    && input.inspectionConfirmed
    && input.notes.trim().length >= 10;
}

export function momoRenditionMatchesCurrentEvidence(input: {
  assetId: string;
  assetContentSha256: string;
  rightsEvidenceClass?: string | null;
  usageScope: string[];
  sourceKind: string;
  sourceAssetId?: string | null;
  sourceKey: string;
  sourceContentSha256: string;
  intendedUse: string;
  renditionEvidenceClass: string;
  renditionStatus: string;
  externalWriteAllowed: boolean;
}): boolean {
  return input.assetId.length > 0
    && input.assetContentSha256.length > 0
    && Boolean(input.rightsEvidenceClass)
    && input.sourceKind === "owner_asset"
    && input.sourceAssetId === input.assetId
    && input.sourceKey === input.assetId
    && input.sourceContentSha256 === input.assetContentSha256
    && input.usageScope.includes(input.intendedUse)
    && input.renditionEvidenceClass === input.rightsEvidenceClass
    && input.renditionStatus === "ready"
    && input.externalWriteAllowed === false;
}

export function resolveMomoMediaWorkflow(input: {
  hasAsset: boolean;
  assetStatus?: string | null;
  rightsStatus?: string | null;
  rightsValidFrom?: string | null;
  rightsExpiresAt?: string | null;
  reviewStatus?: string | null;
  publicUseApproved?: boolean;
  renditionStatus?: string | null;
  now?: number;
}): MomoMediaWorkflow {
  const uploaded = input.hasAsset;
  const now = input.now ?? Date.now();
  const validFrom = input.rightsValidFrom ? Date.parse(input.rightsValidFrom) : null;
  const expiresAt = input.rightsExpiresAt ? Date.parse(input.rightsExpiresAt) : null;
  const rightsWindowOpen = (validFrom === null || (Number.isFinite(validFrom) && validFrom <= now))
    && (expiresAt === null || (Number.isFinite(expiresAt) && expiresAt > now));
  const rightsConfirmed = uploaded && input.rightsStatus === "confirmed" && rightsWindowOpen;
  const reviewApproved = rightsConfirmed
    && input.assetStatus === "ready_to_use"
    && input.reviewStatus === "approved"
    && input.publicUseApproved === true;
  const improvementReady = reviewApproved && input.renditionStatus === "ready";
  const ready = uploaded && rightsConfirmed && reviewApproved && improvementReady;
  const nextAction: MomoMediaWorkflowAction = !uploaded
    ? "upload"
    : !rightsConfirmed
      ? "confirm_rights"
      : !reviewApproved
        ? "team_review"
        : !improvementReady
          ? "improve"
          : "ready";

  return {
    uploaded,
    rightsConfirmed,
    reviewApproved,
    improvementReady,
    ready,
    nextAction,
  };
}
