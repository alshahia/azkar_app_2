# Research Report: AlfaazPlus/QuranApp

**Assigned project:** AlfaazPlus/QuranApp — local clone at `_research/repos/QuranApp`
**Consumer:** Azkar App (React 18 + TS + Vite + Tailwind + Capacitor 8, Arabic RTL, local-first)
**Method:** local shallow clone only (README → manifests → API/grep → schemas). GitHub REST metadata fetch failed twice from the sandbox (network blocked), so stars/last-commit are unavailable; maturity signals below come from repo content.

---

## 1. Project overview

| Item | Finding | Evidence |
|---|---|---|
| What it is | Native **Android Quran reader** — read, listen, explore. Quran-only app (no prayer times, no Qibla, no azkar; verified: `grep -i "prayer\|qibla\|hisn\|adhkar\|azkar"` in Kotlin = **0 matches**). Hadith lives in a sibling app, SunnahApp | FEATURES.md, manifest, grep |
| Positioning | 'ad-free and privacy-focused mobile application … reading and exploring the Holy Qur'an'; badges for Play Store, IzzyOnDroid/F-Droid, GitHub releases; community on Discord/Matrix/Telegram | `README.md` |
| License | **GPL-3.0** | `LICENSE` ('GNU GENERAL PUBLIC LICENSE, Version 3, 29 June 2007') |
| Version | `versionName = '2026.05.13.2'`, `versionCode = 23_11_11_142` — date-based versioning carried forward from a legacy scheme the author regrets | `app/build.gradle.kts:20-24` |
| Maturity signals | Date-versioned releases; old release APK archived in repo (`repo_assets/2025.05.19.2-release-old-signature.apk`); CI + fastlane store metadata; FUNDING.yml; structured issue templates incl. **verse_report.yml** (users report content errors); DeepWiki docs | `.github/*`, `fastlane/` |
| What GPL-3.0 permits us | We may freely **learn and re-implement ideas, schemas, UX flows**. Copying **code or content files** requires our distribution to become GPL-3.0-compatible (source disclosure). Quran text/translation/audio data have their own licenses (Tanzil, QuranEnc, KFQPC fonts, quranicaudio) — several are freer than the app's code license (see §13). | LICENSE |

## 2. Tech stack & architecture

- **Language:** Kotlin (majority) + Java (older files), Java 17 / jvmTarget 17, core-library desugaring (`app/build.gradle.kts:84-93`).
- **UI:** Hybrid **View system (ViewBinding/DataBinding) + Jetpack Compose (Material3, adaptive, windowSizeClass)**; in-house design module **`peacedesign`** (dialogs, bottom sheets, custom spans for footnotes/superscripts). Compose used for player components and settings screens (`compose/…` package).
- **minSdk 24, targetSdk 36, compileSdk 37**; R8 minify + resource shrink on release; cleartext traffic disabled in release via `network_security_config` + per-build `resValue` (`AndroidManifest.xml:34`).
- **Package layout:** `com.quranapp.android` with `activities/`, `compose/`, `views/`, `viewModels/`, `utils/` (subpackages `managers`, `workers`, `mediaplayer`, `app`), `api/`, `db/`, `components/`. Plus separate Gradle module `peacedesign`.
- **State/DI:** **No DI framework** — object/singletons + `DatabaseProvider`; MVVM with `viewModels/` + Compose LiveData; Kotlin coroutines/StateFlow; **DataStore** for prefs.
- **Notable libs** (`app/build.gradle.kts:107-182`): Media3 (ExoPlayer, datasource, **session**, UI), **Room** (+paging, roomPaging), **WorkManager**, Retrofit + kotlinx-serialization, **Glance app widgets**, Coil, Paging 3, Accompanist permissions, Guava, apache commons/compress (zip), Android Auto metadata (`automotive_app_desc` in manifest).
- **Notable absence:** no Firebase, no analytics, no ads, no image/network client beyond Coil/OkHttp — consistent with privacy positioning.

## 3. User-facing features

From `FEATURES.md`, README, activities and workers:

- 📙 **45+ translations, 20+ languages**; multiple translations displayed together; footnote & verse-reference quick previews (`inventory/translations/available_translations_info.json` — ~45 entries)
- ⭐ **10+ tafsirs in 5+ languages** (Ibn Kathir ar/en/ur/bn…, Bayan-ul-Quran), offline after download (`inventory/tafsirs/available_tafsirs_info.json`)
- ⭐ **Word-by-word (WBW)** translation + transliteration per language, **plus per-word audio with timings** (`inventory/wbw/available_wbw_info_v2.json`; tables `wbw_words`, `wbw_audio_timing`)
- ⭐ **Recitations: 18+ reciters + 10+ translation-audios** (play Quran only / translation only / both), custom repeat, auto-scroll-to-verse sync, playback speed, spotlight mode, background player, Android Auto
- 📄 **Mushaf mode** with variable lines per page; read by chapter / juz / hizb / page; quick jump
- 🔤 **Multiple Quran scripts/fonts:** Uthmani Hafs, Indopak, KFQPC v1+v2 (604 **per-page** KFQPC TTF fonts under `inventory/fonts/kfqpc_v1/`)
- 🔍 Advanced search: **FTS Arabic search**, surah-alias FTS, search history, voice search (speech recognizer query in manifest), word/word-part match (`ArabicSearchFtsEntity`, `SurahAliasFtsEntity`)
- 🔖 Bookmarks (single verse **and ranges**, with notes) + **export/import** (`ActivityExportImport`, `user_bookmarks` table)
- 📖 Reference library: duas from the Quran, 'solutions' (etiquette), **prophets in the Quran**, **Quran & Science** (HTML topics in assets), Quranic topics, **major sins** verse sets, exclusive verses (`assets/science/`, `assets/verses/`, `activities/reference/*`)
- ⭐ **Verse of the Day:** reminder notification + **home-screen widget**; uses the user's selected translations (`VerseOfTheDayWorker.kt`, `VotdWidgetReceiver`)
- ⭐ **Recitation player home-screen widget** (Glance) (`RecitationPlayerWidgetReceiver`)
- ❤️ **Verse reminder:** periodic recommended-verse notifications (`RecommendedReminderScheduler.kt` — hourly WorkManager check)
- 🕮 **Read history** incl. mushaf page/variant tracking (`read_history` table, `ActivityReadHistory`)
- ⭐ **Popup Quran activity** — floating overlay verse card for sharing/quick view (`PopupQuranActivity`)
- ⭐ **Storage cleanup screen** (delete downloaded resources by size; `ActivityStorageCleanup`)
- 🚫 No ads/purchases/analytics/permissions (storage, GPS, camera not requested); no account
- 🌓 Dark/light, 5+ material colors + dynamic color; 22 app languages; app logs viewer (`ActivityAppLogs`, local `CrashReceiver`)

## 4. Quran content & data

**Sources (credits in README):** QuranEnc (tafsirs/translations), Tanzil (Quran text), quran.com API, qurandb.com, tarteel.ai, quranicaudio.com, everyayah.com.

**Exact endpoints found (grep of `api/`):**

| Endpoint | Use | Evidence |
|---|---|---|
| `https://api.quran.com/` | Quran API | `api/ApiConfig.kt:22` |
| `https://api.alfaazplus.com` | Their own API (v2 features) | `api/ApiConfig.kt:23`, `AlfaazPlusApi.kt` |
| `https://raw.githubusercontent.com/AlfaazPlus/QuranApp/master/` | **GitHub repo as CDN** for catalogs + content | `ApiConfig.kt:12-14` |
| `https://cdn.jsdelivr.net/gh/AlfaazPlus/QuranApp@latest/` | jsDelivr mirror of same repo | `ApiConfig.kt:11` |
| `https://gh-proxy.alfaazplus.com/AlfaazPlus/QuranApp/master/` | **Self-hosted proxy mirror** (user-selectable) | `ApiConfig.kt:10` |
| `ghraw://` custom scheme | Resolved at runtime to the active mirror root | `api/InventoryUrlFetch.kt` |
| `https://download.quranicaudio.com/qdc/{reciter}/{chapNo}.mp3` | Gapless full-surah audio | `inventory/recitations/available_recitations_info_v2.json` |
| `https://github.com/dabatase/*/releases/download/vN/{chapNo:%03d}.mp3` | 11 translation-audios | `available_recitation_translations_info_v2.json` |
| `ghraw://AlfaazPlus/QuranAppInventory/master/wbw_v2/*.json.gz` | WBW data in a **separate inventory repo**, gzipped | `available_wbw_info_v2.json` |
| `ghraw://…/audio_timings/{reciter}.json.gz` | Per-reciter verse-timing files | same file |

**Distribution architecture (⭐ the standout pattern):** the GitHub repo itself is the content catalog — `inventory/` JSON files are both shipped in the APK *and* fetched fresh at runtime via Retrofit (`GithubApi.kt` GETs `inventory/versions/resources_versions.json`, `available_*_info.json`). Every resource carries an integer **`version`** (`resources_versions.json` tracks counts; per-item `version` fields) so the app knows what to update. Downloads resolve through **3 mirrors** chosen by the user (`DownloadSourceUtils`) — resilience + censorship/ISP fallback. Content entries use `downloadPath` (repo-relative, mirror-agnostic) or full URLs.

**Bundled assets:** full Quran DB `assets/db/quranapp.db`, `page_info.db`, `topics.db`; 3 **prebuilt translations** (en Saheeh, The Clear Quran, ur Junagarhi) in `assets/prebuilt_translations/`; mushaf atlas `assets/atlas/uthmani/6x.zip`; chapter-info HTML/CSS/JS; tafsir reader HTML/CSS/JS (WebView-based); science topics HTML. **Fonts:** KFQPC per-page TTFs (v1+v2) downloadable via `ScriptFontsDownloadManager`/Worker; Uthmani/Indopak via scripts.

**Storage:** Room DBs — see §7. Downloaded translations/tafsirs are JSON files parsed with kotlinx-serialization (`TranslationDownloadManager.kt`) and served through factory classes (`QuranTranslationFactory`).

## 5. Audio & recitation

- **Player:** `RecitationService : MediaLibraryService` (Media3 **session service**) with ExoPlayer, `CacheDataSource` over `DefaultHttpDataSource` → **HTTP cache for streaming**, MediaSession with custom session commands (`RecitationService.kt:1-95`). Compose mini/expanded player UI + **Glance player widget**.
- **Model:** gapless **full-surah MP3s** (`{chapNo}.mp3`) from quranicaudio.com; verse sync via **separate per-reciter timing files** (`.json.gz`) → enables verse-highlight, repeat ranges, auto-scroll. Translation audio alternates Quran/translation or plays one only (`EXTRA_AUDIO_OPTION`).
- **Downloads:** `RecitationAudioDownloadWorker` + `RecitationBulkDownloadWorker` (WorkManager, `NetworkType.CONNECTED`; network changes watched via `NetworkStateReceiver`), progress exposed over `RecitationDownloadProgressBus`; WBW audio has its own worker pair. **No wifi-only gate** (`CONNECTED`, not `UNMETERED`) — deliberate, with a storage-cleanup screen instead.
- **Options:** repeat (verse/verse-range with count), playback speed, continue-to-next-chapter, end-of-audio behaviour dialog, headset-plug receiver (`RecitationHeadsetReceiver`), scroll-sync (`EXTRA_SYNC`).
- **Resumability of partial MP3 downloads:** not verified in code (no Range-request evidence found) — per-surah files are small enough that they likely re-download on failure.

## 6. UI/UX patterns worth copying

- **Dual reader modes:** verse-by-verse list ⇄ mushaf page, persisted per-visit in read history; mushaf has **variable lines/page** and word-coordinate **atlas** (`atlas_word_shapes`: word → page → placements JSON) enabling tap-to-select and word highlight on top of page layout — that's how WBW + audio highlight work even in mushaf mode.
- **Per-page KFQPC fonts** (not images!) → crisp text at any zoom, selectable, small storage (604 TTFs), downloadable lazily per script.
- **WebView hybrids for long-form content** (tafsir page, chapter info, science topics) with local CSS/JS — cheap rich typography without native reflow complexity.
- **Footnote/reference quick previews** via custom spans (`FootnoteRefSpan`, `SuperscriptSpan2` in peacedesign) — tap superscript → popup card.
- **Verse actions popup** + separate popup-activity for share as image/text (advanced sharing).
- **Settings screens in Compose** with dedicated download screens per resource type (`TranslationDownloadScreen`, `RecitationDownloadScreen`) + user-selectable **download source** sheet (mirror choice is surfaced to users!).
- **Storage cleanup** as a first-class screen — critical for a download-heavy offline app.
- **Glance widgets** (VOTD + player) — retention outside the app.
- Accessibility/RTL: `supportsRtl`, 22 locale `values-*` dirs incl. `ar`, RTL-aware bools in peacedesign (`values-ldrtl`), voice search via system recognizer.

## 7. Offline & storage

Room schemas (checked-in JSON at `app/schemas/`) — 4 databases:

| DB | Version | Tables / highlights |
|---|---|---|
| `QuranDatabase` (bundled `quranapp.db`) | 2 | Quran text; **FTS entities**: `ArabicSearchFtsEntity`, `SurahAliasFtsEntity` (`QuranDatabase.kt:18-42`) |
| `ExternalQuranDatabase` | 4 | `wbw_words` (ayah, word_index, translation, transliteration), `wbw_audio_timing` (per-word start/end millis), `atlas_bundles`, `atlas_word_shapes` |
| `QuranScriptDatabase` | 1 | `pages` (script, page, line, line_type, is_centered, first/last word ids), `info` (script, pages, lines_per_page) — mushaf layout metadata |
| `UserDatabase` | 2 | `user_bookmarks` (chapter, from/to verse, **note**, date), `read_history` (read_type, reader_mode, division, chapter, verses, **mushaf_code/variant, page**, datetime) |

- Downloaded resources (translations/tafsirs/scripts/wbw/audio) live in app-private dirs; cleanup/size UI (`ActivityStorageCleanup`); `room.schemaLocation` checked in → versioned migrations reviewable in git.
- **Backup:** Android auto-backup (`allowBackup`, `fullBackupContent`, `data_extraction_rules`) + explicit **bookmark export/import**. No cloud sync (privacy stance).
- Versioned catalog + per-resource integer versions = cheap update-available checks against `resources_versions.json`.

## 8. Notifications & background work

- Scheduler: **WorkManager** everywhere (no AlarmManager use found).
  - `VerseOfTheDayWorker` (CoroutineWorker): picks VOTD honoring the user's translation prefs, posts rich notification deep-linking into the reader (`VerseOfTheDayWorker.kt:37-84`).
  - `RecommendedReminderScheduler`: **unique periodic work, 1 hour, KEEP policy** → `RecommendedReminderWorker` decides when to fire verse reminders (user-configured via `DailyReminderSheet`).
- Download workers as in §5; `SCHEDULE_EXACT_ALARM` is declared in the manifest but no exact-alarm code found (likely legacy).
- Widgets: VOTD widget + recitation player widget via **Glance**.
- `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `FOREGROUND_SERVICE_DATA_SYNC` permissions; wakelock for player.

## 9. i18n

- **22 locales** shipped as `values-*/strings.xml`: ar, bn, ckb, de, es, fa, fil, fr, gu, hi, in(id), it, ky, ml, pt, ru, sd, ta, tr, ur, zh-rCN, zh-rTW (glob of res dir). Content translations additionally cover ~20 languages beyond UI languages.
- RTL: Android `supportsRtl` + ldrtl resource qualifiers + peacedesign RTL-aware components. Reciter names localized into ~23 languages **inside the recitations catalog JSON** (per-item `translations` map) — content localization co-located with data.

## 10. Testing / CI / release engineering

- **Tests:** only template tests exist (`ExampleUnitTest`, `ExampleInstrumentedTest`, `MainActivityTest`) — effectively **no test coverage**.
- **CI:** single `ci.yml` — build debug APK on push/PR (JDK 17 temurin, gradle cache), upload APK artifact; **no test/lint job**; `paths-ignore` for md/inventory/assets. (`.github/workflows/ci.yml`)
- **Release:** fastlane metadata (store listings + screenshots in repo), GitHub Releases + IzzyOnDroid/F-Droid (`dependenciesInfo` disabled for F-Droid compliance — `build.gradle.kts:95-100`), language split disabled in AAB (`bundle.language.enableSplit = false` — keeps all 22 languages in the base bundle), R8 + shrinkResources, release cleartext off.
- Signing: old-signature release APK kept in repo; migration to a new signature implied by filename — a cautionary tale about key management.

## 11. Monetization / privacy / analytics

- **None.** No ads SDK, no purchases, no analytics/crash-reporting service. Local `CrashReceiver` + `ActivityAppLogs` for user-visible diagnostics. FUNDING.yml (donations) + `donate.alfaazplus.com` link. Privacy policy hosted on their site (`inventory/other/urls.json`). The privacy stance is the brand promise and it constrains architecture (no network calls beyond content APIs).

## 12. Recommendations for OUR app (React/Capacitor)

**ADOPT (do the same thing):**

1. **P0 · S — Versioned content catalog with per-resource integer versions.** Ship/serve a single `resources_versions.json`-style manifest + per-item `version` in our bundled JSON inventory (we already bundle Quran + tafsir JSON). Enables delta updates and an update-available UI without app releases.
2. **P0 · M — Read history with mushaf/reader context.** Mirror their `read_history` shape (read_type, reader_mode, division, chapter, from/to verse, page) in our SQLite (`@capacitor-community/sqlite`) — cheap, and it powers continue-reading plus stats we already show (streaks).
3. **P0 · S — FTS for Arabic + surah-alias search.** They use SQLite FTS entities (`ArabicSearchFtsEntity`). Our `SearchScreen` should use SQLite FTS5 (diacritic-normalized column) instead of JS string scanning; an aliases table gives instant jump-to-surah.
4. **P1 · S — Storage-cleanup screen.** First-class screen listing per-resource sizes with delete buttons (`ActivityStorageCleanup`); pairs with our per-surah audio cache.
5. **P1 · S — Bookmark ranges + notes + export/import.** Their `user_bookmarks` (from_verse/to_verse, note, date) + explicit export/import flow complements our existing backup/restore.

**ADAPT (their idea, our stack/approach):**

1. **P0 · M — Repo-as-CDN with mirror fallback.** They serve catalogs/content from raw GitHub + jsDelivr + self-hosted proxy with a user-selectable mirror (`ghraw://` scheme). For our PWA/Capacitor app: define ghraw-like relative paths in a manifest, resolve to {jsDelivr, GitHub raw, our host} at runtime via the network plugin — resilient content updates without Play/PWA review cycles.
2. **P0 · M — Audio timing files separate from audio.** They keep per-reciter verse-timing JSON.gz next to gapless MP3s, enabling verse-sync/repeat on full-surah files. Our per-surah reciter audio can adopt the same: fetch the timing JSON once, sync scroll + verse-highlight, add repeat-range in `AudioController.tsx`.
3. **P1 · M — WBW with per-word audio timings** (`wbw_words` + `wbw_audio_timing` schema is directly portable to our SQLite). Start with ar-only WBW + a reciter with word timing if a source allows; render in `AyahCard`/`MushafModernView`.
4. **P1 · S — VOTD as notification and home widget.** We have `@capacitor/local-notifications` (direct analog of their `VerseOfTheDayWorker` + periodic worker: schedule a daily local notification using the user's selected translation). The widget analog needs a Capacitor widget plugin route (P2 · M).
5. **P1 · M — Mushaf word-coordinates atlas.** Their `atlas_word_shapes` (word → page → placements) over per-page layout metadata (`pages`/`info`) is how tap/highlight works on a mushaf. Our `MushafPixelView`/`MushafModernView` can store the same JSON atlas in SQLite/IDB and get tap-to-select without switching to font rendering.
6. **P2 · S — Reference content packs.** Their Quran&Science / prophets / duas / major-sins packs are just structured JSON+HTML assets. Good candidate for optional downloadable packs in our app using the same manifest mechanism.

**LEARN (inspiration, not directly applicable):**

1. **User-selectable download source / self-hosted proxy** — relevant if our audience includes regions where CDNs are throttled; a PWA can't pick mirrors as easily, but our data pipeline can.
2. **Per-page KFQPC fonts instead of page images** — selectable, zoomable, tiny; if we ever move past the `MushafPixelView` raster approach, the font-per-page + layout-metadata route is proven.
3. **Date-based versionName** kept forever with a commented apology (`build.gradle.kts:20-24`) — pick versioning you can live with.
4. **Verse-report issue template** (`verse_report.yml`) — lightweight content-QA loop with users; we can copy the YAML shape for our repo.
5. **Android Auto media integration** via manifest metadata — long tail for Capacitor, but shows where a mature reciter experience goes.
6. **No-wifi-gate downloads + cleanup screen** instead of metered-network nagging — a UX stance worth debating for our audio downloads (we could default wifi-only but offer a toggle).

## 13. Risks / gotchas

- **License trap:** app code is **GPL-3.0** — do not copy Kotlin sources or their repo-hosted content files verbatim into Azkar App unless we are willing to GPL our distribution. Ideas/schemas are fine; code is not.
- **Content licenses are separate and individual:** Tanzil text has its own free-use terms (attribution, no alteration), QuranEnc tafsirs are per-tafsir CC variants, KFQPC fonts are freer than GPL, and audio from quranicaudio / the `dabatase` GitHub repos has unclear blanket licensing — check each before redistributing in our app.
- **Repo-as-CDN risks:** raw.githubusercontent throttling/latency; jsDelivr @latest caching; self-hosted proxy = operating cost. Their `ghraw://` indirection mitigates but adds a resolution layer.
- **APK/repo bloat:** 604 KFQPC TTFs, atlas zips, science images — download lazily, never bundle (they do not bundle the v2 fonts either).
- **Maintenance smells:** zero meaningful tests; CI is build-only; no lint job; versionCode scheme acknowledged as odd in comments; old-signature APK in the repo hints at signature-rotation pain. Room schemas checked in (good) but 4 separate DBs add plumbing.
- **No prayer-times/azkar features at all** — do not look here for those patterns; it is a pure Quran reader.

## 14. Key links

- Repo: https://github.com/AlfaazPlus/QuranApp (README, FEATURES.md, CONTRIBUTING.md, DeepWiki badge)
- Their site/privacy: https://quran.alfaazplus.com ; donations: https://donate.alfaazplus.com
- Content upstreams: https://quranenc.com , https://tanzil.net , https://quran.com , https://qurandb.com , https://tarteel.ai , https://quranicaudio.com , https://everyayah.com
- Inventory repos referenced in catalogs: `github.com/AlfaazPlus/QuranAppInventory` (WBW, audio timings), `github.com/dabatase/*` (translation-audio releases)
- Distribution: Play Store (`com.quranapp.android`), IzzyOnDroid, GitHub Releases
- Local evidence paths: `app/build.gradle.kts`, `AndroidManifest.xml`, `api/ApiConfig.kt`, `api/GithubApi.kt`, `api/InventoryUrlFetch.kt`, `utils/workers/*`, `utils/mediaplayer/RecitationService.kt`, `app/schemas/**`, `inventory/**`, `FEATURES.md`, `LICENSE`, `.github/workflows/ci.yml`
