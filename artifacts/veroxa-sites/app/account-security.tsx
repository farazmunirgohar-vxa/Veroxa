"use client";

import { useState, type FormEvent } from "react";
import { getVeroxaPasswordIssue } from "./veroxa-password.mjs";
import {
  configureMomoClient,
  signOutMomoClient,
  updateMomoClientPassword,
  type MomoClientPublicConfig,
} from "./momo-client-data";

export function AccountSecurity({
  displayName,
  role,
  supabaseConfig,
}: {
  displayName: string;
  role: "team" | "client";
  supabaseConfig: MomoClientPublicConfig;
}) {
  configureMomoClient(supabaseConfig);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const issue = password ? getVeroxaPasswordIssue(password) : null;
  const mismatch = Boolean(confirmation && password !== confirmation);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (issue || mismatch || !password) return;
    setBusy(true);
    setMessage("");
    try {
      const { otherRefreshSessionsRevoked } = await updateMomoClientPassword(password);
      setPassword("");
      setConfirmation("");
      setMessage(otherRefreshSessionsRevoked
        ? "Password updated. Other devices cannot refresh their sessions; existing access can remain until its current token expires."
        : "Password updated, but Veroxa could not revoke other refresh sessions. Sign out on those devices manually.");
    } catch (caught) {
      const failure = caught instanceof Error ? caught.message : "password_update_failed";
      setMessage(failure === "recent_sign_in_required" || failure === "session_required"
        ? "For security, sign in again before replacing the password."
        : failure === "compromised_password"
          ? "That password appears in known breach data. Choose a different unique password."
          : failure === "password_check_unavailable"
            ? "The leaked-password check is unavailable, so the password was not changed. Please retry."
            : "The password was not changed. Check the requirements and retry.");
    } finally {
      setBusy(false);
    }
  };

  const backPath = role === "team" ? "/team/momo" : "/client/dashboard";
  return <main className="login-shell"><section className="login-card password-security-card"><p className="eyebrow">ACCOUNT SECURITY</p><h1>{displayName}</h1><p>Choose a unique password for this Veroxa account.</p><form className="login-form" onSubmit={(event) => void submit(event)}><label>New password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label>Confirm new password<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label><p className={issue || mismatch ? "form-error" : "form-note"}>{issue || (mismatch ? "Passwords do not match." : "12–72 characters, uppercase, lowercase, number, supported symbol, and no spaces.")}</p><button className="primary-button" disabled={busy || !password || Boolean(issue) || mismatch}>{busy ? "Updating…" : "Update password"}</button></form>{message && <p role="status" aria-live="polite">{message}</p>}<div className="login-actions"><button className="secondary-button" onClick={() => window.location.assign(backPath)}>Back to workspace</button><button onClick={() => void signOutMomoClient().then(() => window.location.assign("/"))}>Sign out</button></div></section></main>;
}
