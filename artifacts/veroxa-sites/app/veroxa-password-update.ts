import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getVeroxaPasswordIssue,
  isVeroxaPasswordCompromised,
} from "./veroxa-password.mjs";

export type VeroxaPasswordUpdateResult = {
  otherRefreshSessionsRevoked: boolean;
};

export async function updateHardenedVeroxaPassword(
  client: SupabaseClient,
  password: string,
): Promise<VeroxaPasswordUpdateResult> {
  if (getVeroxaPasswordIssue(password)) throw new Error("weak_password");

  const { data, error: userError } = await client.auth.getUser();
  if (userError || !data.user) throw new Error("session_required");
  const lastSignInAt = Date.parse(data.user.last_sign_in_at || "");
  if (!Number.isFinite(lastSignInAt) || Date.now() - lastSignInAt > 24 * 60 * 60 * 1000) {
    throw new Error("recent_sign_in_required");
  }

  if (await isVeroxaPasswordCompromised(password)) {
    throw new Error("compromised_password");
  }

  const { error } = await client.auth.updateUser({ password });
  if (error) throw new Error("password_update_failed");
  try {
    const { error: revocationError } = await client.auth.signOut({ scope: "others" });
    return { otherRefreshSessionsRevoked: !revocationError };
  } catch {
    return { otherRefreshSessionsRevoked: false };
  }
}
