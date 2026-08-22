export const acceptanceAuthProofPath =
  "/api/internal/veroxa/acceptance-auth-proof";
export const acceptanceAuthProofCanonicalBody = '{"schemaVersion":1}';
export const acceptanceAuthProofWakeContext =
  `veroxa:internal-acceptance-auth-proof:v1\nPOST\n${acceptanceAuthProofPath}`;

export const acceptanceAuthProofTarget = Object.freeze({
  restaurantId: "0b1323dd-6df6-47d3-8c84-bb8614fdf0d8",
  userId: "94ebed31-b137-4835-a53e-df4478dc815a",
  email:
    "veroxa-acceptance-client1-4f70e4cce0ffb98e@example.invalid",
  uploadSessionId: "b30d1aee-7188-43ea-be76-d70ac65e3a22",
  clientIdempotencyKey: "60e1ff1d-638a-4c1d-b5bc-550fb1798172",
  storagePath:
    "restaurants/0b1323dd-6df6-47d3-8c84-bb8614fdf0d8/uploads/2026/08/b30d1aee-7188-43ea-be76-d70ac65e3a22.jpg",
});

const HMAC = /^[0-9a-f]{64}$/iu;
const JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const MAX_REQUEST_BYTES = 128;
const MAX_RESPONSE_BYTES = 2_048;
const MAX_WAKE_AGE_MS = 60_000;

export type AcceptanceAuthProofUser = {
  id: string;
  email: string | null;
  aud: string;
  role: string;
  isAnonymous: boolean;
  deletedAt: string | null;
  bannedUntil: string | null;
};

export type AcceptanceAuthProofSession = {
  user: AcceptanceAuthProofUser;
  accessToken: string;
  expiresAt: number;
};

export type AcceptanceAuthProofProfile = {
  role: string;
  status: string;
};

export type AcceptanceAuthProofMembership = {
  restaurantId: string;
  role: string;
  status: string;
  restaurantName: string;
  restaurantStatus: string;
};

export type AcceptanceAuthProofFinalizeInput = {
  accessToken: string;
  correlationId: string;
  body: {
    restaurantId: string;
    uploadSessionId: string;
    clientIdempotencyKey: string;
    storagePath: string;
  };
};

export type AcceptanceAuthProofOperationDependencies = {
  getExistingUser(): Promise<AcceptanceAuthProofUser | null>;
  generateMagicLinkTokenHash(): Promise<string | null>;
  verifyMagicLink(
    tokenHash: string,
  ): Promise<AcceptanceAuthProofSession | null>;
  readClientProfile(userId: string): Promise<AcceptanceAuthProofProfile[]>;
  readClientMembership(
    userId: string,
    restaurantId: string,
  ): Promise<AcceptanceAuthProofMembership[]>;
  finalize(input: AcceptanceAuthProofFinalizeInput): Promise<Response>;
  revoke(accessToken: string): Promise<void>;
  clearClientSession(): Promise<void>;
  randomUuid?(): string;
};

export type AcceptanceAuthProofHandlerDependencies = {
  configured: boolean;
  wakeHmacSecret: string;
  operation: AcceptanceAuthProofOperationDependencies;
  now?(): number;
};

type ProofFailureCode =
  | "identity_unavailable"
  | "identity_invalid"
  | "session_mint_failed"
  | "session_invalid"
  | "client_scope_rejected"
  | "finalize_transport_unavailable"
  | "unexpected_finalize_response"
  | "session_revocation_unconfirmed";

class ProofFailure extends Error {
  readonly code: ProofFailureCode;

  constructor(code: ProofFailureCode) {
    super(code);
    this.code = code;
  }
}

class RequestFailure extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function noStore(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    },
  });
}

function hexBytes(value: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(value.length / 2));
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

async function boundedText(
  request: Request,
  maximumBytes: number,
): Promise<string | null> {
  const declaredHeader = request.headers.get("content-length");
  const declared = declaredHeader === null ? null : Number(declaredHeader);
  if (declared !== null && (!Number.isSafeInteger(declared) || declared < 0 ||
    declared > maximumBytes) || !request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) return null;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel("request_too_large");
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
  if (total < 2 || (declared !== null && total !== declared)) return null;
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

async function verifyWake(
  request: Request,
  secret: string,
  now: number,
): Promise<void> {
  if (request.method !== "POST") {
    throw new RequestFailure("method_not_allowed", 405);
  }
  const url = new URL(request.url);
  if (url.pathname !== acceptanceAuthProofPath || url.search || url.hash ||
    !/^application\/json(?:[\t ]*;|$)/iu.test(
      request.headers.get("content-type")?.trim() || "",
    )) {
    throw new RequestFailure("invalid_request", 400);
  }
  const raw = await boundedText(request, MAX_REQUEST_BYTES);
  if (raw !== acceptanceAuthProofCanonicalBody) {
    throw new RequestFailure("invalid_request", 400);
  }
  const timestampText = request.headers
    .get("x-veroxa-acceptance-proof-timestamp-ms")?.trim() || "";
  const nonce = request.headers
    .get("x-veroxa-acceptance-proof-nonce")?.trim() || "";
  const signature = request.headers
    .get("x-veroxa-acceptance-proof-signature")?.trim() || "";
  const timestamp = Number(timestampText);
  if (!/^\d{13}$/u.test(timestampText) || !Number.isSafeInteger(timestamp) ||
    Math.abs(now - timestamp) > MAX_WAKE_AGE_MS || !UUID.test(nonce) ||
    !HMAC.test(signature) || !HMAC.test(secret)) {
    throw new RequestFailure("acceptance_proof_access_required", 403);
  }
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexBytes(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const message = new TextEncoder().encode(
      `${acceptanceAuthProofWakeContext}\n${timestampText}\n${nonce}\n${acceptanceAuthProofCanonicalBody}`,
    );
    if (!await crypto.subtle.verify(
      "HMAC",
      key,
      hexBytes(signature),
      message,
    )) throw new Error("invalid_signature");
  } catch {
    throw new RequestFailure("acceptance_proof_access_required", 403);
  }
}

function activeExactUser(
  user: AcceptanceAuthProofUser | null,
  now: number,
): user is AcceptanceAuthProofUser {
  if (!user || user.id.toLowerCase() !== acceptanceAuthProofTarget.userId ||
    user.email?.toLowerCase() !== acceptanceAuthProofTarget.email ||
    user.aud !== "authenticated" || user.role !== "authenticated" ||
    user.isAnonymous || Boolean(user.deletedAt)) return false;
  if (!user.bannedUntil) return true;
  const bannedUntil = Date.parse(user.bannedUntil);
  return Number.isFinite(bannedUntil) && bannedUntil <= now;
}

function exactClientScope(
  profiles: AcceptanceAuthProofProfile[],
  memberships: AcceptanceAuthProofMembership[],
): boolean {
  if (profiles.length !== 1 || memberships.length !== 1) return false;
  const profile = profiles[0];
  const membership = memberships[0];
  return profile.role === "client" && profile.status === "active" &&
    membership.restaurantId.toLowerCase() ===
      acceptanceAuthProofTarget.restaurantId &&
    membership.role === "client" && membership.status === "active" &&
    membership.restaurantStatus === "active" &&
    Boolean(membership.restaurantName.trim());
}

async function expectedFinalizeRejection(
  response: Response,
  correlationId: string,
): Promise<boolean> {
  if (response.status !== 503 ||
    response.headers.get("x-veroxa-correlation-id") !== correlationId ||
    !response.headers.get("content-type")?.toLowerCase().startsWith(
      "application/json",
    )) return false;
  let text: string;
  try {
    text = await response.text();
  } catch {
    return false;
  }
  if (!text || new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) {
    return false;
  }
  try {
    const value = JSON.parse(text) as unknown;
    return typeof value === "object" && value !== null &&
      !Array.isArray(value) &&
      Object.keys(value).sort().join(",") === "error" &&
      (value as { error?: unknown }).error ===
        "media_verification_unavailable";
  } catch {
    return false;
  }
}

export async function executeAcceptanceAuthProof(
  dependencies: AcceptanceAuthProofOperationDependencies,
  now: number,
): Promise<{ correlationId: string }> {
  let accessToken: string | null = null;
  let result: { correlationId: string } | null = null;
  let failure: unknown = null;
  try {
    const existingUser = await dependencies.getExistingUser();
    if (!existingUser) throw new ProofFailure("identity_unavailable");
    if (!activeExactUser(existingUser, now)) {
      throw new ProofFailure("identity_invalid");
    }
    const tokenHash = await dependencies.generateMagicLinkTokenHash();
    if (!tokenHash || tokenHash.length > 2_048) {
      throw new ProofFailure("session_mint_failed");
    }
    const session = await dependencies.verifyMagicLink(tokenHash);
    if (session?.accessToken && session.accessToken.length <= 8_192 &&
      JWT.test(session.accessToken)) accessToken = session.accessToken;
    const nowSeconds = Math.floor(now / 1_000);
    if (!session || !accessToken || !activeExactUser(session.user, now) ||
      !Number.isSafeInteger(session.expiresAt) ||
      session.expiresAt <= nowSeconds + 300 ||
      session.expiresAt > nowSeconds + 86_400) {
      throw new ProofFailure("session_invalid");
    }
    const [profiles, memberships] = await Promise.all([
      dependencies.readClientProfile(session.user.id),
      dependencies.readClientMembership(
        session.user.id,
        acceptanceAuthProofTarget.restaurantId,
      ),
    ]);
    if (!exactClientScope(profiles, memberships)) {
      throw new ProofFailure("client_scope_rejected");
    }
    const correlationId = dependencies.randomUuid?.() ?? crypto.randomUUID();
    if (!UUID.test(correlationId)) {
      throw new ProofFailure("finalize_transport_unavailable");
    }
    let response: Response;
    try {
      response = await dependencies.finalize({
        accessToken,
        correlationId: correlationId.toLowerCase(),
        body: {
          restaurantId: acceptanceAuthProofTarget.restaurantId,
          uploadSessionId: acceptanceAuthProofTarget.uploadSessionId,
          clientIdempotencyKey:
            acceptanceAuthProofTarget.clientIdempotencyKey,
          storagePath: acceptanceAuthProofTarget.storagePath,
        },
      });
    } catch {
      throw new ProofFailure("finalize_transport_unavailable");
    }
    if (!await expectedFinalizeRejection(response, correlationId.toLowerCase())) {
      throw new ProofFailure("unexpected_finalize_response");
    }
    result = { correlationId: correlationId.toLowerCase() };
  } catch (error) {
    failure = error;
  }

  let revocationFailed = false;
  if (accessToken) {
    try {
      await dependencies.revoke(accessToken);
    } catch {
      revocationFailed = true;
    }
  }
  try {
    await dependencies.clearClientSession();
  } catch {
    if (accessToken) revocationFailed = true;
  }
  if (revocationFailed) {
    throw new ProofFailure("session_revocation_unconfirmed");
  }
  if (failure) throw failure;
  if (!result) throw new ProofFailure("unexpected_finalize_response");
  return result;
}

export function createAcceptanceAuthProofHandler(
  dependencies: AcceptanceAuthProofHandlerDependencies,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (!dependencies.configured) {
      return noStore({ schemaVersion: 1, state: "not_found" }, 404);
    }
    try {
      await verifyWake(
        request,
        dependencies.wakeHmacSecret,
        dependencies.now?.() ?? Date.now(),
      );
    } catch (error) {
      const status = error instanceof RequestFailure ? error.status : 400;
      const state = error instanceof RequestFailure
        ? error.message
        : "invalid_request";
      return noStore({ schemaVersion: 1, state }, status);
    }
    try {
      const proof = await executeAcceptanceAuthProof(
        dependencies.operation,
        dependencies.now?.() ?? Date.now(),
      );
      return noStore({
        schemaVersion: 1,
        state: "candidate_rejection_observed",
        clientAuthorized: true,
        finalizeStatus: 503,
        correlationId: proof.correlationId,
        externalWriteAllowed: false,
        sessionRevoked: true,
      }, 200);
    } catch (error) {
      const state = error instanceof ProofFailure
        ? error.code
        : "acceptance_proof_unavailable";
      return noStore({
        schemaVersion: 1,
        state,
        externalWriteAllowed: false,
      }, 503);
    }
  };
}
