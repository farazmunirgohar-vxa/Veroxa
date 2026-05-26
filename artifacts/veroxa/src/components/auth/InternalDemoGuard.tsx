import { useState } from "react";
import { Link } from "wouter";
import { Lock, AlertTriangle, Loader2, KeyRound, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/useAuth";
import type { VeroxaRole } from "@/lib/auth/authContract";
import { getDemoRoleHomePath } from "@/lib/auth/authContract";
import { AUTH_MODE } from "@/lib/auth/authMode";

// ---------------------------------------------------------------------------
// Demo-only gate constants (placeholder mode only — not real auth)
// ---------------------------------------------------------------------------
const DEMO_ACCESS_KEY = "veroxa_demo_internal_access";
const DEMO_ACCESS_CODE = "veroxa-preview";

function hasStoredAccess(): boolean {
  try {
    return localStorage.getItem(DEMO_ACCESS_KEY) === "true";
  } catch {
    return false;
  }
}

function grantStoredAccess(): void {
  try {
    localStorage.setItem(DEMO_ACCESS_KEY, "true");
  } catch {}
}

function revokeStoredAccess(): void {
  try {
    localStorage.removeItem(DEMO_ACCESS_KEY);
  } catch {}
}

const ROLE_LABELS: Partial<Record<VeroxaRole, string>> = {
  team: "Team Portal",
  operator: "Operator Portal",
  owner: "Owner Portal",
};

function getPortalLabel(role: VeroxaRole | VeroxaRole[]): string {
  const first = Array.isArray(role) ? role[0] : role;
  return ROLE_LABELS[first] ?? "Internal Portal";
}

// ---------------------------------------------------------------------------
// DemoInternalGate — placeholder-mode only component
// ---------------------------------------------------------------------------
interface DemoGateProps {
  role: VeroxaRole | VeroxaRole[];
  children: React.ReactNode;
}

function DemoInternalGate({ role, children }: DemoGateProps) {
  const [access, setAccess] = useState(() => hasStoredAccess());
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const portalLabel = getPortalLabel(role);

  if (access) {
    return (
      <>
        {children}
        {/* Unobtrusive "clear demo access" escape hatch */}
        <button
          onClick={() => {
            revokeStoredAccess();
            setAccess(false);
            setCode("");
            setError(false);
          }}
          className="fixed bottom-4 right-4 z-50 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors underline underline-offset-2 cursor-pointer"
          data-testid="btn-clear-demo-access"
        >
          Clear demo access
        </button>
      </>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim() === DEMO_ACCESS_CODE) {
      grantStoredAccess();
      setAccess(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-5 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-primary/5 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-sm space-y-7">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center space-y-2">
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="demo-gate-heading"
          >
            Internal Demo Access
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            {portalLabel} Preview
          </p>
          <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-xs mx-auto">
            This is a protected Veroxa preview area. Real authentication
            is not active yet.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="demo-access-code"
              className="text-xs font-semibold text-muted-foreground block"
            >
              Demo access code
            </label>
            <Input
              id="demo-access-code"
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
              placeholder="Enter code"
              autoComplete="off"
              className="w-full"
              data-testid="input-demo-code"
            />
            {error && (
              <p
                className="text-[11px] text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
                data-testid="demo-code-error"
              >
                <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                Incorrect code. Try again.
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full font-semibold"
            data-testid="btn-enter-demo"
          >
            Enter {portalLabel}
          </Button>
        </form>

        {/* Disclaimer */}
        <p className="text-center text-[10px] text-muted-foreground/40 leading-relaxed">
          Demo-only gate. Real role-based login will activate after
          Supabase auth is reviewed.
        </p>

        {/* Back link */}
        <div className="flex justify-center">
          <Link
            href="/login"
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors underline underline-offset-2"
            data-testid="link-back-to-login"
          >
            Back to portal selection
          </Link>
        </div>
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
 *     Check localStorage for demo access token.
 *     - Token present  → render children (+ "Clear demo access" button)
 *     - Token absent   → show DemoInternalGate code screen
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
    return <DemoInternalGate role={role}>{children}</DemoInternalGate>;
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
              This internal Veroxa demo is only available after signing in.
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
