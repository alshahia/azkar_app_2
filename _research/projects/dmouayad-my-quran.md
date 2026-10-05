# Research Report: DMouayad/my_quran ("My Quran | قرآني")

> **Scope note:** This is **not** a full Islamic-suite app. It is a **minimal, audio-free, notification-free, fully-offline Quran *reader*** with two riwayat (Hafs + Warsh). It is the wrong sibling for feature-parity, and the **right** sibling for reading-experience, search, data-packaging, and release engineering. Everything below is verified from the local shallow clone unless marked otherwise.

---

## 1. Project overview

| Item | Finding | Evidence |
|---|---|---|
| What it is | Lightweight offline Quran reader; Madani page mode + "Book" (list) mode; Hafs 'an Asim + Warsh 'an Nafi; fast local search | `README.md`, `pubspec.yaml` ("A minimal app to read the Quran") |
| Positioning | "Lightweight. Fast search. No internet required. No analytics." Distributed via **F-Droid, IzzyOnDroid, GitHub Releases, and a PWA** (dmouayad.github.io/my_quran) | `README.md` |
| Version | `1.8.0+24`; 13 releases tracked in `fastlane/version_map.txt` (build 13=1.0.0 → 243=1.8.0) | `pubspec.yaml:6` |
| Maturity | Active, small-community project: CHANGELOG credits external contributors (Hy4ri, XxA7med66xX, Tid0lla, M57). **Shallow clone → exact last-commit date unavailable; GitHub API rate-limited (403) at research time** | `CHANGELOG.md` |
| License | **GPL-3.0** (full text at `LICENSE`). Permits: read, learn, reuse *ideas*, run, fork under GPL. **Forbids: copying code/assets into a non-GPL app.** Quran text itself is not copyrightable, but specific editions/fonts carry their own licenses (see §13) | `LICENSE` |
| Android package | `com.dmouayad.my_quran`, label "قرآني", **no INTERNET permission** | `android/app/build.gradle.kts:28`, `AndroidManifest.xml` |

## 2. Tech stack & architecture

- **Dart / Flutter 3.44.6** (pinned in `.flutter-version`), Dart SDK `>=3.12.0`. Targets: Android, Linux (AppImage), Windows, **Web/PWA**.
- **Android**: minSdk = Flutter default, target/compile **36**, Java 17, R8 minify + shrinkResources, `dependenciesInfo` disabled (reproducibility/privacy) — `android/app/build.gradle.kts`.
- **Dependency surface: only 12 runtime deps** (`pubspec.yaml`): `archive`, `collection`, `dynamic_color`, `file_selector`, `flutter_localizations`, `package_info_plus`, `path_provider`, `scrollable_positioned_list`, `share_plus`, `shared_preferences`, `uuid`, `wakelock_plus`. **No audio, no notifications, no HTTP, no SQL, no state library.**
- **State/DI**: vanilla Flutter — `SettingsController extends ChangeNotifier` (`lib/app/settings_controller.dart:10`), `ListenableBuilder` in `main.dart`, `ValueNotifier` for mushaf data (`Quran.instance.data`) and highlighted verse. No bloc/riverpod/provider/get_it.
- **Singletons over DI**: `Quran.instance`, `QuranPageTextCache.instance`, static `SearchService`.
- **Layout**: `lib/app` (UI + services + widgets), `lib/quran` (data domain: page/juz/hizb/sajdah metadata + `quran.dart` engine), `lib/tool` (Dart CLI generators run at development time). 44 dart files total, zero tests (§10).
- **Linting**: `very_good_analysis` (strict) — `analysis_options.yaml`.

## 3. User-facing features

| Feature | Note |
|---|---|
| ⭐ Mushaf page mode | Horizontal page-swipe with real Madani page layout metadata (surah ranges per page, 604 pages) — `hafs_page_data.dart`, `warsh_page_data.dart` |
| ⭐ Book mode | Continuous vertical list rendering; **reading position preserved when switching modes** (`CHANGELOG.md` 1.4.x) |
| ⭐ Two riwayat + 4 fonts | Hafs (KFGQPC text + HafsSmart font), Warsh (Quran Complex text + Uthmanic Warsh v21), Madinah mushaf text for Rustam/Scheherazade fonts — font choice **switches the dataset** (`quran.dart:37-48`) |
| ⭐ Fast Arabic search | 5 match modes (auto/exact/prefix/contains/flexible) × AND/OR operators, matched-word highlight, 200-hit cap (`models.dart:307-330`, `search_service.dart`) |
| Flexible search mode | Strips leading clitics (و ف ب ك ل س) and "ال" before prefix match — handles user-typed morphology (`search_service.dart:357-378`) |
| Quick navigation | Tap surah/juz/page number **in the page header** to open navigation; navigation sheet with tappable "wheels" (`navigation_sheet.dart`, changelog 1.2.x) |
| Bookmarks + categories | Named categories with colors, visual indicator on verse number, auto-bookmark when only one category exists (`bookmark_service.dart`, 1.8.0 changelog) |
| ⭐ Notes | Standalone notes entity, multiple per verse, manager UI (`notes_service.dart`, `verse_notes_manager.dart`) |
| Reading position | Saved as JSON (page/surah/verse/juz/hizb/quarter), restored on launch, **last-position verse highlighted** (`reading_position_service.dart`) |
| ⭐ Hands-free auto-scroll | 1–12 "pages/min" presets + slider, haptic ticks (`auto_scroll_sheet.dart`) |
| Keep screen on | `wakelock_plus` while reading |
| Themes | myQuran / **Sepia** / **Material You dynamic** (`dynamic_color`); light/dark + **true-black AMOLED option**; per-font font weight, line-height, text align (justify/center/start), font size |
| Verse menu | Long-press/right-click dialog: copy, share, quran.com deep link, bookmark, notes (`verse_menu_dialog.dart`) |
| ⭐ Backup/restore | Versioned JSON backup with **preview (counts, schema version, app version) + merge vs replace import**; web download / mobile share sheet / desktop picker (`backup_service.dart`) |
| What's-new dialog | In-app changelog display (`whats_new_dialog.dart`, `tool/whats_new_generator.dart`) |
| Extras | Sajdah verses data, hizb/quarter display options, landscape reading mode, PWA |

**Not present (deliberately):** audio/recitation, prayer times, azkar, tafsir, translations, notifications, accounts, ads, analytics.

## 4. Quran content & data

- **100% bundled assets, zero downloads, zero APIs.** No HTTP code exists outside quran.com *outbound deep links* (`quran.dart:308-315`) and a provenance comment.
- Datasets (`assets/`, measured sizes): `kfgqpc_hafs.json` 1.9 MB (KFGQPC Hafs text), `quran.json` 1.4 MB (Madinah mushaf text for Rustam/Scheherazade), `warsh.json` 1.4 MB (Warsh), `search_index_{hafs,warsh}.json` ~840 KB each, fonts ~1.26 MB (HafsSmart 294 KB, Uthmanic Warsh v21 851 KB, Rustam 96 KB, Scheherazade subset 22 KB).
- **Warsh provenance**: raw JSON from **https://qurancomplex.gov.sa/quran-dev/**, converted at dev-time by committed CLI `lib/tool/convert_warsh.dart` (strips symbols, restructures to `{surah: {verse: text}}`).
- **Search indexes precomputed at dev time** by `lib/tool/search_index_generator.dart`: inverted index (normalized word → verse ids `surah*1000+verse`), one file per riwayah.
- **Page layout as Dart constants**: `hafs_page_data.dart` / `warsh_page_data.dart` list `{surah, start, end}` per page; juz/hizb/sajdah tables separate (`juz_data.dart`, `hizb_data.dart`, `sajdah_verses.dart`). Reverse maps verse→page and surah→pages built at startup (`quran.dart:75-100`).
- **Font↔dataset coupling** is the core trick: visual fidelity of a riwayah comes from *pairing* a text edition with its matching Quranic font (e.g. HafsSmart + KFGQPC text) — no page images, no per-page layout engine.
- Engineering quality: JSON parsed in a **background isolate** (`compute`, `quran.dart:50-65`); **LRU cache of 30 built pages** keyed by data-revision, invalidated on riwayah switch (`quran_page_text_cache.dart:44-76`); verse segments carry **char offsets + end-symbol spans** for precise highlighting (`quran_page_text_cache.dart:7-21`).
- Updates: data ships with app releases (no OTA content updates); versioning = app version.

## 5. Audio & recitation

**None.** No `just_audio`/`audioplayers`, no download manager, no background playback. Confirmed by pubspec + full-source grep. Their reading UX competes with nothing — silence is a feature here.

## 6. UI/UX patterns worth copying

1. **⭐ Pixel-accurate verse highlight scroll**: an inline `WidgetSpan` sentinel holds a `GlobalKey`; `Scrollable.ensureVisible` scrolls to the verse's exact pixel position regardless of font size (`home_page.dart:56-59`) — the web equivalent is a zero-height anchor span + `scrollIntoView`.
2. **Dual reading modes with shared state**: page-swipe mushaf ↔ continuous scroll, keeping position when switching (`home_page.dart:71-73`, changelog 1.4.3); `PageController` + `scrollable_positioned_list`.
3. **Header-embedded quick navigation**: surah/juz/page numbers in the header are *buttons* — one tap from any page to the navigation sheet.
4. **Search UX**: mode selector + highlight of the exact matched word inside truncated result cards (`SearchHit.matchedWordIndexes`, `models.dart:333-344`; changelog 1.2.4).
5. **Auto-scroll sheet**: speed in pages/min with quick presets and haptic selection clicks (`auto_scroll_sheet.dart:18-27`) — a great "hands-free tilawa" pattern.
6. **Arabic typography controls**: per-riwayah default font weight (`fontWeightForCurrentFamily`), line-height, alignment options, word-gap fixes at large font sizes (changelog 1.2.5).
7. **Backup UX**: preview dialog before import + merge/replace choice — trust-building for destructive operations.
8. Material 3 + `dynamic_color` (device accent as seed), Sepia + true-black, edge-to-edge with transparent status bar (`main.dart:39-48`), web context-menu disabled so right-click opens the verse menu on PWA (`main.dart:52-55`).
9. **What's-new dialog** on update — cheap retention/communication loop.

## 7. Offline & storage

- **No SQL DB. Everything is `shared_preferences`** (`SharedPreferencesAsync`): settings as individual keys (`settings_service.dart`), bookmarks/notes as JSON blobs (`bookmark_service.dart`, `notes_service.dart`), reading position as JSON (`reading_position_service.dart`).
- Migration pattern: **flag-keyed idempotent migration** (`migrated_bookmark_notes_v2`) that moves notes out of bookmarks with dedupe keys (`data_migration_service.dart:10-58`).
- In-memory: LRU page-text cache with revision invalidation (§4).
- Backup: JSON envelope `{schema: 'com.my_quran.backup', schemaVersion: 1, createdAt, counts, appVersion, appBuild}`; **merge or replace** import with preview (`backup_service.dart:15-115`). Cross-platform save via `share_plus`/`file_selector`/`XFile.saveTo` (web = browser download).
- No sync (privacy stance), no accounts.

## 8. Notifications & background work

**None.** No `flutter_local_notifications`, no `workmanager`, no alarms — grep of pubspec + `lib/` confirms. Their brand promise: nothing runs in the background.

## 9. i18n

- **Arabic-only UI**: `supportedLocales: [Locale('ar')]` (`main.dart:95`); a `language` setting key exists (default `'ar'`, `settings_service.dart:17-24`) but only `ar` ships.
- Store metadata is **bilingual** (fastlane `ar` + `en-US` full/short descriptions and per-build changelogs).
- RTL is native (single-locale Arabic app); bidi markers and PUA glyphs are actively **stripped in normalization** (`processor.dart:20-28`).

## 10. Testing / CI / release engineering

- **Tests: none.** No `test/` directory (44 dart files, all in `lib/`); `flutter_test` is declared but unused. Biggest engineering weakness.
- **CI: one strong workflow** (`.github/workflows/release.yml`, tag push or manual dispatch):
  - Pinned Flutter version from `.flutter-version`.
  - **Reproducible APK builds** via `obfusk/reproducible-apk-tools` (zipalign + re-sign) — an F-Droid requirement they actually implement.
  - ABI-split APKs with **derived version codes** `build*10+2` (armv7) / `build*10+3` (arm64).
  - Keystore decoded from CI secrets; `dependenciesInfo` stripped from APKs/bundles.
  - Linux AppImage + portable archive; **GitHub Pages PWA deploy** job.
- **Release metadata**: fastlane title/descriptions/per-build changelogs in ar + en-US; `version_map.txt` maps build→version for F-Droid; hand-curated `CHANGELOG.md`; issue templates + PR template + CONTRIBUTING.md.

## 11. Monetization / privacy / analytics

None. No ads, no IAP, no analytics, no crash reporting, no network permission at all. Privacy-by-architecture is part of the product pitch ("خصوصية تامة"); F-Droid/IzzyOnDroid presence corroborates.

## 12. Recommendations for **Azkar App** (React 18 + Capacitor)

Our stack (from `package.json`): React 18 + Vite + Tailwind, Capacitor 8, `@capacitor-community/sqlite` + `idb-keyval`, `adhan`, `@tarekeldeeb/quran-madina-react` mushaf lib, `@google/genai`; components include `SurahReaderScreen`, `AyahCard`, `TafsirSheet`, `AudioMiniPlayer`, `AudioDownloadSheet`, `SearchScreen`; we have vitest unit tests and eslint jsx-a11y.

### ADOPT (do the same thing)
| # | Item | Why (evidence) | Priority | Effort |
|---|---|---|---|---|
| A1 | **Upgrade backup/restore to their UX spec**: versioned JSON envelope (schema id + `schemaVersion`), **preview dialog with counts before import**, explicit **merge vs replace**, timestamped filename | §7; their `BackupPreview` flow is best-in-class | **P0** | **M** |
| A2 | **Idempotent, flag-keyed data migrations** for our SQLite/IDB schemas (their `migrated_bookmark_notes_v2` pattern + dedupe keys) | §7 `data_migration_service.dart` — we ship SQLite + backups; schema evolution will bite us | **P0** | **S** |
| A3 | **Arabic normalization module for Quran/azkar search**: strip Quranic marks (U+0610–061A, 064B–065F, **06D6–06ED**, 08D3–08FF), fold dagger-alif/small letters *before* stripping, alef/hamza/taa-marbuta/alef-maksura folding, PUA + bidi removal, spelling-variant table (الرحمن/الرحمان…) | §4 `processor.dart` — port the *rules* (not the code) to TS | **P0** | **M** |
| A4 | **Reading position** persisted with juz/hizb granularity + "highlight where you stopped" on reopen | §3, `reading_position_service.dart` | P1 | S |
| A5 | **What's-new dialog** driven by a generated changelog after updates | §6.9, `whats_new_generator.dart` | P1 | S |
| A6 | **Keep-screen-on while reading** (Screen Wake Lock API on PWA / plugin on Android) | §3 | P2 | S |
| A7 | **Fastlane-style release metadata + derived version codes + reproducible-build habit** for our Capacitor Android CI | §10 | P2 | M |

### ADAPT (their idea, our stack)
| # | Item | How for us | Priority | Effort |
|---|---|---|---|---|
| B1 | **⭐ Verse-segment text model with char offsets** (`VerseSegment{start,end}` + end-symbol spans + LRU page cache with revision invalidation) | TS module building per-page segments once, memoized per (mushaf, page); enables precise `<mark>` highlighting and anchor scrolling in `SurahReaderScreen`/`AyahCard` without re-splitting text every render | **P0** | **M** |
| B2 | **Precomputed build-time search index** (normalized word → ayah id) + **bigram index for contains-search** built lazily on device, + match modes (exact/prefix/contains/**flexible with clitic stripping**) and AND/OR operators | Vite build script emitting `search_index.json` from our bundled Quran JSON; search in a Web Worker, 200-hit cap; replaces brute-force scans of the whole mushaf in `SearchScreen` | **P1** | **M** |
| B3 | **Dual reading modes** (mushaf page-swipe ↔ continuous scroll) preserving position across switches | CSS scroll-snap pages + virtualized list; mode toggle in reader; `idb-keyval` for position store | P1 | M |
| B4 | **Header quick-nav**: surah/juz/page numbers as tappable controls opening a navigation sheet | Small change to `SurahPageHeader.tsx`/`PageFooter.tsx` | P2 | S |
| B5 | **Auto-scroll reading mode** (pages/min presets, haptics via Capacitor Haptics) | rAF-based scroller in reader | P2 | S |
| B6 | **Backup preview/merge UI** — UI side of A1 | `SettingsScreen.tsx` | P1 | S |

### LEARN (inspiration, not directly applicable)
- **L1 — Radical dependency minimalism** (12 deps vs our ~25 runtime): every plugin is a maintenance + reproducibility liability; audit ours for what could be 50 lines of platform code.
- **L2 — Font↔text-edition pairing** as the way to render riwayah fidelity — relevant if we ever add Warsh or page-fidelity modes: pick (text dataset, Quranic font) *pairs*, not one global font.
- **L3 — Parse big JSON once off the main thread** (they use `compute`); for us: load mushaf JSON in a Web Worker and keep only the page window in memory.
- **L4 — Reproducible builds + F-Droid metadata discipline** as a trust artifact for a privacy-first app (`release.yml` is a template worth reading before our first F-Droid attempt).
- **L5 — The "no background work" product stance**: a zero-notification app proves a privacy promise can *be* the feature — useful counterweight as we expand reminders.

## 13. Risks / gotchas

- **GPL-3.0 copyleft**: copying any *code* from this repo into Azkar App would obligate us to GPL-3.0 + source disclosure. **Reimplement ideas; never paste code.** Verse↔page mapping *facts* are fine; their JSON *files* as redistributed data are legally gray — regenerate from primary sources instead.
- **Font licensing is separate from the repo license**: `HafsSmart.ttf`/`uthmanic_warsh_v21.ttf` are **KFGQPC** fonts (free use, own license terms — no standalone resale), Scheherazade subset is SIL OFL. The repo ships **no THIRD-PARTY-NOTICES** — if we bundle these fonts, fetch from KFGQPC directly and keep their license files.
- **No tests at all** — do not import their engineering confidence; the changelog shows regression chains ("FIX: fixed X" repeatedly).
- **SharedPreferences-as-DB** works only because the data model is tiny (JSON blobs); our SQLite is strictly better — don't emulate.
- **God-widget smell**: `home_page.dart` is 1,469 lines with an in-code "will refactor soon" comment (`home_page.dart:1`) — a caution for our `SurahReaderScreen`.
- **Asset weight**: ~7.6 MB bundled data+fonts — fine for an APK, **painful as PWA first-load**; keep our PWA Quran JSON lazy/streamed per-surah.
- Shallow clone: no commit history → activity dates unverified; GitHub API rate-limited at research time.

## 14. Key links

- Repo: https://github.com/dmouayad/my_quran (local clone: `_research/repos/my_quran`)
- Releases: https://github.com/dmouayad/my_quran/releases/latest
- PWA: https://dmouayad.github.io/my_quran/
- F-Droid: https://f-droid.org/packages/com.dmouayad.my_quran · IzzyOnDroid: https://apt.izzysoft.de/fdroid/index/apk/com.dmouayad.my_quran
- Warsh text source: https://qurancomplex.gov.sa/quran-dev/ (via `lib/tool/convert_warsh.dart`)
- Outbound deep links: https://quran.com/{surah}/{verse} (`quran.dart:308-315`)
- Reproducible-build tooling: https://github.com/obfusk/reproducible-apk-tools
