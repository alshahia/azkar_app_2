/**
 * Generates the offline Quran dataset consumed by services/QuranService.ts.
 *
 * Sources (verified reachable; text traceable to the Tanzil Uthmani project):
 *   - Text:    https://api.alquran.cloud/v1/quran/quran-uthmani
 *   - Tafsir:  https://api.alquran.cloud/v1/quran/ar.muyassar  (At-Tafsir Al-Muyassar)
 *
 * Usage:
 *   1. Download the two sources into .tmp_quran_raw/ (file names below).
 *   2. node scripts/generate-quran-data.mjs
 *
 * Output (all UTF-8):
 *   data/static/quran/index.json      - 114 surah metadata + juz start table (bundled eagerly)
 *   data/static/quran/text/{n}.json   - { s: surahNumber, a: AyatRow[] } (lazy-loaded)
 *       AyatRow = [numberInSurah, uthmaniText, madaniPage, juz, sajda(0|1|2), globalAyahNumber(1..6236)]
 *   data/static/quran/tafsir/{n}.json - string[] aligned to ayah number (index 0 = ayah 1)
 *
 * Note: alquran.cloud prepends the Basmala to ayah 1 of every surah except
 * Al-Fatiha (where it IS ayah 1) and At-Tawbah (where it never appears).
 * This script strips the prepended copy so the reader can render it decoratively.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = join(ROOT, '.tmp_quran_raw');
const OUT_DIR = join(ROOT, 'data', 'static', 'quran');

const stripMarks = (s) => s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '');
const normalizeWord = (s) =>
    stripMarks(s).replace(/[\u0671\u0623\u0625\u0622]/g, '\u0627').replace(/\u0649/g, '\u064A');
const BASMALA_NORM = ['بسم', 'الله', 'الرحمن', 'الرحيم'].join(' ');

/** Returns the ayah text with a leading Basmala removed, or null when absent. */
function splitBasmala(text) {
    const tokens = text.trim().split(/\s+/);
    let acc = [];
    for (let i = 0; i < Math.min(tokens.length, 6); i++) {
        acc.push(tokens[i]);
        if (acc.map(normalizeWord).join(' ') === BASMALA_NORM) {
            return tokens.slice(i + 1).join(' ');
        }
    }
    return null;
}

const quran = JSON.parse(readFileSync(join(RAW_DIR, 'quran-uthmani.json'), 'utf8')).data;
const tafsirRaw = JSON.parse(readFileSync(join(RAW_DIR, 'tafsir-muyassar.json'), 'utf8')).data;

if (quran.surahs.length !== 114) throw new Error('Expected 114 surahs, got ' + quran.surahs.length);

mkdirSync(join(OUT_DIR, 'text'), { recursive: true });
mkdirSync(join(OUT_DIR, 'tafsir'), { recursive: true });

/** alquran.cloud sajda: false | { id, recommended, obligatory } */
const sajdaFlag = (sajda) => (sajda ? (sajda.obligatory ? 2 : 1) : 0);
const index = [];
const juzStarts = [];
let seenJuz = new Set();
let totalAyat = 0;
let strippedCount = 0;
const problems = [];

for (const surah of quran.surahs) {
    const n = surah.number;
    const tafsirSurah = tafsirRaw.surahs[n - 1];
    if (!tafsirSurah || tafsirSurah.number !== n) {
        problems.push('Surah ' + n + ': tafsir surah missing or misordered');
    }
    // The bulk /quran/ endpoint has no numberOfAyahs field; derive from the array.
    if (!tafsirSurah || tafsirSurah.ayahs.length !== surah.ayahs.length) {
        problems.push('Surah ' + n + ' tafsir coverage mismatch');
    }

    const rows = [];
    const tafsirTexts = [];

    surah.ayahs.forEach((ayah, i) => {
        totalAyat++;
        let text = ayah.text;
        const isFirst = ayah.numberInSurah === 1;

        if (isFirst && n !== 1 && n !== 9) {
            const remainder = splitBasmala(text);
            if (remainder) {
                text = remainder;
                strippedCount++;
            } else {
                problems.push('Surah ' + n + ': expected prepended Basmala, none matched');
            }
        }
        if (isFirst && n === 9 && splitBasmala(text)) {
            problems.push('Surah 9 unexpectedly starts with Basmala');
        }

        if (ayah.juz && !seenJuz.has(ayah.juz)) {
            seenJuz.add(ayah.juz);
            juzStarts.push({ juz: ayah.juz, surah: n, ayah: ayah.numberInSurah });
        }

        rows.push([
            ayah.numberInSurah,
            text,
            ayah.page,
            ayah.juz,
            sajdaFlag(ayah.sajda),
            ayah.number,
        ]);
        tafsirTexts.push(tafsirSurah ? String(tafsirSurah.ayahs[i]?.text ?? '').trim() : '');
    });

    writeFileSync(
        join(OUT_DIR, 'text', n + '.json'),
        JSON.stringify({ s: n, a: rows })
    );
    writeFileSync(
        join(OUT_DIR, 'tafsir', n + '.json'),
        JSON.stringify(tafsirTexts)
    );

    index.push({
        id: n,
        name: surah.name,
        transliteration: surah.englishName,
        meaning: surah.englishNameTranslation,
        revelation: surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
        ayahCount: rows.length,
        firstPage: surah.ayahs[0]?.page ?? 0,
    });
}

writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(index));
writeFileSync(join(OUT_DIR, 'juz.json'), JSON.stringify(juzStarts));

console.log('surahs=' + index.length);
console.log('totalAyat=' + totalAyat + (totalAyat === 6236 ? ' (OK)' : ' (MISMATCH!)'));
console.log('basmalaStripped=' + strippedCount + (strippedCount === 112 ? ' (OK)' : ' (EXPECTED 112!)'));
console.log('juz=' + juzStarts.length);
if (problems.length) {
    console.log('PROBLEMS:');
    for (const p of problems) console.log('  - ' + p);
    process.exit(1);
}
console.log('ALL CHECKS PASSED');
