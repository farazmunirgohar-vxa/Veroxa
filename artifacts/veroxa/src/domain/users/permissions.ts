/**
 * Role permission framework. Read-only architecture — drives future RBAC.
 * Demo today; production tomorrow. UI guards continue to use InternalDemoGuard.
 */
export type AppRole = "client" | "team";
export type AppAction =
  | "view_client_safe_progress"
  | "upload_media"
  | "manage_content_workflow"
  | "validate_weekly_report"
  | "review_monthly_report"
  | "manage_internal_alerts"
  | "manage_content_health"
  | "manage_automation_workflow";

export interface RolePermission {
  role: AppRole;
  label: string;
  visibleModules: string[];
  restrictedModules: string[];
  allowedActions: AppAction[];
}

export const rolePermissions: Record<AppRole, RolePermission> = {
  client: {
    role: "client",
    label: "Client Portal",
    visibleModules: ["Account", "Onboarding", "Media Uploads", "Progress", "Reports", "Requests", "Notifications"],
    restrictedModules: ["Internal Workflow", "Approval Queue", "Content Health", "Alerts", "Automation Controls", "AI Assist", "Internal Notes"],
    allowedActions: ["view_client_safe_progress", "upload_media"],
  },
  team: {
    role: "team",
    label: "Team / Internal Admin Portal",
    visibleModules: ["Dashboard", "Upload Inbox", "Work Queue", "Approval Queue", "Report Queue", "Alerts", "Content Health", "Visibility Audit", "Automation Controls"],
    restrictedModules: [],
    allowedActions: [
      "view_client_safe_progress",
      "upload_media",
      "manage_content_workflow",
      "validate_weekly_report",
      "review_monthly_report",
      "manage_internal_alerts",
      "manage_content_health",
      "manage_automation_workflow",
    ],
  },
};

export const can = (role: AppRole, action: AppAction): boolean =>
  rolePermissions[role].allowedActions.includes(action);
