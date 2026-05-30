export type VeroxaRole = "client" | "team" | "operator" | "owner";

export type VeroxaPermission =
  | "view_client_safe_progress"
  | "upload_media"
  | "manage_content_workflow"
  | "validate_weekly_report"
  | "approve_monthly_report"
  | "view_operator_risk"
  | "view_owner_health";

const rolePermissions: Record<VeroxaRole, ReadonlySet<VeroxaPermission>> = {
  client: new Set(["view_client_safe_progress", "upload_media"]),
  team: new Set([
    "manage_content_workflow",
    "validate_weekly_report",
    "view_operator_risk",
  ]),
  operator: new Set(["approve_monthly_report", "view_operator_risk"]),
  owner: new Set(["view_owner_health"]),
};

export function canRole(
  role: VeroxaRole,
  permission: VeroxaPermission,
): boolean {
  return rolePermissions[role].has(permission);
}

export function canApprovePost(role: VeroxaRole): boolean {
  return role === "team";
}

export function canApproveMonthlyReport(role: VeroxaRole): boolean {
  return role === "operator";
}

export function assertClientSafeRole(role: VeroxaRole): boolean {
  return role === "client" && canRole(role, "view_client_safe_progress");
}
