-- Apply only after the production Sites route has been verified on v2.

revoke execute on function public.submit_audit_request_v1(
  text,text,text,text,text,text,text,text,text,boolean,text,timestamptz,
  text,text,text,text
) from public, anon, authenticated, service_role;

comment on function public.submit_audit_request_v1(
  text,text,text,text,text,text,text,text,text,boolean,text,timestamptz,
  text,text,text,text
) is 'Retired public intake contract. Execute remains revoked after the verified v2 route cutover.';
