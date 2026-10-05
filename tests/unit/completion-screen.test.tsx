/**
 * Tests for the CompletionScreen — the post-session summary screen.
 *
 * The screen reports session reads, the current streak, and the lifetime total
 * reads, and on mount increments the streak and the lifetime read total
 * exactly once per category (guarded by a module-level Set so remounts don't
 * double-count). The streak outcome drives the reset banner (kind 'reset') and
 * the floating toast (kinds 'preserved' / 'first-time').
 *
 * The stores and translation hook are mocked so the component runs in
 * isolation; the identity translation (t returns the key) lets assertions
 * target translation keys directly.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CompletionScreen from '../../components/screens/CompletionScreen';
import type { Category, UserStats } from '../../types';

// ---------------------------------------------------------------------------
// Mocked dependencies
// ---------------------------------------------------------------------------

// vi.mock factories are hoisted above imports by vitest's transform and so
// cannot close over plain consts — vi.hoisted runs this callback first and
// gives every test stable, reconfigurable mock handles.
const mocks = vi.hoisted(() => {
    const stats: UserStats = { streak: 0, totalReads: 0, lastActiveDate: null, timezone: null };
    return {
        navigate: vi.fn(),
        incrementStreak: vi.fn(),
        incrementTotalReads: vi.fn(),
        categories: [] as Category[],
        stats,
    };
});

vi.mock('../../stores/usePreferencesStore', () => ({
    usePreferencesStore: (selector: (state: any) => any) => {
        const state = {
            categories: mocks.categories,
        };
        return selector(state);
    },
}));

vi.mock('../../stores/useProgressStore', () => ({
    useProgressStore: (selector: (state: any) => any) => {
        const state = {
            stats: mocks.stats,
            incrementStreak: mocks.incrementStreak,
            incrementTotalReads: mocks.incrementTotalReads,
        };
        return selector(state);
    },
}));

vi.mock('../../stores/useNavigationStore', () => ({
    useNavigationStore: (selector: (state: any) => any) => {
        const state = {
            navigate: mocks.navigate,
        };
        return selector(state);
    },
}));

vi.mock('../../hooks/useTranslation', () => ({
    useTranslation: () => ({
        // Identity translation: keys render as themselves.
        t: (key: string) => key,
        language: 'ar',
    }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeCategory(id: string, counts: number[]): Category {
    return {
        id,
        title: `Category ${id}`,
        count: counts.reduce((sum, n) => sum + n, 0),
        icon: () => null,
        azkar: counts.map((count, index) => ({
            id: index + 1,
            arabic: `zikr ${index + 1}`,
            transliteration: null,
            translation: null,
            benefit: null,
            reference: null,
            count,
        })),
    };
}

// The mount effect is guarded by a module-level Set keyed by categoryId, so a
// category already counted by an earlier test in this file would skip its
// increment. Every test gets a fresh id.
let categorySeq = 0;
function nextCategoryId(): string {
    categorySeq += 1;
    return `test-category-${categorySeq}`;
}

beforeEach(() => {
    vi.clearAllMocks();
    mocks.categories = [];
    mocks.stats = { streak: 0, totalReads: 0, lastActiveDate: null, timezone: null };
    mocks.incrementStreak.mockReturnValue({ kind: 'same-day', streak: 0 });
    // Mirror the real store: incrementTotalReads folds the session count into
    // the persisted lifetime total, so the screen must not add it again.
    mocks.incrementTotalReads.mockImplementation((count: number) => {
        mocks.stats = { ...mocks.stats, totalReads: mocks.stats.totalReads + count };
    });
});

describe('CompletionScreen', () => {
    it('renders the completion title and subtitle', () => {
        render(<CompletionScreen categoryId={nextCategoryId()} />);

        expect(screen.getByText('completion_title')).toBeInTheDocument();
        expect(screen.getByText('completion_subtitle')).toBeInTheDocument();
    });

    it('shows the session reads count for the category', () => {
        const category = makeCategory(nextCategoryId(), [2, 3]);
        mocks.categories = [category];

        render(<CompletionScreen categoryId={category.id} />);

        expect(screen.getByText('+5')).toBeInTheDocument();
    });

    it('shows the current streak count', () => {
        mocks.stats = { streak: 7, totalReads: 100, lastActiveDate: null, timezone: null };
        const category = makeCategory(nextCategoryId(), [2, 3]);
        mocks.categories = [category];

        render(<CompletionScreen categoryId={category.id} />);

        expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('shows the total reads count (lifetime plus session)', async () => {
        mocks.stats = { streak: 0, totalReads: 100, lastActiveDate: null, timezone: null };
        const category = makeCategory(nextCategoryId(), [2, 3]);
        mocks.categories = [category];

        const { rerender } = render(<CompletionScreen categoryId={category.id} />);

        // The mount effect folds the session reads into the lifetime total via
        // incrementTotalReads, so the tile reads 100 + 5 = 105 once the store
        // update lands. It must not add sessionReads a second time (110).
        await waitFor(() => expect(mocks.incrementTotalReads).toHaveBeenCalledWith(5));
        rerender(<CompletionScreen categoryId={category.id} />);

        expect(screen.getByText('105')).toBeInTheDocument();
        expect(screen.queryByText('110')).not.toBeInTheDocument();
    });

    it('calls incrementStreak exactly once on mount', () => {
        const category = makeCategory(nextCategoryId(), [1, 2, 3]);
        mocks.categories = [category];

        render(<CompletionScreen categoryId={category.id} />);

        expect(mocks.incrementStreak).toHaveBeenCalledTimes(1);
        expect(mocks.incrementStreak).toHaveBeenCalledWith();
    });

    it('calls incrementTotalReads with the session read count on mount', () => {
        const category = makeCategory(nextCategoryId(), [4, 1]);
        mocks.categories = [category];

        render(<CompletionScreen categoryId={category.id} />);

        expect(mocks.incrementTotalReads).toHaveBeenCalledTimes(1);
        expect(mocks.incrementTotalReads).toHaveBeenCalledWith(5);
    });

    it('shows the reset banner when the streak outcome is "reset"', async () => {
        mocks.incrementStreak.mockReturnValue({ kind: 'reset', streak: 1, wasStreak: 5 });
        const category = makeCategory(nextCategoryId(), [2]);
        mocks.categories = [category];

        render(<CompletionScreen categoryId={category.id} />);

        await waitFor(() => {
            expect(screen.getByText('سلسلة جديدة')).toBeInTheDocument();
        });
        // A reset shows the banner, not the preserved-streak toast.
        expect(screen.queryByText('بسم الله — استمر')).not.toBeInTheDocument();
    });

    it('shows a toast when the streak outcome is "preserved"', async () => {
        mocks.incrementStreak.mockReturnValue({ kind: 'preserved', streak: 6, wasStreak: 5 });
        const category = makeCategory(nextCategoryId(), [3]);
        mocks.categories = [category];

        render(<CompletionScreen categoryId={category.id} />);

        await waitFor(() => {
            expect(screen.getByText('بسم الله — استمر')).toBeInTheDocument();
        });
        // A preserved streak shows the toast, not the reset banner.
        expect(screen.queryByText('سلسلة جديدة')).not.toBeInTheDocument();
    });

    it('shows a toast when the streak outcome is "first-time"', async () => {
        mocks.incrementStreak.mockReturnValue({ kind: 'first-time', streak: 1 });
        const category = makeCategory(nextCategoryId(), [1]);
        mocks.categories = [category];

        render(<CompletionScreen categoryId={category.id} />);

        await waitFor(() => {
            expect(screen.getByText('بدأ العد — اليوم الأول')).toBeInTheDocument();
        });
    });

    it('does not call incrementStreak when the session has zero reads', () => {
        const category = makeCategory(nextCategoryId(), []);
        mocks.categories = [category];

        render(<CompletionScreen categoryId={category.id} />);

        expect(mocks.incrementStreak).not.toHaveBeenCalled();
        expect(mocks.incrementTotalReads).not.toHaveBeenCalled();
    });

    it('counts a category only once across remounts', () => {
        const category = makeCategory('remount-category', [2]);
        mocks.categories = [category];

        const first = render(<CompletionScreen categoryId={category.id} />);
        first.unmount();
        render(<CompletionScreen categoryId={category.id} />);

        expect(mocks.incrementStreak).toHaveBeenCalledTimes(1);
        expect(mocks.incrementTotalReads).toHaveBeenCalledTimes(1);
    });
});
