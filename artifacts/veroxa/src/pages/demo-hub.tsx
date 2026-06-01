import { Link } from "wouter";
import { ArrowRight, Lock, Monitor, UploadCloud, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";

export default function DemoHub() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="w-full max-w-2xl">
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-semibold mb-6">
              <Monitor className="w-3.5 h-3.5" />
              Client Demo — sample data only
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" data-testid="demo-heading">
              Veroxa <span className="text-muted-foreground">Client Demo</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              A public sample of the Veroxa client experience — see what a restaurant partner
              sees inside Veroxa. Sample data only; no account needed.
            </p>
          </div>

          {/* Client Demo Card */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 mb-6">
            <div className="p-8 rounded-2xl border border-border bg-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-500/15 to-transparent blur-3xl rounded-full pointer-events-none" />

              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-border flex items-center justify-center shadow-sm">
                  <Monitor className="w-7 h-7 text-blue-500" />
                </div>
                <span className="text-[10px] font-semibold text-blue-400/70 uppercase tracking-widest mt-2">
                  No login required · sample data
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-3">Client Demo</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                See what a restaurant partner sees inside Veroxa — dashboard, media, updates,
                requests, and reports. Sample data only; no account needed.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  "Dashboard",
                  "Media",
                  "Updates",
                  "Requests",
                  "Reports",
                  "Account overview",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <Link href="/demo/client/dashboard" data-testid="btn-enter-client-demo">
                <Button className="gap-2 font-semibold">
                  Open Client Demo <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Restaurant Upload — app-style demo entry */}
          <div className="animate-in fade-in duration-700 mb-6" data-testid="restaurant-upload-card">
            <div className="p-5 rounded-xl border border-border bg-card/60 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-border flex items-center justify-center flex-shrink-0">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Restaurant Upload — app-style
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Sample of the daily content upload flow restaurant staff use. Enter a restaurant
                  upload key — no login or account needed.
                </p>
                <Link
                  href="/upload"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  data-testid="link-restaurant-upload"
                >
                  Open Restaurant Upload <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Veroxa OS Access — real review */}
          <div
            className="p-5 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 animate-in fade-in duration-700 mb-4"
            data-testid="veroxa-os-access-notice"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Hexagon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Veroxa OS — active review access
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                If you have Veroxa credentials, sign in to access the live Client Portal or Team
                Portal review environment — not this sample preview.
              </p>
              <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1" data-testid="link-veroxa-os-login">
                Sign in to Veroxa OS <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Internal portals note */}
          <div
            className="p-5 rounded-xl border border-border/60 bg-card/40 flex items-start gap-3 animate-in fade-in duration-700"
            data-testid="internal-portals-notice"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Team Portal requires login
              </p>
              <p className="text-sm text-muted-foreground">
                Veroxa team access is available after signing in with your Veroxa account.{" "}
                <Link href="/login" className="text-primary hover:underline" data-testid="link-internal-login">
                  Sign in →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
