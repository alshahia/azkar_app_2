/**
 * Asset Manifest (M2-T5)
 * -----------------------
 * The Quran data and the audio cache live entirely on-device. This module
 * loads the small bundled manifest (data/static/manifest.json) which records a
 * SHA-256 hash for each offline-fetchable asset and the audio cache's
 * appVersion stamp. The integrity helpers let callers verify a single URL
 * against the manifest and compute hashes locally via crypto.subtle.digest.
 *
 * Design notes:
 *  - The manifest is loaded lazily via Vite's `?url` + fetch so it never
 *    bundles the index payload into the entry chunk.
 *  - The manifest itself is bundled (Vite inlines it), but its `placeholder`
 *    flag is true until the generator runs; integrity checks therefore warn
 *    (never throw) when the manifest has no entries.
 *  - Hashing is browser-only (uses window.crypto.subtle); the unit tests
 *    inject a fake digest via `_setSubtleForTesting`.
 */
import manifestUrl from '../data/static/manifest.json?url';

export interface ManifestFileEntry {
    path: string;
    sha256: string;
    bytes: number;
}

export interface AssetManifest {
    appVersion: string;
    generatedAt: string;
    placeholder?: boolean;
    files: ManifestFileEntry[];
}

let cached: AssetManifest | null = null;
let inflight: Promise<AssetManifest> | null = null;

type SubtleLike = Pick<SubtleCrypto, 'digest'>;

export async function sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
    const subtle = getSubtle();
    let buf: ArrayBuffer;
    if (typeof data === 'string') {
        buf = new TextEncoder().encode(data).buffer as ArrayBuffer;
    } else if (data instanceof Uint8Array) {
        buf = data.byteOffset === 0 && data.byteLength === data.buffer.byteLength
            ? (data.buffer as ArrayBuffer)
            : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    } else {
        buf = data;
    }
    const digest = await subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function getSubtle(): SubtleLike {
    if (subtleOverride) return subtleOverride;
    const g = globalThis as { crypto?: { subtle?: SubtleCrypto } };
    const subtle = g.crypto?.subtle;
    if (!subtle) throw new Error('crypto.subtle is not available in this environment');
    return subtle;
}

export function _setSubtleForTesting(fake: SubtleLike | null): void {
    subtleOverride = fake;
}

let subtleOverride: SubtleLike | null = null;

export async function loadAssetManifest(): Promise<AssetManifest> {
    if (cached) return cached;
    if (inflight) return inflight;
    inflight = (async () => {
        const res = await fetch(manifestUrl);
        if (!res.ok) throw new Error('Failed to load asset manifest: HTTP ' + res.status);
        const json = (await res.json()) as AssetManifest;
        cached = json;
        return json;
    })();
    try {
        return await inflight;
    } finally {
        inflight = null;
    }
}

export interface VerifyResult {
    status: 'ok' | 'unknown' | 'mismatch' | 'unavailable';
    expected?: string;
    actual?: string;
}

export async function verifyAssetUrl(url: string, bytes: ArrayBuffer | Uint8Array): Promise<VerifyResult> {
    let manifest: AssetManifest;
    try {
        manifest = await loadAssetManifest();
    } catch {
        return { status: 'unknown' };
    }
    if (manifest.placeholder || !manifest.files.length) return { status: 'unknown' };
    const entry = manifest.files.find(f => url.endsWith(f.path) || url.endsWith('/' + f.path));
    if (!entry) return { status: 'unknown' };
    try {
        const actual = await sha256Hex(bytes);
        if (actual === entry.sha256) return { status: 'ok', expected: entry.sha256, actual };
        return { status: 'mismatch', expected: entry.sha256, actual };
    } catch {
        return { status: 'unavailable' };
    }
}

export async function selfHealAudioCache(currentAppVersion: string): Promise<boolean> {
    try {
        const manifest = await loadAssetManifest();
        if (!manifest.appVersion) return false;
        if (manifest.appVersion === currentAppVersion) return false;
        const { clearCache } = await import('./audioCache');
        await clearCache();
        return true;
    } catch {
        return false;
    }
}
