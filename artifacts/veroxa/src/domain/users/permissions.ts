/**
 * Role permission framework. Read-only architecture — drives future RBAC.
 * Demo today; production tomorrow. UI guards continue to use InternalDemoGuard.
 */
export type AppRole = "client" | "team" | "operator" | "owner";
export type AppAction =
  | "view_client_detail_internal" | "view_client_detail_safe"
  | "edit_content" | "approve_content" | "publish_content"
  | "draft_report" | "validate_report" | "publish_report"
  | "manage_tasks" | "assign_task" | "complete_task"
  | "view_revenue" | "view_internal_notes" | "view_ai_confidence"
  | "view_team_workload" | "manage_permissions" | "view_system_status";

export interface RolePermission {
  role:            AppRole;
  label:           string;
  visibleModules:  string[];
  restrictedModules: string[];
  allowedActions:  AppAction[];
}

export const rolePermissions: Record<AppRole, RolePermission> = {
  client: {
    role: "client", label: "Client",
    visibleModules: ["Account", "Onboarding", "Media", "Content", "Calendar", "Reports", "Requests", "Notifications", "Activity"],
    restrictedModules: ["Internal Client Detail", "Operations Center", "Command Board", "Team Oversight", "Revenue", "Internal Notes", "AI Confidence", "System Status"],
    allowedActions: ["view_client_detail_safe", "complete_task"],
  },
  team: {
    role: "team", label: "Team",
    visibleModules: ["Dashboard", "Task Engine", "Work Queue", "Content Review", "Report Queue", "Client Detail (internal)"],
    restrictedModules: ["Revenue", "Permissions", "System Status (full)"],
    allowedActions: ["view_client_detail_internal", "edit_content", "draft_report", "complete_task", "view_internal_notes"],
  },
  operator: {
    role: "operator", label: "Operator",
    visibleModules: ["Command Board", "Operations Center", "Workflow Engine", "Content Calendar", "Client Detail (internal)", "Reporting Command", "Team Oversight", "Risk Center", "Demo Controls", "System Status"],
    restrictedModules: ["Revenue (limited)", "Permissions"],
    allowedActions: ["view_client_detail_internal", "edit_content", "approve_content", "validate_report", "publish_report", "assign_task", "manage_tasks", "view_internal_notes", "view_ai_confidence", "view_team_workload", "view_system_status"],
  },
  owner: {
    role: "owner", label: "Owner",
    visibleModules: ["All operator modules", "Revenue", "Permissions", "Automation Roadmap", "System Map", "Business Health"],
    restrictedModules: [],
    allowedActions: ["view_client_detail_internal", "edit_content", "approve_content", "publish_content", "draft_report", "validate_report", "publish_report", "assign_task", "manage_tasks", "view_revenue", "view_internal_notes", "view_ai_confidence", "view_team_workload", "manage_permissions", "view_system_status"],
  },
};

export const can = (role: AppRole, action: AppAction): boolean =>
  rolePermissions[role].allowedActions.includes(action);
