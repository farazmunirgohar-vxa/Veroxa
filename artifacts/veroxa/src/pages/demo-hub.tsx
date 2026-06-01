import { Link } from "wouter";
import { ArrowRight, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";

export default function DemoHub() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />

      <main className="flex-1 flex items-center justify-center px-6 py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[520px] bg-primary/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        <section className="w-full max-w-2xl text-center rounded-3xl border border-border bg-card/80 px-6 py-10 md:px-10 md:py-12 shadow-sm">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Monitor className="h-7 w-7" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" data-testid="demo-heading">
            Client Demo
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
            See the simple Veroxa client experience for a restaurant partner: media drop-off,
            basic status, requests, and reports. Sample data only; no account needed.
          </p>
          <div className="mt-8">
            <Link href="/demo/client/dashboard" data-testid="btn-enter-client-demo">
              <Button size="lg" className="gap-2 font-semibold">
                Open Client Demo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
