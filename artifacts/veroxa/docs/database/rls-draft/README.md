# Veroxa — Draft RLS Policies

## Status

**These are draft RLS policy files only. Nothing has been applied to any database.**

---

## Purpose

These files contain temporary, dev-only Row Level Security policies for testing anon read access to Mamadali demo data. They are intended to unblock frontend query testing while no auth implementation exists yet.

---

## Files

| File | What it does |
|---|---|
| `001_dev_read_policies.sql` | Adds SELECT-only anon read policies for all 11 tables, scoped to the Mamadali demo client UUID |

---

## How to apply

Apply manually in the **Supabase SQL Editor** on the **dev project only**. Do not script or automate application against any other environment.

Review each file before applying. These policies are not reversible without an explicit `DROP POLICY` statement per policy.

---

## What these policies do

- Allow the Supabase `anon` role to SELECT rows where `client_id = '00000000-0000-0000-0000-000000000001'`
- For the `clients` table, the filter is on `id` instead of `client_id`
- No INSERT, UPDATE, or DELETE policies are created

## What these policies do not do

- They do not authenticate users
- They do not enforce any ownership beyond the hardcoded demo client UUID
- They do not protect against data enumeration if the demo UUID is known (acceptable for dev, not for production)

---

## Critical limitations

These policies are **not production-safe**:

- They use a hardcoded client UUID rather than the authenticated user's identity
- They allow unauthenticated reads from any origin
- They must be dropped and replaced with authenticated, role-based policies before any real client data is introduced or before the project moves to production

---

## Future production RLS

Production RLS must:

1. Use `auth.uid()` or a custom claims function to identify the authenticated user
2. Join against a `user_client_memberships` or equivalent table to verify the user has read access to the client's data
3. Apply to all tables that contain client-scoped data
4. Never allow the service role key to be used in frontend code — all frontend reads must go through the anon or authenticated role

See `docs/database/RLS_PLAN.md` for the planned production RLS approach.
