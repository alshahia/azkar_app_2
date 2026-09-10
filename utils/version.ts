/**
 * Single source of truth for the build's app version. Bumped when an offline
 * cache key change (e.g. audio format tweak, cache layout change) is needed so
 * users automatically get a fresh cache without us shipping a migration. Also
 * referenced by the asset-manifest generator.
 *
 * Keep this in sync with the value exported by scripts/generate-quran-data.mjs
 * (or read it directly from package.json via fs).
 */
export const APP_VERSION = '1';

/**
 * Returns the cache-name suffix used by the audio cache. Versioned so a code
 * release that changes the audio format invalidates the previous cache.
 */
export const audioCacheVersionSuffix = (): string => 'v' + APP_VERSION;
