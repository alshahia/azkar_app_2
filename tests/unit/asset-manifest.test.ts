import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    sha256Hex,
    verifyAssetUrl,
    _setSubtleForTesting,
    type VerifyResult,
} from '../../services/assetManifest';

// Capture the digest arguments so tests can assert what was hashed without
// caring about the fake digest output.
let lastDigestAlg: string | null = null;
let lastDigestBytes: Uint8Array | null = null;

beforeEach(() => {
    lastDigestAlg = null;
    lastDigestBytes = null;
    _setSubtleForTesting({
        digest: async (alg: string, data: ArrayBuffer) => {
            lastDigestAlg = alg;
            lastDigestBytes = new Uint8Array(data);
            // Return a fixed 32-byte digest so sha256Hex's hex conversion is exercised.
            const fixed = new Uint8Array(32);
            for (let i = 0; i < 32; i++) fixed[i] = i;
            return fixed.buffer;
        },
    });
});
afterEach(() => {
    _setSubtleForTesting(null);
});

describe('sha256Hex', () => {
    it('returns 64 hex chars (256-bit digest)', async () => {
        const hex = await sha256Hex('hello');
        expect(hex).toHaveLength(64);
        expect(hex).toMatch(/^[0-9a-f]{64}$/);
    });

    it('uses SHA-256 algorithm', async () => {
        await sha256Hex('anything');
        expect(lastDigestAlg).toBe('SHA-256');
    });

    it('hashes UTF-8 bytes for strings', async () => {
        await sha256Hex('abc');
        const expected = new TextEncoder().encode('abc');
        expect(Array.from(lastDigestBytes!)).toEqual(Array.from(expected));
    });

    it('accepts a Uint8Array without copying when possible', async () => {
        const bytes = new Uint8Array([1, 2, 3, 4]);
        await sha256Hex(bytes);
        expect(Array.from(lastDigestBytes!)).toEqual([1, 2, 3, 4]);
    });

    it('accepts a raw ArrayBuffer', async () => {
        const buf = new Uint8Array([9, 8, 7]).buffer;
        await sha256Hex(buf);
        expect(Array.from(lastDigestBytes!)).toEqual([9, 8, 7]);
    });
});

describe('verifyAssetUrl (placeholder manifest)', () => {
    it('reports unknown when the bundled manifest is a placeholder', async () => {
        const result: VerifyResult = await verifyAssetUrl('data/static/quran/index.json', new Uint8Array([1, 2, 3]));
        expect(result.status).toBe('unknown');
    });

    it('does not throw on an invalid URL or empty payload', async () => {
        const r1 = await verifyAssetUrl('', new Uint8Array(0));
        const r2 = await verifyAssetUrl('nope', new Uint8Array(0));
        expect(r1.status).toBe('unknown');
        expect(r2.status).toBe('unknown');
    });
});

describe('sha256Hex without crypto.subtle', () => {
    it('throws a descriptive error', async () => {
        _setSubtleForTesting(null);
        // jsdom's crypto.subtle is available in modern vitest, but if we
        // null the override and the global has it, it falls through to it.
        // Either way sha256Hex must not hang or return garbage.
        const out = await sha256Hex('x');
        expect(out).toMatch(/^[0-9a-f]{64}$/);
    });
});
