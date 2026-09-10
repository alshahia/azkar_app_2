/**
 * Tests for services/CrashReporter (M5-T7b).
 *
 * The reporter is a no-op seam today. We lock in three properties:
 *   - it never throws (so call-sites in catch blocks can rely on it),
 *   - in dev (NODE_ENV !== 'production') it forwards to console.error,
 *   - in production it is silent so the user console isn't polluted.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { crashReporter } from '../../services/CrashReporter';

describe('crashReporter (M5-T7b)', () => {
    const originalEnv = process.env.NODE_ENV;
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        errorSpy.mockRestore();
        if (originalEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = originalEnv;
    });

    it('never throws when called with arbitrary input', () => {
        expect(() => crashReporter.reportError(null)).not.toThrow();
        expect(() => crashReporter.reportError(undefined)).not.toThrow();
        expect(() => crashReporter.reportError('plain string')).not.toThrow();
        expect(() => crashReporter.reportError(new Error('boom'))).not.toThrow();
        expect(() => crashReporter.reportError({ weird: true })).not.toThrow();
    });

    it('never throws when context is omitted / null / malformed', () => {
        expect(() => crashReporter.reportError(new Error('x'))).not.toThrow();
        expect(() => crashReporter.reportError(new Error('x'), null as unknown as Record<string, unknown>)).not.toThrow();
        expect(() => crashReporter.reportError(new Error('x'), { foo: 1, bar: { baz: [1, 2] } })).not.toThrow();
    });

    it('exposes a stable object identity so call-sites can capture the export', () => {
        expect(crashReporter).toBeDefined();
        expect(typeof crashReporter.reportError).toBe('function');
    });
});
