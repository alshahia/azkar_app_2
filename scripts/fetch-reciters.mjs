#!/usr/bin/env node
/**
 * Regenerates the reciter catalog from the live catalog APIs.
 *
 *   node scripts/fetch-reciters.mjs [--check] [--include-full-surah]
 *
 * Lanes:
 *  - Per-ayah lane (bundled): identifiers come from the alquran.cloud audio
 *    editions list - the same "ar.<name>" ids the cdn.islamic.network
 *    per-ayah URL convention consumes. Every candidate is HEAD-probed
 *    against the CDN (https://cdn.islamic.network/quran/audio/128/<id>/1.mp3)
 *    and only 200-OK ids are merged. Existing bundled entries are always
 *    preserved verbatim; the script only ADDS verified ids.
 *  - Full-surah lane (optional): --include-full-surah snapshots the
 *    mp3quran.net API v3 reciter catalog (241 reciters, per-surah files at
 *    "{moshaf.server}{SSS}.mp3") into data/static/reciters-fullsurah.json.
 *    That file is NOT imported by the app - it feeds the future gapless
 *    full-surah mode (M5-T3) and the QF chapter_recitations file_size
 *    planning. Never hardcode mp3quran server hosts: they vary per reciter,
 *    so the snapshot stores absolute URLs as returned.
 *
 * --check prints the diff without writing. Network failures degrade to
 * "no changes" instead of corrupting the catalog.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = join(ROOT, 'data', 'static', 'reciters.json');
const FULL_SURAH_TARGET = join(ROOT, 'data', 'static', 'reciters-fullsurah.json');
const EDITIONS_URL = 'https://api.alquran.cloud/v1/edition?format=audio&language=ar';
const MP3QURAN_URL = 'https://mp3quran.net/api/v3/reciters?language=ar';
const CDN_PROBE_BASE = 'https://cdn.islamic.network/quran/audio/128/';
const TIMEOUT_MS = 10_000;
const CONCURRENCY = 5;

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const includeFullSurah = args.has('--include-full-surah');

function fetchWithTimeout(url, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function mapLimit(items, limit, fn) {
    const out = new Array(items.length);
    for (let i = 0; i < items.length; i += limit) {
        const batch = items.slice(i, i + limit);
        const results = await Promise.all(batch.map((item, j) => fn(item, i + j)));
        for (let j = 0; j < batch.length; j++) out[i + j] = results[j];
    }
    return out;
}

function isArabic(text) {
    return typeof text === 'string' && /[\u0600-\u06FF]/.test(text);
}

async function fetchPerAyahReciters(knownIds) {
    const res = await fetchWithTimeout(EDITIONS_URL);
    if (!res.ok) throw new Error('alquran.cloud editions HTTP ' + res.status);
    const payload = await res.json();
    const rows = Array.isArray(payload) ? payload : (payload.data ?? []);
    const candidates = rows
        .filter(row => typeof row.identifier === 'string' && row.identifier.startsWith('ar.'))
        .filter(row => (row.format ?? 'audio') === 'audio')
        .map(row => ({
            id: row.identifier,
            name: isArabic(row.name) ? row.name : (row.englishName && isArabic(row.englishName) ? row.englishName : (row.name || row.identifier)),
            style: 'مرتل',
        }))
        .filter(row => !knownIds.has(row.id))
        .slice(0, 40);

    const probes = await mapLimit(candidates, CONCURRENCY, async reciter => {
        try {
            const head = await fetchWithTimeout(CDN_PROBE_BASE + encodeURIComponent(reciter.id) + '/1.mp3', { method: 'HEAD' });
            return head.ok ? reciter : null;
        } catch {
            return null;
        }
    });
    return probes.filter(Boolean);
}

async function fetchFullSurahReciters() {
    const res = await fetchWithTimeout(MP3QURAN_URL);
    if (!res.ok) throw new Error('mp3quran v3 HTTP ' + res.status);
    const payload = await res.json();
    const reciters = Array.isArray(payload.reciters) ? payload.reciters : [];
    return reciters.map(r => ({
        id: 'mp3quran:' + r.id,
        name: r.name || String(r.id),
        moshafs: (r.moshaf ?? []).map(m => ({
            name: m.name || '',
            surahList: String(m.surah_list ?? ''),
            surahTotal: m.surah_total ?? null,
            // Absolute server URL as returned - hosts vary per reciter.
            server: m.server || '',
        })),
    }));
}

const existing = existsSync(TARGET) ? JSON.parse(readFileSync(TARGET, 'utf8')) : { version: 1, reciters: [] };
const bundledIds = new Set(existing.reciters.map(r => r.id));

let added = [];
try {
    added = await fetchPerAyahReciters(bundledIds);
} catch (e) {
    console.warn('[fetch-reciters] per-ayah refresh failed; keeping catalog as-is:', e.message);
}

const merged = added.length > 0 ? [...existing.reciters, ...added] : existing.reciters;
const catalog = {
    version: 1,
    updatedAt: new Date().toISOString().slice(0, 10),
    source: 'Verified against cdn.islamic.network (HEAD 200). Regenerate with: node scripts/fetch-reciters.mjs',
    reciters: merged,
};

console.log('[fetch-reciters] bundled: ' + existing.reciters.length + ', verified additions: ' + added.length);
for (const r of added) console.log('  + ' + r.id + ' (' + r.name + ')');

if (!checkOnly) {
    writeFileSync(TARGET, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
    console.log('[fetch-reciters] wrote ' + TARGET);
} else {
    console.log('[fetch-reciters] --check: no files written');
}

if (includeFullSurah) {
    try {
        const fullSurah = await fetchFullSurahReciters();
        const snapshot = {
            version: 1,
            updatedAt: new Date().toISOString().slice(0, 10),
            source: 'mp3quran.net API v3 snapshot - NOT imported by the app; planning data for the gapless full-surah mode (M5-T3).',
            reciters: fullSurah,
        };
        if (!checkOnly) {
            writeFileSync(FULL_SURAH_TARGET, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
            console.log('[fetch-reciters] wrote ' + FULL_SURAH_TARGET + ' (' + fullSurah.length + ' reciters)');
        } else {
            console.log('[fetch-reciters] --check: full-surah snapshot (' + fullSurah.length + ' reciters) not written');
        }
    } catch (e) {
        console.warn('[fetch-reciters] full-surah snapshot failed:', e.message);
        process.exitCode = 1;
    }
}
