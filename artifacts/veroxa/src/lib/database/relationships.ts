// ─────────────────────────────────────────────
// Veroxa Database Relationship Map
// Schema/contracts only — no runtime database.
// ─────────────────────────────────────────────

// ── Primary relationship tree ─────────────────
//
// clients
//   ├── client_platforms       (one client → many platforms)
//   ├── onboarding_items       (one client → many checklist items)
//   ├── media_assets           (one client → many uploaded/sourced assets)
//   │     └── content_concepts (one media asset → many concepts)
//   │           └── draft_sets (one concept → many draft sets)
//   │                 └── draft_variants (one draft set → normally 3 variants)
//   ├── posts                  (one client → many posts)
//   │     ├── media_assets     (each post references one media asset)
//   │     └── draft_variants   (each post references one approved draft variant)
//   ├── post_slots             (one client → many scheduled slots)
//   ├── weekly_reports         (one client → many weekly reports)
//   ├── monthly_reports        (one client → many monthly reports)
//   ├── notifications          (one client → many notifications)
//   └── activity_logs          (one client → many log entries)

// ── Lightweight relationship constants ────────

export const RELATIONSHIPS = {
  clients: {
    hasMany: [
      "client_platforms",
      "onboarding_items",
      "media_assets",
      "posts",
      "post_slots",
      "weekly_reports",
      "monthly_reports",
      "notifications",
      "activity_logs",
    ],
  },
  media_assets: {
    hasMany: ["content_concepts"],
    belongsTo: ["clients"],
    referencedBy: ["posts"],
  },
  content_concepts: {
    hasMany: ["draft_sets"],
    belongsTo: ["clients", "media_assets"],
  },
  draft_sets: {
    hasMany: ["draft_variants"],
    belongsTo: ["clients", "content_concepts"],
  },
  draft_variants: {
    belongsTo: ["clients", "draft_sets"],
    referencedBy: ["posts"],
  },
  posts: {
    belongsTo: ["clients", "media_assets", "draft_variants", "post_slots"],
    referencedBy: ["activity_logs"],
  },
} as const;

// ── Relationship rules ────────────────────────
//
// 1. UNIVERSAL BACK-LINK
//    Every operational object (media_assets, posts, reports, etc.)
//    carries a `clientId` foreign key so any query can scope to a client.
//
// 2. CONCEPT → DRAFT SETS (one-to-many)
//    One approved concept can generate multiple draft sets
//    (e.g. if the first set is rejected and needs regeneration).
//
// 3. DRAFT SET → VARIANTS (one-to-three)
//    Each draft set normally produces exactly 3 variants:
//    safe, engagement, and sales.
//
// 4. VARIANT REUSE LOCK
//    A DraftVariant whose status is "used" must not be assigned
//    to a second published post. Enforce this at the application layer
//    by checking usedInPostId before scheduling.
//
// 5. PUBLISHED POST LOCK
//    Once a Post reaches status "published", its mediaAssetId and
//    draftVariantId become read-only. The lockedAt timestamp records
//    when this immutability began.
