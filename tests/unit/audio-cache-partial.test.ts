import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    _setBackendForTesting, downloadSurah, getAudioSourceUrl,
    removeReciterAudio, type CacheBackend,
} from '../../services/audioCache';

const RECITER = 'ar.alafasy';

// --- Fake backend WITH the partial protocol --------------------------------

function createPartialBackend() {
    const store = new Map<string, ArrayBuffer>();                 // complete files
    const partials = new Map<string, ArrayBuffer[]>();            // .part chunks
    const discarded: string[] = [];                               // keys discarded
    const key = (r: string, a: number) => r + ':' + a;
    const total = (chunks: ArrayBuffer[]) => chunks.reduce((s, b) => s + b.byteLength, 0);

    const backend = {
        async lookup(r: string, a: number) {
            return store.has(key(r, a)) ? 'mem://' + key(r, a) : null;
        },
        async store(r: string, a: number, bytes: ArrayBuffer) {
            store.set(key(r, a), bytes);
            return 'mem://' + key(r, a);
        },
        async remove(r: string, a: number) { store.delete(key(r, a)); },
        async has(r: string, a: number) { return store.has(key(r, a)); },
        async list() {
            return Array.from(store.entries()).map(([k, v]) => {
                const [reciterId, ayahStr] = k.split(':');
                return { reciterId, ayah: Number(ayahStr), bytes: v.byteLength, lastAccessedAt: 0 };
            });
        },
        async clear() { store.clear(); },
        async getPartialBytes(r: string, a: number) {
            const chunks = partials.get(key(r, a));
            return chunks ? total(chunks) : 0;
        },
        async appendPartial(r: string, a: number, chunk: ArrayBuffer) {
            const k = key(r, a);
            const chunks = partials.get(k) ?? [];
            chunks.push(chunk);
            partials.set(k, chunks);
            return total(chunks);
        },
        async commitPartial(r: string, a: number) {
            const k = key(r, a);
            const chunks = partials.get(k);
            if (!chunks) return 'mem://' + k;
            const merged = new Uint8Array(total(chunks));
            let pos = 0;
            for (const c of chunks) { merged.set(new Uint8Array(c), pos); pos += c.byteLength; }
            store.set(k, merged.buffer as ArrayBuffer);
            partials.delete(k);
            return 'mem://' + k;
        },
        async discardPartial(r: string, a: number) {
            partials.delete(key(r, a));
            discarded.push(key(r, a));
        },
        async removeReciter(r: string) {
            for (const k of Array.from(store.keys())) if (k.startsWith(r + ':')) store.delete(k);
            for (const k of Array.from(partials.keys())) if (k.startsWith(r + ':')) partials.delete(k);
        },
    } as CacheBackend & { discarded: string[] };

    return { backend, store, partials, discarded, key };
}

// --- Scripted fetch: chunked bodies, optional Range, optional mid-stream drop

interface FetchCall { url: string; range?: string }

function stubFetch(
    files: Record<string, Uint8Array>,
    script: Array<'ok' | 'drop'>,
    calls: FetchCall[],
    opts: { supportsRange?: boolean } = {},
) {
    const supportsRange = opts.supportsRange ?? true;
    let callIndex = 0;
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const req = new Request(input as string, init as RequestInit);
        const range = req.headers.get('Range') ?? undefined;
        calls.push({ url: req.url, range });
        const file = files[req.url];
        if (!file) return new Response('not found', { status: 404 });

        let offset = 0;
        let status = 200;
        const match = supportsRange ? range?.match(/bytes=(\d+)-/) : undefined;
        if (match) {
            offset = Number(match[1]);
            status = 206;
        }
        const body = file.subarray(offset);
        const mode = script[Math.min(callIndex, script.length - 1)];
        callIndex++;

        let pos = 0;
        let emitted = 0;
        const CHUNK = 10;
        const drop = mode === 'drop';
        const stream = new ReadableStream<Uint8Array>({
            pull(controller) {
                if (drop && emitted >= 2) {
                    controller.error(new Error('network drop mid-file'));
                    return;
                }
                if (pos >= body.length) {
                    controller.close();
                    return;
                }
                const size = Math.min(CHUNK, body.length - pos);
                controller.enqueue(body.slice(pos, pos + size));
                pos += size;
                emitted++;
            },
        });
        return new Response(stream, { status, headers: { 'Content-Type': 'audio/mpeg' } });
    });
}

function bytes(seed: number, length: number): Uint8Array {
    const out = new Uint8Array(length);
    for (let i = 0; i < length; i++) out[i] = (seed + i) & 0xff;
    return out;
}

const url = (globalAyah: number) => 'https://cdn.islamic.network/quran/audio/128/' + RECITER + '/' + globalAyah + '.mp3';

let env: ReturnType<typeof createPartialBackend>;

beforeEach(() => {
    env = createPartialBackend();
    _setBackendForTesting(env.backend);
});

afterEach(() => {
    _setBackendForTesting(null);
    vi.restoreAllMocks();
});

describe('downloadSurah - basics', () => {
    it('downloads each ayah once and reports progress per ayah', async () => {
        const calls: FetchCall[] = [];
        stubFetch({ [url(1)]: bytes(1, 25), [url(2)]: bytes(2, 25), [url(3)]: bytes(3, 25) }, ['ok', 'ok', 'ok'], calls);
        const onProgress = vi.fn();
        const res = await downloadSurah(RECITER, [{ globalNumber: 1 }, { globalNumber: 2 }, { globalNumber: 3 }], onProgress);
        expect(res).toMatchObject({ downloaded: 3, skipped: 0, failed: 0, aborted: false });
        expect(calls.map(c => c.url)).toEqual([url(1), url(2), url(3)]);
        expect(env.store.size).toBe(3);
        const dones = onProgress.mock.calls.map(c => c[0].done);
        expect(dones[dones.length - 1]).toBe(3);
    });

    it('never re-downloads finished ayahs (skip-complete)', async () => {
        const calls: FetchCall[] = [];
        await env.backend.store(RECITER, 7, bytes(7, 30).buffer as ArrayBuffer);
        stubFetch({ [url(8)]: bytes(8, 30) }, ['ok'], calls);
        const res = await downloadSurah(RECITER, [{ globalNumber: 7 }, { globalNumber: 8 }]);
        expect(res).toMatchObject({ downloaded: 1, skipped: 1, failed: 0 });
        expect(calls.map(c => c.url)).toEqual([url(8)]);
    });

    it('pauses between ayahs when shouldContinue returns false', async () => {
        const calls: FetchCall[] = [];
        stubFetch({ [url(1)]: bytes(1, 25) }, ['ok'], calls);
        // The gate never opens in this test - the download must abort
        // before the first fetch.
        const allow = false;
        const res = await downloadSurah(
            RECITER,
            [{ globalNumber: 1 }, { globalNumber: 2 }, { globalNumber: 3 }],
            undefined,
            () => allow,
        );
        expect(res.aborted).toBe(true);
        expect(res.downloaded).toBe(0);
        expect(calls).toHaveLength(0);
    });
});

describe('downloadSurah - resumable partials (M1-T3)', () => {
    it('keeps .part bytes when the network drops mid-file, then resumes with Range', async () => {
        const calls: FetchCall[] = [];
        const file = bytes(42, 45); // 45 bytes -> 2 chunks of 10 survive, then drop
        stubFetch({ [url(9)]: file }, ['drop', 'ok'], calls);

        // First attempt: drops mid-stream after 2 chunks.
        const failed = await downloadSurah(RECITER, [{ globalNumber: 9 }]);
        expect(failed.failed).toBe(1);
        expect(failed.downloaded).toBe(0);
        expect(await env.backend.getPartialBytes!(RECITER, 9)).toBe(20);
        expect(env.store.has(env.key(RECITER, 9))).toBe(false);

        // Retry: Range request resumes at the exact byte offset and commits.
        const res = await downloadSurah(RECITER, [{ globalNumber: 9 }]);
        expect(res).toMatchObject({ downloaded: 1, failed: 0 });
        const resumeCall = calls[1];
        expect(resumeCall.range).toBe('bytes=20-');
        expect(env.store.has(env.key(RECITER, 9))).toBe(true);
        expect(env.partials.size).toBe(0);

        // The committed file holds the WHOLE payload (20 resumed + 25 fetched).
        const stored = new Uint8Array(env.store.get(env.key(RECITER, 9)) as ArrayBuffer);
        expect(Array.from(stored)).toEqual(Array.from(file));
    });

    it('restarts from scratch when the server ignores Range (HTTP 200)', async () => {
        const calls: FetchCall[] = [];
        // Seed a partial, then pretend the server has no range support by
        // replying 200 - the stub only honours ranges when the script says ok
        // with a full body, which is exactly the HTTP 200 path.
        await env.backend.appendPartial!(RECITER, 9, bytes(1, 20).buffer as ArrayBuffer);
        const file = bytes(42, 45);
        // supportsRange: false -> the server answers 200 with a full body.
        stubFetch({ [url(9)]: file }, ['ok'], calls, { supportsRange: false });

        const res = await downloadSurah(RECITER, [{ globalNumber: 9 }]);
        expect(res.downloaded).toBe(1);
        expect(calls[0].range).toBe('bytes=20-');
        expect(env.discarded).toContain(env.key(RECITER, 9));
        const stored = new Uint8Array(env.store.get(env.key(RECITER, 9)) as ArrayBuffer);
        expect(Array.from(stored)).toEqual(Array.from(file));
    });

    it('a failed ayah does not abort the rest of the batch', async () => {
        const calls: FetchCall[] = [];
        // url2 exists but its stream drops mid-file; url3 still completes.
        stubFetch({ [url(1)]: bytes(1, 25), [url(2)]: bytes(2, 25), [url(3)]: bytes(3, 25) }, ['ok', 'drop', 'ok'], calls);
        const res = await downloadSurah(RECITER, [{ globalNumber: 1 }, { globalNumber: 2 }, { globalNumber: 3 }]);
        expect(res).toMatchObject({ downloaded: 2, failed: 1 });
        expect(calls.map(c => c.url)).toEqual([url(1), url(2), url(3)]);
        // The dropped ayah keeps its partial bytes for the next attempt.
        expect(await env.backend.getPartialBytes!(RECITER, 2)).toBe(20);
    });
});

describe('two-lane sourcing (M1-T6)', () => {
    it('a file being fetched for playback is not fetched again by the download', async () => {
        const calls: FetchCall[] = [];
        stubFetch({ [url(5)]: bytes(5, 25) }, ['ok'], calls);
        const playback = getAudioSourceUrl(RECITER, 5);
        const res = await downloadSurah(RECITER, [{ globalNumber: 5 }]);
        await playback;
        expect(res.skipped).toBe(1);
        expect(res.downloaded).toBe(0);
        expect(calls.filter(c => c.url === url(5))).toHaveLength(1);
    });
});

describe('removeReciterAudio (M1-T7)', () => {
    it('deletes only the target reciter files', async () => {
        await env.backend.store('ar.husary', 1, bytes(1, 10).buffer as ArrayBuffer);
        await env.backend.store(RECITER, 1, bytes(2, 10).buffer as ArrayBuffer);
        await removeReciterAudio(RECITER);
        expect(env.store.has(env.key(RECITER, 1))).toBe(false);
        expect(env.store.has(env.key('ar.husary', 1))).toBe(true);
    });
});
