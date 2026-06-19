import type { ProfileFieldStatus } from "@/domain/liveAutomation/databaseTypes";

type ProfileFieldLike = {
  status?: unknown;
  value?: unknown;
  label?: unknown;
  section?: unknown;
};

export const CURRENT_PROFILE_FIELD_STATUSES: ProfileFieldStatus[] = [
  "please_review",
  "pre_filled",
  "confirmed",
  "optional",
  "veroxa_review",
];
export const UNCONFIRMED_BUSINESS_TRUTH_STATUSES: ProfileFieldStatus[] = [
  "please_review",
  "pre_filled",
  "veroxa_review",
];

export function isConfirmedProfileFieldStatus(
  status: unknown,
): status is "confirmed" {
  return status === "confirmed";
}

export function isOptionalProfileFieldStatus(
  status: unknown,
): status is "optional" {
  return status === "optional";
}

export function isReviewRequiredProfileFieldStatus(
  status: unknown,
): status is "please_review" | "pre_filled" | "veroxa_review" {
  return (
    status === "please_review" ||
    status === "pre_filled" ||
    status === "veroxa_review"
  );
}

export function isUnconfirmedBusinessTruthStatus(status: unknown): boolean {
  return isReviewRequiredProfileFieldStatus(status);
}

export function profileFieldHasValue(
  field: Pick<ProfileFieldLike, "value">,
): boolean {
  return String(field.value ?? "").trim().length > 0;
}

export function summarizeUnconfirmedBusinessTruthFields(
  fields: ProfileFieldLike[],
) {
  const confirmed = fields.filter(
    (field) =>
      isConfirmedProfileFieldStatus(field.status) &&
      profileFieldHasValue(field),
  );
  const optional = fields.filter((field) =>
    isOptionalProfileFieldStatus(field.status),
  );
  const reviewRequired = fields.filter((field) =>
    isReviewRequiredProfileFieldStatus(field.status),
  );
  const unresolved = fields.filter(
    (field) =>
      !isConfirmedProfileFieldStatus(field.status) &&
      !isOptionalProfileFieldStatus(field.status),
  );
  return {
    confirmed,
    optional,
    reviewRequired,
    unresolved,
    evidenceText: `${confirmed.length} confirmed field(s), ${reviewRequired.length} owner/team review required field(s), ${optional.length} optional field(s), and ${unresolved.length} unresolved/pending field(s).`,
  };
}
