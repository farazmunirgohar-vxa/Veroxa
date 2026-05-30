import { Link } from "wouter";
import { ArrowRight, Hexagon, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/useAuth";
import { getRoleHomePath, type VeroxaRole } from "@/lib/auth/authContract";

interface RequireRoleProps {
  role: VeroxaRole;
  children?: ReactNode;
  /** Optional override for the card heading. Defaults to "{Role} Portal — Coming Soon". */
  title?: string;
  /** Optional override for the body description. */
  description?: string;
}

const roleLabels: Record<VeroxaRole, string> = {
  client:   "Client",
  team:     "Team",
};

/**
 * RequireRole — UI shell only. No real auth, no redirects.
 *
 * Today this always shows the "Protected Route Preview" card because the
 * placeholder hook always returns unauthenticated. When real auth ships,
 * the only thing that changes is the hook implementation — this
 * component's call sites stay the same.
 *
 * Intentionally not used on `/demo/*` routes.
 */
export function RequireRole({ role, children, title, description }: RequireRoleProps) {
  const { status } = useAuth();

  if (status === "authenticated") {
    return <>{children}</>;
  }

  const roleLabel = roleLabels[role];
  const roleHomePath = getRoleHomePath(role);
  const heading = title ?? `${roleLabel} Portal — Coming Soon`;

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      data-testid={`require-role-${role}`}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Brand mark */}
      <div className="flex items-center gap-2 text-sm mb-10">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Hexagon className="w-5 h-5 fill-primary/20" />
        </div>
        <span className="font-bold tracking-tight text-lg">Veroxa</span>
      </div>

      <Card
        className="w-full max-w-lg bg-card border-border shadow-2xl shadow-primary/5"
        data-testid="protected-route-preview"
      >
        <CardContent className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-[10px] font-semibold tracking-wide uppercase mb-4 mx-auto block w-fit">
            Protected Route Preview
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-center mb-3">
            {heading}
          </h1>

          {description ? (
            <p className="text-sm text-muted-foreground text-center leading-relaxed mb-7">
              {description}
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center leading-relaxed mb-2">
                This real portal route will require authenticated{" "}
                <span
                  className="text-foreground font-semibold"
                  data-testid="required-role"
                >
                  {roleLabel.toLowerCase()}
                </span>{" "}
                access.
              </p>
              <p className="text-sm text-muted-foreground text-center leading-relaxed mb-7">
                Authentication is not connected yet.
              </p>
            </>
          )}

          <div className="rounded-xl border border-border bg-muted/30 p-4 mb-6">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              When real auth ships, this route will read your Supabase Auth session,
              look up <code className="text-foreground/80">user_profiles.role</code>,
              and only render content if it matches{" "}
              <code className="text-foreground/80" data-testid="required-role-code">{role}</code>.
              Authenticated <span className="font-semibold text-foreground">{roleLabel.toLowerCase()}s</span> will
              land at{" "}
              <code className="text-foreground/80" data-testid="role-home-path">{roleHomePath}</code>.
              Until then, you can preview the same experience in the demo portal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/login" className="flex-1" data-testid={`link-back-login-${role}`}>
              <Button variant="default" className="w-full font-semibold">
                Back to Login
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/demo/client/dashboard" className="flex-1" data-testid={`link-demo-hub-${role}`}>
              <Button variant="outline" className="w-full font-semibold">
                Open Demo Preview
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground/60 mt-8 max-w-md text-center leading-relaxed">
        No real authentication, sessions, cookies, or tokens are used today.
        See <code className="text-foreground/70">docs/AUTH_ARCHITECTURE_PLAN.md</code> for details.
      </p>
    </div>
  );
}
