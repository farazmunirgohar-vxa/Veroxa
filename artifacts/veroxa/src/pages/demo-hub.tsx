import { Link } from "wouter";
import { ArrowRight, Lock, Monitor, Sparkles } from "lucide-react";
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
              Public Experience
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" data-testid="demo-heading">
              Veroxa <span className="text-muted-foreground">— Client Portal Demo</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              This preview shows what a restaurant owner would experience inside Veroxa — dashboard,
              calendar, Google visibility, reports, updates, onboarding, and media guidance.
            </p>
          </div>

          {/* Client Portal Card */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 mb-6">
            <div className="p-8 rounded-2xl border border-border bg-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-500/15 to-transparent blur-3xl rounded-full pointer-events-none" />

              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-border flex items-center justify-center shadow-sm">
                  <Monitor className="w-7 h-7 text-blue-500" />
                </div>
                <span className="text-[10px] font-semibold text-blue-400/70 uppercase tracking-widest mt-2">
                  No login required
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-3">Client Portal Preview</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                The full client-side experience — see exactly what a restaurant owner would see
                inside Veroxa. No account needed.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  "Dashboard",
                  "AI Draft Preview",
                  "Content Calendar",
                  "Reports",
                  "Weekly Updates",
                  "Requests from Veroxa",
                  "Media Guidance",
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
                  Experience Client Portal <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Guided Demo Card */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 mb-6" data-testid="guided-demo-card">
            <div className="p-6 rounded-2xl border border-primary/30 bg-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/10 to-transparent blur-3xl rounded-full pointer-events-none" />
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-border flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-1">Guided Sales Demo</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Walk through the Veroxa story from client upload to AI drafts, team review,
                    scheduling, reporting, and evidence-based recommendations.
                  </p>
                </div>
              </div>
              <Link href="/guided-demo" data-testid="btn-start-guided-demo">
                <Button variant="outline" className="gap-2 font-semibold border-primary/40 hover:bg-primary/10">
                  Start Guided Demo <ArrowRight className="w-4 h-4" />
                </Button>
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
                Internal Team, Operator, and Owner portals require login
              </p>
              <p className="text-sm text-muted-foreground">
                Veroxa staff access is available after signing in with your Veroxa account.{" "}
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
