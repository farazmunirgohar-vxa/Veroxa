-- Forward-only repair: restore_high_resolution_media_finalize_service_role_v1.
-- The live55 function replacement revoked every role. Restore only the
-- lifecycle service role required for private upload finalization.

revoke all on function
  public.veroxa_finalize_private_media_assessment_intake_v1(
    uuid, uuid, uuid, text, text, bigint, integer, integer, text,
    jsonb, text, text, text, uuid
  ) from public, anon, authenticated;

grant execute on function
  public.veroxa_finalize_private_media_assessment_intake_v1(
    uuid, uuid, uuid, text, text, bigint, integer, integer, text,
    jsonb, text, text, text, uuid
  ) to service_role;
