/**
 * Auth types — backward-compatible re-exports.
 *
 * The single source of truth for Veroxa's auth contract is
 * `./authContract.ts`. This file re-exports those types under the
 * original names so existing imports (`VeroxaRole`, `AuthStatus`,
 * `PlaceholderSession`) keep working without churn.
 *
 * Prefer importing directly from `./authContract` in new code.
 *
 * No runtime code. No Supabase. No side effects.
 */

export type { VeroxaRole, AuthStatus, VeroxaSession, AuthState } from "./authContract";

import type { VeroxaSession } from "./authContract";

/**
 * @deprecated Use `VeroxaSession` from `./authContract` instead.
 * Kept as an alias for backward compatibility with older imports.
 */
export type PlaceholderSession = VeroxaSession;
