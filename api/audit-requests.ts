export default {
  async fetch(request: Request): Promise<Response> {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 16_384) {
      return Response.json({ accepted: false }, { status: 413 });
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return Response.json({ accepted: false }, { status: 400 });
      }
    } catch {
      return Response.json({ accepted: false }, { status: 400 });
    }
    return Response.json({ accepted: false }, { status: 503 });
  },
};
