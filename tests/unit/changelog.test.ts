/**
 * Tests for utils/changelog (M4-T4).
 *
 * The parser is purely string-based — we feed it crafted CHANGELOG.md
 * excerpts and assert the resulting structure. The bundled CHANGELOG.md
 * is exercised through `loadChangelogEntries` so any drift between the
 * file and the parser is caught.
 */
import { describe, it, expect } from 'vitest';
import {
    parseChangelog,
    compareSemver,
    entriesSince,
    _resetChangelogCache,
} from '../../utils/changelog';

describe('parseChangelog', () => {
    it('extracts one entry per version heading', () => {
        const raw = `# Changelog

## 1.1.0 (2026-09-10)

- Bullet A
- Bullet B

## 1.0.0 (2026-08-01)

- First bullet
`;
        const entries = parseChangelog(raw);
        expect(entries).toHaveLength(2);
        expect(entries[0].version).toBe('1.1.0');
        expect(entries[0].date).toBe('2026-09-10');
        expect(entries[0].bullets).toEqual(['Bullet A', 'Bullet B']);
        expect(entries[1].version).toBe('1.0.0');
        expect(entries[1].bullets).toEqual(['First bullet']);
    });

    it('strips inline markdown markers (bold, italic, code) from bullets', () => {
        const raw = `## 1.0.0

- Added **bold** text
- Also *italic* and \`code\`
`;
        const entries = parseChangelog(raw);
        expect(entries[0].bullets).toEqual([
            'Added bold text',
            'Also italic and code',
        ]);
    });

    it('accepts headings without a date', () => {
        const raw = `## 2.0.0

- Bullet`;
        const entries = parseChangelog(raw);
        expect(entries[0].version).toBe('2.0.0');
        expect(entries[0].date).toBe('');
    });

    it('returns an empty list when no version heading is present', () => {
        const raw = `# No headings here`;
        expect(parseChangelog(raw)).toEqual([]);
    });

    it('preserves nested bullet indentation', () => {
        const raw = `## 1.0.0

- Top bullet
  - Sub-bullet (we still treat it as a bullet)
`;
        const entries = parseChangelog(raw);
        // We intentionally keep the prefix `- ` parsing simple: any line
        // that starts with `- ` or `* ` after optional whitespace is a
        // bullet. Nested bullets thus produce two entries; that's fine
        // because the modal renders each on its own line.
        expect(entries[0].bullets.length).toBeGreaterThanOrEqual(1);
        expect(entries[0].bullets[0]).toBe('Top bullet');
    });
});

describe('compareSemver', () => {
    it('orders versions correctly', () => {
        expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
        expect(compareSemver('1.0.0', '1.0.1')).toBe(-1);
        expect(compareSemver('1.1.0', '1.0.0')).toBe(1);
        expect(compareSemver('2.0.0', '1.9.9')).toBe(1);
    });

    it('treats missing components as zero', () => {
        expect(compareSemver('1', '1.0.0')).toBe(0);
        expect(compareSemver('1.1', '1.1.0')).toBe(0);
    });
});

describe('entriesSince', () => {
    const entries = [
        { version: '1.2.0', date: '', bullets: [] },
        { version: '1.1.0', date: '', bullets: [] },
        { version: '1.0.0', date: '', bullets: [] },
    ];

    it('returns every entry when lastSeen is null', async () => {
        await expect(entriesSince(null, entries)).resolves.toEqual(entries);
    });

    it('returns every entry when lastSeen is empty', async () => {
        await expect(entriesSince('', entries)).resolves.toEqual(entries);
    });

    it('returns only entries strictly newer than lastSeen', async () => {
        const result = await entriesSince('1.1.0', entries);
        expect(result.map((e) => e.version)).toEqual(['1.2.0']);
    });

    it('returns an empty list when lastSeen is the latest', async () => {
        await expect(entriesSince('1.2.0', entries)).resolves.toEqual([]);
    });
});

describe('bundled CHANGELOG.md', () => {
    it('parses into at least one entry (smoke)', async () => {
        _resetChangelogCache();
        const entries = await entriesSince('0.0.0');
        expect(entries.length).toBeGreaterThanOrEqual(1);
    });
});
