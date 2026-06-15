import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, CheckCircle2, Hexagon, KeyRound, Lock, Mail, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_MODE } from "@/lib/auth/authMode";
import { getSupabaseClient } from "@/lib/supabase";
import { getRoleHomePath } from "@/lib/auth/authContract";
import { getRealAuthAccessMessage, resolveRealAuthAccess } from "@/lib/auth/realAuthFoundation";
import {
  getPilotAccessStatus,
  getPilotRouteForRole,
  validatePilotAccessCredentials,
  type PilotAccessFailureMode,
} from "@/lib/auth/pilotAccessAccounts";
import { createPlaceholderSession, clearPlaceholderSession } from "@/lib/auth/placeholderSession";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";


function getPilotAccessFailureMessage(mode: PilotAccessFailureMode): string {
  switch (mode) {
    case "disabled":
    case "endpoint_unavailable":
      return "Pilot login is not available in this environment yet. Please contact Team Faraz directly.";
    case "unauthorized":
      return "Those sign-in details do not match a Veroxa pilot portal account. Please check the email and password.";
    case "rate_limited":
      return "Too many sign-in attempts. Please wait a few minutes and try again.";
    case "method_not_allowed":
    case "unexpected_error":
      return "We could not finish checking portal access. Please try again or contact Veroxa.";
  }
}

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
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [, setLocation] = useLocation();

  const pilotAccessStatus = getPilotAccessStatus();
  const pilotAccessUnconfigured =
    AUTH_MODE === "placeholder" && !pilotAccessStatus.isConfigured;

  useEffect(() => {
    if (AUTH_MODE !== "real" || typeof window === "undefined") return;

    const recoveryParts = `${window.location.search} ${window.location.hash}`;
    const recoveryDetected =
      recoveryParts.includes("type=recovery") ||
      recoveryParts.includes("type=password_recovery") ||
      recoveryParts.includes("code=");

    if (recoveryDetected) {
      setIsRecoveryMode(true);
      setSignInState({ kind: "idle" });
    }
  }, []);

  function clearRecoveryUrl() {
    if (typeof window === "undefined") return;
    window.history.replaceState(null, "", "/login");
  }

  /**
   * Sign-in submit handler.
   *
   * - When AUTH_MODE === "placeholder": checks server-controlled/manual pilot
   *   portal access, routes to the real portal path based on the
   *   validated role (no visible role selection required).
   * - When AUTH_MODE === "real":
   *     1. signInWithPassword
   *     2. Get session → resolve active profile + membership access
   *     3. Validate the active client/team role boundary
   *     4. Redirect to getRoleHomePath(role)
   *
   * Never creates users. Never writes to user_profiles. Never stores
   * tokens manually. Never uses the service role key.
   */
  async function handleSignInSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (AUTH_MODE === "placeholder") {
      if (pilotAccessUnconfigured) {
        clearPlaceholderSession();
        setSignInState({
          kind: "error",
          message: "Portal access is not configured for this environment. Please contact Team Faraz directly.",
        });
        return;
      }

      setSignInState({ kind: "submitting" });
      try {
        const result = await validatePilotAccessCredentials(email, password);
        if (!result.ok) {
          clearPlaceholderSession();
          setSignInState({ kind: "error", message: getPilotAccessFailureMessage(result.mode) });
          return;
        }
        const { account } = result;
        createPlaceholderSession({
          role: account.role,
          email: account.email,
          accountLabel: account.accountLabel,
          accountId: account.accountId,
          clientId: account.clientId,
          restaurantId: account.restaurantId,
        });
        setSignInState({ kind: "success", message: `Signed in as ${account.accountLabel} — taking you to your portal…` });
        setLocation(getPilotRouteForRole(account.role));
      } catch {
        clearPlaceholderSession();
        setSignInState({ kind: "error", message: "We could not reach the pilot login endpoint. Please try again or contact Veroxa." });
      }
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

      const access = await resolveRealAuthAccess(client, { userId, email });
      if (!access.ok) {
        setSignInState({ kind: "error", message: getRealAuthAccessMessage(access.reason) });
        return;
      }

      setLocation(getRoleHomePath(access.profile.role));
    } catch {
      setSignInState({ kind: "error", message: "Unexpected sign-in error. Please try again." });
    }
  }



  async function handlePasswordRecoverySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (AUTH_MODE !== "real") return;

    if (!newPassword || newPassword !== confirmNewPassword) {
      setSignInState({ kind: "error", message: "The passwords do not match." });
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setSignInState({ kind: "error", message: "This reset link could not be used. Please request a new password reset." });
      return;
    }

    setSignInState({ kind: "submitting" });
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) {
      setSignInState({ kind: "error", message: "This reset link could not be used. Please request a new password reset." });
      return;
    }

    await client.auth.signOut();
    clearRecoveryUrl();
    setPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setIsRecoveryMode(false);
    setSignInState({ kind: "success", message: "Your password has been updated. Please sign in again." });
  }

  async function handlePasswordReset() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setSignInState({ kind: "error", message: "Enter your email first, then request a password reset." });
      return;
    }

    if (AUTH_MODE === "placeholder") {
      setSignInState({ kind: "error", message: "Password reset will be available after real account access is activated." });
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setSignInState({ kind: "error", message: "Password reset is temporarily unavailable. Please contact Veroxa support." });
      return;
    }

    setSignInState({ kind: "submitting" });
    const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      setSignInState({ kind: "error", message: "We could not start password reset. Please contact Veroxa support." });
      return;
    }
    setSignInState({ kind: "success", message: "If this email has Veroxa access, password reset instructions will be sent." });
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
            Sign in to Veroxa
          </h1>
          <p className="text-muted-foreground">
            Access your Veroxa portal.
          </p>
        </div>

        {/* Sign In */}
        <div className="animate-in fade-in duration-700" data-testid="signin-section">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent blur-3xl rounded-full pointer-events-none" />

            {AUTH_MODE === "placeholder" && (
              <div
                className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-400 flex items-start gap-2 relative"
                data-testid="pilot-login-status-note"
              >
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold">
                    {pilotAccessStatus.statusLabel}
                  </span>
                  {" — "}
                  {pilotAccessStatus.helperText}
                </span>
              </div>
            )}

            {AUTH_MODE === "real" && isRecoveryMode ? (
              <form onSubmit={handlePasswordRecoverySubmit} className="space-y-4 relative" data-testid="form-password-recovery">
                <div className="space-y-2">
                  <h2 className="text-lg font-bold tracking-tight">Set a new password</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter a new password for your Veroxa account.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs font-semibold text-muted-foreground">
                    New password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="pl-9"
                      data-testid="input-new-password"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-new-password" className="text-xs font-semibold text-muted-foreground">
                    Confirm new password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                    <Input
                      id="confirm-new-password"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="pl-9"
                      data-testid="input-confirm-new-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={signInState.kind === "submitting"}
                  className="w-full font-semibold"
                  data-testid="btn-update-password"
                >
                  {signInState.kind === "submitting" ? "Updating password…" : "Update password"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    clearRecoveryUrl();
                    setIsRecoveryMode(false);
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setSignInState({ kind: "idle" });
                  }}
                  className="mx-auto block text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="btn-return-signin"
                >
                  Return to sign in
                </button>

                {signInState.kind === "success" && (
                  <div
                    className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-400 flex items-center gap-2"
                    data-testid="password-recovery-success"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    {signInState.message}
                  </div>
                )}

                {signInState.kind === "error" && (
                  <div
                    className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] text-red-400 flex items-center gap-2"
                    data-testid="password-recovery-error"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                    {signInState.message}
                  </div>
                )}
              </form>
            ) : (
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
                {signInState.kind === "submitting" ? "Signing in…" : "Sign in"}
              </Button>

              {AUTH_MODE === "real" && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={signInState.kind === "submitting"}
                  className="mx-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="btn-password-reset"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Reset password
                </button>
              )}

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
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
