import { assertMomoEvidenceUse, type MomoEvidenceClass } from "./momo-evidence-boundary.ts";
import { momoSha256 } from "./momo-media-workflow.ts";

export type MomoRehearsalChannel = "facebook" | "instagram" | "google_business";
export type MomoRehearsalScenario = "success" | "transient_then_success" | "permanent_failure";

export type MomoPublicationRehearsalInput = {
  restaurantId: string;
  variantId: string;
  channel: MomoRehearsalChannel;
  caption: string;
  scheduledFor: string;
  timezone: "America/Chicago";
  media: Array<{ renditionId: string; contentSha256: string; altText: string }>;
  approvalSnapshotSha256: string;
  evidenceClass: MomoEvidenceClass;
  scenario?: MomoRehearsalScenario;
};

export type MomoPublicationAttempt = {
  number: number;
  state: "succeeded" | "retryable_failure" | "permanent_failure";
  code: string;
  nextAttemptAfterSeconds: number | null;
};

export type MomoPublicationRehearsalResult = {
  schemaVersion: "momo-publication-rehearsal-v1";
  executionMode: "rehearsal";
  externalWriteAllowed: false;
  payloadSnapshot: {
    schemaVersion: "momo-publication-rehearsal-v1";
    restaurantId: string;
    variantId: string;
    channel: MomoRehearsalChannel;
    caption: string;
    scheduledFor: string;
    timezone: "America/Chicago";
    media: Array<{ renditionId: string; contentSha256: string; altText: string }>;
    approvalSnapshotSha256: string;
  };
  payloadSha256: string;
  idempotencyKey: string;
  state: "completed" | "dead_letter";
  attempts: MomoPublicationAttempt[];
  simulatedReceipt: {
    accepted: boolean;
    channel: MomoRehearsalChannel;
    externalId: null;
    published: false;
    readbackVerified: false;
  };
};

const publicationPayload = (input: MomoPublicationRehearsalInput): MomoPublicationRehearsalResult["payloadSnapshot"] => ({
  schemaVersion: "momo-publication-rehearsal-v1",
  restaurantId: input.restaurantId,
  variantId: input.variantId,
  channel: input.channel,
  caption: input.caption.trim(),
  scheduledFor: input.scheduledFor,
  timezone: input.timezone,
  media: [...input.media].sort((left, right) => left.renditionId.localeCompare(right.renditionId)),
  approvalSnapshotSha256: input.approvalSnapshotSha256.toLowerCase(),
});

export function validateMomoPublicationRehearsal(input: MomoPublicationRehearsalInput): string[] {
  const problems: string[] = [];
  if (!input.restaurantId || !input.variantId) problems.push("scoped_subject_required");
  if (!input.caption.trim() || input.caption.trim().length > 2200) problems.push("valid_caption_required");
  if (!Number.isFinite(Date.parse(input.scheduledFor))) problems.push("valid_schedule_required");
  if (input.timezone !== "America/Chicago") problems.push("chicago_timezone_required");
  if (input.media.length === 0) problems.push("media_manifest_required");
  if (input.media.some((item) => !item.renditionId || !/^[a-f0-9]{64}$/i.test(item.contentSha256) || !item.altText.trim())) problems.push("valid_media_manifest_required");
  if (!/^[a-f0-9]{64}$/i.test(input.approvalSnapshotSha256)) problems.push("approval_snapshot_required");
  try { assertMomoEvidenceUse(input.evidenceClass, "preconnection_rehearsal"); } catch { problems.push("classified_evidence_required"); }
  return [...new Set(problems)];
}

export async function runMomoPublicationRehearsal(input: MomoPublicationRehearsalInput): Promise<MomoPublicationRehearsalResult> {
  const problems = validateMomoPublicationRehearsal(input);
  if (problems.length) throw new Error(problems.join(","));
  const payloadSnapshot = publicationPayload(input);
  const payloadSha256 = await momoSha256(JSON.stringify(payloadSnapshot));
  const scenario = input.scenario ?? "success";
  const attempts: MomoPublicationAttempt[] = scenario === "success"
    ? [{ number: 1, state: "succeeded", code: "simulated_acceptance", nextAttemptAfterSeconds: null }]
    : scenario === "transient_then_success"
      ? [
          { number: 1, state: "retryable_failure", code: "simulated_rate_limit", nextAttemptAfterSeconds: 60 },
          { number: 2, state: "succeeded", code: "simulated_acceptance", nextAttemptAfterSeconds: null },
        ]
      : [{ number: 1, state: "permanent_failure", code: "simulated_payload_rejection", nextAttemptAfterSeconds: null }];
  const completed = attempts.at(-1)?.state === "succeeded";
  return {
    schemaVersion: "momo-publication-rehearsal-v1",
    executionMode: "rehearsal",
    externalWriteAllowed: false,
    payloadSnapshot,
    payloadSha256,
    idempotencyKey: `momo-publication-rehearsal-v1:${scenario}:${payloadSha256}`,
    state: completed ? "completed" : "dead_letter",
    attempts,
    simulatedReceipt: {
      accepted: completed,
      channel: input.channel,
      externalId: null,
      published: false,
      readbackVerified: false,
    },
  };
}
