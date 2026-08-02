import {
  MOMO_READY_TEAM_INSPECTION_ATTESTATION,
  isMomoContentHash,
  isMomoContentUuid,
  type MomoContentAiPackageOutput,
  type MomoContentPlatform,
  type MomoContentTruthSnapshotField,
} from "../../../../momo-content-ai-contract.ts";
import {
  buildMomoAllowedHashtags,
  buildMomoAllowedSeoPhrases,
  validateMomoContentPackage,
} from "../../../../momo-content-package-validation.ts";
import { momoCanonicalJson } from "../../../../momo-canonical-json.ts";
import { momoBytesSha256 } from "../../../../momo-image-bytes.ts";

const MAX_BODY = 4_096;
const CHICAGO_LOCAL_MINUTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u;

type Actor = { role: "team" | "client"; restaurantId: string | null; userId: string };
export type MomoContentReviewRun = {
  id: string;
  restaurantId: string;
  requestHash: string;
  status: string;
  targetPlatforms: MomoContentPlatform[];
  truthSnapshot: MomoContentTruthSnapshotField[];
  output: MomoContentAiPackageOutput;
  outputSha256: string;
};

export type MomoContentApproveDependencies = {
  authenticate(): Promise<Actor | null>;
  loadRun(runId: string, restaurantId: string): Promise<MomoContentReviewRun | null>;
  materialize(input: {
    runId: string;
    requestHash: string;
    scheduleSnapshot: Record<string, string>;
    scheduleCanonical: string;
    scheduleSha256: string;
    inspectionAttestation: typeof MOMO_READY_TEAM_INSPECTION_ATTESTATION;
  }): Promise<string>;
  loadReadyStatus(readyPackageId: string): Promise<"ready_to_post" | "blocked" | null>;
};

class PublicError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.code = code; this.status = status; }
}

function noStore(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: {
    "cache-control": "no-store, max-age=0",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
  } });
}

function sameOrigin(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

async function parse(request: Request): Promise<{ restaurantId: string; runId: string; schedules: Record<string, string>; inspectionAttestation: true }> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new PublicError("invalid_request", 415);
  const length = Number(request.headers.get("content-length") || 0);
  if (!Number.isFinite(length) || length < 0 || length > MAX_BODY) throw new PublicError("invalid_request", 413);
  let raw = "";
  try { raw = await request.text(); } catch { throw new PublicError("invalid_request", 400); }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY) throw new PublicError("invalid_request", 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { throw new PublicError("invalid_request", 400); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new PublicError("invalid_request", 400);
  const value = body as Record<string, unknown>;
  if (Object.keys(value).sort().join(",") !== "inspectionAttestation,restaurantId,runId,schedules" || !isMomoContentUuid(value.restaurantId) || !isMomoContentUuid(value.runId) || value.inspectionAttestation !== true || typeof value.schedules !== "object" || value.schedules === null || Array.isArray(value.schedules)) throw new PublicError("invalid_request", 400);
  const schedules = value.schedules as Record<string, unknown>;
  if (Object.keys(schedules).length < 1 || Object.keys(schedules).length > 3 ||
    Object.values(schedules).some((time) => typeof time !== "string" || !CHICAGO_LOCAL_MINUTE.test(time))) {
    throw new PublicError("invalid_schedule", 400);
  }
  return { restaurantId: value.restaurantId.toLowerCase(), runId: value.runId.toLowerCase(), schedules: schedules as Record<string, string>, inspectionAttestation: true };
}

export function createMomoContentApproveHandler(dependencies: MomoContentApproveDependencies) {
  return async (request: Request): Promise<Response> => {
    try {
      if (!sameOrigin(request)) throw new PublicError("cross_site_request_rejected", 403);
      const actor = await dependencies.authenticate();
      if (!actor || actor.role !== "team" || !actor.restaurantId || !isMomoContentUuid(actor.restaurantId) || !isMomoContentUuid(actor.userId)) throw new PublicError("team_access_required", 403);
      const input = await parse(request);
      if (input.restaurantId !== actor.restaurantId.toLowerCase()) throw new PublicError("team_access_required", 403);
      const run = await dependencies.loadRun(input.runId, input.restaurantId);
      if (!run || !["pending_review", "materialized"].includes(run.status) || run.restaurantId !== input.restaurantId || !isMomoContentHash(run.requestHash) || !isMomoContentHash(run.outputSha256)) throw new PublicError("content_package_not_reviewable", 409);
      const platformKeys = Object.keys(input.schedules).sort();
      const expected = [...new Set(run.targetPlatforms)].sort();
      if (platformKeys.length !== expected.length || platformKeys.some((platform, index) => platform !== expected[index])) throw new PublicError("schedule_platform_mismatch", 400);
      const validation = validateMomoContentPackage(run.output, {
        targetPlatforms: run.targetPlatforms,
        truthFields: run.truthSnapshot,
        allowedSeoPhrases: buildMomoAllowedSeoPhrases(run.truthSnapshot),
        allowedHashtags: buildMomoAllowedHashtags(run.truthSnapshot),
      });
      if (!validation.ok) throw new PublicError("content_ai_quality_gate_failed", 422);
      const canonicalOutput = momoCanonicalJson(run.output);
      if (await momoBytesSha256(new TextEncoder().encode(canonicalOutput)) !== run.outputSha256) throw new PublicError("content_package_hash_mismatch", 409);
      const scheduleCanonical = momoCanonicalJson(input.schedules);
      const scheduleSha256 = await momoBytesSha256(new TextEncoder().encode(scheduleCanonical));
      const readyPackageId = await dependencies.materialize({
        runId: run.id,
        requestHash: run.requestHash,
        scheduleSnapshot: input.schedules,
        scheduleCanonical,
        scheduleSha256,
        inspectionAttestation: MOMO_READY_TEAM_INSPECTION_ATTESTATION,
      });
      const effectiveStatus = await dependencies.loadReadyStatus(readyPackageId);
      if (effectiveStatus !== "ready_to_post") throw new PublicError("content_package_no_longer_ready", 409);
      return noStore({
        readyPackageId,
        status: "ready_to_post",
        replayed: run.status === "materialized",
        externalWriteAllowed: false,
      }, 200);
    } catch (error) {
      return error instanceof PublicError
        ? noStore({ error: error.code }, error.status)
        : noStore({ error: "content_package_approval_unavailable" }, 503);
    }
  };
}
