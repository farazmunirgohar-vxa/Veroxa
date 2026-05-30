export type VeroxaRole = "client" | "team";

export type VeroxaPermission =
  | "view_client_safe_progress"
  | "upload_media"
  | "manage_content_workflow"
  | "validate_weekly_report"
  | "review_monthly_report"
  | "manage_internal_alerts"
  | "manage_content_health"
  | "manage_automation_workflow";

const rolePermissions: Record<VeroxaRole, ReadonlySet<VeroxaPermission>> = {
  client: new Set(["view_client_safe_progress", "upload_media"]),
  team: new Set([
    "view_client_safe_progress",
    "upload_media",
    "manage_content_workflow",
    "validate_weekly_report",
    "review_monthly_report",
    "manage_internal_alerts",
    "manage_content_health",
    "manage_automation_workflow",
  ]),
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

export function canReviewMonthlyReport(role: VeroxaRole): boolean {
  return role === "team";
}

export const canApproveMonthlyReport = canReviewMonthlyReport;

export function assertClientSafeRole(role: VeroxaRole): boolean {
  return role === "client" && canRole(role, "view_client_safe_progress");
}
