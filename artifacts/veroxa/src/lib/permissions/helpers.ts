import { permissionMatrix } from "./permissionMatrix";
import type { Role } from "./roles";
import type { PermissionAction } from "./actions";
import type { PermissionResource } from "./resources";

// ─────────────────────────────────────────────────────────────────────────────
// Pure permission helpers — no external dependencies, no runtime auth.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the given role is allowed to perform `action` on `resource`.
 *
 * Example:
 *   can("client", "view", "post_schedule")  // true
 *   can("client", "approve", "draft_sets")  // false
 */
export function can(
  role: Role,
  action: PermissionAction,
  resource: PermissionResource
): boolean {
  const rolePermissions = permissionMatrix[role];
  if (!rolePermissions) return false;
  const allowed = rolePermissions[resource];
  if (!allowed) return false;
  return (allowed as ReadonlyArray<string>).includes(action);
}

/**
 * Returns the list of actions the given role may perform on a resource.
 * Returns an empty array if the role has no access to that resource.
 *
 * Example:
 *   getAllowedActions("team", "draft_variants")
 *   // ["create", "edit", "approve"]
 */
export function getAllowedActions(
  role: Role,
  resource: PermissionResource
): ReadonlyArray<PermissionAction> {
  const rolePermissions = permissionMatrix[role];
  if (!rolePermissions) return [];
  return rolePermissions[resource] ?? [];
}

/**
 * Returns the list of resources the given role has any access to.
 *
 * Example:
 *   getAllowedResources("client")
 *   // ["account_profile", "platform_access", "media_library", ...]
 */
export function getAllowedResources(role: Role): ReadonlyArray<PermissionResource> {
  const rolePermissions = permissionMatrix[role];
  if (!rolePermissions) return [];
  return Object.keys(rolePermissions) as PermissionResource[];
}
