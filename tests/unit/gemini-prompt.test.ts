import { describe, it, expect } from 'vitest';
import {
    buildZikrPrompt,
    buildAyahExplanationPrompt,
    GeminiService,
} from '../../services/GeminiService';

// Grounding contract (M0-T2): prompts may contain ONLY the bundled text we
// pass in - never API-fetched content (see docs/license-guardrails.md).

describe('buildZikrPrompt grounding', () => {
    const zikr = 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ';

    it('embeds the bundled zikr text verbatim', () => {
        expect(buildZikrPrompt(zikr)).toContain(zikr);
    });

    it('embeds bundled benefit and reference when provided', () => {
        const prompt = buildZikrPrompt(zikr, {
            benefit: 'من قالها مائة مرة غُفرت ذنوبه',
            reference: 'متفق عليه',
        });
        expect(prompt).toContain('من قالها مائة مرة غُفرت ذنوبه');
        expect(prompt).toContain('متفق عليه');
    });

    it('tells the model to cite the bundled reference', () => {
        const prompt = buildZikrPrompt(zikr, { reference: 'رواه مسلم' });
        expect(prompt).toContain('رواه مسلم');
        expect(prompt).toMatch(/المرجع/);
    });

    it('forbids quoting outside the provided text', () => {
        const prompt = buildZikrPrompt(zikr, { benefit: 'فضل الذكر', reference: 'صحيح' });
        expect(prompt).toMatch(/مصادر خارج/);
    });

    it('never contains a URL (nothing API-fetched is relayed)', () => {
        expect(buildZikrPrompt(zikr, { benefit: 'ب', reference: 'ر' })).not.toMatch(/https?:\/\//);
        expect(buildZikrPrompt(zikr)).not.toMatch(/https?:\/\//);
    });

    it('stays valid when no grounding is available', () => {
        const prompt = buildZikrPrompt(zikr);
        expect(prompt).toContain(zikr);
        expect(prompt).not.toMatch(/المرجع المنقول/);
    });
});

describe('buildAyahExplanationPrompt grounding', () => {
    it('embeds the bundled ayah and tafsir texts plus the position', () => {
        const prompt = buildAyahExplanationPrompt(
            'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
            'لا إله إلا هو، كل ما سواه باطل وفانٍ.',
            { surahName: 'البقرة', surah: 2, ayah: 255 }
        );
        expect(prompt).toContain('اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ');
        expect(prompt).toContain('لا إله إلا هو، كل ما سواه باطل وفانٍ.');
        expect(prompt).toContain('البقرة');
        expect(prompt).toContain('التفسير الميسّر');
    });

    it('never contains a URL', () => {
        const prompt = buildAyahExplanationPrompt('نص الآية', 'نص التفسير', { surah: 1, ayah: 1 });
        expect(prompt).not.toMatch(/https?:\/\//);
    });
});

describe('GeminiService', () => {
    it('refuses to send anything without an API key', async () => {
        await expect(GeminiService.explainZikr('نص', '')).rejects.toThrow('API_KEY_MISSING');
        await expect(GeminiService.explainAyah('آية', 'تفسير', '')).rejects.toThrow('API_KEY_MISSING');
    });
});
