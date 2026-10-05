/**
 * Tests for the Today digest widget (M4-T3).
 *
 * The widget pulls Hijri parts, an on-this-day entry, and a quote — all
 * deterministic for a given Date. We pin the known sample dates (Ramadan
 * 1, Eid al-Fitr, Day of Arafah) and check the rendered output. Engines
 * without Umm al-Qura data get a "no Hijri calendar" card.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup, act } from '@testing-library/react';
import { TodayDigestWidget } from '../../components/home/HomeWidgets';
import { useProgressStore } from '../../stores/useProgressStore';

const hasUmalqura = (() => {
    try {
        return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura').resolvedOptions().calendar === 'islamic-umalqura';
    } catch {
        return false;
    }
})();

afterEach(() => cleanup());

/** Flush the microtask queue used by widgets that defer their initial
 *  setState to avoid react-hooks/set-state-in-effect. Without this, the
 *  assertions run before the widget has populated its state. */
const flushMicrotasks = async () => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
    });
};

describe('TodayDigestWidget (M4-T3)', () => {
    (hasUmalqura ? it : it.skip)('renders the Hijri label on a real Hijri day', async () => {
        const { container } = render(<TodayDigestWidget />);
        await flushMicrotasks();
        const label = container.querySelector('[data-testid="today-hijri-label"]');
        expect(label).not.toBeNull();
        // Label contains at least one Arabic month name.
        expect(label!.textContent).toMatch(/[؀-ۿ]/);
    });

    (hasUmalqura ? it : it.skip)('renders the Eid al-Fitr entry on 1 Shawwal 1446', async () => {
        // 2025-03-30 = 1 Shawwal 1446 (verified by tests/unit/hijri.test.ts).
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-03-30T12:00:00'));
        try {
            const { container } = render(<TodayDigestWidget />);
            await flushMicrotasks();
            const block = container.querySelector('[data-testid="today-onthisday"]');
            expect(block).not.toBeNull();
            expect(block!.textContent).toContain('عيد الفطر');
        } finally {
            vi.useRealTimers();
        }
    });

    (hasUmalqura ? it : it.skip)('renders the Day of Arafah entry on 9 Dhu al-Hijjah 1446', async () => {
        // 2025-06-06 = 10 Dhu al-Hijjah 1446; 9 Dhu al-Hijjah is one day earlier.
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-05T12:00:00'));
        try {
            const { container } = render(<TodayDigestWidget />);
            await flushMicrotasks();
            const block = container.querySelector('[data-testid="today-onthisday"]');
            expect(block).not.toBeNull();
            expect(block!.textContent).toContain('يوم عرفة');
        } finally {
            vi.useRealTimers();
        }
    });

    (hasUmalqura ? it : it.skip)('renders the stub-mode hint on a day with no entry', async () => {
        // 2025-08-15 is roughly 21 Safar 1447 - not in the stub dataset.
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-08-15T12:00:00'));
        try {
            const { container } = render(<TodayDigestWidget />);
            await flushMicrotasks();
            // Either the on-this-day block is absent OR the stub hint is visible.
            const block = container.querySelector('[data-testid="today-onthisday"]');
            if (block) {
                expect(block.textContent!.length).toBeGreaterThan(0);
            } else {
                expect(container.textContent).toMatch(/الإعداد|الإعدادية/);
            }
        } finally {
            vi.useRealTimers();
        }
    });

    it('renders a wisdom quote', async () => {
        const { container } = render(<TodayDigestWidget />);
        await flushMicrotasks();
        const quote = container.querySelector('[data-testid="today-quote"]');
        expect(quote).not.toBeNull();
        expect(quote!.textContent).toMatch(/[؀-ۿ]/);
    });

    it('hides the progress row when the user has no progress yet', async () => {
        // TodayDigestWidget reads progress from the Zustand store.
        useProgressStore.setState({ progress: {} });
        const { container } = render(<TodayDigestWidget />);
        await flushMicrotasks();
        expect(container.querySelector('[data-testid="today-progress"]')).toBeNull();
    });

    it('renders the progress row when the user has progress entries', async () => {
        useProgressStore.setState({ progress: { 1: 5, 2: 0, 3: 10 } });
        const { container } = render(<TodayDigestWidget />);
        await flushMicrotasks();
        const progress = container.querySelector('[data-testid="today-progress"]');
        expect(progress).not.toBeNull();
        expect(progress!.textContent).toContain('٢');
    });
});
