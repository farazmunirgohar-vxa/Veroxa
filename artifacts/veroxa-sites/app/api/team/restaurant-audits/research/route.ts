import { createClient } from "@supabase/supabase-js";
import { getServerVeroxaAccess } from "../../../../veroxa-supabase-server";
import {
  createResearchPostHandler,
  type BudgetAdapter,
  type BudgetFinalizationInput,
  type BudgetReservation,
  type BudgetReservationInput,
} from "./research-core";

export const runtime = "edge";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

type RpcRow = Record<string, unknown>;

function firstRow(value: unknown): RpcRow | null {
  if (Array.isArray(value)) {
    const row = value[0];
    return typeof row === "object" && row !== null && !Array.isArray(row)
      ? row as RpcRow
      : null;
  }
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as RpcRow
    : null;
}

function serverSupabaseConfig(): { url: string; secretKey: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const canonicalSecret = process.env.SUPABASE_SECRET_KEY?.trim();
  const legacyServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const secretKey = canonicalSecret?.startsWith("sb_secret_")
    ? canonicalSecret
    : legacyServiceRole && !legacyServiceRole.startsWith("sb_publishable_") && legacyServiceRole.split(".").length === 3
      ? legacyServiceRole
      : "";
  if (!rawUrl || !secretKey) return null;
  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "https:"
      || !url.hostname.endsWith(".supabase.co")
      || url.username
      || url.password
      || url.port
      || (url.pathname !== "/" && url.pathname !== "")
      || url.search
      || url.hash
    ) return null;
    return { url: url.origin, secretKey };
  } catch {
    return null;
  }
}

function createBudgetAdapter(config: { url: string; secretKey: string } | null): BudgetAdapter {
  if (!config) {
    return {
      async reserve(): Promise<BudgetReservation> {
        throw new Error("ai_budget_configuration_unavailable");
      },
      async finalize(): Promise<void> {
        throw new Error("ai_budget_configuration_unavailable");
      },
    };
  }
  const admin = createClient(config.url, config.secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { "x-veroxa-server-purpose": "ai-audit-budget-v1" } },
  });
  return {
    async reserve(input: BudgetReservationInput): Promise<BudgetReservation> {
      const { data, error } = await admin.rpc("reserve_team_ai_audit_budget_v1", {
        p_idempotency_hash: input.idempotencyHash,
        p_request_hash: input.requestHash,
        p_request_snapshot: input.requestSnapshot,
        p_model: input.model,
        p_pricing_version: input.pricingVersion,
        p_reserved_microusd: input.reservedMicrousd,
        p_max_tool_calls: input.maxToolCalls,
        p_max_output_tokens: input.maxOutputTokens,
      });
      if (error) throw new Error(error.message);
      const row = firstRow(data);
      const status = row?.status;
      if (
        typeof row?.reservation_id !== "string"
        || (status !== "reserved" && status !== "completed" && status !== "in_progress")
      ) throw new Error("ai_budget_reservation_invalid");
      return {
        reservationId: row.reservation_id,
        status,
        cachedResponse: row.cached_response ?? null,
      };
    },
    async finalize(input: BudgetFinalizationInput): Promise<void> {
      const { data, error } = await admin.rpc("finalize_team_ai_audit_budget_v1", {
        p_reservation_id: input.reservationId,
        p_idempotency_hash: input.idempotencyHash,
        p_request_hash: input.requestHash,
        p_status: input.status,
        p_actual_microusd: input.actualMicrousd,
        p_provider_request_id: input.providerRequestId,
        p_usage: input.usage,
        p_sources: input.sources,
        p_response: input.response,
      });
      if (error) throw new Error(error.message);
      const row = firstRow(data);
      if (typeof row?.reservation_id !== "string" || row.status !== input.status) {
        throw new Error("ai_budget_finalization_invalid");
      }
    },
  };
}

const supabaseConfig = serverSupabaseConfig();
const openAiKey = process.env.OPENAI_API_KEY?.trim() || "";

export const POST = createResearchPostHandler({
  enabled: process.env.VEROXA_AI_AUDIT_ENABLED === "true",
  providerConfigured: Boolean(openAiKey),
  budgetConfigured: Boolean(supabaseConfig),
  async authenticate() {
    const access = await getServerVeroxaAccess();
    return access ? { role: access.role, restaurantId: access.restaurantId } : null;
  },
  budget: createBudgetAdapter(supabaseConfig),
  async callOpenAI(body) {
    return fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${openAiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
  },
});
