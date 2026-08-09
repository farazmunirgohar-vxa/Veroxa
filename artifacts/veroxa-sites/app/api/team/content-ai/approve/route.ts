import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getMomoContentAiLifecycleBridgeConfig,
  invokeMomoContentAiLifecycleBridge,
} from "../../../../momo-content-ai-lifecycle-bridge";
import { getServerVeroxaContext } from "../../../../veroxa-supabase-server";
import type { MomoContentAiPackageOutput, MomoContentPlatform, MomoContentTruthSnapshotField } from "../../../../momo-content-ai-contract";
import { createMomoContentApproveHandler } from "./core";

export const runtime = "edge";

function parseRun(row: Record<string, unknown>) {
  if (typeof row.id !== "string" || typeof row.restaurant_id !== "string" || typeof row.request_hash !== "string" || typeof row.status !== "string" || !Array.isArray(row.target_platforms) || !Array.isArray(row.truth_snapshot) || typeof row.output_payload !== "object" || row.output_payload === null || Array.isArray(row.output_payload) || typeof row.output_sha256 !== "string") throw new Error("content_package_readback_invalid");
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    requestHash: row.request_hash,
    status: row.status,
    targetPlatforms: row.target_platforms as MomoContentPlatform[],
    truthSnapshot: row.truth_snapshot as MomoContentTruthSnapshotField[],
    output: row.output_payload as MomoContentAiPackageOutput,
    outputSha256: row.output_sha256,
  };
}

function dependencies(client: SupabaseClient, actor: { role: "team" | "client"; restaurantId: string | null; userId: string }) {
  const bridgeConfig = getMomoContentAiLifecycleBridgeConfig();
  return {
    async authenticate() { return actor; },
    async loadRun(runId: string, restaurantId: string) {
      const { data, error } = await client.from("veroxa_momo_content_ai_runs")
        .select("id,restaurant_id,request_hash,status,target_platforms,truth_snapshot,output_payload,output_sha256")
        .eq("id", runId).eq("restaurant_id", restaurantId).maybeSingle();
      if (error) throw new Error("content_package_readback_failed");
      return data ? parseRun(data as Record<string, unknown>) : null;
    },
    async materialize(input: Record<string, unknown>) {
      if (!bridgeConfig) throw new Error("content_package_approval_configuration_unavailable");
      const value = await invokeMomoContentAiLifecycleBridge<unknown>(client, bridgeConfig, { operation: "materialize", ...input });
      if (typeof value !== "string") throw new Error("content_package_materialization_invalid");
      return value;
    },
    async loadReadyStatus(readyPackageId: string) {
      const { data, error } = await client.rpc("veroxa_momo_ready_package_status_v1", {
        p_ready_package_id: readyPackageId,
      });
      if (error) throw new Error("content_package_status_readback_failed");
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || typeof row !== "object") return null;
      const status = (row as Record<string, unknown>).effective_status;
      return status === "ready_to_post" ? "ready_to_post" as const : status === "blocked" ? "blocked" as const : null;
    },
  };
}

export async function POST(request: Request): Promise<Response> {
  const context = await getServerVeroxaContext();
  if (!context) {
    return createMomoContentApproveHandler({
      ...dependencies({} as SupabaseClient, { role: "client", restaurantId: null, userId: "00000000-0000-4000-8000-000000000000" }),
      authenticate: async () => null,
    })(request);
  }
  return createMomoContentApproveHandler(dependencies(context.client, {
    role: context.access.role,
    restaurantId: context.access.restaurantId,
    userId: context.userId,
  }))(request);
}
