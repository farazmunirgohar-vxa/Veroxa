import { createHmac } from "node:crypto";
const headers = { "Cache-Control": "no-store, max-age=0" };
export default {
  async fetch(request: Request): Promise<Response> {
    const value = await request.text();
    const digest = createHmac("sha256", "diagnostic-only").update(value).digest("hex");
    return Response.json({ accepted: false, reference: digest.slice(0, 4) }, { status: 503, headers });
  },
};
