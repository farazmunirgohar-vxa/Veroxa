-- Query-backed indexes for the Momo upload -> Veroxa Ready v2 pipeline.
--
-- Keep append-only lineage foreign keys unindexed unless an actual read or
-- trigger path uses them. This set covers the client status readback, Team
-- exception/lineage views, retry/replay lookup, and Ready materialization.

create index if not exists veroxa_momo_content_ai_runs_identity_latest_v2_idx
  on public.veroxa_momo_content_ai_runs
    (automation_identity_id, requested_at desc)
  where automation_identity_id is not null;

create index if not exists veroxa_momo_intake_attempts_source_latest_v2_idx
  on public.veroxa_momo_media_intake_attempts_v2
    (source_asset_id, attempted_at desc);

create index if not exists veroxa_momo_exception_events_run_stage_v2_idx
  on public.veroxa_momo_exception_events_v2
    (content_ai_run_id, stage)
  where content_ai_run_id is not null;

create index if not exists veroxa_momo_exception_events_restaurant_latest_v2_idx
  on public.veroxa_momo_exception_events_v2
    (restaurant_id, occurred_at desc);

create index if not exists veroxa_momo_identity_links_restaurant_latest_v2_idx
  on public.veroxa_momo_media_asset_identity_links_v2
    (restaurant_id, created_at desc);

create index if not exists veroxa_momo_ready_packages_identity_latest_v2_idx
  on public.veroxa_momo_ready_packages_v2
    (identity_id, ready_at desc);

create index if not exists veroxa_momo_ready_variants_restaurant_platform_v2_idx
  on public.veroxa_momo_ready_variants_v2
    (restaurant_id, platform);
