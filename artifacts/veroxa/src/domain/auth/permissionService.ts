import { can, rolePermissions, type AppAction, type AppRole } from "@/domain/users/permissions";
import type { AuthUser } from "./types";

/** Permission checks against the role framework. Wraps domain/users/permissions. */
export const PermissionService = {
  can(user: AuthUser | null, action: AppAction): boolean {
    return user ? can(user.role, action) : false;
  },
  modulesFor(role: AppRole): string[] {
    return rolePermissions[role].visibleModules;
  },
  restrictedFor(role: AppRole): string[] {
    return rolePermissions[role].restrictedModules;
  },
  allowedActions(role: AppRole): readonly AppAction[] {
    return rolePermissions[role].allowedActions;
  },
};
