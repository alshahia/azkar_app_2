/**
 * Tests for components/screens/SearchScreen.
 *
 * The screen collaborates with three externals — the Zustand navigation
 * store, azkarRepository.search (azkar/category results) and a Web Worker
 * that answers Quran queries — so all three are replaced with in-test fakes:
 *
 *   - Navigation goes through useNavigationStore; beforeEach swaps its
 *     `navigate` action for the shared spy.
 *   - AppContext is module-mocked with a bare { language } object. `language`
 *     is required because the screen also calls useTranslation(), which still
 *     reads it off that context (the app ships Arabic only).
 *   - azkarRepository is module-mocked with a single search() stub.
 *   - The Worker is replaced on globalThis with a recording fake: it stores
 *     every posted message so tests can assert on the
 *     { type: 'search', query, mode } traffic, and tests drive the response
 *     by invoking `onmessage` with the same id the screen assigned.
 *
 * QuranService is module-mocked too (SURAHS / getSurah / loadSurah) so the
 * Quran-result path stays hermetic — the real loadSurah would pull the
 * bundled Uthmani JSON through import.meta.glob.
 *
 * Both search effects debounce for 300 ms, so the tests use real timers
 * with waitFor rather than fake timers (which fight React's scheduler).
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SearchScreen from '../../components/screens/SearchScreen';
import { useNavigationStore } from '../../stores/useNavigationStore';
import type { Category, UserZikr } from '../../types';
import type { QuranAyah } from '../../services/QuranService';

// ---------------------------------------------------------------------------
// Shared mocks. vi.hoisted runs before the vi.mock factories below, so the
// factories can close over these fns and the tests can assert on them.
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
    navigate: vi.fn(),
    search: vi.fn(),
    loadSurah: vi.fn(),
}));

vi.mock('../../stores/usePreferencesStore', () => ({
    // SearchScreen now navigates through the Zustand store, so this mock only
    // has to satisfy useTranslation(): it reads `language` off the store,
    // and without it translations[undefined] would throw on the first render.
    usePreferencesStore: (selector: (state: any) => any) => {
        const state = {
            language: 'ar' as const,
        };
        return selector(state);
    },
}));

vi.mock('../../data/azkarRepository', () => ({
    azkarRepository: {
        search: mocks.search,
    },
}));

vi.mock('../../services/QuranService', () => {
    // Local const: the factory is hoisted, so it cannot close over any
    // module-level binding of this test file.
    const SURAHS = [
        { id: 1, name: 'الفاتحة', transliteration: 'Al-Fatiha', meaning: 'The Opening', revelation: 'مكية', ayahCount: 7, firstPage: 1 },
        { id: 2, name: 'البقرة', transliteration: 'Al-Baqarah', meaning: 'The Cow', revelation: 'مدنية', ayahCount: 286, firstPage: 2 },
    ];
    return {
        SURAHS,
        getSurah: (id: number) => SURAHS.find(s => s.id === id),
        loadSurah: mocks.loadSurah,
    };
});

// ---------------------------------------------------------------------------
// Worker fake
// ---------------------------------------------------------------------------

interface WorkerMessage {
    id?: number;
    type: string;
    query?: string;
    mode?: string;
    results?: Array<{ s: number; a: number; h: number[] }>;
    queryTokens?: string[];
}

/**
 * Minimal Worker stand-in. It records every postMessage so tests can inspect
 * the outgoing traffic, and accepts a response by invoking `onmessage` with
 * a synthetic event — exactly what the real worker would deliver.
 */
class MockWorker {
    static instances: MockWorker[] = [];
    onmessage: ((e: { data: WorkerMessage }) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    messages: WorkerMessage[] = [];
    terminated = false;
    constructor(public url: unknown, public options?: { type?: string }) {
        MockWorker.instances.push(this);
    }
    postMessage(msg: WorkerMessage): void {
        this.messages.push(msg);
    }
    terminate(): void {
        this.terminated = true;
    }
}

function latestWorker(): MockWorker {
    const w = MockWorker.instances[MockWorker.instances.length - 1];
    if (!w) throw new Error('SearchScreen has not created a Worker yet');
    return w;
}

/** Deliver a worker response the way the real worker would (via onmessage). */
async function workerRespond(data: WorkerMessage): Promise<void> {
    const w = latestWorker();
    await act(async () => {
        w.onmessage?.({ data });
    });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SEARCH_INPUT = 'ابحث في القرآن والأذكار...';

const DummyIcon: React.ComponentType<{ className?: string }> = () => null;

const mockCategories: Category[] = [
    { id: 'morning', title: 'أذكار الصباح', count: 10, icon: DummyIcon, azkar: [] },
];

/** The repository attaches categoryTitle to each zikr at runtime. */
type ZikrWithCategoryTitle = UserZikr & { categoryTitle?: string };

const mockZikr: ZikrWithCategoryTitle = {
    id: 42,
    arabic: 'سبحان الله',
    transliteration: null,
    translation: null,
    benefit: null,
    reference: null,
    count: 3,
    categoryId: 'morning',
    isCustom: false,
    categoryTitle: 'أذكار الصباح',
};

const mockAyahs: QuranAyah[] = [
    { number: 1, text: 'بسم الله الرحمن الرحيم', page: 1, juz: 1, sajda: 0, globalNumber: 1, surahId: 1 },
];

/** Type a query and wait until the debounced azkar search has fired. */
async function typeQuery(value: string): Promise<void> {
    fireEvent.change(screen.getByPlaceholderText(SEARCH_INPUT), { target: { value } });
    await waitFor(() => expect(mocks.search).toHaveBeenCalledWith(value));
}

/** Wait for the worker's search message and answer it with `data`. */
async function answerWorker(data: Omit<WorkerMessage, 'id'>): Promise<void> {
    await waitFor(() => {
        expect(latestWorker().messages.some(m => m.type === 'search')).toBe(true);
    });
    const searchMsg = latestWorker().messages.find(m => m.type === 'search')!;
    await workerRespond({ id: searchMsg.id, ...data });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchScreen', () => {
    beforeEach(() => {
        MockWorker.instances = [];
        (globalThis as { Worker?: unknown }).Worker = MockWorker;
        mocks.navigate.mockReset();
        // The screen reads navigate from the store; point it at the spy.
        useNavigationStore.setState({ navigate: mocks.navigate });
        mocks.search.mockReset().mockResolvedValue({ categories: [], azkar: [] });
        mocks.loadSurah.mockReset().mockResolvedValue([]);
    });

    afterEach(() => {
        cleanup();
        delete (globalThis as { Worker?: unknown }).Worker;
        MockWorker.instances = [];
    });

    it('renders the search input and the four tab buttons', () => {
        render(<SearchScreen />);

        expect(screen.getByPlaceholderText(SEARCH_INPUT)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الكل' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'القرآن' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الفئات' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الأذكار' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'رجوع' })).toBeInTheDocument();
        // No worker is created until a query is typed.
        expect(MockWorker.instances).toHaveLength(0);
    });

    it('debounces the query before searching azkar and posting to the worker', async () => {
        render(<SearchScreen />);

        fireEvent.change(screen.getByPlaceholderText(SEARCH_INPUT), { target: { value: 'الرحمن' } });

        // The 300 ms debounce has not elapsed: nothing has fired yet.
        expect(mocks.search).not.toHaveBeenCalled();
        expect(MockWorker.instances).toHaveLength(0);

        // Azkar search fires with the raw query.
        await waitFor(() => expect(mocks.search).toHaveBeenCalledWith('الرحمن'));

        // The worker was created (load) and then received the search message.
        await waitFor(() => {
            expect(latestWorker().messages).toContainEqual(
                expect.objectContaining({ type: 'search', query: 'الرحمن', mode: 'and' }),
            );
        });
        expect(latestWorker().messages[0]).toEqual(expect.objectContaining({ id: 0, type: 'load' }));
    });

    it('renders Quran results with highlighted matching text', async () => {
        mocks.loadSurah.mockResolvedValue(mockAyahs);
        const { container } = render(<SearchScreen />);

        await typeQuery('الرحمن');
        await answerWorker({ type: 'result', results: [{ s: 1, a: 1, h: [1] }], queryTokens: ['الرحمن'] });

        await waitFor(() => expect(screen.getByText(/الفاتحة/)).toBeInTheDocument());

        // The matching token is wrapped in a <mark> highlight.
        const mark = container.querySelector('mark');
        expect(mark).not.toBeNull();
        expect(mark?.textContent).toBe('الرحمن');
        // The ayah text is split around the highlight.
        expect(screen.getByText(/بسم الله/)).toBeInTheDocument();
    });

    it('renders azkar results', async () => {
        mocks.search.mockResolvedValue({ categories: [], azkar: [mockZikr] });
        render(<SearchScreen />);

        await typeQuery('سبحان');

        await waitFor(() => expect(screen.getByText('سبحان الله')).toBeInTheDocument());
        expect(screen.getByText('أذكار الصباح')).toBeInTheDocument();
    });

    it('renders category results', async () => {
        mocks.search.mockResolvedValue({ categories: mockCategories, azkar: [] });
        render(<SearchScreen />);

        await typeQuery('الصباح');

        await waitFor(() => expect(screen.getByText('أذكار الصباح')).toBeInTheDocument());
    });

    it('navigates to surahReader when a Quran result is clicked', async () => {
        mocks.loadSurah.mockResolvedValue(mockAyahs);
        render(<SearchScreen />);

        await typeQuery('الرحمن');
        await answerWorker({ type: 'result', results: [{ s: 1, a: 1, h: [1] }], queryTokens: ['الرحمن'] });
        await waitFor(() => expect(screen.getByText(/الفاتحة/)).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /الفاتحة/ }));
        expect(mocks.navigate).toHaveBeenCalledWith('surahReader', { surahId: 1, ayah: 1 });
    });

    it('navigates to azkarList when a category result is clicked', async () => {
        mocks.search.mockResolvedValue({ categories: mockCategories, azkar: [] });
        render(<SearchScreen />);

        await typeQuery('الصباح');
        await waitFor(() => expect(screen.getByText('أذكار الصباح')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /أذكار الصباح/ }));
        expect(mocks.navigate).toHaveBeenCalledWith('azkarList', { categoryId: 'morning' });
    });

    it('navigates to azkarList with a scroll target when a zikr result is clicked', async () => {
        mocks.search.mockResolvedValue({ categories: [], azkar: [mockZikr] });
        render(<SearchScreen />);

        await typeQuery('سبحان');
        await waitFor(() => expect(screen.getByText('سبحان الله')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /سبحان الله/ }));
        expect(mocks.navigate).toHaveBeenCalledWith('azkarList', { categoryId: 'morning', initialScrollToId: 42 });
    });

    it('shows the empty state when there is no query', () => {
        render(<SearchScreen />);

        expect(screen.getByPlaceholderText(SEARCH_INPUT)).toHaveValue('');
        expect(screen.getByText('ابدأ الكتابة للبحث')).toBeInTheDocument();
        expect(mocks.search).not.toHaveBeenCalled();
        expect(MockWorker.instances).toHaveLength(0);
    });

    it('shows a no-results message when the query matches nothing', async () => {
        render(<SearchScreen />);

        await typeQuery('zzz');
        await answerWorker({ type: 'result', results: [] });

        await waitFor(() => expect(screen.getByText(/لا توجد نتائج/)).toBeInTheDocument());
    });
});
