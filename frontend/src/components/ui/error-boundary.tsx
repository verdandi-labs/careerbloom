import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-destructive/10 px-6 py-10 text-center">
            <p className="text-sm text-destructive">
              Something went wrong loading this section.
            </p>
            <button
              onClick={this.handleRetry}
              className="rounded-lg bg-destructive px-4 py-2 text-xs font-medium text-white"
            >
              Retry
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
