import {
  getMomoContentAiDispatchBridgeConfig,
  invokeMomoContentAiDispatchBridge,
} from "../../../../../momo-content-ai-dispatch-bridge";
import { createMomoContentAiDispatchHandler } from "./core";

export const runtime = "edge";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const HMAC_SECRET = /^[0-9a-f]{64}$/u;
const openAiKey = process.env.OPENAI_API_KEY?.trim() || "";
const webhookSecret = process.env.OPENAI_WEBHOOK_SECRET?.trim() || "";
const wakeHmacSecret =
  process.env.VEROXA_MOMO_CONTENT_AI_DISPATCH_HMAC_SECRET?.trim() || "";
const bridgeConfig = getMomoContentAiDispatchBridgeConfig();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
let allowedSourceOrigin = "";
try {
  const parsed = new URL(supabaseUrl);
  if (parsed.protocol === "https:" &&
    parsed.hostname.endsWith(".supabase.co")) {
    allowedSourceOrigin = parsed.origin;
  }
} catch {
  allowedSourceOrigin = "";
}

function record(value: unknown): Record<string, unknown> | null {
  const row = Array.isArray(value) ? value[0] : value;
  return typeof row === "object" && row !== null && !Array.isArray(row)
    ? row as Record<string, unknown>
    : null;
}

const handler = createMomoContentAiDispatchHandler({
  enabled: process.env.VEROXA_MOMO_CONTENT_AI_ENABLED === "true",
  providerConfigured: Boolean(
    openAiKey && webhookSecret && bridgeConfig && allowedSourceOrigin &&
      HMAC_SECRET.test(wakeHmacSecret),
  ),
  wakeHmacSecret,
  allowedSourceOrigin,
  async claim(input) {
    if (!bridgeConfig) throw new Error("dispatch_configuration_unavailable");
    return invokeMomoContentAiDispatchBridge<unknown>(bridgeConfig, {
      operation: "claim",
      ...input,
    });
  },
  async begin(input) {
    if (!bridgeConfig) throw new Error("dispatch_configuration_unavailable");
    const row = record(await invokeMomoContentAiDispatchBridge<unknown>(
      bridgeConfig,
      { operation: "begin", ...input },
    ));
    if (!row || row.run_id !== input.runId ||
      typeof row.should_call !== "boolean" ||
      typeof row.run_status !== "string") {
      throw new Error("dispatch_begin_invalid");
    }
    return {
      runId: row.run_id,
      shouldCall: row.should_call,
      status: row.run_status,
    };
  },
  async release(input) {
    if (!bridgeConfig) throw new Error("dispatch_configuration_unavailable");
    const value = await invokeMomoContentAiDispatchBridge<unknown>(
      bridgeConfig,
      { operation: "release", ...input },
    );
    if (value !== input.runId) throw new Error("dispatch_release_invalid");
  },
  async cancelBeforePost(input) {
    if (!bridgeConfig) throw new Error("dispatch_configuration_unavailable");
    const value = await invokeMomoContentAiDispatchBridge<unknown>(
      bridgeConfig,
      { operation: "cancel_before_post", ...input },
    );
    if (value !== input.runId) {
      throw new Error("dispatch_prepost_cancel_invalid");
    }
  },
  async bind(input) {
    if (!bridgeConfig) throw new Error("dispatch_configuration_unavailable");
    const value = await invokeMomoContentAiDispatchBridge<unknown>(
      bridgeConfig,
      { operation: "bind", ...input },
    );
    if (value !== input.runId) throw new Error("dispatch_bind_invalid");
  },
  async reconcile(input) {
    if (!bridgeConfig) throw new Error("dispatch_configuration_unavailable");
    const value = await invokeMomoContentAiDispatchBridge<unknown>(
      bridgeConfig,
      { operation: "reconcile", ...input },
    );
    if (value !== input.runId) throw new Error("dispatch_reconcile_invalid");
  },
  async rejectAfterPost(input) {
    if (!bridgeConfig) throw new Error("dispatch_configuration_unavailable");
    const value = await invokeMomoContentAiDispatchBridge<unknown>(
      bridgeConfig,
      { operation: "reject_after_post", ...input },
    );
    if (value !== input.runId) {
      throw new Error("dispatch_provider_rejection_invalid");
    }
  },
  async fetchSource(url) {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status >= 300 && response.status < 400) {
      throw new Error("dispatch_source_redirect_rejected");
    }
    return response;
  },
  async callOpenAI(rawBody) {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${openAiKey}`,
        "content-type": "application/json",
        "x-stainless-retry-count": "0",
      },
      body: rawBody,
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status >= 300 && response.status < 400) {
      throw new Error("dispatch_provider_redirect_rejected");
    }
    return response;
  },
});

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}
