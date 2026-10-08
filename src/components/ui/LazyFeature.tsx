import React, {
  Component,
  lazy,
  Suspense,
  useMemo,
  useState,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from "react";

interface LazyFeatureErrorBoundaryProps {
  children: ReactNode;
  resetKey: number;
  onRetry: () => void;
}

interface LazyFeatureErrorBoundaryState {
  error: Error | null;
}

class LazyFeatureErrorBoundary extends Component<
  LazyFeatureErrorBoundaryProps,
  LazyFeatureErrorBoundaryState
> {
  state: LazyFeatureErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): LazyFeatureErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(previousProps: LazyFeatureErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Keep module-loading errors local to this view; do not log patient context.
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="m-6 rounded-control border border-danger-200 bg-danger-50 p-4 text-sm text-content-default"
          role="alert"
        >
          <p>This view could not be loaded.</p>
          <button
            className="mt-3 rounded-control bg-surface px-3 py-2 font-semibold text-action hover:bg-canvas"
            onClick={this.props.onRetry}
            type="button"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Creates a stable lazy feature wrapper with a local loading and error state. */
export function createLazyFeature<P extends object>(
  load: () => Promise<{ default: ComponentType<P> }>,
) {
  function LazyFeature(props: P) {
    const [attempt, setAttempt] = useState(0);
    const Feature = useMemo(() => lazy(load), [attempt]);

    return (
      <LazyFeatureErrorBoundary
        key={attempt}
        resetKey={attempt}
        onRetry={() => setAttempt((value) => value + 1)}
      >
        <Suspense
          fallback={
            <div
              className="p-6 text-sm text-content-secondary"
              role="status"
              aria-live="polite"
            >
              Loading view…
            </div>
          }
        >
          <Feature {...props} />
        </Suspense>
      </LazyFeatureErrorBoundary>
    );
  }

  return LazyFeature;
}
