# Milestones & Task List — Apply Research to Azkar App

Companion to `plan-high-level.md`. Sources refer to reports in `_research/projects/`. Every task names real files (verified in repo this session). Validation per milestone: `npm run test` · `npm run lint` · `npm run build` + the milestone's manual RTL smoke items. Effort: S ≤1d, M ≤1wk, L multi-wk.

---

## Milestone 0 — Foundations & guardrails (~½ week)

| ID | Task | Files | Deps | Done when | Effort | Source |
|---|---|---|---|---|---|---|
| M0-T1 | **Attribution screen** — data-driven credits list (Tanzil, King Fahd Complex, reciters+sites, hisnmuslim, OFL fonts, QUL) rendered under Settings → About; ready to include future QF string | `components/screens/AboutUsScreen.tsx`, new `data/static/licenses.ts` | — | About screen lists all current content sources + licenses; text lives in data not JSX | S | apis-and-packages §8 |
| M0-T2 | **Gemini grounding** — `explainZikr` injects the bundled zikr's own text + benefit/reference into the prompt, requires citations, forbids quoting outside provided text; ayah-explanation variant stub grounded on bundled tafsir (no new UI yet) | `services/GeminiService.ts`, new `tests/unit/gemini-prompt.spec.ts` | — | Unit test asserts prompt contains source text + citation instruction and never sends API-fetched content | S | quran-org §6 (quran-mcp principle); api §9 (no-LLM term) |
| M0-T3 | **CI + testing baseline** — GitHub Actions workflow (lint + vitest + `tsc && vite build`) on PR; `TESTING_STRATEGY.md` (fakes-over-mocks rule, from quran_android) | new `.github/workflows/ci.yml`, new `TESTING_STRATEGY.md` | — | CI green on a sample PR; doc reviewed | S | quran-android §10; my_quran §10 |
| M0-T4 | **License guardrail rule** — one-page PR checklist: no code/data from GPL/no-license repos; audio = cache+attribute, never re-host; QF content never bundled/LLM-piped | same docs as M0-T3 | — | Checklist exists and is referenced by CI PR template | S | plan-high-level risks |

**Milestone done when:** CI green · attribution visible · Gemini prompts provably grounded.

---

## Milestone 1 — Audio experience (~2 weeks)  *(completes pending TASK.md "Background Audio Playback")*

| ID | Task | Files | Deps | Done when | Effort | Source |
|---|---|---|---|---|---|---|
| M1-T1 | **Media Session for the Quran player** — reuse the existing pattern from `AudioService.setupMediaSession` in `AudioMiniPlayer.tsx`: metadata (surah name, reciter, artwork icon-512), handlers play/pause/stop/seekto/nexttrack/previoustrack; extract shared helper `utils/mediaSession.ts` | `components/quran/AudioMiniPlayer.tsx`, `services/AudioService.ts`, new `utils/mediaSession.ts` | M0-T3 | Lock-screen/notification controls drive Quran recitation in a mobile browser/PWA | S | mostaqem §12; frontend-next (Media Session); quran-android A3 |
| M1-T2 | **Android WebView media-session spike + decision** — verify lockscreen behavior in the Capacitor APK; evaluate GPL `@jofr/capacitor-media-session` vs a thin custom plugin (MediaSessionCompat ~1 day). ⚠️ **USER DECISION** (license) | `android/` (only if custom plugin), decision note appended here | M1-T1 | Decision recorded + chosen path implemented; lockscreen verified on-device | S + decision | ecosystem §6.4 |
| M1-T3 | **Resumable downloads** — bulk per-surah download path: `.part` file + `Range: bytes=N-` append via Capacitor Filesystem; per-ayah progress events; skip-complete on retry; index records partial state | `services/audioCacheMobile.ts`, `components/quran/AudioDownloadSheet.tsx`, `services/audioCache.ts` (CacheBackend + partial state) | M0-T3 | Kill app mid-download → relaunch → resume from byte offset; finished ayahs never re-downloaded | M | quran-android A1 (.part + Range) |
| M1-T4 | **Reciter catalog: extract + refresh channel** — move `RECITERS` out of `QuranService.ts` → `data/static/reciters.json`; new `scripts/fetch-reciters.mjs` regenerates from API v4 `chapter_recitations` (has `file_size`) + mp3quran v3 (241 reciters); Wi-Fi-gated runtime refresh merges updates; never hardcode CDN hosts (returned absolute URLs + fallback bases) | `services/QuranService.ts`, new `scripts/fetch-reciters.mjs`, `data/static/reciters.json`, `components/quran/ReciterPicker.tsx` | M0-T3 | `node scripts/fetch-reciters.mjs` regenerates catalog; a newly added reciter appears without app release | M | api §8; apis-and-packages §3 (mp3quran v3) |
| M1-T5 | **Playback resume + continue-listening** — persist (surahId, reciterId, ayahNumber, positionMs) via storage adapters (web+mobile); "متابعة الاستماع" Home widget card; exact resume on tap | `data/storage/interface.ts`, `data/storage/web.ts`, `data/storage/mobile.ts`, `components/home/HomeWidgets.tsx`, `AudioMiniPlayer.tsx` | M1-T1 | Relaunch mid-recitation → tap card → resumes at exact position | S | mostaqem §12 (exact position resume) |
| M1-T6 | **Queue + two-lane sourcing** — play local file when cached, stream otherwise (never double-download); auto-advance across surahs (end of surah → next surah, same reciter); queue survives player unmount | `AudioMiniPlayer.tsx`, `services/audioCache.ts`, new `services/audioQueue.ts` | M1-T3, M1-T5 | Whole-mushaf listening continues across surah boundaries; cached files used when present | M | mostaqem §12 (two-lane + neighbor queue); quran-android (AudioQueue) |
| M1-T7 | **Download manager UX** — pause/resume-all, per-item progress, storage-used %, delete one/all; storage-cleanup section in Settings listing cache size by reciter (from `.index.json`) | `AudioDownloadSheet.tsx`, `components/screens/SettingsScreen.tsx`, `services/audioCacheMobile.ts` (size stats) | M1-T3 | User can pause/resume bulk downloads and see/reclaim storage per reciter | M | mostaqem §12; alfaazplus (cleanup screen) |

**Milestone done when:** lockscreen controls work (PWA; Android per M1-T2) · interrupted downloads resume · reciter catalog refreshable · resume + cross-surah queue + storage cleanup verified.
**Manual RTL smoke:** player bar overlays bottom-nav correctly RTL; Arabic labels truncate gracefully; downloads survive airplane-mode interruptions.

---

## Milestone 2 — Data integrity & search (~1½ weeks)

| ID | Task | Files | Deps | Done when | Effort | Source |
|---|---|---|---|---|---|---|
| M2-T1 | **Migration runner** — formalize the existing flag-keyed pattern in `data/migrations.ts` into an ordered runner (array of {flag, fn}), each idempotent + unit-tested; invoked on both adapters' init | `data/migrations.ts`, `data/storage/web.ts`, `data/storage/mobile.ts`, new `tests/unit/migrations.spec.ts` | — | Existing `id_migration_v2` still runs once; new migrations registered + tested; re-run is a no-op | S | my_quran A2 (pattern already half-present in repo) |
| M2-T2 | **Backup v2** — envelope `{schema:'azkar-backup', version:2, exportedAt}`; preview-with-counts dialog; **merge vs replace** import; backward-compatible v1 import | `data/backup.ts`, `components/screens/SettingsScreen.tsx`, both adapters' import paths | M2-T1 | Round-trip: export → wipe → preview → merge restores counts; v1 file still imports | M | my_quran §12 (best-in-class backup UX) |
| M2-T3 | **Arabic normalization module** — `utils/arabicNormalize.ts`: strip Quranic marks (U+0610–061A, 064B–065F, 06D6–06ED, 08D3–08FF), fold alef/hamza/taa-marbuta/alef-maksura, remove PUA/bidi, spelling-variant table; wire into `azkarRepository.search` | new `utils/arabicNormalize.ts`, `data/azkarRepository.ts`, new `tests/unit/arabic-normalize.spec.ts` | — | "الرحمن" matches "الرحمان"; تشكيل-free queries match diacritized azkar text; 20+ unit cases pass | M | my_quran §4 (port rules, not code — GPL) |
| M2-T4 | **Quran search** (new feature — SearchScreen is azkar-only today) — extend `scripts/generate-quran-data.mjs` to emit `data/static/quran/search_index.json` (normalized word→ayah ids); `workers/search.worker.ts` runs queries (exact/prefix/flexible clitic-stripping, AND/OR, 200-hit cap); Quran tab in SearchScreen with `<mark>` highlights (char offsets from AyatRow text) + jump-to-ayah | `scripts/generate-quran-data.mjs`, new `workers/search.worker.ts`, `components/screens/SearchScreen.tsx`, `services/QuranService.ts` | M2-T3 | Diacritic-free query returns correct ayah set quickly on device-class hardware; highlights navigate to ayah | M | my_quran §4+B2; alfaazplus (FTS5 concept → worker/IDB equivalent) |
| M2-T5 | **Content versioning + integrity** — generator also emits `data/static/quran/manifest.json` (per-resource version + counts); launch-time integrity check for the audio cache index (missing/corrupt entries pruned; partials flagged via M1-T3 state); app-version stamped into cache keys so upgrades invalidate cleanly | `scripts/generate-quran-data.mjs`, `services/audioCacheMobile.ts`, `services/QuranService.ts` | M1-T3 | Corrupt audio index self-heals on next launch; manifest versions bump with content changes | M | quran-android A2 (self-repairing content, scoped to downloaded resources) |

**Milestone done when:** migrations tested & ordered · backup v2 merge/replace round-trips · normalized Quran+azkar search with highlights ships · audio cache self-heals.
**Manual RTL smoke:** search highlights render correctly RTL; backup preview counts match reality in Arabic UI.

---

## Milestone 3 — Reading experience (~2 weeks)

| ID | Task | Files | Deps | Done when | Effort | Source |
|---|---|---|---|---|---|---|
| M3-T1 | **Ayah action menu + central modal container** — long-press/tap menu on `AyahCard` (copy, bookmark, share, play-from-here, tafsir, repeat); ONE modal container routes all ayah actions (single modal-state source); advanced copy = range + format options | `components/quran/AyahCard.tsx`, new `components/quran/VerseActionModalContainer.tsx`, reuse `components/quran/BookmarkSheet.tsx` | M2-T4 | All ayah actions reachable from one menu; only one modal ever open; RTL layout correct | M | frontend-next (OverflowVerseActionsMenu + verseActionModal container) |
| M3-T2 | **Repeat settings** — `{from,to,repeatRange,repeatEachVerse,delayMultiplier,-1=∞}` state (context/reducer); UI inside M3-T1 modal; drives `AudioMiniPlayer` looping incl. inter-verse delay | new `context/RepeatSettingsContext.tsx`, `AudioMiniPlayer.tsx`, `VerseActionModalContainer.tsx` | M3-T1 | Repeat 2:255–2:260 ×3 each verse with 1s delay plays exactly that; persisted across sessions | M | frontend-next (RepeatSettings design) |
| M3-T3 | **Ayah timing highlight + tap-to-seek** — `scripts/fetch-timings.mjs` pulls per-reciter ayah timings (QUL datasets — ⚠️ license-check per resource; fallback: derive from per-ayah playback); lazy `data/static/quran/timings/<reciter>.json`; current-ayah highlight during playback; tap ayah to seek | new `scripts/fetch-timings.mjs`, `services/QuranService.ts` (timing loader), `AudioMiniPlayer.tsx`, `AyahCard.tsx` | M1-T4 (catalog keys), M3-T1 | Highlight follows the playing ayah for a timing-equipped reciter; tapping an ayah seeks there | M | quran-android A4; alfaazplus (per-reciter timing files); api §8 (QUL) |
| M3-T4 | **Tafsir switching** — extend `TafsirSheet.tsx`: picker over bundled tafsirs (Muyassar today); OPTIONAL second tafsir (Ibn Kathir) behind a feature flag: license-checked bundle OR on-demand via alquran.cloud with ephemeral cache (≤1 week per QF terms) — ⚠️ **license decision gate before shipping** | `components/quran/TafsirSheet.tsx`, `services/QuranService.ts`, `data/static/quran/tafsir/` | M2-T1 | Switching tafsirs re-renders ayah commentary; on-demand tafsir degrades gracefully offline | M | api §8–9; frontend-next (tafsir picker UX) |
| M3-T5 | **Read history + continue-reading upgrade** — log read sessions (surah, ayah, ts) via storage adapters; "continue where you stopped" with visible marker; history list in QuranScreen | `data/storage/*`, `components/screens/SurahReaderScreen.tsx`, `components/screens/QuranScreen.tsx` | M2-T1 | Reopening a surah resumes at last ayah with marker; last 10 sessions listed | S | alfaazplus (read_history w/ context); my_quran A4 |
| M3-T6 | **Mushaf font hardening** — bundle KFGQPC Uthmanic Hafs WOFF2 **with its license file** (never subset); `font-display: block` + `local()` first + preload + `document.fonts.ready` gating before Quran text renders (UI fonts stay `swap`) | `public/fonts/`, `index.html`, `SurahReaderScreen.tsx`, `MushafModernView.tsx` | — | No flash-of-wrong-glyph on Quran pages; font loads offline; license notice present | S | frontend-next (font readiness gating); apis-and-packages §7 |

**Milestone done when:** menu+modal + repeat + highlight/seek + tafsir switching + history + hardened fonts all verified on device.
**Manual RTL smoke:** menu popover stays in viewport at RTL edges; repeat HUD shows Arabic ranges correctly; highlight auto-scroll doesn't fight user scrolling.

---

## Milestone 4 — Engagement & daily habit (~1 week)

| ID | Task | Files | Deps | Done when | Effort | Source |
|---|---|---|---|---|---|---|
| M4-T1 | **Verse-of-the-Day notification** — deterministic ayah-of-day (by Hijri date) via local notifications; deep-link opens reader at that ayah; toggle + time picker in NotificationSettings | `services/NotificationService.ts`, `components/screens/NotificationSettingsScreen.tsx` | M3-T5 | Fires daily at chosen time; tap lands on the ayah, offline-safe | S | alfaazplus (VOTD loop) |
| M4-T2 | **On-this-day dataset** — 366-entry Hijri-aware `data/static/onthisday.json` (events/births/deaths/occasions) — ⚠️ **content source needs user approval** (authenticity is a brand commitment) + validation script | new `data/static/onthisday.json`, new `scripts/validate-onthisday.mjs` | — | Dataset validates (366 entries, Hijri keys, source field per entry) | M (curation) | roznama §6 |
| M4-T3 | **"Today" digest card** — Home card: today's azkar progress + one wisdom item (existing `quotes.ts`) + one on-this-day entry; respects existing home layouts | `components/home/HomeWidgets.tsx`, `components/home/DashboardLayout.tsx` | M4-T2 | Card renders fully offline; rotates daily (Hijri-keyed) | S | roznama §6 (one-screen-a-day) |
| M4-T4 | **What's-new dialog** — version-gated modal after update summarizing changes (static changelog: `metadata.json` version + new `CHANGELOG.md`) | new `components/common/WhatsNewModal.tsx`, `App.tsx` (post-onboarding hook) | — | Shows once per app version; dismiss choice respected | S | roznama §5; my_quran A5 |
| M4-T5 | **Keep screen awake while reading** — Screen Wake Lock API in `SurahReaderScreen` (auto-release on navigate; settings toggle) | `components/screens/SurahReaderScreen.tsx` | — | Screen stays on while reading; releases on exit; no drain when backgrounded | S | my_quran A6 |

**Milestone done when:** VOTD + digest + what's-new + wake-lock verified offline on device.

---

## Milestone 5 — Strategic backlog (unsized; license-gated; pull per need)

| ID | Item | Gate / note | Effort | Source |
|---|---|---|---|---|
| M5-T1 | **Mushaf page mode** (page/line layout, word-tap highlight) via QUL layouts (MIT repo, per-resource license) + glyph-bounds concept; possibly page images (separate KFGQPC terms) | License check first | L | quran-android §3; quran-org §6; api §8 |
| M5-T2 | **Word-by-word learning** (tap-word meaning + word audio via `verses.quran.com/wbw`, verified 200; QUL wbw data) | QUL per-resource license | M | alfaazplus; api §8 |
| M5-T3 | **Full-surah gapless mode** (quranicaudio full-surah URLs + QUL segment timings for highlight) — complements per-ayah audio today | Audio licensing: cache+attribute | M | quran-org §6; quran-android |
| M5-T4 | **Repo-as-CDN content channel** (catalog in a repo; jsDelivr/GitHub-raw + mirror fallback) when content outgrows the bundle | Only if content strategy demands | M | alfaazplus (standout pattern) |
| M5-T5 | **Local-first community dhikr** (household tasbeeh goal via QR/export of a shared counter — no accounts/server) | Optional; skip is fine | S | roznama §6 |
| M5-T6 | **Per-locale defaults files** (prep for future English) — restructure settings defaults per locale | Cheap now, costly later | S | frontend-next (defaultSettings/locales pattern) |
| M5-T7 | **Engineering hygiene** — Renovate; no-op CrashReporter interface; reproducible-build habit; fastlane-style release notes | Each S | S each | quran-android §10; my_quran §10 |
| M5-T8 | **Polish pack** — auto-scroll mode; dual reading modes preserving position; header quick-nav (surah/juz/page) | Each S | S each | my_quran B3–B4; frontend-next |

---

## Dependency graph (compact)

```
M0 ──► M1 ──────────────► M3 ──► M4
 │        │                │
 └─► M2 ──┴─ (M2-T1 feeds M2-T2, M3-T5; M2-T3 feeds M2-T4; M1-T4 feeds M3-T3)
```

## Decisions required from the user before/at milestone start
1. **M1-T2:** Android lockscreen path — GPL plugin vs thin custom plugin vs PWA-only for now. *(Recommend: PWA-first now, custom plugin in a later pass.)*
   - **DECIDED 2026-09-09: PWA-first.** Lockscreen controls ship via the WebView/PWA `navigator.mediaSession` (M1-T1); no `android/` changes. Thin MediaSessionCompat plugin deferred to a later on-device pass; GPL `@jofr/capacitor-media-session` rejected per `docs/license-guardrails.md` (GPL = ideas only). Revisit only if lockscreen verification on the APK fails.
2. **M3-T4:** Second tafsir — on-demand + ephemeral cache (recommended) vs license-checked bundle.
3. **M4-T2:** Approve the authentic source for the on-this-day dataset.
4. **Pace/ordering:** confirm ~8-week calendar and M1-before-M2 order (audio first), or swap.
