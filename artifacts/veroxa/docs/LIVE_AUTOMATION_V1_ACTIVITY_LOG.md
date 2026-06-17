# Live Automation V1 Activity Log Foundation

Status: GitHub PR #105 Activity Log Foundation only. Profile Corrections already merged as GitHub PR #103 and Real Messages / Portal Threads already merged as GitHub PR #104.

## What GitHub PR #105 adds

- A gated Activity Log feature gate requiring `AUTH_MODE === "real"`, authenticated role context, and `VITE_VEROXA_ACTIVITY_LOG_ENABLED=true`.
- Restaurant-scoped Activity Log service helpers for client-visible reads, Team reads, and Team-only manual event creation.
- Conservative Supabase RLS/policy hardening for the existing `activity_log` table.
- A small Client Portal “Recent Veroxa Activity” card that only reads explicitly `client_visible` activity when the real-auth gate and flag are active.
- A guarded Team route at `/team/activity-log` for Team-only restaurant-scoped event memory and a safe manual “Add activity note” form.
- Guardrails for placeholder honesty and Live Automation V1 sequencing.

## Locked runtime truth

- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Activity Log requires real auth plus `VITE_VEROXA_ACTIVITY_LOG_ENABLED=true`; placeholder mode does not show fake activity history, fake completed work, fake client-visible progress, fake metrics, or fake reports.
- Activity Log is an event memory layer, not reports.
- Client-visible activity is explicit only through `visibility = client_visible`.
- `report_eligible` is explicit and does not mean a report is published or generated.
- Client routes never create activity events; Team event creation is Team-only.
- AI Drafting remains PR #106.
- Reports From Activity remain PR #108.
- Team Automation Control Center remains PR #107.
- Momo owner walkthrough remains blocked until Live Automation V1 is built and approved.

## Not included

No AI runtime calls, report generation, Team Automation Control Center, Google/Meta/Yelp/TikTok integrations, publishing, payments, checkout, Stripe, webhooks, cron jobs, background jobs, SMS, email automation, push notifications, DMs, comments, external chat integrations, customer-service inbox handling, refunds, or order support are added.
