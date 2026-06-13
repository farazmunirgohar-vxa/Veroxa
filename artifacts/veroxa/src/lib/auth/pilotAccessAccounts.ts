import { getRoleHomePath, type VeroxaRole } from "./authContract";

export type PilotAccountSource = "server-controlled" | "disabled-placeholder";

export interface PilotAccessAccount {
  role: VeroxaRole;
  email: string;
  accountLabel: string;
  accountId: string;
  clientId: string | null;
  restaurantId: string | null;
  source: PilotAccountSource;
}

export interface PilotAccessStatus {
  isConfigured: boolean;
  serverEndpointConfigured: boolean;
  configuredAccountCount: number;
  statusLabel: "Pilot login endpoint available" | "Pilot login endpoint unavailable";
  helperText: string;
}

export type PilotAccessFailureMode = "endpoint_unavailable" | "disabled" | "unauthorized" | "rate_limited" | "method_not_allowed" | "unexpected_error";

export type PilotAccessValidationResult =
  | { ok: true; account: PilotAccessAccount }
  | { ok: false; mode: PilotAccessFailureMode };

interface PilotAccessServerResponse {
  ok?: unknown;
  mode?: unknown;
  accountId?: unknown;
  email?: unknown;
  role?: unknown;
}

const PILOT_ACCESS_ENDPOINT_ENV = "VITE_VEROXA_PILOT_ACCESS_ENDPOINT";

export const MOMO_HOUSE_CLIENT_ACCOUNT_LABEL = "Momo House San Antonio";
export const TEAM_FARAZ_ACCOUNT_LABEL = "Team Faraz";
export const MOMO_HOUSE_CLIENT_ID = "client-momo-house-san-antonio";
export const MOMO_HOUSE_RESTAURANT_ID = "pilot-momo-house-san-antonio";
export const MOMO_HOUSE_CLIENT_ACCOUNT_ID = "pilot-account-momo-house-san-antonio";
export const TEAM_FARAZ_ACCOUNT_ID = "pilot-account-team-faraz";

function readViteEnv(name: string): string | null {
  const value = (import.meta.env as Record<string, unknown>)[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getPilotAccessEndpoint(): string | null {
  return readViteEnv(PILOT_ACCESS_ENDPOINT_ENV) ?? "/api/pilot-access";
}

function getPilotAccountAllowlist(): readonly PilotAccessAccount[] {
  return [
    {
      role: "client",
      email: "momo@veroxa.app",
      accountLabel: MOMO_HOUSE_CLIENT_ACCOUNT_LABEL,
      accountId: MOMO_HOUSE_CLIENT_ACCOUNT_ID,
      clientId: MOMO_HOUSE_CLIENT_ID,
      restaurantId: MOMO_HOUSE_RESTAURANT_ID,
      source: "server-controlled",
    },
    {
      role: "team",
      email: "faraz@veroxa.app",
      accountLabel: TEAM_FARAZ_ACCOUNT_LABEL,
      accountId: TEAM_FARAZ_ACCOUNT_ID,
      clientId: null,
      restaurantId: null,
      source: "server-controlled",
    },
  ];
}

export function getPilotAccessAccounts(): readonly PilotAccessAccount[] {
  return getPilotAccountAllowlist();
}

export function findPilotAccessAccountBySessionFields(fields: {
  accountId: string;
  email: string;
  role: VeroxaRole;
  clientId: string | null;
  restaurantId: string | null;
}): PilotAccessAccount | null {
  const normalizedEmail = fields.email.trim().toLowerCase();
  const account = getPilotAccountAllowlist().find(
    (candidate) => candidate.accountId === fields.accountId,
  );
  if (!account) return null;
  if (account.email !== normalizedEmail || account.role !== fields.role) return null;
  if (account.clientId !== fields.clientId) return null;
  if (account.restaurantId !== fields.restaurantId) return null;
  return account;
}

export function getPilotAccessStatus(): PilotAccessStatus {
  const serverEndpointConfigured = Boolean(getPilotAccessEndpoint());
  return {
    isConfigured: serverEndpointConfigured,
    serverEndpointConfigured,
    configuredAccountCount: serverEndpointConfigured ? getPilotAccountAllowlist().length : 0,
    statusLabel: serverEndpointConfigured ? "Pilot login endpoint available" : "Pilot login endpoint unavailable",
    helperText: serverEndpointConfigured
      ? "passwords are checked server-side. No portal passwords are bundled in the browser."
      : "Pilot login is not connected in this environment. Contact Team Faraz directly.",
  };
}

function readSafeFailureMode(mode: unknown, responseOk: boolean): PilotAccessFailureMode {
  if (mode === "disabled" || mode === "unauthorized" || mode === "rate_limited" || mode === "method_not_allowed") {
    return mode;
  }
  return responseOk ? "unexpected_error" : "endpoint_unavailable";
}

export async function validatePilotAccessCredentials(
  emailOrId: string,
  password: string,
): Promise<PilotAccessValidationResult> {
  const endpoint = getPilotAccessEndpoint();
  const normalizedEmail = emailOrId.trim().toLowerCase();
  if (!endpoint) return { ok: false, mode: "endpoint_unavailable" };
  if (!normalizedEmail || !password) return { ok: false, mode: "unauthorized" };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
  } catch {
    return { ok: false, mode: "endpoint_unavailable" };
  }

  let payload: PilotAccessServerResponse = {};
  try {
    payload = (await response.json()) as PilotAccessServerResponse;
  } catch {
    return { ok: false, mode: response.ok ? "unexpected_error" : "endpoint_unavailable" };
  }

  if (!response.ok || payload.ok !== true) {
    return { ok: false, mode: readSafeFailureMode(payload.mode, response.ok) };
  }

  const accountId = typeof payload.accountId === "string" ? payload.accountId : null;
  const responseEmail = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : normalizedEmail;
  const role = payload.role === "client" || payload.role === "team" ? payload.role : null;
  if (!accountId || !role) return { ok: false, mode: "unexpected_error" };

  const account = getPilotAccountAllowlist().find(
    (candidate) => candidate.accountId === accountId && candidate.email === responseEmail && candidate.role === role,
  );

  return account ? { ok: true, account } : { ok: false, mode: "unexpected_error" };
}


export function getPilotRouteForRole(role: VeroxaRole): string {
  return getRoleHomePath(role);
}
