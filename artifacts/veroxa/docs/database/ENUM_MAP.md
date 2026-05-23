# Veroxa — TypeScript Enum → PostgreSQL Enum Type Map

Each TypeScript enum constant in `src/lib/database/enums.ts` maps to a PostgreSQL `CREATE TYPE ... AS ENUM (...)` declaration.

Postgres enum values use `snake_case` to match the TypeScript constant values exactly, making ORM/query layer mapping straightforward.

---

## `client_status`

```sql
CREATE TYPE client_status AS ENUM (
  'lead', 'signed', 'onboarding', 'active',
  'needs_attention', 'at_risk', 'paused', 'closed'
);
```

---

## `plan_type`

```sql
CREATE TYPE plan_type AS ENUM (
  'three_month', 'six_month', 'twelve_month', 'no_contract'
);
```

---

## `service_package`

```sql
CREATE TYPE service_package AS ENUM (
  'presence', 'ads_addon', 'ads_only', 'bundle'
);
```

---

## `content_health_status`

```sql
CREATE TYPE content_health_status AS ENUM (
  'healthy', 'caution', 'urgent', 'broken'
);
```

---

## `risk_status`

```sql
CREATE TYPE risk_status AS ENUM (
  'good', 'risk', 'at_risk'
);
```

---

## `platform_name`

```sql
CREATE TYPE platform_name AS ENUM (
  'instagram', 'facebook', 'google_business', 'tiktok', 'other'
);
```

---

## `platform_access_status`

```sql
CREATE TYPE platform_access_status AS ENUM (
  'pending', 'granted', 'verified', 'revoked'
);
```

---

## `onboarding_item_status`

```sql
CREATE TYPE onboarding_item_status AS ENUM (
  'not_started', 'pending', 'complete', 'blocked'
);
```

---

## `media_file_type`

```sql
CREATE TYPE media_file_type AS ENUM (
  'image', 'video'
);
```

---

## `media_source_type`

```sql
CREATE TYPE media_source_type AS ENUM (
  'client_upload', 'legacy_reuse', 'team_upload'
);
```

---

## `media_quality_ai_flag`

```sql
CREATE TYPE media_quality_ai_flag AS ENUM (
  'likely_usable', 'borderline', 'likely_reject'
);
```

---

## `media_review_status`

```sql
CREATE TYPE media_review_status AS ENUM (
  'uploaded', 'ai_reviewed', 'team_review_pending', 'rejected',
  'usable', 'shortlisted', 'drafted', 'approved',
  'scheduled', 'used', 'reusable_archive'
);
```

---

## `content_goal`

```sql
CREATE TYPE content_goal AS ENUM (
  'awareness', 'engagement', 'conversion', 'announcement', 'credibility'
);
```

---

## `concept_status`

```sql
CREATE TYPE concept_status AS ENUM (
  'generated', 'under_review', 'rejected', 'approved'
);
```

---

## `draft_set_status`

```sql
CREATE TYPE draft_set_status AS ENUM (
  'generated', 'under_review', 'needs_regeneration', 'approved', 'archived'
);
```

---

## `draft_variant_type`

```sql
CREATE TYPE draft_variant_type AS ENUM (
  'safe', 'engagement', 'sales'
);
```

---

## `draft_variant_status`

```sql
CREATE TYPE draft_variant_status AS ENUM (
  'generated', 'under_review', 'approved', 'archived', 'used'
);
```

---

## `post_status`

```sql
CREATE TYPE post_status AS ENUM (
  'planning', 'awaiting_content', 'ready_for_review', 'approved',
  'ready_to_schedule', 'scheduled', 'published', 'failed',
  'reschedule_required', 'archived'
);
```

---

## `post_slot_status`

```sql
CREATE TYPE post_slot_status AS ENUM (
  'open', 'reserved', 'scheduled', 'completed', 'skipped'
);
```

---

## `notification_target_role`

```sql
CREATE TYPE notification_target_role AS ENUM (
  'client', 'team', 'operator', 'owner'
);
```

---

## `notification_status`

```sql
CREATE TYPE notification_status AS ENUM (
  'created', 'sent', 'seen', 'dismissed', 'escalated'
);
```

---

## `weekly_report_status`

```sql
CREATE TYPE weekly_report_status AS ENUM (
  'drafted', 'validated', 'published'
);
```

---

## `monthly_report_status`

```sql
CREATE TYPE monthly_report_status AS ENUM (
  'drafting', 'operator_review', 'approved', 'published'
);
```

---

## `activity_entity_type`

```sql
CREATE TYPE activity_entity_type AS ENUM (
  'client', 'media', 'concept', 'draft_set', 'draft_variant',
  'post', 'report', 'notification'
);
```

---

## `performed_by_role`

```sql
CREATE TYPE performed_by_role AS ENUM (
  'system', 'client', 'team', 'operator', 'owner'
);
```
