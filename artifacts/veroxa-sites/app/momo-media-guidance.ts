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

export type MomoMediaReviewSaveInput = {
  hasCurrentRealOwnerRights: boolean;
  verifiedBytes: boolean;
  platformReadyOriginal: boolean;
  previewRendered: boolean;
  inspectionConfirmed: boolean;
  notes: string;
  qualityScore: number | null;
  publicUseApproved: boolean;
};

export function momoMediaReviewSaveBlockers(input: MomoMediaReviewSaveInput): string[] {
  const blockers: string[] = [];
  if (!input.hasCurrentRealOwnerRights) blockers.push("Current real-owner media rights are required.");
  if (!input.verifiedBytes) blockers.push("Server byte verification must finish first.");
  if (!input.previewRendered) blockers.push("Open the private preview and wait for it to render.");
  if (!input.inspectionConfirmed) blockers.push("Confirm that you inspected the rendered private preview.");
  if (input.notes.trim().length < 10) blockers.push("Add at least 10 characters of visible quality notes.");
  if (!Number.isInteger(input.qualityScore) || input.qualityScore === null || input.qualityScore < 0 || input.qualityScore > 100) {
    blockers.push("Enter a Team quality score from 0 to 100.");
  }
  if (input.publicUseApproved && input.qualityScore !== null && input.qualityScore < 80) {
    blockers.push("Public-use acceptance requires a Team quality score of at least 80.");
  }
  if (input.publicUseApproved && !input.platformReadyOriginal) {
    blockers.push("The exact original must meet the Instagram, Facebook, and Google image profile before content preparation.");
  }
  return blockers;
}

export function momoMediaReviewCanSave(input: MomoMediaReviewSaveInput): boolean {
  return momoMediaReviewSaveBlockers(input).length === 0;
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
