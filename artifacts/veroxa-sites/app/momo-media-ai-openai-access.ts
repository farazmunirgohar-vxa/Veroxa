import { MOMO_MEDIA_AI_MODEL } from "./momo-media-ai-contract.ts";

const OPENAI_MODEL_URL =
  `https://api.openai.com/v1/models/${MOMO_MEDIA_AI_MODEL}`;
const MAX_MODEL_RESPONSE_BYTES = 16_384;

export async function verifyMomoMediaAiOpenAiAccess(
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!apiKey.trim()) return false;
  try {
    const response = await fetcher(OPENAI_MODEL_URL, {
      method: "GET",
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const configuredLength = Number(
      response.headers.get("content-length") || 0,
    );
    if (
      !response.ok
      || !Number.isFinite(configuredLength)
      || configuredLength < 0
      || configuredLength > MAX_MODEL_RESPONSE_BYTES
    ) {
      await response.body?.cancel();
      return false;
    }
    const raw = await response.text();
    if (
      !raw
      || new TextEncoder().encode(raw).byteLength > MAX_MODEL_RESPONSE_BYTES
    ) return false;
    const body = JSON.parse(raw) as unknown;
    return Boolean(
      body
      && typeof body === "object"
      && !Array.isArray(body)
      && (body as { id?: unknown }).id === MOMO_MEDIA_AI_MODEL
      && (body as { object?: unknown }).object === "model",
    );
  } catch {
    return false;
  }
}
