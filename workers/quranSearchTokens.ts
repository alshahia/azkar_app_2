// =====================================================================
//  Quran search tokenization (M2-T4).
// =====================================================================
//  Shared by:
//    - the generator (scripts/generate-quran-data.mjs) at build time
//    - the runtime worker (workers/search.worker.ts)
//    - tests (tests/unit/quran-search-tokenize.test.ts)
//
//  Lives outside data/static/ so Vite glob scanners for the bundled
//  Quran dataset never pick it up. The module is plain JS / TS so
//  Node can require() it directly from the generator.

const STRIP_MARKS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
const ALEF_VARIANTS = /[\u0671\u0623\u0625\u0622]/g;
const SPLIT_RE = /[\s\u060C\u061B\u061F.,;:!?()\[\]{}"'`]+/;
// CLITICS are stripped from the start of a normalized word to widen matching.
// We deliberately do NOT include the bare article 'ال' - stripping it would
// collapse 'الرحمن' and 'الرحيم' (closed forms users actively query) into
// 'رحمن'/'رحيم', and the Quran almost always carries the article, so the
// narrower stem doesn't add recall. The other clitics are unambiguous because
// each contains a preposition+article (e.g. 'بال' = bi+al) or conjunction.
const CLITICS = ['وال', 'بال', 'فال', 'كال', 'لل'];
const STOP_WORDS = new Set(['و', 'ف', 'ب', 'ل', 'ك', 'ثم', 'او', 'أم']);

function stripMarks(s: string): string { return s.replace(STRIP_MARKS, ''); }
function normalizeWord(s: string): string {
    return stripMarks(s).replace(ALEF_VARIANTS, '\u0627').replace(/\u0649/g, '\u064A');
}

/**
 * Closed/lemma forms that the Quran uses as a single token. Treating them as
 * opaque prevents the multi-char clitic strip from collapsing their leading
 * letters (e.g. 'لله' must NOT become 'ه' via the 'لل' clitic).
 * Extend this set only with forms that occur across the mushaf and that
 * users would search for whole.
 */
const CLOSED_FORMS = new Set([
    'الله', 'لله', 'الرحمن', 'الرحيم', 'الذين', 'اللاتي', 'التي', 'اللائي', 'الذى',
]);

/** Strip the longest matching clitic prefix from a normalized word. */
function stripClitic(word: string): string {
    if (CLOSED_FORMS.has(word)) return word;
    for (const c of CLITICS) {
        if (word.length > c.length && word.startsWith(c)) {
            return word.slice(c.length);
        }
    }
    return word;
}

/** Tokenize raw Uthmani ayah text into normalized stems for the index. */
function tokenizeAyah(rawText: string): string[] {
    const out = [];
    const normalized = normalizeWord(rawText);
    for (const word of normalized.split(SPLIT_RE)) {
        if (!word) continue;
        if (word.length <= 1 && STOP_WORDS.has(word)) continue;
        const stem = stripClitic(word);
        if (!stem) continue;
        out.push(stem);
    }
    return out;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tokenizeAyah, stripClitic, normalizeWord, stripMarks, CLITICS, STOP_WORDS, CLOSED_FORMS };
}

export { tokenizeAyah, stripClitic, normalizeWord, stripMarks, CLITICS, STOP_WORDS, CLOSED_FORMS };
