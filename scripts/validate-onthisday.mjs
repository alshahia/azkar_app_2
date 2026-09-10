#!/usr/bin/env node
/**
 * On-this-day dataset validator (M4-T2).
 *
 * Enforces the structural contract of `data/static/onthisday.json`:
 * - valid JSON
 * - `schema` = 'azkar-onthisday'
 * - `version` = positive integer
 * - `entries` is an array of objects with the required fields
 * - when `stubMode === true`, accepts a partial file (>= 1 entry)
 *   and only checks each entry is well-formed
 * - when `stubMode !== true`, requires at least 354 distinct MM-DD
 *   keys (Hijri year is 354 or 355 days; tolerates a 12-key overlap)
 * - every entry has `source` field (authenticity posture)
 * - no Sufi Urs / sectarian events (rejects entries whose source
 *   mentions a known Sufi order; per apis-and-packages §aladhan warning)
 *
 * Exit codes:
 *  0 - dataset is valid
 *  1 - dataset failed validation
 *  2 - file missing / unreadable
 *
 * Usage: `node scripts/validate-onthisday.mjs` (from repo root)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const FILE = resolve(ROOT, 'data/static/onthisday.json');

const REQUIRED_FIELDS = ['id', 'hijriMonth', 'hijriDay', 'type', 'title', 'source'];
const VALID_TYPES = new Set(['event', 'birth', 'death', 'occasion']);
const SUFI_KEYWORDS = [
    'urs',
    'mawlid',
    'shaykh',
    'tariqa',
    'naqshbandi',
    'qadiri',
    'chishti',
];

let problems = 0;
const fail = (msg) => {
    problems++;
    console.error('  FAIL: ' + msg);
};

let raw;
try {
    raw = readFileSync(FILE, 'utf8');
} catch (e) {
    console.error('Could not read ' + FILE);
    console.error('  REASON: ' + (e && e.message ? e.message : String(e)));
    process.exit(2);
}

let parsed;
try {
    parsed = JSON.parse(raw);
} catch (e) {
    console.error('onthisday.json is not valid JSON:');
    console.error('  REASON: ' + (e && e.message ? e.message : String(e)));
    process.exit(1);
}

console.log('Checking ' + FILE);

if (parsed.schema !== 'azkar-onthisday') {
    fail("schema must be 'azkar-onthisday' (got " + JSON.stringify(parsed.schema) + ')');
}
if (!Number.isInteger(parsed.version) || parsed.version < 1) {
    fail('version must be a positive integer (got ' + JSON.stringify(parsed.version) + ')');
}
if (!Array.isArray(parsed.entries)) {
    fail('entries must be an array');
    process.exit(1);
}

const isStub = parsed.stubMode === true;
const keySet = new Set();
const seenIds = new Set();

parsed.entries.forEach((entry, idx) => {
    const where = 'entries[' + idx + ']';
    for (const field of REQUIRED_FIELDS) {
        if (entry[field] === undefined || entry[field] === null || entry[field] === '') {
            fail(where + ' missing required field "' + field + '"');
        }
    }
    if (entry.id && seenIds.has(entry.id)) {
        fail(where + ' duplicates id "' + entry.id + '"');
    } else if (entry.id) {
        seenIds.add(entry.id);
    }
    if (entry.hijriMonth !== undefined) {
        if (!Number.isInteger(entry.hijriMonth) || entry.hijriMonth < 1 || entry.hijriMonth > 12) {
            fail(where + ' hijriMonth must be 1..12 (got ' + entry.hijriMonth + ')');
        }
    }
    if (entry.hijriDay !== undefined) {
        if (!Number.isInteger(entry.hijriDay) || entry.hijriDay < 1 || entry.hijriDay > 30) {
            fail(where + ' hijriDay must be 1..30 (got ' + entry.hijriDay + ')');
        }
    }
    if (entry.type !== undefined && !VALID_TYPES.has(entry.type)) {
        fail(where + ' type must be one of ' + Array.from(VALID_TYPES).join(', ') + ' (got ' + entry.type + ')');
    }
    const sourceLower = typeof entry.source === 'string' ? entry.source.toLowerCase() : '';
    for (const kw of SUFI_KEYWORDS) {
        if (sourceLower.includes(kw)) {
            fail(where + ' source mentions a Sufi-order keyword "' + kw + '" (rejected per apis-and-packages §aladhan warning)');
            break;
        }
    }
    const m = String(entry.hijriMonth || '').padStart(2, '0');
    const d = String(entry.hijriDay || '').padStart(2, '0');
    if (m !== '00' && d !== '00') keySet.add(m + '-' + d);
});

if (!isStub) {
    // Full mode: at least 354 distinct MM-DD keys (Hijri year is 354/355 days).
    if (keySet.size < 354) {
        fail('non-stub mode requires >= 354 distinct MM-DD keys, got ' + keySet.size);
    }
} else {
    if (parsed.entries.length < 1) {
        fail('stub mode requires at least one entry');
    }
}

if (problems === 0) {
    console.log('PASS: ' + parsed.entries.length + ' entries (' + keySet.size + ' distinct dates, ' + (isStub ? 'stub mode' : 'full mode') + ')');
    process.exit(0);
} else {
    console.error('FAIL: ' + problems + ' problem(s) detected');
    process.exit(1);
}
