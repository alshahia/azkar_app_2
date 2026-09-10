/**
 * Tests for components/common/WhatsNewModal (M4-T4).
 *
 * The modal renders a centered overlay when (a) `isOpen` is true and
 * (b) there's at least one entry newer than `lastSeenVersion`. Otherwise
 * it returns null. Dismissing calls `onDismiss` with the highest version
 * in the rendered set.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import WhatsNewModal from '../../components/common/WhatsNewModal';
import { _resetChangelogCache } from '../../utils/changelog';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    _resetChangelogCache();
});

describe('WhatsNewModal (M4-T4)', () => {
    it('renders nothing when isOpen is false', () => {
        const { container } = render(
            <WhatsNewModal
                isOpen={false}
                lastSeenVersion={null}
                currentVersion="1.0.0"
                onDismiss={vi.fn()}
            />,
        );
        expect(container.querySelector('[data-testid="whats-new-modal"]')).toBeNull();
    });

    it('renders a changelog block for the bundled entries', async () => {
        const { container } = render(
            <WhatsNewModal
                isOpen={true}
                lastSeenVersion={null}
                currentVersion="1.1.0"
                onDismiss={vi.fn()}
            />,
        );
        await waitFor(() => {
            const blocks = container.querySelectorAll('[data-testid^="changelog-"]');
            expect(blocks.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('renders nothing when lastSeen already matches current and no new entries exist', async () => {
        const { container } = render(
            <WhatsNewModal
                isOpen={true}
                lastSeenVersion="1.1.0"
                currentVersion="1.1.0"
                onDismiss={vi.fn()}
            />,
        );
        // Wait for the async load to settle, then assert nothing renders.
        await new Promise((r) => setTimeout(r, 30));
        expect(container.querySelector('[data-testid="whats-new-modal"]')).toBeNull();
    });

    it('calls onDismiss with the highest version in the rendered set', async () => {
        const onDismiss = vi.fn();
        const { getByTestId } = render(
            <WhatsNewModal
                isOpen={true}
                lastSeenVersion={null}
                currentVersion="1.1.0"
                onDismiss={onDismiss}
            />,
        );
        const dismiss = await waitFor(() => getByTestId('whats-new-dismiss'));
        fireEvent.click(dismiss);
        expect(onDismiss).toHaveBeenCalledWith('1.1.0');
    });

    it('renders Arabic text inside the changelog blocks', async () => {
        const { container } = render(
            <WhatsNewModal
                isOpen={true}
                lastSeenVersion={null}
                currentVersion="1.1.0"
                onDismiss={vi.fn()}
            />,
        );
        await waitFor(() => {
            const blocks = container.querySelectorAll('[data-testid^="changelog-"]');
            expect(blocks.length).toBeGreaterThanOrEqual(1);
        });
        const blocks = container.querySelectorAll('[data-testid^="changelog-"]');
        const combined = Array.from(blocks).map((b) => b.textContent).join(' ');
        expect(combined).toMatch(/[\u0600-\u06FF]/);
    });
});
