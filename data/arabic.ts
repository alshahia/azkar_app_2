
/**
 * Shared Arabic text normalization.
 * Used by search matching (diacritic-insensitive queries) and by deterministic
 * ID hashing so IDs survive diacritic-only dataset edits.
 */
const DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;

export const normalizeArabic = (input: string): string =>
    input
        .replace(DIACRITICS, '')
        .replace(/[\u0622\u0623\u0625\u0627]/g, '\u0627') // alef variants -> bare alef
        .replace(/\u0649/g, '\u064A')                       // alef maqsura -> ya
        .replace(/\u0626/g, '\u064A')                       // ya with hamza -> ya
        .replace(/\u0624/g, '\u0648')                       // waw with hamza -> waw
        .replace(/\u0629/g, '\u0647')                       // taa marbuta -> ha
        .replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48)) // Arabic-Indic digits
        .toLowerCase()
        .trim();
