import { Link } from "wouter";
import { ArrowLeft, Hexagon, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/useAuth";
import { AUTH_MODE } from "@/lib/auth/authMode";

/**
 * /auth-status — development diagnostics page.
 *
 * Shows the *shape* of the current auth state without ever exposing
 * sensitive material:
 *   - never renders access tokens, refresh tokens, or the raw
 *     Supabase session object,
 *   - only renders `userId`, `email`, `role`, `clientId`,
 *     `displayName`, `status`, `isDemoOnly`, and `AUTH_MODE`.
 *
 * No writes. No user creation. No mutations.
 */
export default function AuthStatusPage() {
  const state = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Veroxa.com
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Hexagon className="w-4 h-4 fill-primary/20" />
            </div>
            <span className="font-bold tracking-tight">Veroxa</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px] font-semibold tracking-wide mb-4">
          <ShieldAlert className="w-3 h-3" />
          Development diagnostics only — no writes, no user creation.
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2" data-testid="auth-status-heading">
          Auth Status
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Snapshot of the unified <code className="text-foreground/80">useAuth()</code> hook.
          Sensitive material (access tokens, refresh tokens, raw Supabase session) is
          intentionally never shown on this page.
        </p>

        <Card className="bg-card border-border" data-testid="auth-status-card">
          <CardContent className="p-6 space-y-4">
            <Row label="AUTH_MODE" value={AUTH_MODE} testid="row-auth-mode" />
            <Row label="status" value={state.status} testid="row-status" />
            <Row
              label="isDemoOnly"
              value={String(state.isDemoOnly)}
              testid="row-is-demo-only"
            />
            <Row
              label="role"
              value={state.session?.role ?? "—"}
              testid="row-role"
            />
            <Row
              label="clientId"
              value={state.session?.clientId ?? "—"}
              testid="row-client-id"
            />
            <Row
              label="userId"
              value={state.session?.userId ?? "—"}
              testid="row-user-id"
            />
            <Row
              label="email"
              value={state.session?.email ?? "—"}
              testid="row-email"
            />
            <Row
              label="displayName"
              value={state.session?.displayName ?? "—"}
              testid="row-display-name"
            />
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground/70 mt-8 leading-relaxed">
          This page reads the same <code className="text-foreground/80">AuthState</code> contract
          (<code className="text-foreground/80">src/lib/auth/authContract.ts</code>) that
          <code className="text-foreground/80"> RequireRole</code> uses. With{" "}
          <code className="text-foreground/80">AUTH_MODE = "placeholder"</code>, the hook always
          reports unauthenticated and <code className="text-foreground/80">isDemoOnly: true</code>.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div
      className="flex items-center justify-between py-2 border-b border-border/40 last:border-b-0"
      data-testid={testid}
    >
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <code className="text-sm font-mono text-foreground/90">{value}</code>
    </div>
  );
}
