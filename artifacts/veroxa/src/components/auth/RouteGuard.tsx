import { type ReactNode } from "react";
import { ShieldX } from "lucide-react";
import type { AppRole } from "@/domain/users/permissions";

interface Props {
  roles:    AppRole[];          // allowed roles
  current?: AppRole | null;     // demo: defaults to team (Internal Admin posture)
  children: ReactNode;
  fallback?: ReactNode;
  testId?:  string;
}

/**
 * Generic role-based guard. Demo-aware: in demo mode pages set `current` themselves;
 * future real auth will pull `current` from AuthService session.
 *
 * NOTE: This is the *future* router guard. Existing pages keep their existing
 * InternalDemoGuard — RouteGuard is not retrofitted in Batch A.
 */
export function RouteGuard({ roles, current = "team", children, fallback, testId }: Props) {
  if (current && roles.includes(current)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  return (
    <div className="min-h-[40vh] flex items-center justify-center p-6" data-testid={testId ?? "route-guard-denied"}>
      <div className="max-w-sm rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-center">
        <ShieldX className="w-6 h-6 mx-auto mb-2 text-rose-300" />
        <p className="text-sm font-semibold">Access restricted</p>
        <p className="text-xs text-muted-foreground mt-1">
          This area requires {roles.join(" / ")} access.
        </p>
      </div>
    </div>
  );
}
