export default {
  fetch(): Response {
    return Response.json(
      { accepted: false },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  },
};
