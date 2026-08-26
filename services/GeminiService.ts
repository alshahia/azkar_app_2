
import { GoogleGenAI } from "@google/genai";

export const GeminiService = {
    /**
     * Generates a spiritual explanation for a given Zikr text.
     */
    async explainZikr(text: string, apiKey: string): Promise<string> {
        if (!apiKey) {
            throw new Error("API_KEY_MISSING");
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        // Detailed prompt to ensure high-quality, spiritual, and concise Arabic output
        const prompt = `
        بصفتك عالماً روحانياً ومربياً، قم بشرح هذا الذكر أو الدعاء بشكل مبسط، عميق، ومؤثر.
        
        النص: "${text}"
        
        المطلوب:
        1. شرح المعنى العام والمفردات الصعبة إن وجدت.
        2. ذكر الفضل أو الأثر الروحاني لهذا الذكر.
        3. اجعل الإجابة مختصرة (فقرة أو فقرتين) وباللغة العربية الفصحى السهلة.
        4. لا تذكر "أنا نموذج ذكاء اصطناعي"، ادخل في الشرح مباشرة.
        `;

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
    }
};
