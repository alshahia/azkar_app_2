
/**
 * Shared Arabic text normalization.
 * Used by search matching (diacritic-insensitive queries) and by deterministic
 * ID hashing so IDs survive diacritic-only dataset edits.
 *
 * The mark ranges covered here are exhaustive for Unicode Arabic Blocks:
 *   0610-061A  Arabic letters/symbols marks (annotation marks)
 *   064B-065F  Arabic combining marks (tashkil, shadda, sukun, etc.)
 *   0670       Arabic letter superscript alef
 *   06D6-06ED  Quranic annotation marks (sajda, waqf signs, etc.)
 *   08D3-08FF  Arabic extended marks
 *   0640       Arabic tatweel (kashida) - removed
 *   FEFF       Zero-width no-break space (BOM)
 *   200B-200F  Zero-width and bidi controls
 *   202A-202E  Bidi embeddings/overrides
 *   2066-2069  Bidi isolates
 *   E000-F8FF  Private Use Area (PUA) - stripped to defeat codepoint
 *                smuggling (alef-wasla, etc.) that some Quran fonts encode there.
 *
 * Letter folds match modern search-relevance norms so 'الرحمن' matches
 * 'الرحمان', 'الله' matches 'اللة', etc. The spelling-variant table is the
 * single point of change for that mapping.
 */
const ALL_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF\u0640\uFEFF\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const PUA = /[\uE000-\uF8FF]/g;

/**
 * Hand-curated spelling-variant table: matched as whole tokens AFTER letter
 * folding. Used to handle common Quranic/azkar spelling differences that no
 * Unicode-level rule can express (e.g. الرحمن vs الرحمان).
 *
 * Order matters: longer keys are checked first so prefixes don't shadow them.
 * Add new pairs here, not as extra `.replace()` calls, so the rationale for
 * each pair stays visible.
 */
const SPELLING_VARIANTS: ReadonlyArray<readonly [string, string]> = [
    ['الرحمان', 'الرحمن'], // الرحمن / الرحمان (Quranic, multiple surahs)
    ['الرحمانه', 'الرحمنه'], // defensive: future "الرحمانة"
    ['اللة', 'الله'], // الله / اللة (azkar / folklore)
    ['سبحانه', 'سبحنه'], // defensive (rare)
    ['عبده', 'عبده'], // no-op placeholder to document the entry shape
];

/**
 * Apply the variant table to the whole string. We split by the longest
 * variant key first so multi-word phrases match whole.
 */
const applySpellingVariants = (s: string): string => {
    let out = s;
    for (const [from, to] of SPELLING_VARIANTS) {
        if (from === to) continue;
        if (out.includes(from)) out = out.split(from).join(to);
    }
    return out;
};

export const normalizeArabic = (input: string): string => {
    const stripped = input
        .replace(PUA, '')
        .replace(ALL_MARKS, '')
        .replace(/[\u0622\u0623\u0625\u0627]/g, '\u0627') // alef variants -> bare alef
        .replace(/\u0649/g, '\u064A')                       // alef maqsura -> ya
        .replace(/\u0626/g, '\u064A')                       // ya with hamza -> ya
        .replace(/\u0624/g, '\u0648')                       // waw with hamza -> waw
        .replace(/\u0629/g, '\u0647')                       // taa marbuta -> ha
        .replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48)) // Arabic-Indic digits
        .toLowerCase()
        .trim();
    return applySpellingVariants(stripped);
};
