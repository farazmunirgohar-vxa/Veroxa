import assert from "node:assert/strict";
import test from "node:test";
import {
  readBoundedResponseBytes,
  readBoundedResponseText,
} from "../app/bounded-response.ts";

function chunkedResponse(chunks, headers = {}) {
  let cancelReason = null;
  const response = new Response(new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(Uint8Array.from(chunk));
      controller.close();
    },
    cancel(reason) {
      cancelReason = reason;
    },
  }), { headers });
  return { response, cancelReason: () => cancelReason };
}

test("bounded response streams an unknown-length body without buffering past the cap", async () => {
  const { response } = chunkedResponse([
    new TextEncoder().encode('{"ok":'),
    new TextEncoder().encode("true}"),
  ]);
  assert.equal(await readBoundedResponseText(response, {
    maxBytes: 32,
    minBytes: 2,
    errorMessage: "bounded",
  }), '{"ok":true}');
});

test("bounded response cancels as soon as a chunk crosses the cap", async () => {
  let cancelled = null;
  const response = new Response(new ReadableStream({
    pull(controller) {
      controller.enqueue(Uint8Array.of(1, 2, 3, 4));
    },
    cancel(reason) {
      cancelled = reason;
    },
  }));
  await assert.rejects(readBoundedResponseBytes(response, {
    maxBytes: 7,
    errorMessage: "bounded",
  }), /bounded/u);
  assert.equal(cancelled, "response_too_large");
});

test("bounded response rejects an oversized declaration before reading", async () => {
  let cancelled = null;
  const response = new Response(new ReadableStream({
    pull(controller) {
      controller.enqueue(Uint8Array.of(1));
      controller.close();
    },
    cancel(reason) {
      cancelled = reason;
    },
  }), { headers: { "content-length": "9" } });
  await assert.rejects(readBoundedResponseBytes(response, {
    maxBytes: 8,
    errorMessage: "bounded",
  }), /bounded/u);
  assert.equal(response.bodyUsed, true);
  assert.equal(response.body.locked, false);
  assert.equal(cancelled, "response_too_large");
});

test("bounded response rejects declared-length mismatch and invalid UTF-8", async () => {
  const mismatch = chunkedResponse(
    [Uint8Array.of(1, 2)],
    { "content-length": "3" },
  ).response;
  await assert.rejects(readBoundedResponseBytes(mismatch, {
    maxBytes: 8,
    errorMessage: "bounded",
  }), /bounded/u);

  const invalidUtf8 = chunkedResponse([Uint8Array.of(0xc3, 0x28)]).response;
  await assert.rejects(readBoundedResponseText(invalidUtf8, {
    maxBytes: 8,
    errorMessage: "bounded",
  }), /bounded/u);
});

test("bounded response does not compare decompressed bytes with compressed length", async () => {
  const { response } = chunkedResponse(
    [new TextEncoder().encode('{"ok":true}')],
    { "content-length": "5", "content-encoding": "gzip" },
  );
  assert.equal(await readBoundedResponseText(response, {
    maxBytes: 32,
    minBytes: 2,
    errorMessage: "bounded",
  }), '{"ok":true}');
});
