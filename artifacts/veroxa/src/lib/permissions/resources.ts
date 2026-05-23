export const PermissionResource = {
  account_profile:    "account_profile",
  onboarding:         "onboarding",
  platform_access:    "platform_access",
  media_library:      "media_library",
  content_concepts:   "content_concepts",
  draft_sets:         "draft_sets",
  draft_variants:     "draft_variants",
  post_schedule:      "post_schedule",
  publish_log:        "publish_log",
  weekly_reports:     "weekly_reports",
  monthly_reports:    "monthly_reports",
  alerts:             "alerts",
  client_health:      "client_health",
  user_admin:         "user_admin",
  revenue_dashboard:  "revenue_dashboard",
  activity_logs:      "activity_logs",
} as const;
export type PermissionResource = (typeof PermissionResource)[keyof typeof PermissionResource];
