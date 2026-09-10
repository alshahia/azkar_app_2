
import { GoogleGenAI } from "@google/genai";

/** Optional bundled context injected into the zikr prompt for grounding. */
export interface ZikrGrounding {
    /** The benefit (فضل) text shipped with this zikr, if any. */
    benefit?: string | null;
    /** The reference (e.g. "رواه البخاري") shipped with this zikr, if any. */
    reference?: string | null;
}

/** Position metadata for the ayah-explanation prompt. */
export interface AyahMeta {
    surahName?: string;
    surah?: number;
    ayah?: number;
}

/**
 * Prompt builders are exported pure functions so unit tests can prove the
 * prompts are grounded: they may only contain the bundled text we pass in,
 * never API-fetched content. Quran Foundation terms forbid relaying their
 * API content into an LLM without consent (see docs/license-guardrails.md).
 */
export const buildZikrPrompt = (text: string, grounding?: ZikrGrounding): string => {
    const contextLines: string[] = [];
    if (grounding?.benefit) contextLines.push(`الفضل/الأثر المنقول مع الذكر: "${grounding.benefit}"`);
    if (grounding?.reference) contextLines.push(`المرجع المنقول مع الذكر: "${grounding.reference}"`);

    return [
        'أنت مساعد شرح للأذكار والأدعية.',
        'اشرح الذكر التالي شرحاً مبسطاً عميقاً اعتماداً على النص المعتمد أدناه فقط.',
        '',
        'النص المعتمد:',
        `"${text}"`,
        ...(contextLines.length ? ['', ...contextLines] : []),
        '',
        'الضوابط الإلزامية:',
        '1. اشرح المعنى العام والمفردات الصعبة، ولا تنقل شيئاً من مصادر خارج النص أعلاه.',
        '2. لا تُظهر آيات أو أحاديث أو فتاوى من عندك؛ إن لم يكفِ النص المعطى فقل ذلك باختصار.',
        grounding?.reference
            ? '3. أشر إلى المرجع المذكور أعلاه عند الحديث عن أصل الذكر.'
            : '3. لا تنسب الذكر إلى مصدر بعينه لأن المرجع غير متوفر لك.',
        '4. اجعل الإجابة مختصرة (فقرة أو فقرتان) وباللغة العربية الفصحى السهلة.',
        '5. لا تذكر أنك نموذج ذكاء اصطناعي؛ ادخل في الشرح مباشرة.',
    ].join('\n');
};

/**
 * Ayah-explanation prompt grounded on the BUNDLED tafsir only
 * (التفسير الميسّر). Stub for a future feature - no UI wires into it yet.
 */
export const buildAyahExplanationPrompt = (
    ayahText: string,
    tafsirText: string,
    meta?: AyahMeta
): string => {
    const where = meta?.surah
        ? `سورة ${meta.surahName ?? ''} (${meta.surah})${meta.ayah ? ` - الآية ${meta.ayah}` : ''}`.replace(/\s+/g, ' ').trim()
        : '';

    return [
        'أنت مساعد شرح للقرآن الكريم.',
        'اشرح الآية التالية اعتماداً على نص التفسير المرفق (التفسير الميسّر) فقط.',
        ...(where ? ['', `الموضع: ${where}`] : []),
        '',
        'نص الآية:',
        `"${ayahText}"`,
        '',
        'نص التفسير المعتمد:',
        `"${tafsirText}"`,
        '',
        'الضوابط الإلزامية:',
        '1. الاطلاع الوحيد المسموح به هو نصا الآية والتفسير أعلاه.',
        '2. لا تُظهر تفسيراً أو رواية أو قصة من خارج النص المرفق.',
        '3. اذكر الموضع وفق المعلومات المرفقة فقط دون استنتاج من عندك.',
        '4. اجعل الإجابة مختصرة وباللغة العربية الفصحى السهلة.',
        '5. لا تذكر أنك نموذج ذكاء اصطناعي؛ ادخل في الشرح مباشرة.',
    ].join('\n');
};

export const GeminiService = {
    /**
     * Single network entry point: sends one prompt and returns its text.
     */
    async send(prompt: string, apiKey: string): Promise<string> {
        const ai = new GoogleGenAI({ apiKey: apiKey });

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            return response.text || "عذراً، لم أتمكن من توليد الشرح في الوقت الحالي.";
        } catch (error) {
            console.error("Gemini API Error:", error);
            throw error;
        }
    },

    /**
     * Generates a grounded explanation for a zikr. Only the bundled zikr
     * text and its bundled benefit/reference are sent - no API-fetched
     * content ever enters the prompt.
     */
    async explainZikr(text: string, apiKey: string, grounding?: ZikrGrounding): Promise<string> {
        if (!apiKey) {
            throw new Error("API_KEY_MISSING");
        }
        return this.send(buildZikrPrompt(text, grounding), apiKey);
    },

    /**
     * Generates an ayah explanation grounded on the bundled tafsir text.
     * Stub: exported for the upcoming tafsir feature, no UI wires into it
     * yet; call only with bundled tafsir content.
     */
    async explainAyah(
        ayahText: string,
        tafsirText: string,
        apiKey: string,
        meta?: AyahMeta
    ): Promise<string> {
        if (!apiKey) {
            throw new Error("API_KEY_MISSING");
        }
        return this.send(buildAyahExplanationPrompt(ayahText, tafsirText, meta), apiKey);
    }
};
