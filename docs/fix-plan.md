# Azkar App — Fix Plan

Companion to the full-app review. One decision per finding, with the recommended
option chosen and the rejected option recorded.

Sequencing: 1.1 → 3.1 → 2.1 → 3.2 → 4.1 → 4.2 → 5.
Validation after every step: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.
Final: `npx playwright test --project=chromium`.

---

## 1. P1 — Data loss

### 1.1 Quran persistence bypasses the storage adapter (silent backup/restore gap)

**Problem.** `stores/useQuranStore.ts` persists to localStorage key `azkar-quran`.
`data/storage/web.ts::exportData()` builds `quranBookmarks` / `quranLastRead` from
the **adapter**, and only `importData` ever writes those adapter keys. So:

- backups silently omit real bookmarks and the resume position;
- restore writes records nothing reads;
- the restore preview reports 0 bookmarks;
- `quranRepository`, `pushQuranHistory`, `storage.getQuranReadHistory` and the whole
  `AppContextType` quran surface are dead.

**Recommended option — (a) make `useQuranStore` a thin facade over the adapter.**

Rejected: (b) include the `azkar-quran` blob in the backup envelope. It leaves two
sources of truth and changes the backup format for every consumer.

**Steps**

1. In `stores/useQuranStore.ts`, add an async zustand `PersistStorage`
   (`getItem` / `setItem` / `removeItem`) backed by `getStorage()`'s quran
   methods: `getQuranBookmarks`/`saveQuranBookmarks`,
   `getQuranLastRead`/`saveQuranLastRead`,
   `getQuranReadHistory`/`saveQuranReadHistory`.
2. Swap the `persist` config to `createJSONStorage(() => adapterStorage)`. Keep
   `name: 'azkar-quran'` — the adapter keys are independent of the zustand name, so
   there is no collision.
3. Keep the public API byte-identical (state fields + the 8 actions). Zero changes
   in `QuranScreen`, `SurahReaderScreen`, `VerseActionModalContainer`.
4. **Migration for existing users.** On first hydrate: if
   `localStorage.getItem('azkar-quran')` exists and the adapter is empty, write the
   legacy blob through the adapter, then `removeItem('azkar-quran')` and set an
   `azkar-quran-migrated` flag so it runs exactly once.
5. Wrap every write in `try/catch` + `logger.warn` — a persistence failure must
   never break the UI.
6. Tests: assert the store writes through to a mocked adapter; assert the migration
   (legacy blob → adapter → legacy key removed, runs once).

**Risk.** Async hydration can flash an empty state. Mitigated: all three consumers
already handle empty arrays / `null` lastRead, and hydration is a single
localStorage/SQLite read.

**Side effect.** `data/quranRepository.ts` stops being dead code.

---

## 2. P2 — CI is red

### 2.1 e2e workflow `BASE_URL` does not match the Playwright webServer

**Problem.** `.github/workflows/e2e.yml` sets `BASE_URL: http://localhost:4173`.
`playwright.config.ts` starts `npm run dev -- --port 5173` and waits on
`http://localhost:5173`. Nothing serves 4173, so every e2e test fails in CI.
Proven locally: with that exact `BASE_URL` the suite fails with connection refused.

**Recommended option — remove the `BASE_URL` override from `e2e.yml`** so the
workflow inherits the config's `baseURL` (5173), which matches `webServer.url`.
The port then has a single source of truth: `playwright.config.ts`.

Rejected: switch the config's webServer to `npm run preview -- --port 4173`. It
matches the config's own "use the preview server for production-like testing"
comment and makes the workflow's `npm run build` step meaningful, but it regresses
local `npx playwright test` (requires a prior `npm run build`). If
production-like runs are wanted, do it as a follow-up with
`command: 'npm run build && npm run preview -- --port 4173'` and
`url: 'http://localhost:4173'`.

**Steps.** Delete the `BASE_URL` env line (or set it explicitly to
`http://localhost:5173`); re-run `npx playwright test --project=chromium`.

---

## 3. Correctness / single source of truth

### 3.1 `usePreferencesStore` keeps a drifted copy of the defaults

**Problem.** The store's local `defaultPreferences` (lines 110-140) differs from
`data/storage/defaults.ts` in 6 fields and is **missing `calculationMethod` and
`currentLocale` entirely** — those are `undefined` in state until hydrated.

| Field | `defaults.ts` | store copy |
|---|---|---|
| `darkMode` | `true` | `false` |
| `homeLayout` | `'dashboard'` | `'stream'` |
| `voiceName` | `'Charon'` | `''` |
| `tafsirId` | `'muyassar'` | `'default'` |
| `morningReminderTime` | `'05:00 AM'` | `'06:00 AM'` |
| `eveningReminderTime` | `'05:00 PM'` | `'06:00 PM'` |
| `calculationMethod` | `'MuslimWorldLeague'` | *absent* |
| `currentLocale` | `'ar'` | *absent* |

`resetPreferences()` also resets to the wrong values.

**Recommended — delete the local copy and import `defaultPreferences` from
`data/storage/defaults.ts`.** One source of truth; fixes the drift, the two
missing fields, and `resetPreferences` in one move.

**Steps.** Remove lines 110-140; add
`import { defaultPreferences } from '../data/storage/defaults'`. Safe because
`defaults.ts` is a pure constants module (no storage side effects) and its object
is a superset of the store's. Run tsc + tests.

### 3.2 Vacuous test

**Problem.** `tests/unit/surah-reader-resume.test.tsx:207-224` defines local
`vi.fn()` mocks, calls them, and asserts on them. Zero app coverage.

**Recommended — replace it with a real test** that mocks `data/storage` and asserts
`saveQuranLastRead(null)` fires when the resume banner is dismissed. Fallback if
that proves too involved: delete the test.

---

## 4. Design-system conformance

### 4.1 DESIGN.md gradient conflict

**Problem.** L177-181 (Named Rules → Time-of-Day Gradient Rule) permits exactly
three formulas and explicitly binds Quick-Access Tiles: "No ad-hoc gradients are
allowed." L273 says the Welcome Card uses "orange→amber for morning/day", and L280
specifies five distinct tile gradients (teal / orange / violet / sky / emerald).
Direct contradiction.

**Recommended — L177-181 is normative; amend L273 and L280 to conform.**

Rejected: amend L177 to permit the tile palette. L177 is the explicit Named Rules
section, states the prohibition outright, and the code already follows it.

**Steps.** Rewrite L273's wash to the three rule formulas. Rewrite L280 so each tile
uses one of the three (Morning = Day, Evening = Evening, moonSighting = Sleep,
remaining tiles = Day, or explicitly exempted as brand tiles).

### 4.2 Emoji icons in `QuickAccessGrid`

**Problem.** Seven emoji violate the craft-floor ban on emoji-as-icon.

**Recommended — swap to stroke icons.**

| Tile | Now | Target |
|---|---|---|
| morning | ☀️ | `MorningIcon` (exists) |
| evening | 🌙 | `EveningIcon` (exists) |
| wordByWord | 📖 | `BookOpenIcon` (exists) |
| qibla | 🕋 | **new** `KaabaIcon` |
| asmaUlHusna | 🌸 | **new** `FlowerIcon` |
| duas | 🤲 | **new** `DuaIcon` |
| memorization | 🎯 | **new** `TargetIcon` |

Author the four new icons in `components/common/CustomIcons.tsx` matching the
existing 24×24 stroke style (`stroke="currentColor"`, `strokeWidth={1.5}`,
`fill="none"`, `strokeLinecap/Linejoin="round"`).

**Follow-up (not blocking).** `quran`, `hadith`, `islamicLibrary` and
`wordByWord` all use `BookOpenIcon` — consider differentiating.

---

## 5. Dead code (scoped, last)

**Recommended — delete only what has zero production AND zero test references;
update tests first for the rest.**

- `data/prayerTimesRepository.ts::getAllPrayerTimes` — byte-for-byte duplicate of
  `getPrayerTimes` → **delete the duplicate**.
- `tests/unit/surah-reader-resume.test.tsx:207-224` → delete/replace (see 3.2).
- `quranRepository` → **revived by 1.1**, no action.
- Keep and report only: `EmptyState.tsx`, `ShareCard.tsx`, `prefetchAyah`,
  `shareRange`, `utils/errorHandler.ts`, `BaseRepository`,
  `useProgress`/`useStreak`/`useOfflineQueue`, store `resetPreferences`,
  `calculationMethod` preference, `AppContext.tsx`/`AppContextType`,
  `AccessibilitySettings.tsx`, the theme-engine cluster. Some are referenced by
  tests; the rest are feature-flagged rather than finished.

---

## Open items explicitly out of scope

- Wiring `AccessibilitySettings.tsx` into Settings (needs new persisted preference
  fields = a feature, not polish).
- Wiring the theme-engine cluster (`ThemeCustomizer.tsx`,
  `useThemeCustomization.ts`, `themePresets.ts`).
- Replacing Western digits in Arabic UI labels (copy decision).
- Differentiating the four `BookOpenIcon` tiles.
