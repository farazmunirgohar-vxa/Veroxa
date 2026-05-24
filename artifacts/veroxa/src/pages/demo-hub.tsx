import { Link } from "wouter";
import { ArrowLeft, Lock, Utensils } from "lucide-react";

export default function DemoHub() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Veroxa.com
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-portal-login"
          >
            Portal Login →
          </Link>
        </div>

        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground" data-testid="demo-heading">
            Veroxa Growth OS <span className="text-muted-foreground">— Demo</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            See the restaurant growth operating system from the client's perspective.
          </p>
        </div>

        {/* Public client demo */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Link href="/demo/client" className="block group" data-testid="portal-card-client">
            <div className="p-8 rounded-2xl border border-border bg-card hover:bg-accent/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-500/20 to-transparent blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Utensils className="w-7 h-7 text-blue-500" />
                </div>
                <span className="text-[10px] font-semibold text-blue-400/70 uppercase tracking-widest mt-2">
                  Public Preview
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">Client Portal</h2>
              <p className="text-muted-foreground leading-relaxed">
                What a restaurant owner sees — content calendar, Google visibility, weekly updates, and monthly report previews. No login required.
              </p>
            </div>
          </Link>
        </div>

        {/* Internal portals notice */}
        <div className="mt-8 p-6 rounded-2xl border border-border/60 bg-card/50 animate-in fade-in duration-700" data-testid="internal-portals-notice">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Internal Veroxa portals require login</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Team, Operator, and Owner portals are available after signing in with your Veroxa account credentials.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            data-testid="link-internal-login"
          >
            Sign in to access internal portals →
          </Link>
        </div>
      </div>
    </div>
  );
}
