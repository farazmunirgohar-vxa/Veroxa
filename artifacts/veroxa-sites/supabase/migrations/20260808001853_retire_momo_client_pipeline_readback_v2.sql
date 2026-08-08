-- Retired Client pipeline readback contract.
-- Apply only after the Client v3 route is published and verified.

revoke execute on function public.veroxa_momo_client_upload_status_v2(uuid)
  from public, anon, authenticated, service_role;
