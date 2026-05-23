export const Role = {
  client:   "client",
  team:     "team",
  operator: "operator",
  owner:    "owner",
  system:   "system",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

// Roles that map to a human portal user (excludes system).
export type UserFacingRole = "client" | "team" | "operator" | "owner";
