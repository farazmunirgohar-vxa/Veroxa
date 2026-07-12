import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type VeroxaRole = "team" | "client";

export type VeroxaAccess = {
  user: User;
  role: VeroxaRole;
  displayName: string;
  restaurantId: string | null;
};

export type AuditRequestStatus =
  | "new"
  | "in_review"
  | "waiting_on_research"
  | "ready_for_review"
  | "reviewed"
  | "archived";

export type AuditRunStatus =
  | "queued"
  | "in_progress"
  | "ready_for_review"
  | "reviewed"
  | "failed";

export type AuditFindingSeverity =
  | "opportunity"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type AuditRun = {
  id: string;
  previous_run_id: string | null;
  run_number: number;
  status: AuditRunStatus;
  source_snapshot: Record<string, unknown>;
  score_snapshot: Record<string, unknown>;
  comparison_summary: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditFinding = {
  id: string;
  audit_run_id: string;
  category: string;
  severity: AuditFindingSeverity;
  title: string;
  summary: string;
  evidence_url: string | null;
  evidence_label: string | null;
  recommended_action: string | null;
  created_at: string;
};

export type AuditNote = {
  id: string;
  body: string;
  created_at: string;
};

export type AuditReport = {
  id: string;
  audit_run_id: string;
  status: "draft" | "ready_for_review" | "reviewed";
  executive_summary: string;
  priority_actions: string;
  honesty_note: string;
  reviewed_at: string | null;
  updated_at: string;
};

export type AuditQueueRecord = {
  id: string;
  reference_code: string;
  status: AuditRequestStatus;
  source: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_note: string | null;
  consent_to_contact: boolean;
  created_at: string;
  updated_at: string;
  audit_restaurants: {
    id: string;
    restaurant_name: string;
    city: string;
    state: string;
    website_url: string | null;
    google_profile_url: string | null;
  };
  audit_runs: AuditRun[];
  audit_notes: AuditNote[];
};

export type PublicAuditSubmission = {
  restaurantName: string;
  city: string;
  state: string;
  websiteUrl?: string;
  googleProfileUrl?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactNote?: string;
  consentToContact: boolean;
  consentVersion: "2026-07-12";
  formStartedAt: string;
  honeypot?: string;
  idempotencyKey: string;
};

type AuditReference = {
  request_id: string;
  reference_code: string;
  request_status: string;
};

let singleton: SupabaseClient | null | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getVeroxaSupabase(): SupabaseClient | null {
  if (singleton !== undefined) return singleton;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    singleton = null;
    return singleton;
  }
  singleton = createBrowserClient(url, key);
  return singleton;
}

export async function getCurrentVeroxaAccess(): Promise<VeroxaAccess | null> {
  const client = getVeroxaSupabase();
  if (!client) return null;

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return null;

  const { data: profile, error: profileError } = await client
    .from("veroxa_user_profiles")
    .select("role, display_name, status")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (profileError || !profile || profile.status !== "active") return null;
  if (profile.role !== "team" && profile.role !== "client") return null;

  const { data: membership, error: membershipError } = await client
    .from("veroxa_restaurant_members")
    .select("restaurant_id, role, status, veroxa_restaurants!inner(status)")
    .eq("user_id", userData.user.id)
    .eq("role", profile.role)
    .eq("status", "active")
    .maybeSingle();
  const restaurant = membership?.veroxa_restaurants as { status?: string } | null;
  if (
    membershipError ||
    !membership?.restaurant_id ||
    membership.role !== profile.role ||
    restaurant?.status !== "active"
  ) {
    return null;
  }

  return {
    user: userData.user,
    role: profile.role,
    displayName: profile.display_name || userData.user.email || (profile.role === "team" ? "Team Faraz" : "Momo’s House"),
    restaurantId: membership.restaurant_id,
  };
}

export async function signOutOfVeroxa(): Promise<void> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  const { error } = await client.auth.signOut();
  if (error) throw new Error("sign_out_failed");
}

function safeReturnTo(value: string | null | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/team/momo";
  try {
    const resolved = new URL(value, window.location.origin);
    return resolved.origin === window.location.origin
      ? `${resolved.pathname}${resolved.search}${resolved.hash}`
      : "/team/momo";
  } catch {
    return "/team/momo";
  }
}

export async function requestVeroxaMagicLink(email: string, returnTo?: string | null): Promise<void> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  const next = safeReturnTo(returnTo);
  const { error } = await client.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) throw new Error("magic_link_failed");
}

export function subscribeToVeroxaAuth(onChange: () => void): () => void {
  const client = getVeroxaSupabase();
  if (!client) return () => undefined;
  const { data } = client.auth.onAuthStateChange(() => onChange());
  return () => data.subscription.unsubscribe();
}

export async function submitPublicAudit(
  input: PublicAuditSubmission,
): Promise<AuditReference> {
  const response = await fetch("/api/audit-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => null) as { reference?: string } | null;
  if (!response.ok) {
    if (response.status === 429) throw new Error("rate_limited");
    if (response.status === 400) throw new Error("validation_failed");
    if (response.status === 413) throw new Error("request_too_large");
    if (response.status === 503) throw new Error("temporarily_unavailable");
    throw new Error("audit_submission_failed");
  }
  if (!data?.reference) throw new Error("audit_submission_failed");
  return { request_id: "accepted", reference_code: data.reference, request_status: "new" };
}

export async function listAuditQueue(): Promise<AuditQueueRecord[]> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  const { data, error } = await client
    .from("audit_requests")
    .select(`
      id, reference_code, status, source, contact_name, contact_email,
      contact_phone, contact_note, consent_to_contact, created_at, updated_at,
      audit_restaurants!inner(
        id, restaurant_name, city, state, website_url, google_profile_url
      ),
      audit_runs(
        id, previous_run_id, run_number, status, source_snapshot, score_snapshot,
        comparison_summary, failure_reason, created_at, updated_at
      ),
      audit_notes(id, body, created_at)
    `)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []) as unknown as AuditQueueRecord[];
}

export async function createTeamAudit(input: {
  restaurantName: string;
  city: string;
  state: string;
  websiteUrl?: string;
  googleProfileUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  teamNote?: string;
}): Promise<AuditReference> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  const { data, error } = await client.rpc("create_team_audit_v1", {
    p_restaurant_name: input.restaurantName.trim(),
    p_city: input.city.trim(),
    p_state: input.state.trim(),
    p_website_url: input.websiteUrl?.trim() || null,
    p_google_profile_url: input.googleProfileUrl?.trim() || null,
    p_contact_email: input.contactEmail?.trim().toLowerCase() || null,
    p_contact_phone: input.contactPhone?.trim() || null,
    p_team_note: input.teamNote?.trim() || null,
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as AuditReference | null;
  if (!row?.request_id) throw new Error("audit_create_failed");
  return row;
}

export async function updateAuditRequestStatus(
  requestId: string,
  status: AuditRequestStatus,
): Promise<void> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  const update: Record<string, unknown> = { status };
  if (status === "reviewed") {
    const { data } = await client.auth.getUser();
    update.reviewed_by = data.user?.id || null;
    update.reviewed_at = new Date().toISOString();
  }
  const { data, error } = await client
    .from("audit_requests")
    .update(update)
    .eq("id", requestId)
    .select("id")
    .single();
  if (error || data?.id !== requestId) throw error || new Error("audit_request_update_failed");
}

export async function startAuditRerun(requestId: string): Promise<string> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  const { data, error } = await client.rpc("start_audit_rerun_v1", {
    p_audit_request_id: requestId,
  });
  if (error || typeof data !== "string") throw error || new Error("rerun_failed");
  return data;
}

export async function updateAuditRun(
  runId: string,
  input: {
    status: AuditRunStatus;
    comparisonSummary?: string;
    failureReason?: string;
    scoreSnapshot?: Record<string, unknown>;
  },
): Promise<void> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  const { data: authData } = await client.auth.getUser();
  const update: Record<string, unknown> = {
    status: input.status,
    comparison_summary: input.comparisonSummary?.trim() || null,
    failure_reason: input.status === "failed" ? input.failureReason?.trim() || null : null,
  };
  if (input.scoreSnapshot !== undefined) update.score_snapshot = input.scoreSnapshot;
  if (input.status === "in_progress") update.started_at = new Date().toISOString();
  if (["ready_for_review", "reviewed", "failed"].includes(input.status)) {
    update.completed_at = new Date().toISOString();
  }
  if (input.status === "reviewed") {
    update.reviewed_by = authData.user?.id || null;
    update.reviewed_at = new Date().toISOString();
  }
  const { data, error } = await client
    .from("audit_runs")
    .update(update)
    .eq("id", runId)
    .select("id")
    .single();
  if (error || data?.id !== runId) throw error || new Error("audit_run_update_failed");
}

export async function listAuditFindings(runId: string): Promise<AuditFinding[]> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  const { data, error } = await client
    .from("audit_findings")
    .select("*")
    .eq("audit_run_id", runId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as AuditFinding[];
}

export async function addAuditFinding(
  runId: string,
  input: {
    category: string;
    severity: AuditFindingSeverity;
    title: string;
    summary: string;
    evidenceUrl?: string;
    evidenceLabel?: string;
    recommendedAction?: string;
  },
): Promise<void> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  const { data: authData } = await client.auth.getUser();
  const { error } = await client.from("audit_findings").insert({
    audit_run_id: runId,
    category: input.category.trim(),
    severity: input.severity,
    title: input.title.trim(),
    summary: input.summary.trim(),
    evidence_url: input.evidenceUrl?.trim() || null,
    evidence_label: input.evidenceLabel?.trim() || null,
    recommended_action: input.recommendedAction?.trim() || null,
    created_by: authData.user?.id || null,
  });
  if (error) throw error;
}

export async function addAuditNote(requestId: string, body: string): Promise<void> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  const { data: authData } = await client.auth.getUser();
  const { error } = await client.from("audit_notes").insert({
    audit_request_id: requestId,
    body: body.trim(),
    created_by: authData.user?.id || null,
  });
  if (error) throw error;
}

export async function getAuditReport(runId: string): Promise<AuditReport | null> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  const { data, error } = await client
    .from("audit_reports")
    .select("*")
    .eq("audit_run_id", runId)
    .maybeSingle();
  if (error) throw error;
  return data as AuditReport | null;
}

export async function saveAuditReport(
  runId: string,
  input: {
    status: AuditReport["status"];
    executiveSummary: string;
    priorityActions: string;
  },
): Promise<void> {
  const client = getVeroxaSupabase();
  if (!client) throw new Error("configuration_unavailable");
  const { data: authData } = await client.auth.getUser();
  const record: Record<string, unknown> = {
    audit_run_id: runId,
    status: input.status,
    executive_summary: input.executiveSummary.trim(),
    priority_actions: input.priorityActions.trim(),
    prepared_by: authData.user?.id || null,
  };
  if (input.status === "reviewed") {
    record.reviewed_by = authData.user?.id || null;
    record.reviewed_at = new Date().toISOString();
  }
  const { data, error } = await client
    .from("audit_reports")
    .upsert(record, { onConflict: "audit_run_id" })
    .select("id, audit_run_id")
    .single();
  if (error || data?.audit_run_id !== runId) throw error || new Error("audit_report_save_failed");
}
