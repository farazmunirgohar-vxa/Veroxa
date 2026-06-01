/**
 * writeAdapter.ts — M023B / M023C
 *
 * Selects the active write adapter based on `getWriteMode()`:
 *   - "dev_supabase_writes" → `devSupabaseWriteAdapter` (real
 *     metadata writes against a dev Supabase project, no storage)
 *   - "disabled"            → `disabledWriteAdapter` (returns the
 *     disabled envelope, no network calls)
 *
 * Page components must import `veroxaWriteAdapter` — they never
 * pick an adapter directly.
 *
 * The selection is resolved at module load. `getWriteMode()` reads
 * `VITE_VEROXA_ENABLE_DEV_WRITES` strictly together with
 * `VITE_VEROXA_DEV_WRITE_ENV="dev"` and non-production mode; see
 * `writeReadiness.ts`.
 */

import { devSupabaseWriteAdapter } from "./devSupabaseWriteAdapter";
import { disabledWriteAdapter } from "./disabledWriteAdapter";
import type { VeroxaWriteAdapter } from "./writeAdapterTypes";
import { getWriteMode } from "./writeReadiness";

function selectAdapter(): VeroxaWriteAdapter {
  return getWriteMode() === "dev_supabase_writes"
    ? devSupabaseWriteAdapter
    : disabledWriteAdapter;
}

export const veroxaWriteAdapter: VeroxaWriteAdapter = selectAdapter();

export type { VeroxaWriteAdapter } from "./writeAdapterTypes";
