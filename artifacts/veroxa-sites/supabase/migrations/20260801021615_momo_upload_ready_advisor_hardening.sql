-- Cover private lifecycle foreign keys used by cleanup and audit queries.
-- Forward-only follow-up to the applied Momo v4 contract migration.

create index if not exists momo_content_ai_result_outbox_staged_by_idx
  on veroxa_private.momo_content_ai_result_outbox (staged_by);

create index if not exists momo_content_ai_webhook_events_restaurant_idx
  on veroxa_private.momo_content_ai_webhook_events (restaurant_id);
