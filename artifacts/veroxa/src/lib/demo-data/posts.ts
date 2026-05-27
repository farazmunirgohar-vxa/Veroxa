import type { Post, PostSlot } from "../database/models";
import { PlatformName, PostStatus, PostSlotStatus } from "../database/enums";

// ── Typed demo posts — Demo Grill House (id: mamadali) ────────────────────────

export const mamadaliPosts: Post[] = [
  {
    id: "post-mamadali-001",
    clientId: "client-mamadali-001",
    platformName: PlatformName.instagram,
    mediaAssetId: "media-mamadali-001",
    draftVariantId: "draft-variant-001-A",
    postSlotId: "slot-mamadali-001",
    status: PostStatus.scheduled,
    scheduledAt: "2026-05-26T17:00:00Z",
    publishedAt: null,
    failedAt: null,
    failureReason: null,
    lockedAt: null,
    createdAt: "2026-05-20T10:30:00Z",
    updatedAt: "2026-05-22T11:00:00Z",
  },
  {
    id: "post-mamadali-002",
    clientId: "client-mamadali-001",
    platformName: PlatformName.facebook,
    mediaAssetId: "media-mamadali-002",
    draftVariantId: "draft-variant-002-B",
    postSlotId: "slot-mamadali-002",
    status: PostStatus.scheduled,
    scheduledAt: "2026-05-28T18:00:00Z",
    publishedAt: null,
    failedAt: null,
    failureReason: null,
    lockedAt: null,
    createdAt: "2026-05-21T11:00:00Z",
    updatedAt: "2026-05-22T11:00:00Z",
  },
  {
    id: "post-mamadali-003",
    clientId: "client-mamadali-001",
    platformName: PlatformName.instagram,
    mediaAssetId: "media-mamadali-003",
    draftVariantId: null,
    postSlotId: "slot-mamadali-003",
    status: PostStatus.ready_for_review,
    scheduledAt: "2026-05-30T17:00:00Z",
    publishedAt: null,
    failedAt: null,
    failureReason: null,
    lockedAt: null,
    createdAt: "2026-05-22T09:15:00Z",
    updatedAt: "2026-05-22T09:15:00Z",
  },
  {
    id: "post-mamadali-004",
    clientId: "client-mamadali-001",
    platformName: PlatformName.instagram,
    mediaAssetId: "media-mamadali-004",
    draftVariantId: "draft-variant-004-A",
    postSlotId: "slot-mamadali-004",
    status: PostStatus.published,
    scheduledAt: "2026-05-17T17:00:00Z",
    publishedAt: "2026-05-17T17:01:22Z",
    failedAt: null,
    failureReason: null,
    lockedAt: "2026-05-17T17:01:22Z",
    createdAt: "2026-05-14T10:00:00Z",
    updatedAt: "2026-05-17T17:01:22Z",
  },
  {
    id: "post-mamadali-005",
    clientId: "client-mamadali-001",
    platformName: PlatformName.facebook,
    mediaAssetId: "media-mamadali-005",
    draftVariantId: "draft-variant-005-A",
    postSlotId: "slot-mamadali-005",
    status: PostStatus.published,
    scheduledAt: "2026-05-18T18:00:00Z",
    publishedAt: "2026-05-18T18:01:05Z",
    failedAt: null,
    failureReason: null,
    lockedAt: "2026-05-18T18:01:05Z",
    createdAt: "2026-05-15T09:00:00Z",
    updatedAt: "2026-05-18T18:01:05Z",
  },
  {
    id: "post-mamadali-006",
    clientId: "client-mamadali-001",
    platformName: PlatformName.instagram,
    mediaAssetId: "media-mamadali-006",
    draftVariantId: "draft-variant-006-A",
    postSlotId: "slot-mamadali-006",
    status: PostStatus.published,
    scheduledAt: "2026-05-19T17:00:00Z",
    publishedAt: "2026-05-19T17:00:58Z",
    failedAt: null,
    failureReason: null,
    lockedAt: "2026-05-19T17:00:58Z",
    createdAt: "2026-05-16T10:30:00Z",
    updatedAt: "2026-05-19T17:00:58Z",
  },
  {
    id: "post-mamadali-007",
    clientId: "client-mamadali-001",
    platformName: PlatformName.instagram,
    mediaAssetId: "media-mamadali-007",
    draftVariantId: "draft-variant-007-A",
    postSlotId: "slot-mamadali-007",
    status: PostStatus.published,
    scheduledAt: "2026-05-20T17:00:00Z",
    publishedAt: "2026-05-20T17:01:11Z",
    failedAt: null,
    failureReason: null,
    lockedAt: "2026-05-20T17:01:11Z",
    createdAt: "2026-05-17T09:00:00Z",
    updatedAt: "2026-05-20T17:01:11Z",
  },
];

// ── Typed demo post slots ─────────────────────────────────────────────────────

export const mamadaliPostSlots: PostSlot[] = [
  { id: "slot-mamadali-001", clientId: "client-mamadali-001", platformName: PlatformName.instagram, slotDate: "2026-05-26", slotTime: "17:00", status: PostSlotStatus.scheduled,  postId: "post-mamadali-001", createdAt: "2026-05-01T08:00:00Z", updatedAt: "2026-05-22T11:00:00Z" },
  { id: "slot-mamadali-002", clientId: "client-mamadali-001", platformName: PlatformName.facebook,  slotDate: "2026-05-28", slotTime: "18:00", status: PostSlotStatus.scheduled,  postId: "post-mamadali-002", createdAt: "2026-05-01T08:00:00Z", updatedAt: "2026-05-22T11:00:00Z" },
  { id: "slot-mamadali-003", clientId: "client-mamadali-001", platformName: PlatformName.instagram, slotDate: "2026-05-30", slotTime: "17:00", status: PostSlotStatus.reserved,   postId: "post-mamadali-003", createdAt: "2026-05-01T08:00:00Z", updatedAt: "2026-05-22T09:15:00Z" },
  { id: "slot-mamadali-004", clientId: "client-mamadali-001", platformName: PlatformName.instagram, slotDate: "2026-05-17", slotTime: "17:00", status: PostSlotStatus.completed,  postId: "post-mamadali-004", createdAt: "2026-05-01T08:00:00Z", updatedAt: "2026-05-17T17:01:22Z" },
  { id: "slot-mamadali-005", clientId: "client-mamadali-001", platformName: PlatformName.facebook,  slotDate: "2026-05-18", slotTime: "18:00", status: PostSlotStatus.completed,  postId: "post-mamadali-005", createdAt: "2026-05-01T08:00:00Z", updatedAt: "2026-05-18T18:01:05Z" },
  { id: "slot-mamadali-006", clientId: "client-mamadali-001", platformName: PlatformName.instagram, slotDate: "2026-05-19", slotTime: "17:00", status: PostSlotStatus.completed,  postId: "post-mamadali-006", createdAt: "2026-05-01T08:00:00Z", updatedAt: "2026-05-19T17:00:58Z" },
  { id: "slot-mamadali-007", clientId: "client-mamadali-001", platformName: PlatformName.instagram, slotDate: "2026-05-20", slotTime: "17:00", status: PostSlotStatus.completed,  postId: "post-mamadali-007", createdAt: "2026-05-01T08:00:00Z", updatedAt: "2026-05-20T17:01:11Z" },
  { id: "slot-mamadali-008", clientId: "client-mamadali-001", platformName: PlatformName.instagram, slotDate: "2026-06-01", slotTime: "17:00", status: PostSlotStatus.open,       postId: null,                createdAt: "2026-05-01T08:00:00Z", updatedAt: "2026-05-01T08:00:00Z" },
];

// ── Client Portal — Upcoming scheduled posts display ──────────────────────────

export const scheduledPosts = [
  { date: "Mon 26 May", caption: "Slow-cooked lamb shoulder — marinated 24 hours. Available this week only.", platform: "Instagram", status: "Scheduled" },
  { date: "Wed 28 May", caption: "Family feast deal — feed 4 for under $60. Book your table now.",            platform: "Facebook",  status: "Scheduled" },
  { date: "Fri 30 May", caption: "Behind the scenes: how we make our signature kebab sauce from scratch.",    platform: "Instagram", status: "In Review" },
  { date: "Sun 1 Jun",  caption: "New on the menu: spiced aubergine dip with fresh lavash bread.",            platform: "Instagram", status: "Draft"     },
] as const;

// ── Team Portal — Task list ───────────────────────────────────────────────────

export const tasks = [
  { id: 1, title: "Review raw media batch — Demo Grill House (May shoot)",      client: "Demo Grill House", priority: "High",   done: true  },
  { id: 2, title: "AI quality check passed — approve 3 hero shots for drafts",  client: "Demo Grill House", priority: "High",   done: true  },
  { id: 3, title: "Generate 3 caption variants for lamb shoulder post",          client: "Demo Grill House", priority: "High",   done: false },
  { id: 4, title: "Send draft variants to team lead for approval",               client: "Demo Grill House", priority: "Medium", done: false },
  { id: 5, title: "Schedule approved posts for week of 26 May",                  client: "Demo Grill House", priority: "Medium", done: false },
  { id: 6, title: "Compile reporting feed for May wrap summary",                 client: "Internal",             priority: "Low",    done: false },
] as const;

// ── Team Portal — Caption draft variants display ──────────────────────────────

export const draftVariants = [
  { id: "A", caption: "24 hours marinated. Cooked low and slow. Worth the wait. Reserve your table tonight.",       score: 92, status: "Approved" },
  { id: "B", caption: "The lamb shoulder that keeps regulars coming back. On the menu this week only.",              score: 88, status: "Pending"  },
  { id: "C", caption: "Slow food, fast service. Our lamb shoulder — available Tue–Sun from 5pm.",                   score: 81, status: "Pending"  },
] as const;

// ── Team Portal — Post-ready queue display ────────────────────────────────────

export const postReadyQueue = [
  { title: "Lamb shoulder hero shot",    client: "Demo Grill House", platform: "Instagram", date: "Mon 26 May" },
  { title: "Family feast promo graphic", client: "Demo Grill House", platform: "Facebook",  date: "Wed 28 May" },
  { title: "Kitchen BTS reel",           client: "Demo Grill House", platform: "Instagram", date: "Fri 30 May" },
] as const;

// ── Team Portal — Published this week display ─────────────────────────────────

export const publishedThisWeek = [
  { title: "Weekend special: mixed grill platter for 2",      platform: "Instagram", reach: "4,820", client: "Demo Grill House" },
  { title: "Google review highlight — 5 stars from a happy customer", platform: "Facebook", reach: "2,140", client: "Demo Grill House" },
  { title: "New opening hours for spring season",              platform: "Instagram", reach: "6,300", client: "Demo Grill House" },
  { title: "Behind the scenes: prep day with the team",        platform: "Instagram", reach: "3,910", client: "Demo Grill House" },
] as const;

// ── Operator Portal — Failed posts display ────────────────────────────────────

export const failedPosts = [
  { client: "Bayleaf Indian Kitchen", platform: "Instagram", reason: "Auth token expired",    date: "23 May", assignee: "JD" },
  { client: "The Grill House",        platform: "Facebook",  reason: "Page role removed",    date: "21 May", assignee: "SM" },
  { client: "Rosso Trattoria",        platform: "Instagram", reason: "Media file corrupted", date: "20 May", assignee: "AK" },
] as const;
