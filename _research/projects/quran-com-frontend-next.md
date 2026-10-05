# Research Report — quran.com-frontend-next (for Azkar App)

## Overview

- **Repo**: quran/quran.com-frontend-next, local clone `E:\flutter\azkar-app_6\_research\repos\quran-com-frontend-next`.
- **Last commit**: `aff1a03` — 2026-03-03 — "Ramadan release 4 (#3251)" (author Osama Sayed). Actively developed.
- **License**: `package.json` declares `"license": "MIT"`; **no root LICENSE file exists in the clone** (checked `LICENSE*` patterns — none found). README adds a trust statement: "copying the code/project is unacceptable" — i.e. take patterns/ideas, not code. Fonts/content (QCF/KFGQPC Uthmani font, tafsir texts, audio) carry separate licenses.
- **Scale**: single-package (NOT a monorepo), ~15k files mostly media/fonts in `public/`/`configs/`; all app code is in `src/`.
- **Docs**: agent docs at `.agents/quran/standards/repo-context.md`; published Storybook.

## Stack & architecture

| Concern | What they use | Evidence |
|---|---|---|
| Framework | **Next.js 14 Pages Router** (NOT App Router) | `src/pages/` (no `src/app/`), `next ^14.2.6` in `package.json` |
| Routes | `[chapterId]` (+ range/tafsir), `juz`, `hizb`, `rub`, `page`, `reciters`, `calendar`, `ramadan2026`, `my-quran`, `collections`, `media`, `embed`, `radio` | `src/pages/*` |
| State | **Redux Toolkit + redux-persist** (persist version **48** with migration scripts), custom `DefaultSettingsMiddleware` | `src/redux/store.ts:54-100`, `src/redux/migration-scripts/` |
| Slices | QuranReader/*: `styles`, `translations`, `tafsirs`, `bookmarks`, `contextMenu`, `verseActionModal`, `studyMode`, `notes`, `pinnedVerses`, `readingTracker`; plus `AudioPlayer/state`, `CommandBar`, `Search`, `theme`… | `src/redux/slices/**` |
| Audio state | **XState v3** (`@xstate/react`): `audioPlayerMachine` spawns `repeatMachine` + `radioMachine`; also `rangeCycleMachine`, `verseCycleMachine` | `src/xstate/actors/audioPlayer/audioPlayerMachine.ts:11-25` |
| Data fetching | **SWR** (87 files) over hand-rolled `src/api.ts` `fetcher()` (offline check throws `OFFLINE_ERROR`, `humps` camelization, proxied to QuranFoundation API v4) | `src/api.ts:76-90`, `src/utils/apiPaths.ts` |
| i18n | **next-translate** (`i18n.json`, 19 locales, default `en`); per-locale defaults in `src/redux/defaultSettings/locales/{ar,en,...}.ts` | `i18n.json` |
| Styling | **SCSS CSS Modules** + own **DLS** library (`src/components/dls/`) on **Radix primitives** (dialog, dropdown-menu, popover, slider, switch, tabs, tooltip, direction, visually-hidden…) | `package.json` deps; README DLS section |
| Other libs | react-hook-form, react-share, react-toastify, react-hotkeys-hook, @milkdown (notes editor), fuse.js (client-side translation filtering only) | `package.json` |
| Testing | vitest (colocated tests), Playwright integration, Storybook stories everywhere | `package.json` scripts |

**Key insight**: no RTK Query, no React Query — plain SWR + tiny URL-builder modules (`utils/apiPaths.ts` mirrors API v4 paths 1:1). Redux holds *persisted preferences + UI state*; server state lives in the SWR cache.

## Reading experience

- **Three reading modes** via `readingPreferences` slice: `ReadingView` (mushaf — renders **pages → lines** via `groupPagesByVerses.ts`/`groupLinesByVerses.ts`, `Page.tsx`, `Line.tsx`, Tajweed bar), `TranslationView` (per-verse cells with inline actions), `TafsirView` (dedicated full-screen tafsir reader). `ReadingPreferenceSwitcher` + `MobileReadingTabs` (`src/components/QuranReader/`).
- **Per-locale defaults decide the mode**: `defaultSettings/locales/ar.ts:14` sets Arabic users to mushaf `Reading` with **no translations**; default Arabic tafsir = slug `ar-tafseer-al-qurtubi` (line 6). A pattern worth copying wholesale.
- **Ayah interactions** (verified):
  - Inline: play-verse-audio, bookmark icon, pin (`src/components/Verse/*`).
  - Overflow menu `OverflowVerseActionsMenuBody`: **Pin, AdvancedCopy, Word-by-Word, RepeatAudio, TranslationFeedback, Embed widget**, Share submenu (`src/components/Verse/OverflowVerseActionsMenuBody/index.tsx:34-72`).
  - Central modal container gated by `verseActionModal` slice: `AdvancedCopyModal`, `BookmarkModal`, `FeedbackModal`, `NotesModals` (milkdown editor), `ReaderBioModal`, with study-mode restore (`src/components/QuranReader/VerseActionModalContainer/index.tsx`).
  - **Advanced copy**: range selection + format options + URL building (`src/components/Verse/AdvancedCopy/*`).
- **Word-by-word**: word tap → `WordPopover`/`WordActionsMenu`; per-word audio mp3s `https://audio.qurancdn.com/wbw/001_002_001.mp3` (`src/utils/audio.ts:23-29`); word-translation locale is a setting (`selectedWordByWordLocale`).
- **Tafsir UX**: `TafsirBody.tsx` loads the tafsir *list* per language (`makeTafsirsUrl`) and content (`makeTafsirContentUrl`) via `useSWR` immutable; language picker → tafsir picker, **prev/next ayah + surah navigation** (`SurahAndAyahSelection`), end-of-scrolling actions; `selectedTafsirs` is an array (multi-tafsir) with `isUsingDefaultTafsirs` tracking (`src/redux/slices/QuranReader/tafsirs.ts:16-24`).
- **Search**: command-bar (⌘K) + **voice search** (`Search/VoiceSearch`, `useVoiceSearch`, custom audio-worklet in `src/audioInput/`), search history, filters (translations/language), query suggestions, term-highlighted results (`SearchResultText`); server search via `getNewSearchResults` (API v4). `fuse.js` only filters translation lists client-side.
- **No virtualization in the reader**: verses load by **infinite scroll** (`useInfiniteScroll` + `getPagesLookup`); `react-virtuoso` only for collections/notifications lists (`src/components/MyQuran/*`, `Notifications/*`).

## Audio player

- **Global player** = XState machine in a React context (`AudioPlayerMachineContext`); only *preferences* persist through Redux (`AudioPlayer/state.ts`: `enableAutoScrolling`, `isDownloadingAudio`, `showTooltipWhenPlayingAudio`, `repeatSettings`).
- **Verse timing**: per-surah audio data + timestamps from API v4 (`getChapterAudioData`, `getVerseTimestamps` → segments `timestampFrom/timestampTo`); `useActiveVerseTiming.tsx:16-38` memoizes the last active verse to avoid rescanning each tick; word-level highlight via `useMemoizedHighlightedWordLocation`.
- **Repeat / A-B loop**: `RepeatSettings { from, to, repeatRange, repeatEachVerse, delayMultiplier }` with **`-1` sentinel for Infinity** (`src/redux/types/AudioState.ts:6-20`); `RepeatAudioModal` + `SelectRepetitionMode`; `rangeCycleMachine`/`verseCycleMachine` drive cycling; "Repeat" lives in both player bar and ayah menu.
- **Controls**: playback-rate menu, volume, ±seek, slider, remaining-range count, **reciter picker** (per-locale default), download button, auto-scroll toggle, keyboard shortcuts (`AudioKeyboardListeners.tsx`), **Media Session metadata**, Radio (stations).
- **URLs**: recitation mp3s on `audio.qurancdn.com` (QDC; runtime config also references `download.quranicaudio.com` full-file mp3s); per-word `wbw/*.mp3`; reciter `relativeUrl` from API v4.
- **Documented gotcha**: Safari fires no `onWaiting`; they simulate CAN_PLAY/WAITING and re-seek — 30-line comment in `audioPlayerMachine.ts:31-59`.

## Data layer & API usage

- `src/api.ts` exports ~32 endpoint functions, all API v4 via `utils/apiPaths.ts`: `verses/by_chapter/:id`, `verses/by_range`, `verses/filter`, `chapters` (+`info`, `metadata`), `tafsirs` + tafsir content, translations info, audio (chapter audio data, verse timestamps), reciters + reciter data, new search, pages lookup, footnotes, qiraat matrix/junctures, hadiths-by-ayah + counts, layered translations + counts, languages, word-by-word translations, advanced copy.
- **Caching**: SWR (`useSWR`/`swr/immutable`) + mutate helpers (`useMutateWithoutRevalidation`, `useMutateMultipleKeys`, `useBookmarkCacheInvalidator`). Preferences persist via **redux-persist with 48 versioned migrations** — the strongest local-first pattern in the repo.
- **Fonts** (`src/components/Fonts/FontPreLoader.tsx`): locale-aware `<link rel="preload">` lists — Arabic UI = `NotoNaskhArabic-Regular.woff2` + `kitab-base(.bold).woff2`; English = Figtree; Quran reader = **`UthmanicHafs1Ver18.woff2`** (QCF), Indopak v4.2.1 for ur/bn/id. Fonts served with `Cache-Control: max-age=31536000, immutable` (`next.config.js:110-117`); `useQcfFont` + `font-faces` slice + `useIsFontLoaded` gate mushaf render on font readiness (no FOUT).
- **Long lists**: infinite scroll + pages-lookup pagination instead of virtualization.

## Performance & PWA

- **PWA**: `next-pwa` (Workbox) production-only (`next.config.js:19-29`), custom `pwa-runtime-config.js` runtime caching (CacheFirst for google fonts, SWR for static assets) — with a documented decision to **disable MP3 SW caching** (cached mp3s break in Firefox; header comment in `pwa-runtime-config.js`). Precache excludes most fonts/icons/images.
- Images avif/webp; `removeConsole` in prod; bundle analyzer; Sentry; sitemap generation; per-verse SEO text (`SeoTextForVerse.tsx`); server-side API proxy (`getProxiedServiceUrl`) hides the upstream host.
- Code splitting is per-page (Pages Router native); no per-surah splitting beyond data fetching.

## RTL / i18n / typography

- `getDir(locale)` → `<Html dir lang>` in `src/pages/_document.tsx:14`; `useDirection` reads router locale (`src/hooks/useDirection.ts`); Radix `Direction` primitive wraps menus. next-translate namespaces per page in `i18n.json`.
- **Per-locale defaults files** (`src/redux/defaultSettings/locales/*.ts`, 21 locales) set reading mode, translations, tafsir, reciter — Arabic-first defaults done right.
- `eslint i18next/no-literal-string` forbids hardcoded strings (`TafsirBody.tsx:3`).
- Mushaf font scaling + font-faces readiness tracked in Redux slices (`QuranReader/styles`, `font-faces`).

## Accessibility

- Radix primitives (focus scope, tooltip, visually-hidden) across `dls/`; `jsx-a11y` linting; keyboard shortcuts (`react-hotkeys-hook`, `AudioKeyboardListeners.tsx`); Storybook per DLS component. Solid baseline, nothing exotic.

## What to ADOPT / ADAPT / LEARN for Azkar App (React SPA + Capacitor)

### P0 (do first)
1. **ADAPT — Ayah action-menu + single modal container** (M): overflow menu with submenus (copy/share/tafsir/notes) + one central "modal type" state object instead of scattered dialogs. Model: `OverflowVerseActionsMenuBody` + `verseActionModal` slice.
2. **ADOPT — Repeat-audio design** (M): `RepeatSettings` shape (`from`/`to` verse keys, `repeatRange`, `repeatEachVerse`, `delayMultiplier`, `-1 = ∞`) + modal; with our per-surah audio cache, verse-range cycling is pure client logic.
3. **ADOPT — Verse-timing segments for highlight & tap-to-seek** (M): bundle/fetch `verseTimings` (`timestampFrom/To` + word positions) per reciter; the memoized active-verse lookup (`useActiveVerseTiming`) is ~20 lines and conceptually portable.
4. **ADAPT — Per-locale defaults files** (S): `defaultSettings/locales/ar.ts` pattern prepares us for English later: default mode/tafsir/reciter per locale with `isUsingDefaultX` tracking + "reset" middleware.
5. **ADAPT — Font readiness gating + immutable font caching** (S): preload Uthmani/Kitab fonts, gate mushaf render on `document.fonts` readiness, long-lived immutable caching in PWA precache.

### P1
6. **ADAPT — Tafsir switching UX** (M): full-screen tafsir view with language→tafsir two-step picker, prev/next ayah navigation, end-of-scroll actions, multi-tafsir selection; default per locale (Arabic → Qurtubi/Muyassar).
7. **ADOPT — Word-by-word** (M/L): word tap popover + per-word `wbw/001_002_001.mp3` audio + chosen word-translation locale; needs word data in our bundled JSON (API v4 `words=true` shape is the reference).
8. **ADOPT — Versioned local-store migrations** (S): redux-persist's `version: 48 + createMigrate` model applied to our idb-keyval/SQLite settings store.
9. **ADOPT — Advanced copy** (M): verse-range copy dialog with format options (with/without tafsir/translation, footnote markers) + canonical URL builder.
10. **ADOPT — Offline-aware fetcher** (S): `navigator.onLine` check throwing a typed `OFFLINE_ERROR` for a distinct offline UI state.
11. **LEARN — Search UX** (M): command bar + suggestions + history + result highlighting; for us a simplified suggestions + highlight layer over bundled search.

### P2
12. **LEARN — XState for audio** only if our player grows radio/multi-reciter complexity; the repeat/range/verse sub-machine split is instructive but a reducer + context likely suffices.
13. **LEARN — i18n for future English**: next-translate namespace pattern + `getDir(locale)` + per-locale defaults; no Next built-in i18n used.
14. **LEARN — DLS/Storybook discipline** (L): shared primitives + stories; long-term maintainability play.
15. **LEARN — Media Session metadata** (S) for lock-screen playback controls in Capacitor/PWA.

## Risks / gotchas

- **License**: code is MIT but README forbids copying the project; the clone lacks the LICENSE file — treat as "patterns only, verify content licenses separately" (QCF/KFGQPC font license, tafsir/translation copyrights, recitation rights).
- **next-pwa is effectively unmaintained**, and they had to disable mp3 SW caching due to a Firefox SW bug — for our PWA, prefer our existing Capacitor-FS audio cache over Workbox caching.
- Their data layer assumes a **server proxy + live API**; we're offline-first — endpoints/params are a good schema reference, but don't import `api.ts` directly.
- Reader is not virtualized; fine for SSR + infinite scroll, but our bundled-full-Quran approach should keep per-surah rendering.
- Pages Router (not App Router) — newer Next App-Router conventions won't map; don't over-index on their file conventions.
- Huge clone (~15k files) — avoid whole-tree globs; everything relevant is under `src/`.

## Key links

- Repo: https://github.com/quran/quran.com-frontend-next
- Storybook: https://quran.github.io/quran.com-frontend-next/storybook/master
- Repo architecture docs: `.agents/quran/standards/repo-context.md` (in clone)
- API v4: https://api-docs.quran.foundation/
