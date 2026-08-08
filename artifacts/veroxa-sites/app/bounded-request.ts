export class BoundedRequestBodyError extends Error {
  readonly status: 400 | 413;

  constructor(status: 400 | 413) {
    super(status === 413 ? "request_body_too_large" : "request_body_unreadable");
    this.status = status;
  }
}

function declaredContentLength(request: Request): number | null {
  const header = request.headers.get("content-length");
  if (header === null) return null;
  const value = Number(header);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new BoundedRequestBodyError(413);
  }
  return value;
}

export async function readBoundedRequestText(
  request: Request,
  maxBytes: number,
): Promise<string> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new TypeError("invalid_max_bytes");
  }
  const declared = declaredContentLength(request);
  if (declared !== null && declared > maxBytes) {
    throw new BoundedRequestBodyError(413);
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) {
        throw new BoundedRequestBodyError(400);
      }
      if (value.byteLength > maxBytes - received) {
        await reader.cancel().catch(() => undefined);
        throw new BoundedRequestBodyError(413);
      }
      received += value.byteLength;
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof BoundedRequestBodyError) throw error;
    throw new BoundedRequestBodyError(400);
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}
