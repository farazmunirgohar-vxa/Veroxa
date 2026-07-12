const MAX_BODY_BYTES = 16_384;
const headers = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const json = (status: number, payload: unknown) => Response.json(payload, { status, headers });
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return json(405, { accepted: false });
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json(413, { accepted: false });
    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json(400, { accepted: false });
      body = parsed as Record<string, unknown>;
    } catch {
      return json(400, { accepted: false });
    }
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const secret = process.env.AUDIT_INTAKE_HMAC_SECRET;
    return json(url && key && secret && body ? 503 : 503, { accepted: false });
  },
};
