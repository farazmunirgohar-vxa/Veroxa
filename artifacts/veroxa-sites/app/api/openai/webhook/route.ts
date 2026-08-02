import OpenAI from "openai";
import {
  getMomoContentAiWebhookBridgeConfig,
  invokeMomoContentAiWebhookBridge,
} from "../../../momo-content-ai-webhook-bridge";
import { createMomoContentAiWebhookPostHandler } from "./core";

export const runtime = "edge";

const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
const webhookSecret = process.env.OPENAI_WEBHOOK_SECRET?.trim() || "";
const bridgeConfig = getMomoContentAiWebhookBridgeConfig();
const client = apiKey && webhookSecret
  ? new OpenAI({
      apiKey,
      webhookSecret,
      maxRetries: 0,
      timeout: 30_000,
    })
  : null;

// Keep stored responses available through OpenAI's retention window. A webhook
// delivery can be replayed after our final 2xx is lost, so synchronous deletion
// would destroy the only provider evidence needed to acknowledge that retry.

function bridge(body: Record<string, unknown>): Promise<unknown> {
  if (!bridgeConfig) throw new Error("momo_content_ai_webhook_bridge_unavailable");
  return invokeMomoContentAiWebhookBridge<unknown>(bridgeConfig, body);
}

const handler = createMomoContentAiWebhookPostHandler({
  configured: Boolean(client && bridgeConfig),
  async unwrap(rawBody, headers) {
    if (!client) throw new Error("momo_content_ai_webhook_unavailable");
    return client.webhooks.unwrap(rawBody, headers);
  },
  async retrieveOpenAI(responseId) {
    if (!client) throw new Error("momo_content_ai_webhook_unavailable");
    return client.responses.retrieve(responseId);
  },
  claim(identity) {
    return bridge({ operation: "claim", ...identity });
  },
  stage(input) {
    return bridge({ operation: "stage_result", ...input });
  },
  completeStaged(identity) {
    return bridge({ operation: "complete_staged", ...identity });
  },
  recordException(input) {
    return bridge({ operation: "record_exception", ...input });
  },
  fail(input) {
    return bridge({ operation: "fail", ...input });
  },
  finish(input) {
    return bridge({ operation: "finish", ...input });
  },
});

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}
