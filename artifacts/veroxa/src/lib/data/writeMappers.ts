/**
 * writeMappers.ts — M023C
 *
 * Centralize mapping from app input types to Supabase row shapes.
 *
 * NO Supabase calls here. NO network. NO file data. NO raw filenames.
 * Notes are sanitized (email / phone-like / @handle redaction, length
 * capped) as defense-in-depth even though page-level inputs are
 * already sanitized.
 */

import type {
  CreateDirectionRequestInput,
  CreateTeamReviewDecisionInput,
  CreateUploadSubmissionInput,
} from "./writeAdapterTypes";

const NOTE_MAX_LENGTH = 500;

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /(?:\+?\d[\s.\-()]?){7,}\d/g;
const HANDLE_RE = /(^|[\s(])@[A-Za-z0-9_.]{2,}/g;

export function sanitizeNote(input: string | null | undefined): string | null {
  if (input == null) return null;
  let s = String(input);
  s = s.replace(EMAIL_RE, "[redacted-email]");
  s = s.replace(PHONE_RE, "[redacted-phone]");
  s = s.replace(HANDLE_RE, (m, lead: string) => `${lead}[redacted-handle]`);
  s = s.trim();
  if (s.length > NOTE_MAX_LENGTH) {
    s = s.slice(0, NOTE_MAX_LENGTH);
  }
  return s.length === 0 ? null : s;
}

export interface UploadSubmissionRow {
  restaurant_id: string;
  upload_key_id: string | null;
  category: string;
  priority: string;
  note: string | null;
  submitted_by_label: string | null;
  status: "received";
}

export function mapUploadSubmissionToRow(
  input: CreateUploadSubmissionInput,
): UploadSubmissionRow {
  return {
    restaurant_id: input.restaurantId,
    upload_key_id: input.uploadKeyId,
    category: input.category,
    priority: input.priority,
    note: sanitizeNote(input.note),
    submitted_by_label: input.submittedByLabel,
    status: "received",
  };
}

export interface DirectionRequestRow {
  restaurant_id: string;
  focus: string;
  channel: string;
  urgency: string;
  title: string;
  client_note: string | null;
  preferred_timing_label: string;
  related_media_id: string | null;
  avoid_item: string | null;
  status: "received";
}

export function mapDirectionRequestToRow(
  input: CreateDirectionRequestInput,
): DirectionRequestRow {
  return {
    restaurant_id: input.restaurantId,
    focus: input.focus,
    channel: input.channel,
    urgency: input.urgency,
    title: input.title.slice(0, 200),
    client_note: sanitizeNote(input.clientNote),
    preferred_timing_label: input.preferredTimingLabel,
    related_media_id: input.relatedMediaId,
    avoid_item: input.avoidItem ? input.avoidItem.slice(0, 200) : null,
    status: "received",
  };
}

export interface TeamReviewDecisionRow {
  restaurant_id: string;
  target_type: CreateTeamReviewDecisionInput["targetType"];
  target_id: string;
  decision: string;
  safe_client_status: string;
  internal_note: string | null;
}

export function mapTeamReviewDecisionToRow(
  input: CreateTeamReviewDecisionInput,
): TeamReviewDecisionRow {
  return {
    restaurant_id: input.restaurantId,
    target_type: input.targetType,
    target_id: input.targetId,
    decision: input.decision,
    safe_client_status: input.safeClientStatus,
    internal_note: sanitizeNote(input.internalNote),
  };
}
