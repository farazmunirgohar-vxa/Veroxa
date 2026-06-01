import { Link } from "wouter";
import { Lock, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/useAuth";
import type { VeroxaRole } from "@/lib/auth/authContract";
import { getRoleHomePath } from "@/lib/auth/authContract";

// ---------------------------------------------------------------------------
// InternalDemoGuard — public API
// ---------------------------------------------------------------------------

interface InternalDemoGuardProps {
  /** Single role or list of roles allowed to view the page. */
  role: VeroxaRole | VeroxaRole[];
  children: React.ReactNode;
}

/**
 * InternalDemoGuard — protects /team/* from unauthenticated and wrong-role
 * access.
 *
 * Do NOT use on /demo/client/* — that remains public.
 *
 * Rules:
 *   AUTH_MODE === "placeholder":
 *     - Team routes require a placeholder session marker created only after
 *       successful env-backed login. AUTH_MODE alone never grants access.
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
    // Active roles (client, team) go to their real portal home.
    const redirectPath = currentRole ? getRoleHomePath(currentRole) : "/login";
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
