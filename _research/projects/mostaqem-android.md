# Mostaqem Android — Research Report for Azkar App

> Researched from local shallow clone: `E:\flutter\azkar-app_6\_research\repos\mostaqem_android`
> Scope: audio-first Quran recitation app — what we can ADOPT / ADAPT / LEARN for our React+Capacitor "Azkar App".

---

## 1. Project overview

| Item | Finding | Evidence |
|---|---|---|
| What | Native Android app for "Islamic media like quran and podcasts without ads and subscriptions" — audio-first Quran recitation player with reading mode | `README.md` |
| Positioning | Free on Google Play (`com.mostaqem`), Android 8.0+, explicitly "without ads and subscriptions" | `README.md` |
| Version | `versionName "1.5.1"`, `versionCode 14` | `app/build.gradle.kts` |
| Maturity | Small-team hobby project (3 credited people: Android/Web/Backend). Shallow clone → no commit history. Activity signals are **fresh (2025)**: Compose BOM `2025.08.00`, Kotlin `2.2.0`, Media3 `1.8.0`, AGP `8.11.0`, LICENSE dated "September 2025", local build error logs from May 2025 | `gradle/libs.versions.toml`, `LICENSE`, `.kotlin/errors/` |
| GitHub metadata | ⚠️ GitHub API returned **403 rate-limited** — stars/last-push **unknown** | — |
| License | **"Mostaqem Custom License (MCL)" v1.2 (Sept 2025)** — NOT OSI open source | `LICENSE` |

**License implications for us (critical):**

- Grants: personal/non-commercial **use** and **modification** only.
- Prohibits: **commercial use**, **closed-source redistribution** ("any redistribution must maintain full source availability"), sub-licensing. Attribution + license link + change-indication **required**.
- **Verdict: do NOT copy code** from Mostaqem into Azkar App unless we verify our distribution qualifies as non-commercial *and* we accept exposing our source per their terms. Ideas, architecture patterns, UX concepts, and data strategy are **not copyrightable** — borrow those freely. Treat all code as read-only reference.

## 2. Tech stack & architecture

- **Language**: Kotlin 2.2.0, JVM 17. Single-module app (`:app`) + `:benchmark` (macrobenchmark) + `:baselineprofile`.
- **UI**: Jetpack Compose (BOM 2025.08.00), **Material3 1.4.0-alpha17** incl. experimental `MaterialExpressiveTheme`; Navigation-Compose with **type-safe @Serializable routes** (`core/navigation/models/destinations.kt`); adaptive `NavigationSuiteScaffold` (`core/ui/app/MostaqemApp.kt:162`).
- **DI/state**: Hilt 2.56.2 (one DI module per feature under `core/di/modules/`); MVVM with `StateFlow` + sealed `Result<T, DataError>` (`core/network/models/`); Paging 3 for reciter/surah lists.
- **Data**: Room 2.7.2 (KSP, **exported schemas** in `app/schemas/`), **DataStore with custom kotlinx.serialization serializer** (`settings/AppSettingsSerializer.kt` — whole `AppSettings` object persisted atomically), Retrofit 3 + Gson + OkHttp logging.
- **Media**: **Media3 1.8.0** — exoplayer, session, dash (DASH declared but unused in code), ui.
- **Background**: WorkManager 2.10.2 + Hilt workers; Media3 `DownloadManager`/`DownloadService`.
- **Extras**: Glance app widget, Coil 2.x + Coil3 SVG, material-kolor, androidx.graphics-shapes (custom player shapes), profileinstaller + baseline profiles, R8 minify + resource shrink.
- **min/target/compile SDK**: 26 / 36 / 36 (Android 8.0+).
- **Layout**: package-by-feature `features/<name>/{data,domain,presentation}` + shared `core/` (database, di, media, navigation, network, ui). Clean-architecture style; very readable for its size.

## 3. User-facing features (complete list)

| Feature | Note |
|---|---|
| ⭐ Continuous recitation queue | Auto-extends ±3 neighboring surahs, prefers local downloads, auto-advances at queue end through the whole mushaf (`PlayerViewModel.kt:327+`, `onPlaybackStateChanged`) |
| ⭐ Resume playback | Last surah/reciter/tilawa/**position** persisted in Room, restored via `setMediaItem(item, position)` (`applyCachedState`, `PlayerDao`) |
| ⭐ Offline downloads w/ manager UI | Resumable per-surah downloads + "download all 114" + storage-% meter, pause/resume-all, delete one/all (`OfflineManager.kt`, `OfflineSettings.kt`, `DownloadAll.kt`) |
| ⭐ Reciter + tilawa model | Two-level selection: reciter → recitation style (e.g. Hafs/Warsh), defaults persisted in DataStore (`PersonalizationRepository.kt`) |
| Reading mode | Bundled Uthmani text, chapter pager (`HorizontalPager`), ayah selection → share (`ReadingScreen.kt`) |
| ⭐ Share-ayah image | Shareable card with selectable **font + color** (`ShareScreen.kt`, `SelectedFont/SelectedColor`) |
| Favorites | Per (surah, recitation) favorites in Room (`features/favorites`) |
| Sleep timer | Preset dialog + live countdown, pauses player on finish (`player/components/sleep/`) |
| Repeat & shuffle | Player repeat modes + shuffle (`PlayOptions.kt:109-137`) |
| Recommendations | "Random surahs" from API (limit 6) on home (`SurahService.getRandomSurahs`) |
| History / continue | Room-cached recently accessed surahs & reciters with **weekly auto-cleanup** (`HomeRepository.kt`, `DeleteWorker`) |
| Search | Advanced search: all / chapters / reciters, server-backed (`history/components/AdvancedSearch.kt`) |
| Notifications | Friday: Surah Al-Kahf 9:00 weekly; nightly 21:00: Al-Mulk; deep-links into player (`NotificationWorker.kt`, `App.kt`) |
| Home-screen widget | Glance widget: play/pause/next via MediaController (`widget/AppWidget.kt`) |
| In-app updates | GitHub Releases check → APK download (wifi-only) → install prompt (`update/GithubAPI.kt`, `ApkHandle.kt`) |
| Themes/dark | Material You dynamic color + dark + **shape personalization** (`theme/Theme.kt`, `ShapesScreen.kt`) |
| Languages | English + Arabic, per-app locale, app restart to apply (`LanguageManager.kt`) |
| Donate screen | Instapay link, Play Store rating, repo link (`DonateScreen.kt`) |
| Deep links | `mostaqem://player` + autoVerify `https://mostaqemapp.online/quran/{surah}/{recitation}` (`AndroidManifest.xml`) |
| Login | **Stub only** — 0.6KB screen, empty interfaces (`features/auth`) — abandoned feature |
| ❌ Playback speed | **Absent** — no `playbackSpeed` anywhere (verified by grep) |
| ❌ Per-ayah audio | Absent — full-surah files only |

## 4. Quran content & data

- **Quran text**: bundled asset `app/src/main/assets/quran.json` (1.75MB) — Uthmani script **with full diacritics** (Tanzil-Uthmani style), shape `{ "1": [ {chapter, verse, text}, ... ] }` keyed by chapter. Loaded once into memory via Gson, then per-chapter cache (`ReadingRepository.kt`).
- **No translations/tafsir** anywhere — text-only reading mode.
- **Audio metadata (reciters, tilawa, URLs, images)**: **their own backend** `https://api.mostaqemapp.online/api/v1/` (`core/di/modules/BaseModule.kt:53`), Retrofit endpoints:
  - `GET reciter?take=12&page=&name=` (paged list/search) — `ReciterService.kt`
  - `GET reciter/{id}/tilawa` (recitation styles) — `ReciterService.kt`
  - `GET surah?take=10&page=`, `GET surah?name=` — `SurahService.kt`
  - `GET audio?surah_id=&reciter_id=&tilawa_id=` → streaming URL — `SurahService.kt`
  - `GET audio/random?limit=&reciter_id=` — `SurahService.kt`
- **Update strategy**: audio metadata fetched live; surahs/reciters cached in Room with `lastAccessedAt`; text is a static asset. App updates via `https://api.github.com/` releases + Play Store.
- **Fonts** (`res/font/`): `uthmani.otf` (Quran text), `surah_names.ttf` (decorative surah names), `amiri.ttf`, `kufam.ttf` (Arabic UI), `product.ttf` (Latin UI). Locale-adaptive font-family switch (`Theme.kt:70-76`).
- ⚠️ Cover-art fallbacks are **hardcoded freepik "premium" URLs** and a Wikimedia image (`SurahResponse.kt:20`, `PlayerViewModel.kt:75`) — licensing smell; don't reuse.

## 5. Audio & recitation (core of this research)

**Player architecture** (`core/media/service/MediaService.kt`):

- `MediaSessionService` (Media3) + `ExoPlayer` built with `setAudioAttributes(..., handleAudioFocus=true)`, `setHandleAudioBecomingNoisy(true)`, and a `DefaultMediaSourceFactory` wrapping `CacheDataSource`.
- `CacheDataSource` uses the **download cache with the write sink disabled** (`setCacheWriteDataSinkFactory(null)`, `MediaService.kt:77`) → streaming playback **never populates the cache**; only completed downloads do. Clean split: stream = network, download = cache hit.
- Foreground service type `mediaPlayback` + `BIND_MEDIA_SESSION` permission (`AndroidManifest.xml`); `MediaButtonReceiver` registered (headset/Bluetooth); task-removed → pause + stopSelf.
- **Notification**: custom `DefaultMediaNotificationProvider` override → always prev/play/next buttons, `VISIBILITY_PUBLIC`, app logo small icon (`CustomNotificationProvider`).
- **Full-surah playback only** (one MP3 per surah); no per-ayah timing/gapless work at all.

**Downloads** (`features/offline/`):

- Media3 `DownloadManager` + `DownloadService` (`AppDownloadService`, FGS type `dataSync`, with the `RESTART` intent filter so downloads survive process death).
- Download ID = `"{surahID}-{recitationID}"`; `DownloadRequest.data` = Gson-serialized `AudioData` (surah name, reciter, URL) so offline items render with zero network (`OfflineManager.startDownload`).
- **Resumable**: yes (Media3 chunked downloads); explicit pause/resume/remove/removeAll; "download all" = 114 parallel URL resolutions then batch enqueue, skipping already-downloaded/in-progress (`SurahRepositoryImpl.getAllSurahsUrls`, `OfflineManager.startDownloadList`).
- **Requirements**: default network (any). **No wifi-only toggle for audio** — only the self-update APK uses `NETWORK_WIFI` (`ApkHandle.kt:21`).
- Cache location: `getExternalFilesDir(null)/Downloads` with `SimpleCache` + `NoOpCacheEvictor` (`DownloadUtils.kt`) → **unbounded growth**; user deletes manually (they do provide a storage-% UI).
- Completion → row in Room `downloaded_audios` (id, title, size, reciter, remoteUrl…); removal deletes the row (`OfflineManager.kt:onDownloadChanged/onDownloadRemoved`). Room row + Media3 download index = two sources of truth (minor drift risk).

**Queue & state**:

- `getQueueUrls` builds **±3 neighboring surahs** around current, **preferring local downloaded files**, and on `STATE_ENDED` at queue end extends the queue again → continuous listening across the mushaf (`PlayerViewModel.kt:327+, :206-217`).
- Player state persisted in Room (`player_state` via `PlayerDao`): surah, reciter, recitation, position, url, `isLocal` → exact resume after process death.
- Metadata round-trip hack: reciterID stored in `MediaMetadata.albumTitle`, recitationID in `albumArtist` (`setMetadata`, `PlayerViewModel.kt:341-352`) — works but brittle.
- Progress: UI polls position at 1s; download progress polls Media3 index every 100-500ms (battery/CPU smell; Media3 offers listeners).

**Sleep timer**: `CountDownTimer` in a ViewModel with remaining-time `StateFlow`, pause callback on finish (`SleepViewModel.kt`). **Speed**: none. **Equalizer**: none. **Per-ayah seek**: none.

## 6. UI/UX patterns worth copying

- **Adaptive navigation**: `NavigationSuiteScaffold` → bottom bar on phones, rail on tablets; single nav graph.
- **Player as bottom-sheet layers**: mini bar → modal sheet → full player; queue/options/sleep as `BottomSheetType` enum-driven sheets (`player/data/BottomSheetType.kt`).
- **Type-safe deep links into player** with autoVerified web + custom scheme (`AndroidManifest.xml`, `MostaqemApp.kt:280`) — notification/share/widget all land on the exact surah+recitation.
- **Arabic-first typography**: uthmani.otf for scripture, surah_names.ttf for decorative headers, kufam for Arabic UI; automatic font-family swap by locale.
- **Share-ayah image generator** with font/color pickers — high-virality feature.
- **Material You dynamic color + shape personalization** ("Shapes" screen changing player container shapes via androidx.graphics-shapes) — cheap-to-copy delight.
- Empty/loading/error states via sealed `Result` + `SnackbarController`; network-status observation (`NetworkObserver.kt`) with online/offline content switching (`HistoryOnline.kt`).
- ⚠️ Accessibility is weak: hardcoded English `contentDescription`s ("repeat", "shuffle") even in an Arabic app — do better than them.

## 7. Offline & storage

- **Room DB v3** (`core/database/AppDatabase.kt`): 5 tables — `surahs`, `reciters` (with `lastAccessedAt` for continue-listening + weekly pruning), `player_state` (resume), `downloaded_audios`, `favorited_audio`. Schema JSONs exported to VCS + `AutoMigration(2→3)` **and** an identical hand-written migration companion (redundant leftover).
- **DataStore** (not Preferences): one serialized `AppSettings` object (reciter, recitation, language, sort, shapeID, notification toggles) — atomic, type-safe, versionable. Notable pattern.
- Downloads: Media3 `SimpleCache` in external files dir; storage-usage % computed in `OfflineRepository`.
- Android auto-backup: `backup_rules.xml` + `data_extraction_rules.xml`; **no cloud sync of any kind** (fits their no-account stance).
- Weekly `DeleteWorker` prunes history entries older than 7 days (`App.kt:38-48`, `HomeRepository.kt`).

## 8. Notifications & background work

- **Scheduler: WorkManager** (unique periodic work; Hilt `@HiltWorker` + custom `WorkerFactory` via `Configuration.Provider`; default initializer removed in manifest).
  - `FridayWorker`: weekly, initial delay computed to next Friday 09:00 (`App.kt:calculateInitialDelay`), content = Surah 18 (Al-Kahf), gated by DataStore toggle + runtime `POST_NOTIFICATIONS` check.
  - `NightsWorker`: daily 21:00 (`calculateNightsInitialDay`), content = Surah 67 (Al-Mulk), policy `UPDATE` so re-enqueues refresh the schedule.
  - `DeleteWorker`: weekly history cleanup.
- Notification tap → deep link `https://mostaqemapp.online/quran/{surah}/{recitation}` → autoVerify → opens player at that content (`NotificationService.kt:25`). Smart: one URL format serves sharing, notifications, and widgets.
- Single notification channel; no prayer-time notifications (our domain, not theirs).

## 9. i18n

- English (default `values/strings.xml`) + Arabic (`values-ar/strings.xml`); `locale_config.xml` enables **per-app language** (Android 13+ system settings integration).
- `LanguageManager.kt`: API 34 path uses `LocaleManager.overrideLocaleConfig`, older uses `AppCompatDelegate.setApplicationLocales`; persists choice in DataStore + `autoStoreLocales` metadata service; **restarts the app** to apply (crude but reliable).
- RTL: `android:supportsRtl="true"` + Arabic-first layouts; locale-aware surah/reciter name selection at metadata build time (`PlayerViewModel.setMetadata`).

## 10. Testing / CI / release engineering

- **Tests**: template `ExampleUnitTest`/`ExampleInstrumentedTest` + **one real gem: `AppMigrationTest.kt`** — Room migration test validating schema v2→v3 against exported schemas. That's it.
- **CI: none** — `.github/` contains only `FUNDING.yml`. No Actions workflows, no lint/test/build automation.
- Release: R8 minify + resource shrink; **baseline profiles + macrobenchmark module** + `profileable` manifest tag (perf investment rare in hobby apps — copy as an idea); release **APK/AAB binaries committed to the repo** (`app/release/`) — hygiene smell.
- `CONTRIBUTING` is a **copy-pasted Dart/Flutter template** ("Effective Dart", `dart format`) in a Kotlin repo — docs drift smell.
- Distribution: Play Store + GitHub-Releases APK self-updater (wifi-only via platform `DownloadManager`, install via FileProvider — `update/`).

## 11. Monetization / privacy / analytics

- No ads, no analytics SDKs, no accounts (auth package is an empty stub), no tracking deps — matches our philosophy. Monetization = donations only: Instapay link + GitHub Sponsors (`.github/FUNDING.yml`, `DonateScreen.kt`).
- Network surface: their API + api.github.com + image CDNs. ⚠️ **Security smell**: `ignoreAllSSLErrors()` (trust-all TLS + hostname verification disabled) is applied to the **production API client** (`BaseModule.kt:45`, `core/network/SSLPass.kt`) — MITM-vulnerable. Do NOT imitate.

## 12. Recommendations for Azkar App (React 18 + Capacitor 8)

Context: we already have `components/quran/AudioMiniPlayer.tsx`, `AudioDownloadSheet.tsx`, `ReciterPicker.tsx`, per-surah download+cache, `@capacitor-community/sqlite`, `@capacitor/local-notifications`, `@capacitor/filesystem`, idb-keyval.

### ADOPT (do the same thing)

| Pri | Item | Effort | Source pattern |
|---|---|---|---|
| **P0** | Persist player state (surah, reciter, recitation, **position**) and resume exactly on relaunch — SQLite/idb like their `player_state` table | **S** | `PlayerDao`, `applyCachedState` |
| **P0** | "Continue listening" + recent reciters/surahs on Home, with `lastAccessedAt` pruning | **S** | `HomeRepository.kt`, `DeleteWorker` |
| **P1** | Continuous queue: after a surah ends, auto-enqueue next surahs of the same reciter (prefer local files) — whole-mushaf listening | **M** | `PlayerViewModel.getQueueUrls`, `STATE_ENDED` handler |
| **P1** | Download manager UX: pause/resume-all, per-item progress, storage-used %, delete one/all, skip-already-downloaded on "download all" | **M** | `OfflineManager.kt`, `OfflineSettings.kt` |
| **P1** | Sleep timer with visible countdown that pauses (not stops) playback | **S** | `SleepViewModel.kt` |
| **P2** | Composite download key `surahId-recitationId` + embed metadata in the download record so offline items render with zero network | **S** | `OfflineManager.startDownload` |

### ADAPT (their idea, our stack)

| Pri | Item | Effort | How for us |
|---|---|---|---|
| **P0** | **Media Session / lock-screen controls**: they get it free from Media3; we must wire the **Web MediaSession API** (`navigator.mediaSession` metadata + action handlers) inside our WebView + audio-element handling — the single biggest gap for a recitation experience in Capacitor | **M** | extend `AudioMiniPlayer.tsx` |
| **P1** | Two-lane audio sourcing (their stream-vs-cache split): if the surah file exists in our Filesystem cache → play local path; else stream URL; never double-download | **M** | mirror their `isLocal`/`getDownloadedMediaItem` logic in our audio service |
| **P1** | Reciter → **tilawa (recitation style)** two-level selection, persisted as default | **S** | extend `ReciterPicker.tsx` |
| **P1** | Friday-Kahf / nightly-Mulk style "listen" nudges with deep-link payloads — reusing `@capacitor/local-notifications` | **S** | `NotificationWorker.kt` idea |
| **P1** | Share-ayah / share-dua **image card generator** with font+color options (we already have html-to-image) | **S** | `ShareScreen.kt` idea; our `ShareEditorScreen.tsx` exists |
| **P2** | In-app "check for update" flow with release notes (Android build) | **S** | `update/` feature |
| **P2** | Schema-migration test habit for our SQLite upgrades | **S** | `AppMigrationTest.kt` pattern |

### LEARN (inspiration, not directly applicable)

- **Their own metadata API** validates the "small dedicated backend for reciter/tilawa/URL metadata + bundled text" split — our bundled-JSON + per-surah audio manifest approach is sound; consider a client-side "discover/random" helper instead of an endpoint.
- **Baseline profiles + macrobenchmark**: the analog for us is Vite build budgets + (later) Capacitor startup profiling — perf-as-a-feature mindset.
- **Anti-patterns to avoid (negative learnings)**: 100–500ms polling loops for progress (use events); `NoOpCacheEvictor` → unbounded cache (set an LRU/quota in our Filesystem cache); trust-all-SSL (never); storing IDs inside media metadata fields (keep a typed state object); committing release binaries to git.
- **Their missing features are our opportunities**: playback speed (0.75–2×), per-ayah mode, tafsir-in-player — none exist here, so they're differentiators for us, not copied table stakes.

## 13. Risks / gotchas

1. **License trap (high)**: MCL = non-commercial + source-available redistribution + attribution. **No code copying** unless we accept those terms; ideas/architecture only. Verify our app's status before any copy-paste.
2. **Single-vendor backend (medium)**: all reciter/audio metadata depends on a hobby backend (`api.mostaqemapp.online`) with trust-all TLS — the data layer could vanish or be MITM'd; never depend on it, only mirror the *shape* of it.
3. **Asset weight (low/medium)**: their bundled quran.json is 1.75MB; loaded fully into RAM at first read — keep gzip/brotli + lazy chapter parsing in our equivalent.
4. **Maintenance smells (low)**: stub auth feature, `TODO("Not yet implemented")` in `PlayerRepository.buildQueue`, redundant migration 2→3, Flutter-template CONTRIBUTING, committed APKs, no CI, alpha Material3 APIs subject to churn, Gson `!!` force-unwraps on API models.
5. **Shallow clone (info)**: no commit history; GitHub API rate-limited during research → stars/contributor activity unverified.

## 14. Key links

- Repo: https://github.com/Mostaqem/mostaqem_android
- Desktop sibling: https://github.com/Mostaqem/mostaqem_desktop (per README)
- Play Store: https://play.google.com/store/apps/details?id=com.mostaqem
- Deep-link/content site: https://mostaqemapp.online/quran/{surahID}/{recitationID}
- API base: https://api.mostaqemapp.online/api/v1/ (endpoints in §4)
- License: `LICENSE` (MCL v1.2) — contact: hardlight555@gmail.com
- Local clone: `E:\flutter\azkar-app_6\_research\repos\mostaqem_android`

---

*Report generated from static inspection of the local clone (README, manifests, source, schemas). All claims cite repo-relative file paths. GitHub stars/last-push unknown (API 403).*