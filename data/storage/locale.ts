/**
 * Per-locale default-preferences resolver (M5-T6).
 *
 * Today only Arabic ('ar') is shipped per the milestone plan's
 * "no i18n expansion yet" non-goal. The shape is in place so a future
 * English (or other locale) addition only needs to drop a new block
 * into `LOCALE_PRESETS` — no App.tsx / storage adapter edits.
 *
 * Unknown locales fall back to Arabic defaults. The fallback is
 * intentional: we never want a bad locale tag to leave the app in a
 * half-hydrated state where some fields are Arabic and others are
 * English (the brand is "Arabic-first, RTL, local-first").
 */

import type { UserPreferences } from '../../types';
import { defaultPreferences as arabicDefaults } from './defaults';

export type SupportedLocale = 'ar';

/** All known locales. Extend this union when a new locale ships. */
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['ar'] as const;

const FALLBACK_LOCALE: SupportedLocale = 'ar';

/** Locale-tag normalizer. Anything outside the supported set falls back. */
export function resolveLocale(input?: string | null): SupportedLocale {
    if (input === 'ar') return 'ar';
    return FALLBACK_LOCALE;
}

/**
 * Returns the default `UserPreferences` for the given locale.
 *
 * The current implementation returns the Arabic defaults verbatim
 * for every supported locale; the indirection lets a future English
 * locale drop in `language: 'en'` plus locale-specific overrides
 * (e.g. an English prayer-time fallback or a different home layout)
 * without touching call-sites.
 */
export function getDefaultPreferences(locale?: string | null): UserPreferences {
    const resolved = resolveLocale(locale);
    switch (resolved) {
        case 'ar':
            return arabicDefaults;
        default:
            return arabicDefaults;
    }
}
