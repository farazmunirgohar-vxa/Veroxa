-- =============================================================================
-- M003 SEED — DEV DATA ONLY — NOT PRODUCTION
--
-- Run AFTER 01_apply_m003.sql + 01b_apply_notifications_status_guard.sql,
-- as the postgres (service-role) user.
--
-- PRECONDITION: M001 + M002 dev fixtures already in place:
--   owner@, operator@, team@, client@, team2@, inactive@
--   clients: Demo Restaurant A (a000...), Demo Restaurant B (b000...)
--   assignments: team@→A executor, team2@→B reporter
-- =============================================================================

-- =============================================================================
-- UUID CONFIG SECTION — REPLACE BEFORE RUNNING
--
-- Required UUIDs (already exist from M001/M002):
--   <<OWNER_UUID>>     — owner@veroxa.test
--   <<OPERATOR_UUID>>  — operator@veroxa.test
--   <<TEAM_UUID>>      — team@veroxa.test
--   <<CLIENT_UUID>>    — client@veroxa.test
--
-- Fixed (from M002 seed — keep as-is):
--   TEAM2_UUID  = '12222222-2222-4222-a222-222222222222'
--   CLIENT_A_ID = 'a0000000-0000-4000-a000-00000000000a'
--   CLIENT_B_ID = 'b0000000-0000-4000-b000-00000000000b'
--
-- Fixed (created by this script — KEEP THESE):
--   MEDIA_A_CLIENT_UPLOADED = 'a0000001-0000-4000-a000-00000000000a'
--   MEDIA_A_TEAM_PENDING    = 'a0000002-0000-4000-a000-00000000000a'
--   MEDIA_A_TEAM_APPROVED   = 'a0000003-0000-4000-a000-00000000000a'
--   MEDIA_B_1               = 'b0000001-0000-4000-b000-00000000000b'
--   MEDIA_B_2               = 'b0000002-0000-4000-b000-00000000000b'
--   NOTIF_A_CLIENT          = 'a000000a-0001-4000-a000-00000000000a'
--   NOTIF_A_TEAM            = 'a000000a-0002-4000-a000-00000000000a'
--   NOTIF_A_OPERATOR        = 'a000000a-0003-4000-a000-00000000000a'
--   NOTIF_B_CLIENT          = 'b000000b-0001-4000-b000-00000000000b'
--   SNAP_A_ATTENTION        = 'a000000a-1000-4000-a000-00000000000a'
--   SNAP_B_HEALTHY          = 'b000000b-1000-4000-b000-00000000000b'
--   LOG_A_MEDIA             = 'a000000a-2001-4000-a000-00000000000a'
--   LOG_A_PRICING           = 'a000000a-2002-4000-a000-00000000000a'
--   LOG_B_MEDIA             = 'b000000b-2001-4000-b000-00000000000b'
-- =============================================================================

-- =============================================================================
-- STEP A — media_assets
--   A: 1 client-uploaded, 1 team_review_pending, 1 approved (with internal_note,
--      rejection_reason, quality_score=2)
--   B: 2 client-uploaded
-- =============================================================================

insert into public.media_assets (
  id, client_id, uploaded_by_user_id, file_url, file_type, mime_type,
  source_type, review_status, title, internal_note, rejection_reason, quality_score
) values
(
  'a0000001-0000-4000-a000-00000000000a',
  'a0000000-0000-4000-a000-00000000000a',
  (select id from public.user_profiles where email = 'client@veroxa.test'),
  'https://example.test/a/upload-1.jpg', 'image', 'image/jpeg',
  'client_upload', 'uploaded', 'Front-door shot',
  NULL, NULL, NULL
),
(
  'a0000002-0000-4000-a000-00000000000a',
  'a0000000-0000-4000-a000-00000000000a',
  (select id from public.user_profiles where email = 'team@veroxa.test'),
  'https://example.test/a/team-pending.jpg', 'image', 'image/jpeg',
  'team_upload', 'team_review_pending', 'Plated dish — needs review',
  NULL, NULL, NULL
),
(
  'a0000003-0000-4000-a000-00000000000a',
  'a0000000-0000-4000-a000-00000000000a',
  (select id from public.user_profiles where email = 'team@veroxa.test'),
  'https://example.test/a/approved.jpg', 'image', 'image/jpeg',
  'team_upload', 'approved', 'Approved dish photo',
  'looks good — featured slot', 'blurry — request retake', 2
),
(
  'b0000001-0000-4000-b000-00000000000b',
  'b0000000-0000-4000-b000-00000000000b',
  NULL,
  'https://example.test/b/upload-1.jpg', 'image', 'image/jpeg',
  'client_upload', 'uploaded', 'B menu',
  NULL, NULL, NULL
),
(
  'b0000002-0000-4000-b000-00000000000b',
  'b0000000-0000-4000-b000-00000000000b',
  NULL,
  'https://example.test/b/upload-2.jpg', 'image', 'image/jpeg',
  'client_upload', 'uploaded', 'B exterior',
  NULL, NULL, NULL
);

-- =============================================================================
-- STEP B — notifications
--   client/A, team/A, operator/A, client/B
-- =============================================================================

insert into public.notifications (
  id, client_id, target_role, notification_type, priority,
  title, message_body, status, trigger_source
) values
(
  'a000000a-0001-4000-a000-00000000000a',
  'a0000000-0000-4000-a000-00000000000a',
  'client', 'info', 'p2',
  'New post drafted', 'A new post draft is ready for your review.',
  'sent', 'system'
),
(
  'a000000a-0002-4000-a000-00000000000a',
  'a0000000-0000-4000-a000-00000000000a',
  'team', 'reminder', 'p2',
  'Media review pending', 'Restaurant A has 1 pending media item.',
  'sent', 'system'
),
(
  'a000000a-0003-4000-a000-00000000000a',
  'a0000000-0000-4000-a000-00000000000a',
  'operator', 'warning', 'p1',
  'Health attention', 'Restaurant A health is in attention state.',
  'sent', 'system'
),
(
  'b000000b-0001-4000-b000-00000000000b',
  'b0000000-0000-4000-b000-00000000000b',
  'client', 'success', 'p2',
  'Welcome to Veroxa', 'Your Veroxa workspace is ready.',
  'sent', 'system'
);

-- =============================================================================
-- STEP C — client_health_snapshots
-- =============================================================================

insert into public.client_health_snapshots (
  id, client_id, level, priority_level, content_runway_days,
  approved_media_count, scheduled_posts_count, open_requests_count,
  unresolved_alerts_count, summary, created_by_role
) values
(
  'a000000a-1000-4000-a000-00000000000a',
  'a0000000-0000-4000-a000-00000000000a',
  'attention', 'high', 5, 3, 1, 2, 1,
  'Content runway low; 1 unresolved alert.', 'system'
),
(
  'b000000b-1000-4000-b000-00000000000b',
  'b0000000-0000-4000-b000-00000000000b',
  'healthy', 'normal', 14, 8, 3, 0, 0,
  'All good.', 'system'
);

-- =============================================================================
-- STEP D — activity_logs
--   1 for A media_assets (team-visible)
--   1 for A clients/pricing_changed (NOT team-visible — entity_type not in allowlist)
--   1 for B media_assets
-- =============================================================================

insert into public.activity_logs (
  id, client_id, entity_type, entity_id, action_key, description,
  performed_by_role, performed_by_user_id
) values
(
  'a000000a-2001-4000-a000-00000000000a',
  'a0000000-0000-4000-a000-00000000000a',
  'media_assets',
  'a0000003-0000-4000-a000-00000000000a',
  'review_status_changed',
  'Status changed to approved',
  'team',
  (select id from public.user_profiles where email = 'team@veroxa.test')
),
(
  'a000000a-2002-4000-a000-00000000000a',
  'a0000000-0000-4000-a000-00000000000a',
  'clients',
  'a0000000-0000-4000-a000-00000000000a',
  'pricing_changed',
  'monthly_fee_cents changed by owner',
  'owner',
  (select id from public.user_profiles where email = 'owner@veroxa.test')
),
(
  'b000000b-2001-4000-b000-00000000000b',
  'b0000000-0000-4000-b000-00000000000b',
  'media_assets',
  'b0000001-0000-4000-b000-00000000000b',
  'uploaded',
  'Client uploaded new media',
  'client',
  NULL
);

-- =============================================================================
-- STEP E — VERIFY SEED (paste this block separately)
-- =============================================================================

select 'media_assets'            as table_name, count(*) from public.media_assets
union all select 'notifications',           count(*) from public.notifications
union all select 'client_health_snapshots', count(*) from public.client_health_snapshots
union all select 'activity_logs',           count(*) from public.activity_logs;
-- EXPECTED:
--   media_assets = 5
--   notifications = 4
--   client_health_snapshots = 2
--   activity_logs = 3

select client_id, review_status, count(*) from public.media_assets
group by client_id, review_status order by client_id, review_status;

select client_id, target_role from public.notifications
order by client_id, target_role;
