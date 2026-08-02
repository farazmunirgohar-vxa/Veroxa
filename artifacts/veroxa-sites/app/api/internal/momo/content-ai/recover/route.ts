import OpenAI from "openai";
import {
  getMomoContentAiDispatchBridgeConfig,
  invokeMomoContentAiDispatchBridge,
} from "../../../../../momo-content-ai-dispatch-bridge";
import {
  getMomoContentAiWebhookBridgeConfig,
  invokeMomoContentAiWebhookBridge,
} from "../../../../../momo-content-ai-webhook-bridge";
import { createMomoContentAiRecoveryHandler } from "./core";

export const runtime = "edge";

const HMAC_SECRET = /^[0-9a-f]{64}$/u;
const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
const wakeHmacSecret =
  process.env.VEROXA_MOMO_CONTENT_AI_DISPATCH_HMAC_SECRET?.trim() || "";
const dispatchBridgeConfig = getMomoContentAiDispatchBridgeConfig();
const webhookBridgeConfig = getMomoContentAiWebhookBridgeConfig();
const client = apiKey
  ? new OpenAI({ apiKey, maxRetries: 0, timeout: 30_000 })
  : null;

function webhookBridge(body: Record<string, unknown>): Promise<unknown> {
  if (!webhookBridgeConfig) {
    throw new Error("momo_content_ai_webhook_bridge_unavailable");
  }
  return invokeMomoContentAiWebhookBridge<unknown>(
    webhookBridgeConfig,
    body,
  );
}

const handler = createMomoContentAiRecoveryHandler({
  configured: Boolean(
    client && dispatchBridgeConfig && webhookBridgeConfig &&
      HMAC_SECRET.test(wakeHmacSecret),
  ),
  wakeHmacSecret,
  async claimRecovery(input) {
    if (!dispatchBridgeConfig) {
      throw new Error("momo_content_ai_dispatch_bridge_unavailable");
    }
    return invokeMomoContentAiDispatchBridge<unknown>(
      dispatchBridgeConfig,
      { operation: "claim_recovery", ...input },
    );
  },
  async retrieveOpenAI(responseId) {
    if (!client) throw new Error("momo_content_ai_recovery_unavailable");
    return client.responses.retrieve(responseId);
  },
  claim(identity) {
    return webhookBridge({ operation: "claim", ...identity });
  },
  stage(input) {
    return webhookBridge({ operation: "stage_result", ...input });
  },
  completeStaged(identity) {
    return webhookBridge({ operation: "complete_staged", ...identity });
  },
  recordException(input) {
    return webhookBridge({ operation: "record_exception", ...input });
  },
  fail(input) {
    return webhookBridge({ operation: "fail", ...input });
  },
  finish(input) {
    return webhookBridge({ operation: "finish", ...input });
  },
});

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}
