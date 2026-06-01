/**
 * devSupabaseWriteAdapter.ts — M023C
 *
 * The ONLY place in the codebase where Supabase runtime writes are
 * allowed. Uses the browser/anon Supabase client. No service role.
 * No storage upload. No file blobs. No FormData. No fetch.
 *
 * Every function:
 *   1. Calls `assertWritesAllowed()` first — so this code path is
 *      unreachable unless `VITE_VEROXA_ENABLE_DEV_WRITES === "true"`, `VITE_VEROXA_DEV_WRITE_ENV === "dev"`, and the build is non-production.
 *   2. Maps input via `writeMappers` (which sanitizes notes).
 *   3. Calls `supabase.from(...).insert(...)` or `.update(...)`.
 *   4. Returns a `WriteResult<T>`.
 *   5. Routes any error through `toSafeWriteFailure` — never leaks
 *      raw Postgres / Supabase error text to the caller.
 *
 * If the proposed tables do not exist yet, calls will fail with a
 * safe `failure` envelope. That is acceptable for this build; pages
 * keep working on local/session stores.
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  FirstClientDirectionRequest,
  FirstClientDirectionStatus,
  FirstClientTeamReviewDecision,
  FirstClientUploadStatus,
  FirstClientUploadSubmission,
} from "@/lib/firstClient/firstClientContracts";
import { assertWritesAllowed } from "./writeReadiness";
import type {
  CreateDirectionRequestInput,
  CreateTeamReviewDecisionInput,
  CreateUploadSubmissionInput,
  UpdateDirectionStatusInput,
  UpdateUploadReviewStatusInput,
  VeroxaWriteAdapter,
  WriteResult,
} from "./writeAdapterTypes";
import {
  mapDirectionRequestToRow,
  mapTeamReviewDecisionToRow,
  mapUploadSubmissionToRow,
} from "./writeMappers";
import { safeWriteFailure, toSafeWriteFailure } from "./writeErrors";

const NO_CLIENT_FAILURE_MESSAGE =
  "Dev writes are enabled but Supabase is not configured. Add Supabase env vars to use the dev write adapter.";

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }
  return client;
}

export const devSupabaseWriteAdapter: VeroxaWriteAdapter = {
  async createUploadSubmission(
    input: CreateUploadSubmissionInput,
  ): Promise<WriteResult<FirstClientUploadSubmission>> {
    assertWritesAllowed();
    const client = requireClient();
    if (!client) return safeWriteFailure(NO_CLIENT_FAILURE_MESSAGE, false);

    try {
      const row = mapUploadSubmissionToRow(input);
      const { data, error } = await client
        .from("upload_submissions")
        .insert(row)
        .select(
          "id, restaurant_id, upload_key_id, category, priority, note, submitted_by_label, status, created_at, updated_at",
        )
        .single();
      if (error) return toSafeWriteFailure(error, "createUploadSubmission");
      return {
        ok: true,
        status: "success",
        data: mapRowToUploadSubmission(data),
      };
    } catch (err) {
      return toSafeWriteFailure(err, "createUploadSubmission");
    }
  },

  async createDirectionRequest(
    input: CreateDirectionRequestInput,
  ): Promise<WriteResult<FirstClientDirectionRequest>> {
    assertWritesAllowed();
    const client = requireClient();
    if (!client) return safeWriteFailure(NO_CLIENT_FAILURE_MESSAGE, false);

    try {
      const row = mapDirectionRequestToRow(input);
      const { data, error } = await client
        .from("direction_requests")
        .insert(row)
        .select(
          "id, restaurant_id, focus, channel, urgency, title, client_note, preferred_timing_label, related_media_id, avoid_item, status, created_at, updated_at",
        )
        .single();
      if (error) return toSafeWriteFailure(error, "createDirectionRequest");
      return {
        ok: true,
        status: "success",
        data: mapRowToDirectionRequest(data),
      };
    } catch (err) {
      return toSafeWriteFailure(err, "createDirectionRequest");
    }
  },

  async updateUploadReviewStatus(
    input: UpdateUploadReviewStatusInput,
  ): Promise<
    WriteResult<{
      submissionId: string;
      status: FirstClientUploadStatus;
      updatedAt: string;
    }>
  > {
    assertWritesAllowed();
    const client = requireClient();
    if (!client) return safeWriteFailure(NO_CLIENT_FAILURE_MESSAGE, false);

    try {
      const { data, error } = await client
        .from("upload_submissions")
        .update({ status: input.nextStatus })
        .eq("id", input.submissionId)
        .select("id, status, updated_at")
        .single();
      if (error) return toSafeWriteFailure(error, "updateUploadReviewStatus");
      return {
        ok: true,
        status: "success",
        data: {
          submissionId: String(data.id),
          status: data.status as FirstClientUploadStatus,
          updatedAt: String(data.updated_at),
        },
      };
    } catch (err) {
      return toSafeWriteFailure(err, "updateUploadReviewStatus");
    }
  },

  async updateDirectionStatus(
    input: UpdateDirectionStatusInput,
  ): Promise<
    WriteResult<{
      directionId: string;
      status: FirstClientDirectionStatus;
      updatedAt: string;
    }>
  > {
    assertWritesAllowed();
    const client = requireClient();
    if (!client) return safeWriteFailure(NO_CLIENT_FAILURE_MESSAGE, false);

    try {
      const { data, error } = await client
        .from("direction_requests")
        .update({ status: input.nextStatus })
        .eq("id", input.directionId)
        .select("id, status, updated_at")
        .single();
      if (error) return toSafeWriteFailure(error, "updateDirectionStatus");
      return {
        ok: true,
        status: "success",
        data: {
          directionId: String(data.id),
          status: data.status as FirstClientDirectionStatus,
          updatedAt: String(data.updated_at),
        },
      };
    } catch (err) {
      return toSafeWriteFailure(err, "updateDirectionStatus");
    }
  },

  async createTeamReviewDecision(
    input: CreateTeamReviewDecisionInput,
  ): Promise<WriteResult<FirstClientTeamReviewDecision>> {
    assertWritesAllowed();
    const client = requireClient();
    if (!client) return safeWriteFailure(NO_CLIENT_FAILURE_MESSAGE, false);

    try {
      const row = mapTeamReviewDecisionToRow(input);
      const { data, error } = await client
        .from("team_review_decisions")
        .insert(row)
        .select(
          "id, restaurant_id, target_type, target_id, decision, safe_client_status, internal_note, reviewed_by_user_id, created_at",
        )
        .single();
      if (error) return toSafeWriteFailure(error, "createTeamReviewDecision");
      return {
        ok: true,
        status: "success",
        data: mapRowToTeamReviewDecision(data),
      };
    } catch (err) {
      return toSafeWriteFailure(err, "createTeamReviewDecision");
    }
  },
};

// ---- Row → contract mapping ------------------------------------------
// Defensive `any` reads to keep this independent from generated Supabase
// types; mapped fields are explicitly cast back to the contract types.

type AnyRow = Record<string, unknown>;

function mapRowToUploadSubmission(row: AnyRow): FirstClientUploadSubmission {
  return {
    id: String(row.id ?? ""),
    restaurantId: String(row.restaurant_id ?? ""),
    uploadKeyId: row.upload_key_id != null ? String(row.upload_key_id) : "",
    category: row.category as FirstClientUploadSubmission["category"],
    priority: row.priority as FirstClientUploadSubmission["priority"],
    note: row.note != null ? String(row.note) : "",
    status: row.status as FirstClientUploadStatus,
    internalNote: row.internal_note != null ? String(row.internal_note) : null,
    submittedAt: String(row.created_at ?? row.submitted_at ?? ""),
    reviewedAt: row.reviewed_at != null ? String(row.reviewed_at) : null,
    reviewedBy: row.reviewed_by != null ? String(row.reviewed_by) : null,
  };
}

function mapRowToDirectionRequest(row: AnyRow): FirstClientDirectionRequest {
  return {
    id: String(row.id ?? ""),
    restaurantId: String(row.restaurant_id ?? ""),
    focus: row.focus as FirstClientDirectionRequest["focus"],
    channel: row.channel as FirstClientDirectionRequest["channel"],
    urgency: row.urgency as FirstClientDirectionRequest["urgency"],
    title: String(row.title ?? ""),
    clientNote: row.client_note != null ? String(row.client_note) : "",
    preferredTimingLabel: String(row.preferred_timing_label ?? ""),
    relatedMediaId:
      row.related_media_id != null ? String(row.related_media_id) : null,
    avoidItem: row.avoid_item != null ? String(row.avoid_item) : null,
    status: row.status as FirstClientDirectionStatus,
    submittedAt: String(row.created_at ?? row.submitted_at ?? ""),
  };
}

function mapRowToTeamReviewDecision(
  row: AnyRow,
): FirstClientTeamReviewDecision {
  return {
    id: String(row.id ?? ""),
    targetType: row.target_type as FirstClientTeamReviewDecision["targetType"],
    targetId: String(row.target_id ?? ""),
    reviewerId:
      row.reviewed_by_user_id != null ? String(row.reviewed_by_user_id) : "",
    decision: row.decision as FirstClientTeamReviewDecision["decision"],
    internalNote: row.internal_note != null ? String(row.internal_note) : null,
    createdAt: String(row.created_at ?? ""),
  };
}
