/**
 * CrashReporter — a no-op seam (M5-T7b).
 *
 * Today this module is intentionally a no-op. It exists to give every
 * catch block in the codebase a single funnel to log errors to. If a
 * future contributor ever wires a real reporter (Sentry / PostHog /
 * etc.), they swap this module out without touching any call-site.
 *
 * Brand constraint: the app is local-first, no accounts, no analytics,
 * no telemetry. The plan explicitly states we will NOT enable remote
 * crash reporting. The seam is here for *future optionality*, not
 * because we plan to wire it.
 *
 * Errors are forwarded to `console.error` in dev only; production
 * builds intentionally swallow them so a non-actionable error doesn't
 * pollute the device console for end users.
 */

type CrashContext = Record<string, unknown>;

interface CrashReporter {
    /** Report an uncaught error. No-op in production. */
    reportError(error: unknown, context?: CrashContext): void;
}

const noopReporter: CrashReporter = {
    reportError() {
        // intentionally empty
    },
};

const devReporter: CrashReporter = {
    reportError(error, context) {
        console.error('[CrashReporter]', error, context ?? {});
    },
};

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';

export const crashReporter: CrashReporter = isDev ? devReporter : noopReporter;

export type { CrashContext, CrashReporter };
