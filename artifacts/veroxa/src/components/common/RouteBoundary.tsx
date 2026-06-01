import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

/** Calm branded fallback shown while a lazy-loaded route chunk loads. */
function RouteLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background text-foreground"
      data-testid="route-loading"
    >
      <p className="text-sm text-muted-foreground animate-pulse">Loading Veroxa…</p>
    </div>
  );
}

/** Client-safe fallback shown when a route/section fails to render. */
function RouteErrorFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background text-foreground p-6"
      data-testid="route-error"
    >
      <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 text-center">
        <p className="font-semibold text-foreground mb-1">
          Something went wrong loading this section.
        </p>
        <p className="text-sm text-muted-foreground">Please refresh or contact Veroxa.</p>
      </div>
    </div>
  );
}

/**
 * Route-level boundary: combines a Suspense fallback (for lazy route chunks)
 * with a client-safe ErrorBoundary so a single broken page never white-screens
 * the whole app. The global ErrorBoundary in App remains the last resort.
 */
export function RouteBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={<RouteErrorFallback />}>
      <Suspense fallback={<RouteLoading />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
