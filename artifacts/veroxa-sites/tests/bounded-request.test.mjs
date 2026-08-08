import assert from "node:assert/strict";
import test from "node:test";
import {
  BoundedRequestBodyError,
  readBoundedRequestText,
} from "../app/bounded-request.ts";

function chunkedRequest(chunks, headers = {}) {
  let cancelled = null;
  const request = new Request("https://veroxa.example/intake", {
    method: "POST",
    headers,
    body: new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
      cancel(reason) {
        cancelled = reason;
      },
    }),
    duplex: "half",
  });
  return { request, cancelReason: () => cancelled };
}

test("bounded request accepts an empty or safely streamed body", async () => {
  const empty = new Request("https://veroxa.example/intake", { method: "POST" });
  assert.equal(await readBoundedRequestText(empty, 0), "");

  const { request } = chunkedRequest([
    new TextEncoder().encode('{"ok":'),
    new TextEncoder().encode("true}"),
  ]);
  assert.equal(await readBoundedRequestText(request, 32), '{"ok":true}');
});

test("bounded request rejects an oversized declaration before reading", async () => {
  const { request, cancelReason } = chunkedRequest(
    [Uint8Array.of(1)],
    { "content-length": "9" },
  );
  await assert.rejects(
    readBoundedRequestText(request, 8),
    (error) => error instanceof BoundedRequestBodyError &&
      error.status === 413 && error.message === "request_body_too_large",
  );
  assert.equal(cancelReason(), null);
});

test("bounded request cancels immediately when streamed bytes cross the cap", async () => {
  let cancelled = null;
  const request = new Request("https://veroxa.example/intake", {
    method: "POST",
    body: new ReadableStream({
      pull(controller) {
        controller.enqueue(Uint8Array.of(1, 2, 3, 4));
      },
      cancel(reason) {
        cancelled = reason;
      },
    }),
    duplex: "half",
  });
  await assert.rejects(
    readBoundedRequestText(request, 7),
    (error) => error instanceof BoundedRequestBodyError && error.status === 413,
  );
  assert.equal(cancelled, undefined);
});

test("bounded request treats malformed lengths as oversized without trusting declared equality", async () => {
  for (const declared of ["-1", "1.5", "nope"]) {
    const { request } = chunkedRequest([Uint8Array.of(1)], { "content-length": declared });
    await assert.rejects(
      readBoundedRequestText(request, 8),
      (error) => error instanceof BoundedRequestBodyError && error.status === 413,
    );
  }

  const { request } = chunkedRequest(
    [Uint8Array.of(1, 2)],
    { "content-length": "3" },
  );
  assert.equal(await readBoundedRequestText(request, 8), "\u0001\u0002");
});

test("bounded request rejects invalid caps and non-byte chunks", async () => {
  const normal = new Request("https://veroxa.example/intake", {
    method: "POST",
    body: "ok",
  });
  await assert.rejects(readBoundedRequestText(normal, -1), /invalid_max_bytes/u);

  const { request } = chunkedRequest(["not-bytes"]);
  await assert.rejects(
    readBoundedRequestText(request, 32),
    (error) => error instanceof BoundedRequestBodyError && error.status === 400,
  );
});
