export interface AuditCenterPublicRequest {
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
}

export async function submitAuditCenterRequest(
  request: AuditCenterPublicRequest,
): Promise<{ reference: string }> {
  const response = await fetch("/api/audit-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
  const body = await response.json().catch(() => null) as {
    reference?: string;
  } | null;
  if (!response.ok) {
    throw new Error(response.status === 429 ? "rate_limited" : "submission_failed");
  }
  if (!body?.reference) throw new Error("submission_failed");
  return { reference: body.reference };
}
