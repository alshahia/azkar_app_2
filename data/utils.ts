
export interface RawZikr {
    arabic: string;
    transliteration: string | null;
    translation: string | null;
    benefit: string | null;
    reference: string | null;
    count: number;
}

export const z = (
    arabic: string,
    translation: string | null = null,
    reference: string | null = null,
    count: number | string | null = 1,
    benefit: string | null = null,
    transliteration: string | null = null
): RawZikr => {
    let parsedCount = 1;

    if (count === null || count === undefined) {
        parsedCount = 1;
    } else if (typeof count === 'number') {
        parsedCount = count;
    } else if (typeof count === 'string') {
        // Handle "01", "1"
        const cleanStr = count.trim();
        const parsed = parseInt(cleanStr, 10);
        
        if (!isNaN(parsed)) {
            parsedCount = parsed;
        } else {
             // Handle Arabic text counts found in the JSON
             if (cleanStr.includes('ثلاث') || cleanStr.includes('3')) parsedCount = 3;
             else if (cleanStr.includes('سبع') || cleanStr.includes('7')) parsedCount = 7;
             else if (cleanStr.includes('عشر') || cleanStr.includes('10')) parsedCount = 10;
             else if (cleanStr.includes('مائة') || cleanStr.includes('مئة') || cleanStr.includes('100')) parsedCount = 100;
             else if (cleanStr.includes('33')) parsedCount = 33;
             else if (cleanStr.includes('34')) parsedCount = 34;
             else parsedCount = 1; // Default fallback
        }
    }

    return {
        arabic,
        transliteration,
        translation,
        benefit,
        reference,
        count: parsedCount
    };
};
