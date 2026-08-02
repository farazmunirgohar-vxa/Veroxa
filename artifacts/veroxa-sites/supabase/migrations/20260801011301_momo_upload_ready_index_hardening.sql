-- Cover every upload-to-Ready foreign-key lookup used for lifecycle checks,
-- tenant cleanup, and immutable evidence joins.

create index if not exists veroxa_momo_content_runs_intake_idx
  on public.veroxa_momo_content_ai_runs (intake_verification_id);
create index if not exists veroxa_momo_content_runs_requested_by_idx
  on public.veroxa_momo_content_ai_runs (requested_by);
create index if not exists veroxa_momo_content_runs_review_idx
  on public.veroxa_momo_content_ai_runs (review_id);
create index if not exists veroxa_momo_content_runs_rights_idx
  on public.veroxa_momo_content_ai_runs (rights_id);
create index if not exists veroxa_momo_content_runs_source_asset_idx
  on public.veroxa_momo_content_ai_runs (source_asset_id);
create index if not exists veroxa_momo_content_runs_team_decided_by_idx
  on public.veroxa_momo_content_ai_runs (team_decided_by)
  where team_decided_by is not null;

create index if not exists veroxa_momo_media_intake_asset_idx
  on public.veroxa_momo_media_intake_verifications (asset_id);
create index if not exists veroxa_momo_media_intake_initiated_by_idx
  on public.veroxa_momo_media_intake_verifications (initiated_by);

create index if not exists veroxa_momo_ready_variants_media_asset_idx
  on public.veroxa_momo_ready_package_variants (media_asset_id);
create index if not exists veroxa_momo_ready_variants_media_review_idx
  on public.veroxa_momo_ready_package_variants (media_review_id);

create index if not exists veroxa_momo_ready_packages_approved_by_idx
  on public.veroxa_momo_ready_packages (approved_by);
create index if not exists veroxa_momo_ready_packages_intake_idx
  on public.veroxa_momo_ready_packages (intake_verification_id);
create index if not exists veroxa_momo_ready_packages_review_idx
  on public.veroxa_momo_ready_packages (review_id);
create index if not exists veroxa_momo_ready_packages_rights_idx
  on public.veroxa_momo_ready_packages (rights_id);
create index if not exists veroxa_momo_ready_packages_source_asset_idx
  on public.veroxa_momo_ready_packages (source_asset_id);

create index if not exists momo_ai_budget_controls_authorized_by_idx
  on veroxa_private.momo_ai_budget_controls (authorized_by);
