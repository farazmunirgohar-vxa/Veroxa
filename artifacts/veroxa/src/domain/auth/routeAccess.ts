import type { AppRole } from "@/domain/users/permissions";

export type RouteAccess = "public" | "authenticated" | { roles: AppRole[] };

export interface RouteRule {
  pattern: string;            // e.g. "/demo/client/*"
  access:  RouteAccess;
  note?:   string;
}

/**
 * Demo access matrix. Today's pages still use the existing route table;
 * this is the future-ready map a real router guard would consult.
 */
export const routeAccessMap: RouteRule[] = [
  { pattern: "/", access: "public", note: "Marketing landing" },
  { pattern: "/demo", access: "public", note: "Demo hub" },
  { pattern: "/demo/client/dashboard", access: "public", note: "The only public client demo surface" },
  { pattern: "/client/*", access: "public", note: "Current client review/demo route" },
  { pattern: "/team/*", access: { roles: ["team"] }, note: "Team/Internal Admin portal" },
  { pattern: "/demo/internal/*", access: { roles: ["team"] }, note: "Internal architecture and system status" },
];

export function ruleFor(path: string): RouteRule | undefined {
  return routeAccessMap.find((r) => {
    if (r.pattern.endsWith("/*")) return path.startsWith(r.pattern.slice(0, -1));
    return path === r.pattern;
  });
}

export function isAllowed(path: string, role: AppRole | null): boolean {
  const rule = ruleFor(path);
  if (!rule) return false;
  if (rule.access === "public") return true;
  if (rule.access === "authenticated") return role !== null;
  return role !== null && rule.access.roles.includes(role);
}
