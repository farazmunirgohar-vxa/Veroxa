import { getRoleHomePath, type VeroxaRole } from "./authContract";

export type PilotAccountSource = "env" | "deterministic-pilot";

export interface PilotAccessAccount {
  role: VeroxaRole;
  email: string;
  password: string;
  accountLabel: string;
  clientId: string | null;
  restaurantId: string | null;
  source: PilotAccountSource;
}

export interface PilotAccessStatus {
  isConfigured: boolean;
  envCredentialCount: number;
  deterministicAccountCount: number;
  statusLabel: "Portal access ready" | "Portal access unavailable";
  helperText: string;
}

const PILOT_CLIENT_EMAIL_ENV = "VITE_VEROXA_PILOT_CLIENT_EMAIL";
const PILOT_CLIENT_PASSWORD_ENV = "VITE_VEROXA_PILOT_CLIENT_PASSWORD";
const PILOT_TEAM_EMAIL_ENV = "VITE_VEROXA_PILOT_TEAM_EMAIL";
const PILOT_TEAM_PASSWORD_ENV = "VITE_VEROXA_PILOT_TEAM_PASSWORD";

const LEGACY_CLIENT_EMAIL_ENV = "VITE_VEROXA_DEV_CLIENT_EMAIL";
const LEGACY_CLIENT_PASSWORD_ENV = "VITE_VEROXA_DEV_CLIENT_PASSWORD";
const LEGACY_TEAM_EMAIL_ENV = "VITE_VEROXA_DEV_TEAM_EMAIL";
const LEGACY_TEAM_PASSWORD_ENV = "VITE_VEROXA_DEV_TEAM_PASSWORD";

export const MOMO_HOUSE_CLIENT_ACCOUNT_LABEL = "Momo House San Antonio";
export const TEAM_FARAZ_ACCOUNT_LABEL = "Team Faraz";
export const MOMO_HOUSE_CLIENT_ID = "client-momo-house-san-antonio";
export const MOMO_HOUSE_RESTAURANT_ID = "pilot-momo-house-san-antonio";

function readViteEnv(name: string): string | null {
  const value = (import.meta.env as Record<string, unknown>)[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function accountFromEnv(
  role: VeroxaRole,
  label: string,
  clientId: string | null,
  restaurantId: string | null,
  primaryEmailEnv: string,
  primaryPasswordEnv: string,
  legacyEmailEnv: string,
  legacyPasswordEnv: string,
): PilotAccessAccount | null {
  const email = (readViteEnv(primaryEmailEnv) ?? readViteEnv(legacyEmailEnv))?.toLowerCase();
  const password = readViteEnv(primaryPasswordEnv) ?? readViteEnv(legacyPasswordEnv);
  if (!email || !password) return null;
  return { role, email, password, accountLabel: label, clientId, restaurantId, source: "env" };
}

function getEnvPilotAccounts(): readonly PilotAccessAccount[] {
  return [
    accountFromEnv(
      "client",
      MOMO_HOUSE_CLIENT_ACCOUNT_LABEL,
      MOMO_HOUSE_CLIENT_ID,
      MOMO_HOUSE_RESTAURANT_ID,
      PILOT_CLIENT_EMAIL_ENV,
      PILOT_CLIENT_PASSWORD_ENV,
      LEGACY_CLIENT_EMAIL_ENV,
      LEGACY_CLIENT_PASSWORD_ENV,
    ),
    accountFromEnv(
      "team",
      TEAM_FARAZ_ACCOUNT_LABEL,
      null,
      null,
      PILOT_TEAM_EMAIL_ENV,
      PILOT_TEAM_PASSWORD_ENV,
      LEGACY_TEAM_EMAIL_ENV,
      LEGACY_TEAM_PASSWORD_ENV,
    ),
  ].filter((account): account is PilotAccessAccount => Boolean(account));
}

function getDeterministicPilotAccounts(): readonly PilotAccessAccount[] {
  return [
    {
      role: "client",
      email: "momo@veroxa.app",
      password: "momohousepilot",
      accountLabel: MOMO_HOUSE_CLIENT_ACCOUNT_LABEL,
      clientId: MOMO_HOUSE_CLIENT_ID,
      restaurantId: MOMO_HOUSE_RESTAURANT_ID,
      source: "deterministic-pilot",
    },
    {
      role: "team",
      email: "faraz@veroxa.app",
      password: "teamfarazpilot",
      accountLabel: TEAM_FARAZ_ACCOUNT_LABEL,
      clientId: null,
      restaurantId: null,
      source: "deterministic-pilot",
    },
  ];
}

export function getPilotAccessAccounts(): readonly PilotAccessAccount[] {
  return [...getEnvPilotAccounts(), ...getDeterministicPilotAccounts()];
}

export function getPilotAccessStatus(): PilotAccessStatus {
  const envCredentialCount = getEnvPilotAccounts().length;
  const deterministicAccountCount = getDeterministicPilotAccounts().length;
  return {
    isConfigured: envCredentialCount + deterministicAccountCount > 0,
    envCredentialCount,
    deterministicAccountCount,
    statusLabel: "Portal access ready",
    helperText: "Pilot portal access is available for the Client Portal and Team Portal. Access is managed manually by Veroxa for this pilot.",
  };
}

export function validatePilotAccessCredentials(
  emailOrId: string,
  password: string,
): PilotAccessAccount | null {
  const normalizedEmail = emailOrId.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;
  return getPilotAccessAccounts().find(
    (account) => account.email === normalizedEmail && account.password === password,
  ) ?? null;
}

export function getPilotRouteForRole(role: VeroxaRole): string {
  return getRoleHomePath(role);
}
