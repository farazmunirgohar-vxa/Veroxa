import { Link } from "wouter";
import { ArrowRight, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export default function DemoHub() {
  useDocumentMeta({
    title: "Client Demo — Veroxa",
    description: "Preview the simple Veroxa Client Portal with sample data.",
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="w-full max-w-xl text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-semibold mb-6">
            <Monitor className="w-3.5 h-3.5" />
            Sample data only
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" data-testid="demo-heading">
            Client Demo
          </h1>

          <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
            See what a restaurant partner sees inside Veroxa — dashboard, media, updates,
            requests, and reports. Sample data only; no account needed.
          </p>

          <Link href="/demo/client/dashboard" data-testid="btn-enter-client-demo">
            <Button size="lg" className="gap-2 font-semibold h-12 px-7">
              Open Client Demo <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
