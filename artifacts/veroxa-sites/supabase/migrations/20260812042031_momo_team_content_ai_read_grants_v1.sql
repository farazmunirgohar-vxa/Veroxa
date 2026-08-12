-- The Team content-AI read policy already exists. Keep the table protected and
-- grant only the newer metadata columns requested by the Team read model.
grant select (
  automation_policy_version,
  automation_identity_id,
  automation_initiated_by,
  automation_retry_of_run_id,
  automation_retry_generation,
  decision_mode
) on table public.veroxa_momo_content_ai_runs to authenticated;
