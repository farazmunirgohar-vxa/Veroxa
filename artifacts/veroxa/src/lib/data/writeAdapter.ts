/**
 * writeAdapter.ts — M023B
 *
 * Re-export the currently active write adapter. In this build the
 * active adapter is `disabledWriteAdapter`, which never touches the
 * network.
 *
 * Future M023C/M024 work can swap this re-export behind an explicit
 * feature flag (e.g. `VITE_VEROXA_ENABLE_DEV_WRITES=true`) to point
 * at a real Supabase write adapter — without churn at call sites.
 */

import { disabledWriteAdapter } from "./disabledWriteAdapter";
import type { VeroxaWriteAdapter } from "./writeAdapterTypes";

export const veroxaWriteAdapter: VeroxaWriteAdapter = disabledWriteAdapter;

export type { VeroxaWriteAdapter } from "./writeAdapterTypes";
