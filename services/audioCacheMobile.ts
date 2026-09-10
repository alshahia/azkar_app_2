/**
 * Mobile backend for audioCache - persists per-ayah recitation audio under
 * Capacitor Filesystem (Directory.Data) so it survives across app launches
 * even when the device is offline.
 *
 * Layout
 * ------
 *   <Directory.Data>/quran-audio/<reciterId>/<globalAyah>.mp3
 *   <Directory.Data>/quran-audio/<reciterId>/<globalAyah>.mp3.part
 *   <Directory.Data>/quran-audio/.index.json
 *
 * The index is a JSON object { entries: [...], partials?: { "<reciterId>:<ayah>":
 * { bytes, path } } }. It is updated on every read and write; corrupt indexes
 * are treated as empty and rebuilt lazily as new files are written. Partial
 * files let an interrupted download resume from its exact byte offset
 * (audioCache.ts sends "Range: bytes=N-" on the retry).
 *
 * LRU eviction
 * ------------
 * After every bulk download we evict the oldest entries (by lastAccessedAt)
 * until the total stored bytes fit within the requested cap. Per-ayah reads
 * only refresh lastAccessedAt; they never trigger eviction on their own.
 * Partial files are never eviction candidates - they belong to a download
 * that is still in progress.
 *
 * URL handling
 * ------------
 * Filesystem.getUri() returns a file:// URI which the Capacitor WebView
 * blocks by default. We wrap it with Capacitor.convertFileSrc() so the URL
 * becomes a http://localhost/_capacitor_file_/... path the WebView can load
 * into <audio src>.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import type { CacheBackend, IndexEntry } from './audioCache';
import { APP_VERSION } from '../utils/version';

const DIR_NAME = 'quran-audio-' + APP_VERSION;
const INDEX_FILENAME = '.index.json';

interface PartialRecord {
    bytes: number;
    path: string;
}

interface StoredIndex {
    entries: Array<IndexEntry & { path: string }>;
    partials?: Record<string, PartialRecord>;
}

function reciterDir(reciterId: string): string {
    return DIR_NAME + '/' + encodeURIComponent(reciterId);
}

function filePathFor(reciterId: string, ayah: number): string {
    return reciterDir(reciterId) + '/' + ayah + '.mp3';
}

function partialPathFor(reciterId: string, ayah: number): string {
    return filePathFor(reciterId, ayah) + '.part';
}

function partialKey(reciterId: string, ayah: number): string {
    return reciterId + ':' + ayah;
}

async function readIndex(): Promise<StoredIndex> {
    try {
        const res = await Filesystem.readFile({
            path: DIR_NAME + '/' + INDEX_FILENAME,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
        });
        const text = typeof res.data === 'string' ? res.data : '';
        const parsed = JSON.parse(text);
        if (!parsed || !Array.isArray(parsed.entries)) return { entries: [] };
        return parsed as StoredIndex;
    } catch {
        return { entries: [] };
    }
}

async function writeIndex(idx: StoredIndex): Promise<void> {
    await Filesystem.writeFile({
        path: DIR_NAME + '/' + INDEX_FILENAME,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
        data: JSON.stringify(idx),
    });
}

function toBase64(bytes: ArrayBuffer): string {
    // Chunked encode to avoid call-stack limits on large buffers.
    const chunk = 0x8000;
    let binary = '';
    const arr = new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i += chunk) {
        binary += String.fromCharCode.apply(
            null,
            Array.from(arr.subarray(i, i + chunk)) as number[],
        );
    }
    if (typeof btoa === 'function') return btoa(binary);
    // Node fallback for tooling/tests.
    return Buffer.from(binary, 'binary').toString('base64');
}

async function ensureDir(reciterId: string): Promise<void> {
    try {
        await Filesystem.mkdir({
            path: reciterDir(reciterId),
            directory: Directory.Data,
            recursive: true,
        });
    } catch {
        // mkdir with recursive=true throws if the directory already exists on
        // some platforms; treat that as success.
    }
}

function localUriToPlayable(uri: string): string {
    return Capacitor.convertFileSrc(uri);
}

/** Deletes a partial file and drops it from the index. */
async function removePartial(idx: StoredIndex, reciterId: string, ayah: number): Promise<void> {
    const key = partialKey(reciterId, ayah);
    const partial = idx.partials?.[key];
    if (idx.partials) delete idx.partials[key];
    if (!partial) return;
    try {
        await Filesystem.deleteFile({
            path: partial.path,
            directory: Directory.Data,
        });
    } catch { /* already gone */ }
}

export function createMobileBackend(): CacheBackend {
    return {
        async lookup(reciterId, globalAyah) {
            try {
                await Filesystem.stat({
                    path: filePathFor(reciterId, globalAyah),
                    directory: Directory.Data,
                });
            } catch {
                return null;
            }
            // Refresh LRU access time.
            const idx = await readIndex();
            const entry = idx.entries.find(
                e => e.reciterId === reciterId && e.ayah === globalAyah,
            );
            if (entry) {
                entry.lastAccessedAt = Date.now();
                try { await writeIndex(idx); } catch { /* best-effort */ }
            }
            const uriRes = await Filesystem.getUri({
                path: filePathFor(reciterId, globalAyah),
                directory: Directory.Data,
            });
            return localUriToPlayable(uriRes.uri);
        },

        async store(reciterId, globalAyah, bytes) {
            await ensureDir(reciterId);
            const path = filePathFor(reciterId, globalAyah);
            await Filesystem.writeFile({
                path,
                directory: Directory.Data,
                data: toBase64(bytes),
            });
            const idx = await readIndex();
            const existing = idx.entries.find(
                e => e.reciterId === reciterId && e.ayah === globalAyah,
            );
            const entry = existing ?? { reciterId, ayah: globalAyah, bytes: 0, lastAccessedAt: Date.now(), path };
            entry.bytes = bytes.byteLength;
            entry.path = path;
            entry.lastAccessedAt = Date.now();
            if (!existing) idx.entries.push(entry);
            // A full write supersedes any half-downloaded .part for this ayah.
            try { await removePartial(idx, reciterId, globalAyah); } catch { /* best-effort */ }
            try { await writeIndex(idx); } catch { /* best-effort */ }
            const uriRes = await Filesystem.getUri({ path, directory: Directory.Data });
            return localUriToPlayable(uriRes.uri);
        },

        async remove(reciterId, globalAyah) {
            try {
                await Filesystem.deleteFile({
                    path: filePathFor(reciterId, globalAyah),
                    directory: Directory.Data,
                });
            } catch { /* already gone */ }
            const idx = await readIndex();
            idx.entries = idx.entries.filter(
                e => !(e.reciterId === reciterId && e.ayah === globalAyah),
            );
            try { await removePartial(idx, reciterId, globalAyah); } catch { /* best-effort */ }
            try { await writeIndex(idx); } catch { /* best-effort */ }
        },

        async has(reciterId, globalAyah) {
            try {
                await Filesystem.stat({
                    path: filePathFor(reciterId, globalAyah),
                    directory: Directory.Data,
                });
                return true;
            } catch {
                return false;
            }
        },

        async list() {
            const idx = await readIndex();
            return idx.entries.map(e => ({
                reciterId: e.reciterId,
                ayah: e.ayah,
                bytes: e.bytes,
                lastAccessedAt: e.lastAccessedAt,
            }));
        },

        async clear() {
            try {
                await Filesystem.rmdir({
                    path: DIR_NAME,
                    directory: Directory.Data,
                    recursive: true,
                });
            } catch {
                // Directory may not exist on a fresh install.
            }
        },

        async enforceCap(targetBytes) {
            const idx = await readIndex();
            let total = idx.entries.reduce((sum, e) => sum + e.bytes, 0);
            if (total <= targetBytes) return;
            idx.entries.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);
            while (total > targetBytes && idx.entries.length > 0) {
                const victim = idx.entries.shift();
                if (!victim) break;
                try {
                    await Filesystem.deleteFile({
                        path: victim.path,
                        directory: Directory.Data,
                    });
                } catch { /* file already gone */ }
                total -= victim.bytes;
            }
            try { await writeIndex(idx); } catch { /* best-effort */ }
        },

        // --- Partial download protocol ---

        async getPartialBytes(reciterId, ayah) {
            const idx = await readIndex();
            const partial = idx.partials?.[partialKey(reciterId, ayah)];
            if (!partial) return 0;
            try {
                await Filesystem.stat({ path: partial.path, directory: Directory.Data });
                return partial.bytes;
            } catch {
                // The .part vanished (manual cleanup) - drop the stale record.
                try {
                    if (idx.partials) {
                        delete idx.partials[partialKey(reciterId, ayah)];
                        await writeIndex(idx);
                    }
                } catch { /* best-effort */ }
                return 0;
            }
        },

        async appendPartial(reciterId, ayah, chunk) {
            await ensureDir(reciterId);
            const key = partialKey(reciterId, ayah);
            const idx = await readIndex();
            if (!idx.partials) idx.partials = {};
            const entry = idx.partials[key] ?? { bytes: 0, path: partialPathFor(reciterId, ayah) };
            await Filesystem.appendFile({
                path: entry.path,
                directory: Directory.Data,
                data: toBase64(chunk),
            });
            entry.bytes += chunk.byteLength;
            idx.partials[key] = entry;
            try { await writeIndex(idx); } catch { /* best-effort */ }
            return entry.bytes;
        },

        async commitPartial(reciterId, ayah) {
            const key = partialKey(reciterId, ayah);
            const idx = await readIndex();
            const partial = idx.partials?.[key];
            const finalPath = filePathFor(reciterId, ayah);
            if (partial) {
                try {
                    await Filesystem.rename({
                        from: partial.path,
                        to: finalPath,
                        directory: Directory.Data,
                    });
                } catch {
                    // Older plugin builds may lack rename - fall back to a
                    // full read/write cycle.
                    try {
                        const res = await Filesystem.readFile({
                            path: partial.path,
                            directory: Directory.Data,
                        });
                        const text = typeof res.data === 'string' ? res.data : '';
                        await Filesystem.writeFile({
                            path: finalPath,
                            directory: Directory.Data,
                            data: text,
                        });
                    } catch { /* commit failed - retry redownloads */ }
                }
                try { await removePartial(idx, reciterId, ayah); } catch { /* best-effort */ }
            }
            const idx2 = await readIndex();
            const size = partial ? partial.bytes : 0;
            const existing = idx2.entries.find(
                e => e.reciterId === reciterId && e.ayah === ayah,
            );
            const entry = existing ?? { reciterId, ayah, bytes: 0, lastAccessedAt: Date.now(), path: finalPath };
            if (size > 0) entry.bytes = size;
            entry.path = finalPath;
            entry.lastAccessedAt = Date.now();
            if (!existing) idx2.entries.push(entry);
            try { await writeIndex(idx2); } catch { /* best-effort */ }
            const uriRes = await Filesystem.getUri({ path: finalPath, directory: Directory.Data });
            return localUriToPlayable(uriRes.uri);
        },

        async discardPartial(reciterId, ayah) {
            const idx = await readIndex();
            try { await removePartial(idx, reciterId, ayah); } catch { /* best-effort */ }
            try { await writeIndex(idx); } catch { /* best-effort */ }
        },

        async removeReciter(reciterId) {
            try {
                await Filesystem.rmdir({
                    path: reciterDir(reciterId),
                    directory: Directory.Data,
                    recursive: true,
                });
            } catch {
                // Directory may not exist.
            }
            const idx = await readIndex();
            idx.entries = idx.entries.filter(e => e.reciterId !== reciterId);
            if (idx.partials) {
                const prefix = reciterId + ':';
                for (const key of Object.keys(idx.partials)) {
                    if (key.startsWith(prefix)) delete idx.partials[key];
                }
            }
            try { await writeIndex(idx); } catch { /* best-effort */ }
        },
    };
}
