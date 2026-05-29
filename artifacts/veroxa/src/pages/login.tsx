import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, Hexagon, Lock, Mail, ShieldAlert, Users, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_MODE } from "@/lib/auth/authMode";
import { getSupabaseClient } from "@/lib/supabase";
import { getRoleHomePath, isVeroxaRole } from "@/lib/auth/authContract";
import {
  getDevRouteForRole,
  validateDevCredentials,
} from "@/lib/auth/devCredentials";

/**
 * Quick-access portal cards — link directly to the portal (no credential
 * required for the client portal; team portal opens via the sign-in form).
 * These are not demo links — they are the active Veroxa OS review portals.
 */
const portalCards = [
  {
    href: "/client/dashboard",
    icon: Utensils,
    label: "Client Portal",
    description: "Restaurant owner view — content calendar, Google visibility, weekly updates, and monthly reports.",
    iconClass: "bg-blue-500/10 text-blue-500",
    glow: "from-blue-500/15 to-transparent",
    testid: "role-card-client",
    badge: null,
  },
  {
    href: "/team/dashboard",
    icon: Users,
    label: "Team Portal",
    description: "Content team workspace — media review, AI quality checks, draft variants, approvals, scheduling.",
    iconClass: "bg-emerald-500/10 text-emerald-500",
    glow: "from-emerald-500/15 to-transparent",
    testid: "role-card-team",
    badge: "Login required",
  },
];

type SignInState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export default function LoginPage() {
  const [signInState, setSignInState] = useState<SignInState>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();

  /**
   * Sign-in submit handler.
   *
   * - When `AUTH_MODE === "placeholder"`: validates dev credentials, routes to
   *   the real portal path (/client/dashboard, /team/dashboard).
   * - When `AUTH_MODE === "real"`:
   *     1. signInWithPassword
   *     2. Get session → look up user_profiles by user_id
   *     3. Validate role with isVeroxaRole
   *     4. Redirect to getRoleHomePath(role)
   *
   * Never creates users. Never writes to user_profiles. Never stores
   * tokens manually. Never uses the service role key.
   */
  async function handleSignInSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (AUTH_MODE === "placeholder") {
      // TEMPORARY development-only flow. See
      // src/lib/auth/devCredentials.ts — no Supabase, no network, no
      // production users. Remove together when real auth is wired.
      const role = validateDevCredentials(email, password);
      if (!role) {
        setSignInState({
          kind: "error",
          message: "Invalid development credentials.",
        });
        return;
      }
      setSignInState({
        kind: "success",
        message: `Routing to ${role} portal…`,
      });
      setLocation(getDevRouteForRole(role));
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setSignInState({
        kind: "error",
        message: "Sign-in unavailable: Supabase env vars missing.",
      });
      return;
    }

    setSignInState({ kind: "submitting" });
    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        setSignInState({
          kind: "error",
          message: `Sign-in failed: ${error.message}`,
        });
        return;
      }

      // Look up user_profiles to resolve role.
      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) {
        setSignInState({
          kind: "error",
          message: "Signed in, but no Veroxa profile was found for this user.",
        });
        return;
      }

      const { data: profile, error: profileError } = await client
        .from("user_profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle<{ role?: unknown }>();

      if (profileError) {
        setSignInState({
          kind: "error",
          message: `Signed in, but profile lookup failed: ${profileError.message}`,
        });
        return;
      }

      if (!profile) {
        setSignInState({
          kind: "error",
          message: "Signed in, but no Veroxa profile was found for this user.",
        });
        return;
      }

      if (!isVeroxaRole(profile.role)) {
        setSignInState({
          kind: "error",
          message: "Signed in, but this Veroxa role is not valid.",
        });
        return;
      }

      setLocation(getRoleHomePath(profile.role));
    } catch {
      setSignInState({
        kind: "error",
        message: "Unexpected sign-in error. Please try again later.",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Veroxa.com
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Hexagon className="w-4 h-4 fill-primary/20" />
            </div>
            <span className="font-bold tracking-tight">Veroxa</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-[11px] font-semibold tracking-wide mb-6">
            <ShieldAlert className="w-3 h-3" />
            Veroxa OS · Internal preview
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" data-testid="login-heading">
            Access Veroxa OS
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Sign in to access the Client Portal or Team Portal review environment.
          </p>
        </div>

        {/* Portal cards */}
        <div className="grid sm:grid-cols-2 gap-5 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {portalCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="block group"
              data-testid={card.testid}
            >
              <div className="h-full p-7 rounded-2xl border border-border bg-card hover:bg-accent/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.glow} blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="mb-5 flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${card.iconClass} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  {card.badge && (
                    <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full uppercase tracking-widest whitespace-nowrap flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      {card.badge}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {card.label}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {card.description}
                </p>

                <div className="flex items-center justify-end pt-4 border-t border-border/40">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                    Open Portal
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Sign In */}
        <div className="mt-16 animate-in fade-in duration-700" data-testid="future-signin-section">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              Or sign in directly
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border border-border bg-card p-7 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent blur-3xl rounded-full pointer-events-none" />

              <div className="flex items-start justify-between mb-5 relative">
                <div>
                  <h3 className="text-lg font-bold mb-1">Sign In</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                    Sign in with your Veroxa credentials to be routed to your portal.
                  </p>
                </div>
                <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-widest whitespace-nowrap flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Active
                </span>
              </div>

              <form onSubmit={handleSignInSubmit} className="space-y-4 relative" data-testid="form-future-signin">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-xs font-semibold text-muted-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@veroxa.com"
                      autoComplete="email"
                      className="pl-9"
                      data-testid="input-signin-email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signin-password" className="text-xs font-semibold text-muted-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pl-9"
                      data-testid="input-signin-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={signInState.kind === "submitting"}
                  className="w-full font-semibold"
                  data-testid="btn-signin-coming-soon"
                >
                  {signInState.kind === "submitting" ? "Signing in…" : "Sign In"}
                </Button>

                <div
                  className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-2"
                  data-testid="signin-dev-notice"
                >
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  Internal preview environment. Use your Veroxa credentials.
                </div>

                {signInState.kind === "success" && (
                  <div
                    className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-400 flex items-center gap-2"
                    data-testid="signin-success"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    {signInState.message}
                  </div>
                )}

                {signInState.kind === "error" && (
                  <div
                    className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] text-red-400 flex items-center gap-2"
                    data-testid="signin-error"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                    {signInState.message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground/70 mt-12 max-w-md mx-auto leading-relaxed">
          Sign in with your Veroxa credentials to be routed to your portal.
          The Client Portal is also directly accessible above. Owner and Operator portals are parked.
        </p>
      </div>
    </div>
  );
}
