export default {
  async fetch(request: Request): Promise<Response> {
    const raw = await request.text();
    return Response.json({ accepted: false, size: raw.length }, { status: 503 });
  },
};
