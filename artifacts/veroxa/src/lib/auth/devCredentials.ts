/**
 * Compatibility wrapper for Real Login V1 pilot portal access.
 *
 * Older call sites and tests used the devCredentials module name. The active
 * login behavior is now pilot access for the two locked Veroxa portals only:
 * Client Portal and Team/Internal Admin Portal. This is still deterministic
 * placeholder/manual auth while AUTH_MODE remains "placeholder"; it is not
 * secure production auth and it does not create users or write records.
 */

import type { VeroxaRole } from "./authContract";
import {
  getPilotAccessAccounts,
  getPilotAccessStatus,
  getPilotRouteForRole,
  validatePilotAccessCredentials,
  type PilotAccessAccount,
  type PilotAccessStatus,
} from "./pilotAccessAccounts";

export type DevCredential = PilotAccessAccount;
export type PlaceholderCredentialStatus = PilotAccessStatus;

export function getDevRoleCredentials(): readonly DevCredential[] {
  return getPilotAccessAccounts();
}

export function hasConfiguredDevCredentials(): boolean {
  return getPilotAccessAccounts().length > 0;
}

export function getPlaceholderCredentialStatus(): PlaceholderCredentialStatus {
  return getPilotAccessStatus();
}

export function validateDevCredentials(
  emailOrId: string,
  password: string,
): VeroxaRole | null {
  return validatePilotAccessCredentials(emailOrId, password)?.role ?? null;
}

export function getDevRouteForRole(role: VeroxaRole): string {
  return getPilotRouteForRole(role);
}
