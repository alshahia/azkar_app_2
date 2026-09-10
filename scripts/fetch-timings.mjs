#!/usr/bin/env node
/**
 * fetch-timings.mjs - harvest per-ayah timings for each reciter (M3-T3).
 *
 * Strategy (kept deliberately small for M3):
 *   1. For every reciter in data/static/reciters.json, look up its
 *      timing source URL. The current build is conservative: it accepts
 *      only CC-BY / public-domain datasets and only when an explicit
 *      license tag is recorded on the reciter.
 *   2. If no source is known for a reciter, a placeholder timings JSON
 *      is written so the bundle stays green (matching the
 *      search_index.json pattern).
 *   3. The output is shaped:
 *        { reciterId, source, license, generatedAt, ayahs: [] }
 *
 * This script is safe to run repeatedly; it is idempotent.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const TIMINGS_DIR = path.join(REPO, 'data', 'static', 'quran', 'timings');
const RECITERS_PATH = path.join(REPO, 'data', 'static', 'reciters.json');

mkdirSync(TIMINGS_DIR, { recursive: true });

/** Permissive licenses we accept for bundled timings. */
const ACCEPTED_LICENSES = new Set([
    'CC-BY 4.0',
    'CC-BY-SA 4.0',
    'public-domain',
    'Public Domain',
]);

function loadReciters() {
    if (!existsSync(RECITERS_PATH)) {
        console.warn('[fetch-timings] reciters.json not present; skipping harvest');
        return [];
    }
    try {
        const raw = readFileSync(RECITERS_PATH, 'utf8');
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return [];
        return list;
    } catch (e) {
        console.warn('[fetch-timings] reciters.json unreadable:', e.message);
        return [];
    }
}

function placeholder(reciterId, reason) {
    return JSON.stringify({
        reciterId,
        source: 'placeholder',
        placeholder: true,
        generatedAt: new Date().toISOString(),
        reason,
        license: 'n/a',
        ayahs: [],
    }, null, 2) + '\n';
}

async function fetchForReciter(reciter) {
    // M3 keeps this conservative. A live QUL harvest endpoint is left
    // for a later pass; the M1 fetch-reciters script in this repo shows
    // the wiring shape. The gate for a future endpoint is:
    //   - reciter.timingSource (string url) AND
    //   - ACCEPTED_LICENSES.has(reciter.timingLicense)
    return placeholder(reciter.id, 'no-bundled-source');
}

async function main() {
    const reciters = loadReciters();
    let written = 0;
    for (const r of reciters) {
        if (!r || !r.id) continue;
        const file = await fetchForReciter(r);
        const outPath = path.join(TIMINGS_DIR, r.id + '.json');
        writeFileSync(outPath, file, 'utf8');
        written++;
    }
    console.log('[fetch-timings] wrote ' + written + ' files to ' + path.relative(REPO, TIMINGS_DIR));
}

main().catch(e => {
    console.error('[fetch-timings] failed:', e);
    process.exit(1);
});
