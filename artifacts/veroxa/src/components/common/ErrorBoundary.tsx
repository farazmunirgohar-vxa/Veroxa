import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Demo only — surface to console for development visibility.
    // In production this should ship to a real error sink.
    // eslint-disable-next-line no-console
    console.error("[Veroxa ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md w-full rounded-lg border border-rose-500/40 bg-rose-500/5 p-5">
          <div className="flex items-center gap-2 mb-2 text-rose-300">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-semibold">Something went wrong on this screen</p>
          </div>
          <p className="text-sm text-foreground/80 mb-4">
            The page hit an unexpected error. Your work isn't lost — try reloading or jumping back to the dashboard.
          </p>
          <pre className="text-[10px] font-mono text-muted-foreground bg-muted/30 rounded p-2 overflow-x-auto mb-4">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs hover:bg-primary/20 transition-colors"
            data-testid="error-boundary-reload"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reload
          </button>
        </div>
      </div>
    );
  }
}
