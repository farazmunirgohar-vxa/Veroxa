import { Link } from "wouter";
import { Lock, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/useAuth";
import type { VeroxaRole } from "@/lib/auth/authContract";
import { getDemoRoleHomePath } from "@/lib/auth/authContract";
import { AUTH_MODE } from "@/lib/auth/authMode";

// ---------------------------------------------------------------------------
// ParkedPortal — shown when a route belongs to a parked role (operator/owner)
// ---------------------------------------------------------------------------
function ParkedPortal() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="parked-heading">
            Parked
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This area is parked for the current build.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login" data-testid="parked-back-to-login">Back to Login</Link>
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InternalDemoGuard — public API
// ---------------------------------------------------------------------------

interface InternalDemoGuardProps {
  /** Single role or list of roles allowed to view the page. */
  role: VeroxaRole | VeroxaRole[];
  children: React.ReactNode;
}

/**
 * InternalDemoGuard — protects /demo/team/*, /demo/operator/*,
 * and /demo/owner/* from unauthenticated and wrong-role access.
 *
 * Do NOT use on /demo/client/* — that remains public.
 *
 * Rules:
 *   AUTH_MODE === "placeholder":
 *     - Route includes "team"        → render children (active portal)
 *     - Route is operator/owner only → show ParkedPortal (not in current build)
 *     No access code required after valid email/password login.
 *
 *   AUTH_MODE === "real":
 *     - loading  → "Checking Veroxa access…" card
 *     - unauth   → "Login required" card with link to /login
 *     - authed, matching role → render children
 *     - authed, wrong role    → "Wrong portal" card
 *
 * No writes. No token display. No service role.
 */
export default function InternalDemoGuard({ role, children }: InternalDemoGuardProps) {
  if (AUTH_MODE === "placeholder") {
    const roles = Array.isArray(role) ? role : [role];
    // Operator and Owner are parked for the current build.
    // If the route allows team (alone or alongside others), it is active.
    if (!roles.includes("team")) {
      return <ParkedPortal />;
    }
    // Team or team+others — active in placeholder mode; no access code required.
    return <>{children}</>;
  }

  // Real-auth path — only reached when AUTH_MODE === "real".
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const auth = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Checking Veroxa access…</p>
        </div>
      </div>
    );
  }

  if (auth.status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Login required</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This internal Veroxa portal is only available after signing in.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Sign in to Veroxa</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentRole = auth.session?.role;
  const allowed = Array.isArray(role) ? role : [role];

  if (!currentRole || !allowed.includes(currentRole)) {
    const redirectPath = currentRole ? getDemoRoleHomePath(currentRole) : "/login";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Wrong portal for this login</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are signed in as{" "}
              <span className="text-foreground font-semibold">{currentRole ?? "unknown"}</span>.
              Open your portal instead.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href={redirectPath}>Go to my portal</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
