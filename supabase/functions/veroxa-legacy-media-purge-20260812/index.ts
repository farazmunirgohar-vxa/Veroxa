Deno.serve(() =>
  Response.json(
    { error: "legacy_media_purge_closed" },
    {
      status: 410,
      headers: {
        "cache-control": "no-store, max-age=0",
        "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
        "x-content-type-options": "nosniff",
      },
    },
  )
);
