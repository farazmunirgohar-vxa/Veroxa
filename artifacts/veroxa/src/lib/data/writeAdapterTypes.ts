/**
 * writeAdapterTypes.ts — M023B
 *
 * Generic result envelopes and input types for the Veroxa write
 * adapter. The disabled adapter (this build) and the future dev
 * Supabase adapter (M023C) both implement these types.
 *
 * No runtime behavior. Types only.
 */

import type {
  FirstClientDirectionChannel,
  FirstClientDirectionFocus,
  FirstClientDirectionRequest,
  FirstClientDirectionStatus,
  FirstClientDirectionUrgency,
  FirstClientTeamReviewDecision,
  FirstClientUploadCategory,
  FirstClientUploadPriority,
  FirstClientUploadStatus,
  FirstClientUploadSubmission,
} from "@/lib/firstClient/firstClientContracts";

// ---- Result envelopes ------------------------------------------------

export interface WriteDisabledResult {
  ok: false;
  status: "disabled";
  /** Client-safe message. Never raw DB error text. */
  safeMessage: string;
  /** Human-readable reason for logs / readiness UI. */
  reason: string;
}

export interface WriteFailureResult {
  ok: false;
  status: "failure";
  safeMessage: string;
  retryable: boolean;
}

export interface WriteSuccessResult<T> {
  ok: true;
  status: "success";
  data: T;
}

export type WriteResult<T> =
  | WriteDisabledResult
  | WriteFailureResult
  | WriteSuccessResult<T>;

// ---- Input types -----------------------------------------------------

export interface CreateUploadSubmissionInput {
  restaurantId: string;
  uploadKeyId: string | null;
  category: FirstClientUploadCategory;
  priority: FirstClientUploadPriority;
  /** Sanitized client-side before the call. */
  note: string | null;
  submittedByLabel: string | null;
}

export interface CreateDirectionRequestInput {
  restaurantId: string;
  focus: FirstClientDirectionFocus;
  channel: FirstClientDirectionChannel;
  urgency: FirstClientDirectionUrgency;
  title: string;
  /** Sanitized client-side before the call. */
  clientNote: string;
  preferredTimingLabel: string;
  relatedMediaId: string | null;
  avoidItem: string | null;
}

export interface UpdateUploadReviewStatusInput {
  submissionId: string;
  nextStatus: FirstClientUploadStatus;
  internalNote: string | null;
}

export interface UpdateDirectionStatusInput {
  directionId: string;
  nextStatus: FirstClientDirectionStatus;
  internalNote: string | null;
}

export interface CreateTeamReviewDecisionInput {
  restaurantId: string;
  targetType: "upload_submission" | "direction_request" | "content_workflow_item";
  targetId: string;
  decision: string;
  safeClientStatus: string;
  internalNote: string | null;
}

// ---- Adapter shape ---------------------------------------------------

export interface VeroxaWriteAdapter {
  createUploadSubmission(
    input: CreateUploadSubmissionInput,
  ): Promise<WriteResult<FirstClientUploadSubmission>>;
  createDirectionRequest(
    input: CreateDirectionRequestInput,
  ): Promise<WriteResult<FirstClientDirectionRequest>>;
  updateUploadReviewStatus(
    input: UpdateUploadReviewStatusInput,
  ): Promise<WriteResult<{ submissionId: string; status: FirstClientUploadStatus; updatedAt: string }>>;
  updateDirectionStatus(
    input: UpdateDirectionStatusInput,
  ): Promise<WriteResult<{ directionId: string; status: FirstClientDirectionStatus; updatedAt: string }>>;
  createTeamReviewDecision(
    input: CreateTeamReviewDecisionInput,
  ): Promise<WriteResult<FirstClientTeamReviewDecision>>;
}
