/**
 * supabaseReadOnlyClient.ts — safe read-only Supabase scaffold.
 *
 * This module wraps the existing Supabase client (`./client.ts`) and
 * exposes ONLY a narrowed read-only surface. Callers cannot reach
 * `insert`, `update`, `delete`, `upsert`, `rpc`, `storage`, or `auth`
 * mutation methods through this module — those are not part of the
 * `ReadOnlyHandle` type, and the runtime wrapper does not forward
 * them either.
 *
 * Hard rules:
 *  - Never expose write methods through the returned handle.
 *  - Never call insert / update / delete / upsert / storage.upload.
 *  - Never use a service-role key. Only the public anon key
 *    (VITE_SUPABASE_ANON_KEY) is allowed.
 *  - If env vars are missing, return a safe `unavailable` state.
 *    Do NOT throw — the app must continue to work on demo data.
 *
 * The current repository layer does NOT call this module yet.
 * It is scaffolding for a future, opt-in read-only data source.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";
import { getSupabaseClient } from "./client";

/**
 * The return type of `.select(...)` on a Supabase table query.
 * We capture it structurally from the underlying SDK without
 * leaking any write methods.
 */
type SelectBuilder = ReturnType<ReturnType<SupabaseClient["from"]>["select"]>;

/**
 * The only PostgREST query operations we expose. Anything that
 * mutates data (`insert`, `update`, `delete`, `upsert`) is
 * deliberately omitted from this interface — even though the
 * underlying client supports them, callers cannot reach them
 * through `ReadOnlyHandle`.
 */
export interface ReadOnlyTableHandle {
  select(columns?: string): SelectBuilder;
}

export interface ReadOnlyHandle {
  from(table: string): ReadOnlyTableHandle;
}

export type ReadOnlyClientState =
  | { available: true; reason: "ready"; client: ReadOnlyHandle }
  | { available: false; reason: "missing_env"; missing: string[] }
  | { available: false; reason: "client_init_failed" };

/**
 * Returns the read-only Supabase handle wrapped in a safe state
 * object. Never throws. Never exposes credentials. Never exposes
 * write methods.
 */
export function getReadOnlySupabaseClient(): ReadOnlyClientState {
  const env = getSupabaseEnv();
  if (!env.ready) {
    return { available: false, reason: "missing_env", missing: env.missing };
  }

  const raw = getSupabaseClient();
  if (!raw) {
    return { available: false, reason: "client_init_failed" };
  }

  const handle: ReadOnlyHandle = {
    from(table: string): ReadOnlyTableHandle {
      const tbl = raw.from(table);
      return {
        select(columns = "*") {
          // Only forward select. Do NOT forward insert/update/delete/upsert.
          return tbl.select(columns);
        },
      };
    },
  };

  return { available: true, reason: "ready", client: handle };
}

/**
 * Convenience boolean for diagnostic pages.
 */
export function isReadOnlySupabaseAvailable(): boolean {
  return getReadOnlySupabaseClient().available;
}
