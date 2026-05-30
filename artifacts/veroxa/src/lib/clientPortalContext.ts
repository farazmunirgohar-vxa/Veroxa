import { useLocation } from "wouter";
import { AUTH_MODE } from "@/lib/auth/authMode";
import { useAuth } from "@/lib/auth/useAuth";

export const DEMO_CLIENT_CONTEXT_ID = "demo-a";

export interface ActiveClientPortalContext {
  activeClientId: string;
  isRealClientSession: boolean;
  isPublicDemoRoute: boolean;
}

/**
 * Resolves the active client id for portal pages without exposing auth details
 * to the UI. Real-auth /client/* pages use the signed-in client's id; public
 * demo and placeholder review routes keep using the safe sample client id.
 */
export function useActiveClientPortalContext(): ActiveClientPortalContext {
  const [location] = useLocation();
  const auth = useAuth();
  const isPublicDemoRoute = location.startsWith("/demo/");
  const realClientId =
    AUTH_MODE === "real" &&
    !isPublicDemoRoute &&
    auth.status === "authenticated" &&
    auth.session?.role === "client"
      ? auth.session.clientId
      : null;

  return {
    activeClientId: realClientId ?? DEMO_CLIENT_CONTEXT_ID,
    isRealClientSession: Boolean(realClientId),
    isPublicDemoRoute,
  };
}
