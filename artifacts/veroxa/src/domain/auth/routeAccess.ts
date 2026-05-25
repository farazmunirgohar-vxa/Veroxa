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
  { pattern: "/",                          access: "public", note: "Marketing landing" },
  { pattern: "/demo",                      access: "public", note: "Demo hub" },
  { pattern: "/demo/client/*",             access: "public", note: "Client portal demo — always public in demo mode" },
  { pattern: "/demo/team/*",               access: { roles: ["team", "operator", "owner"] } },
  { pattern: "/demo/operator/*",           access: { roles: ["operator", "owner"] } },
  { pattern: "/demo/owner/*",              access: { roles: ["owner"] } },
  { pattern: "/demo/internal/*",           access: { roles: ["operator", "owner"] }, note: "Internal architecture, system status, demo controls" },
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
