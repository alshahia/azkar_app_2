import React from 'react';

interface Props {
    /**
     * Children to render when the boundary is healthy. On error, the
     * boundary either renders `fallback` (if provided) or these children
     * directly — whichever is appropriate for the caller's strategy.
     */
    children: React.ReactNode;
    /**
     * Optional label included in the console error so logs from many
     * boundaries are easy to correlate with the failing provider. Has no
     * UI effect.
     */
    name?: string;
    /**
     * What to render when the boundary catches an error.
     *
     * - Function: `(children) => ReactNode` — render the original children
     *   inside the caller's wrapper. Useful when the failure is a context
     *   provider and the fallback wants to re-supply a default context
     *   value (e.g. `<XxxContext.Provider value={NOOP_XXX}>{kids}</XxxContext.Provider>`).
     * - Element: `ReactNode` — render this in place of the children
     *   entirely (e.g. an inline error message or alternate view).
     * - Omitted: render the original children directly. Useful when a
     *   higher boundary will catch any follow-on throws from a missing
     *   context, but we still want to log the initial failure.
     */
    fallback?: React.ReactNode | ((children: React.ReactNode) => React.ReactNode);
    /**
     * Optional error reporter (e.g. telemetry). Called from
     * `componentDidCatch` after the console log so devtools and prod
     * telemetry see the same failure.
     */
    onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Lightweight error boundary used to wrap providers and high-risk
 * subtrees (third-party web components, lazy-loaded views, etc.).
 *
 * Goals, in order of importance:
 *  1. Never let a child render error unmount the entire app. A higher
 *     boundary — usually a `ScreenErrorBoundary` at the screen root, or
 *     a sibling `ProviderBoundary` further up — catches anything that
 *     escapes.
 *  2. Allow per-provider "graceful degradation": if a context provider
 *     crashes, wrap children in a no-op default value provider so
 *     consumers keep working (toasts silent, audio no-op, etc.).
 *  3. Log every caught error with the boundary's `name` so production
 *     telemetry can attribute it back to the failing subtree.
 *
 * Notes:
 * - The boundary intentionally does NOT replace `ScreenErrorBoundary`.
 *   `ScreenErrorBoundary` is the user-visible "something went wrong"
 *   surface with a retry button; `ProviderBoundary` is the recovery
 *   strategy for individual providers.
 * - Class component is required: only class components support
 *   `getDerivedStateFromError` / `componentDidCatch`.
 */
export default class ProviderBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        const label = this.props.name ?? 'unnamed';
        // console.error is intentional: an uncaught error is the one event we
        // always want surfaced in the browser console (and forwarded to any
        // crash reporter the host app wires up via onError).
        console.error(`[ProviderBoundary:${label}] Uncaught error:`, error, info.componentStack);
        this.props.onError?.(error, info);
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            const { fallback, children } = this.props;
            if (typeof fallback === 'function') {
                // Function form: caller wants the original children wrapped
                // in some recovery provider (e.g. a noop context value).
                return (fallback as (c: React.ReactNode) => React.ReactNode)(children);
            }
            if (fallback !== undefined) {
                // Element form: render the fallback in place of children.
                return fallback;
            }
            // No fallback: passthrough. A higher boundary must catch any
            // downstream throws (e.g. consumers reading a missing context).
            return children;
        }
        return this.props.children;
    }
}
