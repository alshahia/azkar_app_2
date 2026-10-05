# quran_android (Quran for Android) — Research Report

> Research consumer: **Azkar App** (React 18 + TS + Vite + Tailwind + Capacitor 8, Arabic-only RTL, local-first).
> Subject: local shallow clone at `_research/repos/quran_android` (HEAD `42d51e96a`, 2026-09-03, "Update agp to v9.4.0").
> Note: GitHub REST API was unreachable from this sandbox, so stars/forks are **not** quoted; all findings below are verified from local files (paths cited).

---

## 1. Project overview

| Item | Finding | Evidence |
|---|---|---|
| What | "Quran for Android" — "a simple (Madani based) Quran app" by Quran.com / quran labs | `README.md:11` |
| Distribution | Google Play (`com.quran.labs.androidquran`), IzzyOnDroid, GitHub Releases | `README.md:13-21` |
| Version | 3.6.3 / versionCode 3630 | `app/build.gradle.kts` |
| Activity | HEAD commit 2026-09-03 (AGP 9.4.0 bump) — actively developed at cutting edge | `git log -1` on shallow clone |
| Maturity | One of the oldest open-source Quran Android apps (Play listing + versionCode 3630; exact founding year not verifiable from shallow clone). Deps are on the *bleeding edge* (AGP 9.4, Kotlin 2.4.10, Compose BOM 2026.08) | `gradle/libs.versions.toml` |
| License | **GPL-3.0** (code). Data typically **CC BY-NC-ND** from scholars/publishers | `LICENSE:1-2`, `README.md:61` |
| Legal takeaway for us | **Do not copy code or images into Azkar App.** GPL is viral: reusing Kotlin code would force GPL on our app. CC BY-NC-ND data forbids derivatives/commercial use. The value here is **architecture & UX patterns**, not code. README explicitly frames the project as non-profit and warns bandwidth (android.quran.com) is volunteer-funded — don't leech their servers. | `README.md:53-61` |

## 2. Tech stack & architecture

- **Language:** Kotlin 2.4.10 (with legacy Java files: `AudioService.kt` is Kotlin, but `TranslationView.java`, `QuranDownloadNotifier.java` remain), AGP 9.4.0.
- **SDK:** compileSdk 37, minSdk 23, targetSdk 36 (`build-logic/.../AndroidCommon.kt:8-9`, `AndroidApplicationConventionPlugin.kt:27`).
- **UI:** hybrid — legacy **Android Views** core (PagerActivity, fragments, RecyclerView) + **Jetpack Compose** for new feature modules (Compose BOM 2026.08.00). Navigation: androidx Navigation-Compose + ViewPager for mushaf pages.
- **DI:** **Metro 1.4.2** (`dev.zacsweers.metro`) — the Dagger successor; applied via convention plugins.
- **DB:** **SQLDelight 2.3.2** (typed SQL, migration verification in CI, Paging3 extensions).
- **Network:** OkHttp 5.5 (BOM) + Retrofit 3, Moshi, custom **DNS-over-HTTPS via 1.1.1.1 + dnsjava** fallback (`common/networking/.../DnsModule.kt:39`, pinned ISRG Root X1 in `NetworkModule.kt:78`).
- **Async:** Coroutines + RxJava 3 coexisting; Molecule for Compose-friendly flows.
- **Audio:** Media3 ExoPlayer 1.11.0 (`libs.versions.toml`), legacy `MediaSessionCompat` in main app; pure Media3 in the Android Auto module.
- **Background:** WorkManager 2.11.2.
- **Modularization:** ~35 Gradle modules via `includeBuild("build-logic")` convention plugins (`settings.gradle.kts`):
  - `common/*`: audio, bookmark, data, di, download, networking, pages, reading, linebyline(data/ui), recitation, preference, search, toolbar, translation, upgrade, mapper/imlaei, analytics, ui/core.
  - `feature/*`: audio, audiobar, ayahbookmark, downloadmanager, linebyline, qarilist, recitation, sync, autoquran, **analytics-noop vs firebase-analytics** (swappable).
  - `pages/*`: madani page provider + `pages/data:madani` / `pages/data:warsh` (two riwayah data sources).
  - `autoquran`: **separate application module** (Android Auto).
- **Flavors/buildTypes:** flavor dimension `pageType` (madani); buildTypes debug / beta / release, all release builds minified+shrunk (`app/build.gradle.kts`).
- **DX/quality:** errorprone, Kover coverage, LeakCanary, Timber, Renovate, committed code-style XML.

## 3. User-facing features (verified)

| Feature | Note |
|---|---|
| ⭐ Mushaf **page-image mode** | Madani page images (v8) with per-ayah tap highlight from a downloaded `ayahinfo` coordinates DB |
| ⭐ **Line-by-line mode** | Extra feature rendering each mushaf line as an image with ayah/word-level selection math (`feature/linebyline`: SelectionHelper, LineModel, SidelineModel) |
| **Translations mode** | Downloaded translation DBs, footnotes (`TranslationFootnoteHelper`), inline Arabic + translation rows, per-translation font size (`ui/translation/*`) |
| ⭐ **Audio: gapless + gapped qaris** | ~25 reciters incl. English (Ibrahim Walk); gapless full-sura files vs gapped per-ayah folders — unified behind one player |
| **Audio download manager** | Resumable, per-surah or whole-qari, with progress notifications (`service/QuranDownloadService.kt`, `DownloadStrategy.kt` trio) |
| ⭐ **Continuous audio queue** | `service/AudioQueue.kt` + `SuraAyahExtension.kt` — playback flows across sura boundaries with verse-range requests |
| ⭐ **Android Auto** | `autoquran` app module: Media3 browsable audio service (`QuranBrowsableAudioPlaybackService.kt`, `BrowsableSurahBuilder.kt`, recent playback recorder) |
| ⭐ **Recitation tracking** | Live mic → Google Cloud Speech (gRPC) → highlights the ayah/word being recited (`common/recitation` RecitedAyah/RecitedWord, `feature/recitation` presenters) |
| **Bookmarks + tags + last page** | SQLDelight `Bookmark.sq`, `BookmarkTag.sq`, `Tag.sq`, `LastPage.sq`; ayah long-press toolbar (`common/toolbar`) |
| ⭐ **Optional account sync** | OIDC **PKCE** (no client secrets) via `com.quran:mobile-sync` artifact; issuer/redirect configurable per build from `oauth.properties` — sync-optional, self-hostable (`app/build.gradle.kts` androidComponents block, `feature/sync/*`) |
| **Home-screen widgets** | Bookmarks widget (RemoteViewsService list) + search widget (`app/.../widget/*`) |
| ⭐ **Foldable two-page mode** | `PagerActivity.kt:302-313` reads `FoldingFeature` (vertical, FLAT/HALF_OPENED) → shows two mushaf pages side-by-side |
| **Search** | Arabic search w/ imlaei→uthmani mapping (`common/mapper/imlaei` `WordAlignment.sq`) |
| **Page-type picker** | Downloadable page-type "snips" from `https://quran.app/data/pagetypes/snips` (`app/.../pageselect`) — infra for adding riwayahs post-release |
| **Accessibility extras** | Bundled **OpenDyslexic.otf** font |
| ⭐ **Data self-repair** | WorkManager `MissingPageDownloadWorker` + `PartialPageCheckingWorker` silently verify/repair downloaded page images |

Not present (relevant to us): prayer times, azkar, streaks — they deliberately stay a Quran reader. No crash-report opt-in prompt found (analytics decided at build time — §11).

## 4. Quran content & data strategy

**All heavy content is downloaded, versioned, and self-repairing. Only 3 fonts ship in the APK** (`app/src/main/assets`: `kitab.ttf` 67KB, `OpenDyslexic.otf` 211KB, `UthmanTN1Ver10.otf` 169KB). Mushaf rendering needs no Arabic font because the page *images* are pre-rendered.

| Asset | Source (exact URLs from code) | Evidence |
|---|---|---|
| Madani page images | `https://android.quran.com/data/` — `zips/`, `patches/v{N}`, `databases/ayahinfo/` | `pages/madani/.../MadaniPageProvider.kt` |
| Image versioning | `getImageVersion() = 8` + patch URL pattern → incremental patch downloads per version bump | same file |
| Arabic ayah DB | `quran.ar.uthmani.v2.db` (version embedded in filename) | `pages/common/madani/.../MadaniConstants.kt` |
| Translations/tafsirs | quranenc + King Saud University + tanzil (README credits); shipped as zipped DBs under `$baseUrl/databases/`; tafsirs are modeled as translation entries (no separate tafsir subsystem) | `README.md:30`, `MadaniPageProvider.kt` |
| Translation list refresh | Throttled: only if `lastUpdatedTranslationDate > Constants.MIN_TRANSLATION_REFRESH_TIME` | `presenter/translation/TranslationManagerPresenter.kt:58` |
| Audio (gapless) | `https://download.quranicaudio.com/quran/{qari}/` | `MadaniPageProvider.kt` |
| Audio (gapped/ayah) | `https://mirrors.quranicaudio.com/everyayah/{qari}/` | same |
| Gapless timing DBs | `$baseUrl/databases/audio/{qari}.zip` (per-surah ayah timing tables) | `getAudioDatabasesBaseUrl()` + test fixtures `databases/sheikh.zip` |
| Warsh riwayah | Parallel `pages/data:warsh` + `pages/common:warsh` modules — same app can host multiple riwayahs behind `pageType` flavor | `settings.gradle.kts` |
| Page-type snips | `https://quran.app/data/pagetypes/snips` | `app/.../pageselect` |

**Strategy worth copying:** every downloaded artifact is (a) versioned, (b) patchable in place (`patches/v{N}`), (c) integrity-checkable (`MissingPageDownloadWorker`), (d) described by code-level interfaces (`PageProvider`) so a whole riwayah is a swappable Gradle module.

## 5. Audio & recitation architecture

- **Player:** `app/.../service/AudioService.kt` — **Media3 ExoPlayer** with an `audioOnlyRenderersFactory`, `AudioAttributes`, full **audio-focus lifecycle** (transient-loss → pause, resume-on-regain, `AudioService.kt:117-227`), `MediaSessionCompat` + media notification with play/next/prev (`AudioService.kt:1271-1291`), `MediaButtonReceiver` in manifest.
- **Queue:** `AudioQueue.kt` + `SuraAyahExtension.kt` model playback as a verse range that can span suras — gapless and gapped are both just iterators of audio file paths (`common/audio`: `AudioPathInfo`, `AudioRequest`, `GaplessAudioInfoCommand` / `GappedAudioInfoCommand` compute file boundaries from the qari's timing DB).
- **Download strategies:** `service/DownloadStrategy.kt` with `GaplessDownloadStrategy`, `GappedDownloadStrategy`, `SingleFileDownloadStrategy` — one resumable downloader core, three content shapes.
- **Resumability:** partial files (`filename + PARTIAL_EXT`) + `Range: bytes=N-` header + appending sink (`QuranDownloadService.kt:470-493`) → downloads survive process death/network loss.
- **Qari download state cache:** `common/audio/cache/*` — `QariDownloadInfoManager` + `QariDownloadInfoStorageCache` remember exactly which suras of which qari are complete/partial, so the UI shows per-qari per-surah download state offline.
- **Freshness:** `worker/AudioUpdateWorker.kt` periodically checks hosts for new/updated recitations and gapless DBs.
- **Background/auto:** `autoquran` module = pure Media3 `MediaSessionService` with browsable tree (App → Qari → Sura) — Android Auto/Assistant compatible.
- **Recitation:** `common/recitation` models a `RecitationSession` (RecitedAyah, RecitedWord, RecitedSection); `feature/recitation` presenters drive highlights from streaming gRPC Google Cloud Speech results (`grpc-okhttp`, `google-cloud-speech` in `libs.versions.toml`).

## 6. UI/UX patterns worth copying

1. **Pixel-perfect mushaf via images + coordinate overlay** — text layout of Quran is a religious-typography problem; they sidestep it in page mode by shipping images and using the `ayahinfo` DB purely for interaction (tap bounds, highlights). Text mode still uses bundled `UthmanTN1Ver10.otf` / `kitab.ttf`.
2. **Compose at the edges, not the core** — new surfaces (qari list `feature/qarilist/ui/QariList.kt`, audiobar, sync screens, line-by-line) are Compose; the fragile core (PagerActivity) stays Views. Low-risk incremental migration.
3. **Foldable two-page spread** from `FoldingFeature` state — a book metaphor preserved on large screens.
4. **Widgets as content surfaces** (bookmarks list, search) not vanity widgets.
5. **Everything downloadable is observable** — notifications for downloads (`QuranDownloadNotifier`), per-qari cache state in UI, silent repair workers.
6. **RTL/Arabic:** full `values-ar` in *every* module (even feature modules), localized reciter names (`common/audio/res/values-ar/readers.xml`), Arabic handled as data (uthmani DB) vs display (images/fonts) separately.
7. **Engineering culture artifacts worth imitating:** `TESTING_STRATEGY.md`, committed code-style XML, `CONTRIBUTORS.md`.

## 7. Offline & storage

- **SQLDelight schemas** (all typed, testable, migration-verified in CI): bookmarks/tags/last-page (`common/bookmark/src/main/sqldelight/*`), ayah glyphs/highlights/markers (`common/linebyline/data`), translations (`common/translation/translations.sq`), imlaei word alignment (`common/mapper/imlaei/WordAlignment.sq`).
- **Content layout:** images, DBs, audio live under app-scoped external dirs via `QuranFileUtils`; database filename per version (`quran.ar.uthmani.v2.db`).
- **Upgrades:** dedicated `common:upgrade` module (`PreferencesUpgrade`) + `MadaniDataUpgrade`/`MadaniPreferencesUpgrade` (`pages/common/madani/upgrade/*`) — versioned migrations for prefs and data, not ad-hoc fixes.
- **Android backup:** `dataExtractionRules` + `fullBackupContent` in manifest (device transfer support).
- **Sync:** opt-in OIDC PKCE account sync via `com.quran:mobile-sync` maven artifact; issuer URL and client id injected per build (`oauth.properties`) — i.e., the community can self-host the sync server.

## 8. Notifications & background work

- **Scheduler:** **WorkManager** (`androidx-work-runtime-ktx`); workers in `app/.../worker/`: `AudioUpdateWorker`, `MissingPageDownloadWorker`, `PartialPageCheckingWorker`, with DI (`core/worker/di/AudioUpdateModule.kt`).
- **Playback notification:** media-style notification + `MediaSessionCompat` + `MediaButtonReceiver`; channels via `util/NotificationChannelUtil.kt`.
- **Download notifications:** `QuranDownloadNotifier(Impl)` — progress, success, wifi-required prompts.
- **No prayer/reminder scheduling exists in this app** — our Azkar app already exceeds it here (adhan + reminders via Capacitor LocalNotifications is our domain).

## 9. i18n

- **45 locales** whitelisted via `localeFilters` in `app/build.gradle.kts` (ar, ur, fa, ps, ku, ug, + European/Asian languages). Arabic strings present in every module's `values-ar`.
- Reciter names, download strings, sync strings — all localized (Arabic first-class).
- Quran text itself is data (uthmani script DB), never machine-reformatted; display is images in page mode.

## 10. Testing / CI / release engineering

- **Testing:** `TESTING_STRATEGY.md` documents a 6-phase initiative: **1.5% → 413+ tests across 11 modules**; philosophy: *behavior not implementation*, **fakes over mocks** (zero Mockito in app tests), in-memory SQLite instead of mocked DAOs, unit tests < 100ms, Kover coverage.
- **CI** (`.github/workflows/`): `build.yml` = PR build + `lintMadaniDebug` + **`verifySqlDelightMigration`** + `testMadaniDebug testReleaseUnitTest -PdisableFirebase` + artifact diffing vs previous APK; `merge.yml`, `post_build.yml`, `post_merge.yml`; concurrency-cancel on PRs. **Renovate** (`renovate.json5`) for dependency automation.
- **Signing/release:** keystore via gradle properties (`STORE_FILE`...), `beta` build type signed with release key, minified+resource-shrunk; **FOSS flavor switch** `-PdisableFirebase` (used for IzzyOnDroid builds) also strips `dependenciesInfo` from the APK.

## 11. Monetization / privacy / analytics

- **Monetization: none.** README explicitly asks forks to stay non-profit.
- **Analytics/crash = build-time strategy pattern, not runtime opt-in:** `common:analytics` defines `AnalyticsProvider` + `CrashReporter`; the app ships either `feature:firebase-analytics` (Play builds; Crashlytics applied **only on release builds**) or `feature:analytics-noop` (FOSS builds). `RecordingLogTree` uploads error logs to Crashlytics. No user-facing consent prompt found — privacy posture is enforced by distribution channel.
- Firebase google-services only applied when task name contains "Release" AND `useFirebase` (`app/build.gradle.kts:19-25`).

## 12. Recommendations for Azkar App

**ADOPT (do the same thing):**
1. **P0, S — Resumable downloads with partial files + `Range` header** for reciter audio (and any large JSON). Their pattern: `.part` file + `bytes=N-` + append (`QuranDownloadService.kt:470-493`). In our stack: Capacitor Filesystem append + fetch/XHR with Range, or a download plugin. We already do per-surah caching; resumability is the missing reliability piece.
2. **P0, M — Versioned content + silent self-repair.** Version every downloaded asset (filename or manifest), add a periodic integrity check (our SW + a Capacitor background task / SW update cycle) that re-fetches missing/corrupt surah files — their `MissingPageDownloadWorker`/`PartialPageCheckingWorker` pattern.
3. **P1, S — CI gate for DB migrations + dependency automation.** We use `@capacitor-community/sqlite`; add a CI step that applies all migrations to a fresh DB and to a seeded old-version DB before tests (their `verifySqlDelightMigration`), plus Renovate.
4. **P1, S — Swappable crash-reporting module.** Even with no analytics, define a `CrashReporter` interface now (no-op default), so adding Sentry/Crashlytics later is a build-time swap, like their `analytics-noop`/`firebase-analytics` pair.
5. **P1, S — A testing-strategy doc + fakes-over-mocks rule.** Their `TESTING_STRATEGY.md` is the best single artifact to imitate; codify it for our vitest suite.

**ADAPT (their idea, our stack):**
1. **P0, M — Audio queue + focus + media notifications.** Mirror their `AudioQueue` + audio-focus semantics with HTML5 audio + Media Session API (works in Capacitor WebView and PWA): continuous play across suras, lock-screen controls, pause on focus loss, resume on regather.
2. **P1, M — Gapless-first audio model with ayah timing tables.** Our per-surah download ≈ their gapless mode. Adopt their *timing DB* idea (per-surah ayah timestamps) to enable tap-ayah→seek and live ayah highlighting while listening — cheap to generate from the same hosts they use, or via our TTS pipeline for azkar.
3. **P1, S — Two-page spread on wide screens.** Their FoldingFeature logic → CSS: on tablets/landscape (or foldables via viewport segments), render mushaf as a two-page book spread.
4. **P1, M — Download-state cache per reciter.** Their `QariDownloadInfoManager` → we keep a small SQLite/indexedDB table of (reciter, sura, bytes, etag) so the reciter list can show downloaded/partial/missing state fully offline.
5. **P2, L — Widgets via Capacitor.** Their BookmarksWidget/SearchWidget are high-value, low-frequency surfaces; on Android a native widget plugin (or Capacitor community widget plugin) fed by our streak/azkar data is a differentiator.
6. **P2, M — Word-alignment DB for text mode.** Their `common/mapper/imlaei` `WordAlignment.sq` maps written-form↔image-glyph; adapt to map our Quran JSON words → audio timestamps / TTS positions for word-by-word interaction.

**LEARN (inspiration, not directly applicable):**
1. **P1, M — Pixel-perfect mushaf option:** they render Quran layout as *images + interaction coordinates* because script fidelity matters religiously. If we ever hit fidelity limits with our text mushaf component, the image+ayahinfo-coords approach is the proven fallback (host images ourselves).
2. **P2, S — DNS/DoH resilience:** their DoH fallback (1.1.1.1) keeps content hosts reachable on flaky DNS; for a PWA this is a reminder to add host mirrors + retry/backoff rather than trust a single CDN.
3. **P2, L — Recitation verification:** their Google Cloud Speech recitation tracker is the analog of our Gemini key — an "AI listens to your recitation and corrects you" feature would be our natural version of their strongest differentiator.
4. **P2, L — Optional OIDC sync without passwords:** their PKCE + configurable issuer design shows how to add sync later without holding secrets client-side — a template if we ever add opt-in backup sync beyond file export.
5. **License hygiene:** learn from their explicit "data vs code" licensing split (GPL code / CC-BY-NC-ND data) — audit our bundled Quran/tafsir JSON sources' licenses before shipping updates.

## 13. Risks / gotchas

- **GPL-3.0 copyleft:** any code copied from this repo forces GPL on our app. Treat everything as read-only reference. Assets: images/data are CC BY-NC-ND (no derivatives, non-commercial).
- **Server etiquette:** `android.quran.com` bandwidth is volunteer-funded; README warns against third-party consumption. Never point our app at their hosts — mirror from quranicaudio/everyayah hosts' own terms or self-host.
- **Bleeding-edge stack:** AGP 9.4/Kotlin 2.4/Compose BOM 2026.08 + Metro 1.4 (Dagger successor) — cutting-edge, meaning churn risk; also evidence the project has strong maintainer bandwidth.
- **Legacy debt:** Views+Java remnants (`TranslationView.java`, `QuranDownloadNotifier.java`), dual async systems (RxJava3 + coroutines) — cost of 15 years of history.
- **Recitation feature needs Google Cloud credentials** (API key/billing) — not shippable as-is for a no-account app.
- **Shallow clone limits:** no git history; maturity claims beyond HEAD (stars, founding year) rely on README/versionCode. GitHub API unreachable from this sandbox.
- **No runtime crash-opt-in:** if we adopt their build-time analytics swap, note it satisfies FOSS channels but not "no analytics ever" users — we currently have zero analytics, which is a feature.

## 14. Key links

- Repo: https://github.com/quran/quran_android · Play: https://play.google.com/store/apps/details?id=com.quran.labs.androidquran · IzzyOnDroid: https://apt.izzysoft.de/packages/com.quran.labs.androidquran
- Mushaf images origin: https://github.com/quran/quran.com-images · Data sources: https://quranenc.com · https://quran.ksu.edu.sa · http://tanzil.net
- Audio hosts: https://download.quranicaudio.com · https://mirrors.quranicaudio.com/everyayah
- Key local files: `README.md`, `TESTING_STRATEGY.md`, `settings.gradle.kts`, `gradle/libs.versions.toml`, `app/build.gradle.kts`, `pages/madani/.../MadaniPageProvider.kt`, `app/.../service/{AudioService,QuranDownloadService,AudioQueue,DownloadStrategy}.kt`, `common/audio/**`, `common/bookmark/src/main/sqldelight/*`, `.github/workflows/build.yml`, `feature/{sync,qarilist,recitation,linebyline,audiobar}`, `autoquran/**`
