import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, CheckCircle2, Hexagon, Lock, Mail, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_MODE } from "@/lib/auth/authMode";
import { getSupabaseClient } from "@/lib/supabase";
import { getRoleHomePath, isVeroxaRole } from "@/lib/auth/authContract";
import { getDevRouteForRole, validateDevCredentials, getPlaceholderCredentialStatus } from "@/lib/auth/devCredentials";
import { createPlaceholderSession, clearPlaceholderSession } from "@/lib/auth/placeholderSession";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

type SignInState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export default function LoginPage() {
  useDocumentMeta({
    title: "Login — Veroxa",
    description: "Sign in to Veroxa.",
  });

  const [signInState, setSignInState] = useState<SignInState>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();

  const placeholderCredentialStatus = getPlaceholderCredentialStatus();
  const placeholderLoginUnconfigured =
    AUTH_MODE === "placeholder" && !placeholderCredentialStatus.isConfigured;

  /**
   * Sign-in submit handler.
   *
   * - When AUTH_MODE === "placeholder": validates dev credentials, routes to
   *   the real portal path based on the validated role (no visible role
   *   selection required).
   * - When AUTH_MODE === "real":
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
      if (placeholderLoginUnconfigured) {
        clearPlaceholderSession();
        setSignInState({
          kind: "error",
          message: "Preview access is not enabled for this review. Please ask Veroxa to enable preview access.",
        });
        return;
      }

      const role = validateDevCredentials(email, password);
      if (!role) {
        clearPlaceholderSession();
        setSignInState({ kind: "error", message: "Those sign-in details do not match this Veroxa preview. Please try again." });
        return;
      }
      createPlaceholderSession(role, email);
      setSignInState({ kind: "success", message: "Signed in — taking you to your portal…" });
      setLocation(getDevRouteForRole(role));
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setSignInState({ kind: "error", message: "Sign-in is temporarily unavailable. Please try again later." });
      return;
    }

    setSignInState({ kind: "submitting" });
    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        setSignInState({ kind: "error", message: "Sign-in failed. Please check your credentials and try again." });
        return;
      }

      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) {
        setSignInState({ kind: "error", message: "This Veroxa account is not fully set up yet. Please contact Veroxa support." });
        return;
      }

      const { data: profile, error: profileError } = await client
        .from("user_profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle<{ role?: unknown }>();

      if (profileError) {
        setSignInState({ kind: "error", message: "We could not finish checking your account access. Please try again later." });
        return;
      }
      if (!profile) {
        setSignInState({ kind: "error", message: "This Veroxa account is not fully set up yet. Please contact Veroxa support." });
        return;
      }
      if (!isVeroxaRole(profile.role)) {
        setSignInState({ kind: "error", message: "This account does not have the right portal access yet. Please contact Veroxa support." });
        return;
      }

      setLocation(getRoleHomePath(profile.role));
    } catch {
      setSignInState({ kind: "error", message: "Unexpected sign-in error. Please try again." });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-md">

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
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3" data-testid="login-heading">
            Sign in to Veroxa.
          </h1>
          <p className="text-muted-foreground">
            Use the Veroxa review sign-in details you were given. This preview access is not production client billing or live account access.
          </p>
        </div>

        {/* Sign In */}
        <div className="animate-in fade-in duration-700" data-testid="signin-section">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent blur-3xl rounded-full pointer-events-none" />

            {AUTH_MODE === "placeholder" && (
              <div
                className={`mb-4 rounded-lg border px-3 py-2 text-[11px] flex items-start gap-2 relative ${
                  placeholderCredentialStatus.isConfigured
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                    : "border-amber-500/20 bg-amber-500/5 text-amber-400"
                }`}
                data-testid="temp-login-status-note"
              >
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold">
                    {placeholderCredentialStatus.statusLabel}
                  </span>
                  {" — "}
                  {placeholderCredentialStatus.helperText}
                </span>
              </div>
            )}

            <form onSubmit={handleSignInSubmit} className="space-y-4 relative" data-testid="form-signin">
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
                data-testid="btn-signin"
              >
                {signInState.kind === "submitting" ? "Signing in…" : "Sign In"}
              </Button>

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
    </div>
  );
}
