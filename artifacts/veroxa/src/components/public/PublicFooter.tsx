import { Link } from "wouter";
import { Hexagon } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="mt-auto py-12 border-t border-border/40 bg-card/20 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2 opacity-70">
            <Hexagon className="w-5 h-5 fill-current" />
            <span className="font-bold tracking-tight">Veroxa</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors" data-testid="footer-link-home">Home</Link>
            <Link href="/free-audit" className="hover:text-foreground transition-colors" data-testid="footer-link-audit">Audit</Link>
            <Link href="/login" className="hover:text-foreground transition-colors" data-testid="footer-link-login">Login</Link>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/60 text-center max-w-2xl mx-auto leading-relaxed">
          © {new Date().getFullYear()} Veroxa. Complete Online Presence is a manual launch service. Veroxa does not guarantee orders, revenue, profit, rankings, customers, walk-ins, ROI, or growth.
        </p>
      </div>
    </footer>
  );
}
