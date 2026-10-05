import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ProviderBoundary from '../../components/common/ProviderBoundary';

interface BoomProps {
    /** When true, throw during render so the boundary has something to catch. */
    throw?: boolean;
    /** Stable label so we can assert on what was actually mounted. */
    label: string;
}

const Boom: React.FC<BoomProps> = ({ throw: shouldThrow, label }) => {
    if (shouldThrow) {
        throw new Error(`boom from ${label}`);
    }
    return <span data-testid={`boom-${label}`}>{label}</span>;
};

describe('ProviderBoundary', () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // componentDidCatch forwards to console.error; silence it so the
        // test output stays clean.
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    it('renders children normally when no error occurs', () => {
        render(
            <ProviderBoundary name="happy" fallback={<div>should-not-render</div>}>
                <Boom label="child" />
            </ProviderBoundary>,
        );

        expect(screen.getByTestId('boom-child')).toHaveTextContent('child');
        expect(screen.queryByText('should-not-render')).toBeNull();
    });

    it('renders the element fallback when a child throws', () => {
        render(
            <ProviderBoundary name="element-fallback" fallback={<div data-testid="fallback">recovery screen</div>}>
                <Boom label="child" throw />
            </ProviderBoundary>,
        );

        // The boom child must be gone; the fallback must be in its place.
        expect(screen.queryByTestId('boom-child')).toBeNull();
        expect(screen.getByTestId('fallback')).toHaveTextContent('recovery screen');
    });

    it('passes the original children to a function fallback and renders its return value', () => {
        // We verify two things:
        //   (a) the fallback function is invoked with the original children
        //       argument so the caller can wrap them in a recovery provider
        //       (e.g. NOOP context).
        //   (b) the boundary actually mounts the JSX the fallback returns.
        // We intentionally do NOT render `kids` inside the fallback to keep
        // the test focused on the boundary's contract: a persistently
        // throwing child inside the fallback re-throws on re-render and the
        // error propagates up — that's React's error-boundary model, not
        // something this component can paper over.
        const seenKids: React.ReactNode[] = [];
        const fallback = (kids: React.ReactNode) => {
            seenKids.push(kids);
            return <span data-testid="function-fallback-marker">wrapped</span>;
        };

        render(
            <ProviderBoundary name="function-fallback" fallback={fallback}>
                <Boom label="child" throw />
            </ProviderBoundary>,
        );

        // (a) The boundary invoked our function and handed it the original
        // children element instance. React 18 may call the function more
        // than once during the recovery phase (the recovery re-render is
        // a documented behavior of `createRoot` error handling), so we
        // only assert "at least once" here.
        expect(seenKids.length).toBeGreaterThanOrEqual(1);
        expect(React.isValidElement(seenKids[0])).toBe(true);

        // (b) The boundary mounted the JSX we returned. The marker proves
        // the boundary followed the function's contract: "use whatever you
        // return as the new subtree."
        expect(screen.getByTestId('function-fallback-marker')).toHaveTextContent('wrapped');
    });

    it('logs the boundary name on error for telemetry attribution', () => {
        render(
            <ProviderBoundary name="NamedBoundary" fallback={<span>ok</span>}>
                <Boom label="x" throw />
            </ProviderBoundary>,
        );

        // The boundary emits exactly one [ProviderBoundary:Name] console.error.
        const matching = errorSpy.mock.calls.filter((args: unknown[]) =>
            typeof args[0] === 'string' && args[0].includes('[ProviderBoundary:NamedBoundary]'),
        );
        expect(matching.length).toBeGreaterThanOrEqual(1);
    });

    it('uses "unnamed" as the log label when no name prop is supplied', () => {
        render(
            <ProviderBoundary fallback={<span>ok</span>}>
                <Boom label="x" throw />
            </ProviderBoundary>,
        );

        const matching = errorSpy.mock.calls.filter((args: unknown[]) =>
            typeof args[0] === 'string' && args[0].includes('[ProviderBoundary:unnamed]'),
        );
        expect(matching.length).toBeGreaterThanOrEqual(1);
    });

    it('forwards errors to the optional onError callback', () => {
        const onError = vi.fn();

        render(
            <ProviderBoundary
                name="telemetry"
                fallback={<span>ok</span>}
                onError={onError}
            >
                <Boom label="x" throw />
            </ProviderBoundary>,
        );

        expect(onError).toHaveBeenCalledTimes(1);
        const [err, info] = onError.mock.calls[0];
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe('boom from x');
        expect(info).toBeDefined();
        expect(typeof info.componentStack).toBe('string');
    });

    it('does NOT call onError when the boundary stays healthy', () => {
        const onError = vi.fn();

        render(
            <ProviderBoundary name="telemetry-clean" onError={onError}>
                <Boom label="y" />
            </ProviderBoundary>,
        );

        expect(onError).not.toHaveBeenCalled();
        expect(screen.getByTestId('boom-y')).toHaveTextContent('y');
    });
});
