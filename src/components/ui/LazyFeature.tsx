import React, {
  Component,
  lazy,
  Suspense,
  useState,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from "react";
import Button from "./Button";
import { ErrorState, LoadingIndicator } from "./LoadingFeedback";

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
        <ErrorState
          title="This view could not be loaded."
          message="Your other work is still available. Try loading this view again."
          action={
            <Button onClick={this.props.onRetry} size="sm" variant="secondary">
              Try again
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}

/** Creates a stable lazy feature wrapper with a local loading and error state. */
export function createLazyFeature<P extends object>(
  load: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode,
) {
  let SharedFeature = lazy(load);

  function LazyFeature(props: P) {
    const [attempt, setAttempt] = useState(0);
    const [Feature, setFeature] = useState(() => SharedFeature);

    const retry = () => {
      SharedFeature = lazy(load);
      setFeature(() => SharedFeature);
      setAttempt((value) => value + 1);
    };

    return (
      <LazyFeatureErrorBoundary
        key={attempt}
        resetKey={attempt}
        onRetry={retry}
      >
        <Suspense
          fallback={fallback ?? <LoadingIndicator label="Loading view…" />}
        >
          <Feature {...props} />
        </Suspense>
      </LazyFeatureErrorBoundary>
    );
  }

  return LazyFeature;
}
