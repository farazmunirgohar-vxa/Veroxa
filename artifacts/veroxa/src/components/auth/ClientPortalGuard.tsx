import { Link } from "wouter";
import { AlertTriangle, LifeBuoy, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AUTH_MODE } from "@/lib/auth/authMode";
import { useAuth } from "@/lib/auth/useAuth";

interface ClientPortalGuardProps {
  children: React.ReactNode;
}

/**
 * ClientPortalGuard — protects /client/* in both placeholder and real auth.
 *
 * In placeholder mode a client must complete the env-backed login flow (which
 * creates a placeholder session) before /client/* renders; AUTH_MODE alone never
 * grants access. Placeholder client sessions carry no clientId, so the clientId
 * requirement applies only when AUTH_MODE === "real". Public demo routes (for
 * example /demo/client/dashboard) are not wrapped with this guard and remain
 * open regardless of auth mode.
 */
export default function ClientPortalGuard({ children }: ClientPortalGuardProps) {
  const auth = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Checking your Veroxa access…</p>
        </div>
      </div>
    );
  }

  if (auth.status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Login required</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Please sign in to view your Veroxa client portal.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Sign in to Veroxa</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (auth.session?.role === "team") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-sky-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Wrong portal for this login</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This sign-in belongs in the Veroxa team portal.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/team/dashboard">Go to team portal</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isClientSession = auth.session?.role === "client";
  const realClientReady = AUTH_MODE === "real" ? Boolean(auth.session?.clientId) : true;
  if (!isClientSession || !realClientReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
            <LifeBuoy className="w-7 h-7 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Account setup needed</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your Veroxa account is signed in, but your restaurant workspace still needs team review. Please contact Veroxa support.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
