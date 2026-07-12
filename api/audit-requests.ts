export default {
  async fetch(): Promise<Response> {
    const bytes = new TextEncoder().encode("diagnostic-only");
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Response.json(
      { accepted: false, size: digest.byteLength },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  },
};
