export default {
  fetch(): Response {
    const configured = Boolean(
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) &&
      process.env.AUDIT_INTAKE_HMAC_SECRET
    );
    return Response.json({ accepted: false, configured }, { status: 503 });
  },
};
