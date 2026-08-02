export type BoundedResponseOptions = {
  maxBytes: number;
  minBytes?: number;
  errorMessage: string;
};

export async function readBoundedResponseBytes(
  response: Response,
  options: BoundedResponseOptions,
): Promise<Uint8Array> {
  const { maxBytes, minBytes = 0, errorMessage } = options;
  const declaredHeader = response.headers.get("content-length");
  const declared = declaredHeader === null ? null : Number(declaredHeader);
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 ||
    !Number.isSafeInteger(minBytes) || minBytes < 0 || minBytes > maxBytes ||
    !response.body) {
    throw new Error(errorMessage);
  }
  if (declared !== null && (!Number.isSafeInteger(declared) || declared < 0 ||
    declared > maxBytes)) {
    try {
      await response.body.cancel("response_too_large");
    } catch {
      // A locked or already-failed stream is still rejected below.
    }
    throw new Error(errorMessage);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new Error(errorMessage);
      total += value.byteLength;
      if (!Number.isSafeInteger(total) || total > maxBytes) {
        await reader.cancel("response_too_large");
        throw new Error(errorMessage);
      }
      chunks.push(value);
    }
  } catch {
    throw new Error(errorMessage);
  } finally {
    reader.releaseLock();
  }

  const contentEncoding = response.headers.get("content-encoding")
    ?.trim().toLowerCase();
  const declaredDescribesStream = !contentEncoding || contentEncoding === "identity";
  if (total < minBytes ||
    (declaredDescribesStream && declared !== null && declared !== total)) {
    throw new Error(errorMessage);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readBoundedResponseText(
  response: Response,
  options: BoundedResponseOptions,
): Promise<string> {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      await readBoundedResponseBytes(response, options),
    );
  } catch {
    throw new Error(options.errorMessage);
  }
}
