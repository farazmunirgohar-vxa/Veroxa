import { useLocation } from "wouter";
import { AUTH_MODE } from "@/lib/auth/authMode";
import { useAuth } from "@/lib/auth/useAuth";

export const DEMO_CLIENT_CONTEXT_ID = "demo-a";

export interface ActiveClientPortalContext {
  /** Real signed-in client id when available; public demo id only on /demo/*. */
  activeClientId: string | null;
  /** Fixture client id allowed only for public Client Demo sample data. */
  demoClientId: typeof DEMO_CLIENT_CONTEXT_ID;
  isRealClientSession: boolean;
  isPublicDemoRoute: boolean;
}

/**
 * Resolves the active client id for portal pages without exposing auth details
 * to the UI. Public /demo/* routes use the sample client id. Real /client/*
 * routes do not silently fall back to demo-a while live account data is not
 * connected; pages should show safe review/empty states instead.
 */
export function useActiveClientPortalContext(): ActiveClientPortalContext {
  const [location] = useLocation();
  const auth = useAuth();
  const isPublicDemoRoute = location.startsWith("/demo/");
  const realClientId =
    AUTH_MODE === "real" &&
    !isPublicDemoRoute &&
    auth.status === "authenticated" &&
    auth.session?.role === "client" &&
    auth.session.clientId
      ? auth.session.clientId
      : null;

  return {
    activeClientId: isPublicDemoRoute ? DEMO_CLIENT_CONTEXT_ID : realClientId,
    demoClientId: DEMO_CLIENT_CONTEXT_ID,
    isRealClientSession: Boolean(realClientId),
    isPublicDemoRoute,
  };
}
