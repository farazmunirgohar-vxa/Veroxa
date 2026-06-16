# Live Automation V1 Real Messages / Portal Threads Foundation

Status: GitHub PR #104 Real Messages / Portal Threads foundation only. Profile Corrections already merged as GitHub PR #103; follow `LIVE_AUTOMATION_V1_PR_SEQUENCE.md` for the corrected sequence.

## What GitHub PR #104 adds

- A gated Client Portal message composer and restaurant-scoped thread for future real-auth use.
- A guarded Team Portal route at `/team/messages` for Team Faraz to view portal messages, reply in the portal, and mark messages read or resolved.
- Message service helpers for listing restaurant messages, sending client messages, listing the Team inbox, sending Team replies, and Team-only status updates.
- Supabase RLS write policies for the existing `messages` table so active clients can message only their active restaurant and active Team users can reply only as Team.
- A dedicated guardrail script for the Real Messages foundation.

## Locked runtime truth

- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Messages are gated behind `AUTH_MODE === "real"`, authenticated role, active client restaurant context where required, and `VITE_VEROXA_MESSAGES_ENABLED=true`.
- Placeholder mode does not fake sent messages, fake delivered state, fake replies, or fake persistence.
- Messages are portal-only. They are not SMS, email automation, push notifications, DMs, comments, external chat, customer-service inbox handling, refund handling, or order support.
- Nothing is published automatically.
- No service-role frontend behavior is used.
- No activity_log runtime writes are added in this PR.
- No AI runtime, Google/Meta/Yelp/TikTok integrations, publishing, payments, checkout, webhooks, cron jobs, or background jobs are added.
- Roles remain `client` and `team` only.
- Momo owner walkthrough remains blocked.

## Corrected sequence

- PR #103 — Profile Corrections Foundation is already merged.
- PR #104 — Real Messages / Portal Threads Foundation is this module.
- PR #105 — Activity Log Foundation remains next.
- PR #106 — AI Draft Preparation Foundation remains after Activity Log.

## RLS behavior

- Active clients may insert messages only for restaurants where they have active client membership.
- Client inserts require `sender_user_id = auth.uid()`, `sender_role = "client"`, non-empty body, and initial `status = "unread"`.
- Active Team users may insert replies for active restaurants.
- Team inserts require `sender_user_id = auth.uid()`, `sender_role = "team"`, non-empty body, and initial `status = "unread"`.
- Active Team users may update message status to `read` or `resolved`.
- No anonymous policies are added and existing select policies are not weakened.
