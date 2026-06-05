import { Link } from "wouter";

export default function PublicNav() {
  return (
    <nav className="h-20 border-b border-border/40 flex items-center justify-center px-4 lg:px-12 backdrop-blur-md sticky top-0 z-50 bg-background/80" aria-label="Veroxa public header">
      <Link
        href="/"
        className="text-center text-sm font-bold tracking-tight text-foreground transition-colors hover:text-primary"
        data-testid="nav-link-brand"
      >
        Veroxa
      </Link>
    </nav>
  );
}
