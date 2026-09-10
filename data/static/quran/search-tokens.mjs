// =====================================================================
//  Quran search index tokenization (M2-T4).
// =====================================================================
//  A small, pure module shared by:
//    - the generator (scripts/generate-quran-data.mjs) at build time
//    - the runtime worker (workers/search.worker.ts)
//    - tests (tests/unit/quran-search-tokenize.test.ts)
//
//  Keeping the function as plain JS in a single file means both Node and
//  Vite can load it without a build step. The shape mirrors what the
//  generator already inlined - extracted so we can unit-test it.

const STRIP_MARKS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
const ALEF_VARIANTS = /[\u0671\u0623\u0625\u0622]/g;
const SPLIT_RE = /[\s\u060C\u061B\u061F.,;:!?()\[\]{}"'`]+/;
const CLITICS = ['وال', 'بال', 'فال', 'كال', 'لل', 'ال'];
const STOP_WORDS = new Set(['و', 'ف', 'ب', 'ل', 'ك', 'ثم', 'او', 'أم']);

function stripMarks(s) { return s.replace(STRIP_MARKS, ''); }
function normalizeWord(s) {
    return stripMarks(s).replace(ALEF_VARIANTS, '\u0627').replace(/\u0649/g, '\u064A');
}

/** Strip the longest matching clitic prefix from a normalized word. */
function stripClitic(word) {
    for (const c of CLITICS) {
        if (word.length > c.length && word.startsWith(c)) {
            return word.slice(c.length);
        }
    }
    return word;
}

/** Tokenize raw Uthmani ayah text into normalized stems for the index. */
function tokenizeAyah(rawText) {
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

/** Same tokenize + clitic strip applied to a user query string. */
function tokenizeQuery(query) {
    return tokenizeAyah(query);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tokenizeAyah, tokenizeQuery, stripClitic, normalizeWord, stripMarks, CLITICS, STOP_WORDS };
}

export { tokenizeAyah, tokenizeQuery, stripClitic, normalizeWord, stripMarks, CLITICS, STOP_WORDS };
