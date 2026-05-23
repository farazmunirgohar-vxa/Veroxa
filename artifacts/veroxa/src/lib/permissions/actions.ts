export const PermissionAction = {
  view:          "view",
  create:        "create",
  edit:          "edit",
  approve:       "approve",
  trigger:       "trigger",
  receive_alert: "receive_alert",
} as const;
export type PermissionAction = (typeof PermissionAction)[keyof typeof PermissionAction];
