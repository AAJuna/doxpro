import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Ada yang gak beres</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aplikasi ke-crash karena error tak terduga. Klik tombol di bawah untuk coba ulang, atau
            restart aplikasi kalau masih error.
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-secondary/50 p-3 text-left text-xs text-muted-foreground">
            {this.state.error.message}
          </pre>
          <Button className="mt-4" onClick={this.reset}>
            <RotateCw className="h-4 w-4" /> Coba Lagi
          </Button>
        </div>
      </div>
    );
  }
}
