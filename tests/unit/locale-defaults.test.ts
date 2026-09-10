/**
 * Tests for data/storage/locale (M5-T6).
 *
 * The milestone ships Arabic-only today per the plan's
 * "no i18n expansion yet" non-goal, but the locale resolver is the
 * extension point for future locales — we lock its behaviour now so
 * adding English (or anything else) doesn't quietly regress Arabic
 * defaults.
 */
import { describe, it, expect } from 'vitest';
import { resolveLocale, getDefaultPreferences, SUPPORTED_LOCALES } from '../../data/storage/locale';
import { defaultPreferences } from '../../data/storage/defaults';

describe('locale resolver (M5-T6)', () => {
    it('accepts the supported Arabic tag verbatim', () => {
        expect(resolveLocale('ar')).toBe('ar');
    });

    it('falls back to Arabic for null / undefined / empty input', () => {
        expect(resolveLocale(null)).toBe('ar');
        expect(resolveLocale(undefined)).toBe('ar');
        expect(resolveLocale('')).toBe('ar');
    });

    it('falls back to Arabic for any unsupported locale tag', () => {
        // Future locales: this test is the safety net that ensures we
        // never accidentally ship a half-hydrated state when an unknown
        // locale tag lands in stored preferences (e.g. from a backup
        // export created by a newer app version).
        expect(resolveLocale('en')).toBe('ar');
        expect(resolveLocale('en-US')).toBe('ar');
        expect(resolveLocale('fr')).toBe('ar');
        expect(resolveLocale('ar-SA')).toBe('ar');
        expect(resolveLocale('xx')).toBe('ar');
    });

    it('reports the supported-locales list', () => {
        expect(SUPPORTED_LOCALES).toEqual(['ar']);
    });
});

describe('getDefaultPreferences (M5-T6)', () => {
    it('returns Arabic defaults for the Arabic locale', () => {
        const result = getDefaultPreferences('ar');
        expect(result).toEqual(defaultPreferences);
    });

    it('returns Arabic defaults for null / undefined input', () => {
        expect(getDefaultPreferences(null)).toEqual(defaultPreferences);
        expect(getDefaultPreferences(undefined)).toEqual(defaultPreferences);
    });

    it('returns Arabic defaults for unsupported locales (defensive default)', () => {
        expect(getDefaultPreferences('en')).toEqual(defaultPreferences);
        expect(getDefaultPreferences('fr')).toEqual(defaultPreferences);
    });

    it('preserves every key on the Arabic defaults object', () => {
        // Sanity check: the locale path must NOT drop a field. If we
        // add a new preference to defaultPreferences, this test fails
        // until we confirm the locale path still emits it.
        const result = getDefaultPreferences('ar');
        for (const key of Object.keys(defaultPreferences) as Array<keyof typeof defaultPreferences>) {
            expect(result).toHaveProperty(key);
        }
    });
});
