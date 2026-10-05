# Feature Matrix — Our App vs. Researched Quran/Islamic Apps

Legend: ✅ full support · ◐ partial/different approach · ❌ absent · ?=unverified (self-reported)
Sources: per-project reports in `_research/projects/` (evidence-cited there).

| Capability | **Azkar App (ours)** | quran.com web (frontend-next) | quran_android | QuranApp (AlfaazPlus) | Mostaqem | my_quran | Roznama |
|---|---|---|---|---|---|---|---|
| **Stack** | React+Capacitor (web UI) | Next.js 14 | Kotlin/Compose hybrid | Kotlin/Compose hybrid | Kotlin/Compose | Flutter | closed (closed source) |
| **Quran text bundled offline** | ✅ 114 surahs JSON | ◐ (server-fetched, SW-cached) | ❌ downloaded DBs | ◐ 3 prebuilt, rest downloaded | ✅ 1.75MB quran.json | ✅ ~4.6MB JSON + search idx | ◐ ? |
| **Mushaf page mode** | ❌ | ✅ page→line grouping | ✅ page images + ayahinfo coords | ✅ 604 per-page fonts + word atlas | ❌ | ◐ paired font/text fidelity | ✅ tajwid view? |
| **Translation view** | ❌ (Arabic-only) | ✅ | ✅ | ✅ 45+ | ❌ | ◐ (font/text pairs) | ✅ 9 languages |
| **Tafsir** | ✅ الميسر only, bundled | ✅ 20, switchable, multi-select | ✅ downloaded DBs | ✅ 10+ | ❌ | ❌ | ✅ + إعراب + أسباب النزول |
| **Word-by-word** | ❌ | ✅ (text+audio wbw/*.mp3) | ◐ glyph coords | ✅ wbw_words + wbw_audio_timing | ❌ | ❌ | ✅? |
| **Arabic search** | ◐ (brute-force scan) | ✅ server API | ✅ | ✅ SQLite FTS5 | ❌ | ✅ build-time inverted+bigram index, match modes | ? |
| **Audio: full-surah download+cache** | ✅ per-surah download | ◐ streams (SW MP3 cache OFF) | ✅ gapless from quranicaudio | ✅ quranicaudio + translation audios | ✅ Media3 DownloadManager | ❌ (no audio at all) | ✅? |
| **Audio: per-ayah** | ✅ cdn.islamic.network | ✅ verses.quran.com | ✅ everyayah (gapped) | ✅ + per-word audio | ✅ | ❌ | ? |
| **Resumable downloads** | ❌ | — | ✅ .part + Range header | ✅ WorkManager | ✅ resumable/pausable | — | ? |
| **Repeat settings (A-B, per-verse, delay)** | ❌ | ✅ RepeatSettings machine | ◐ range repeat | ✅ verse-sync/repeat | ◐ queue-based | — | ❌ |
| **Live ayah highlight during audio** | ❌ | ✅ verse timing segments | ✅ timing DB | ✅ per-reciter timing files | ◐ | — | ? |
| **Lock-screen / media controls** | ❌ | ✅ Media Session | ✅ Media3 MediaSession | ✅ MediaLibraryService | ✅ MediaSessionService | — | ? |
| **Continuous queue across surahs** | ❌ | ✅ radio submachine | ✅ AudioQueue | ✅ | ✅ ±3 neighbor auto-extend | — | ? |
| **Playback resume (position)** | ❌ | ? | ✅ | ✅ | ✅ exact position in DB | — | ? |
| **Versioned content catalog / delta updates** | ❌ (content ships with app) | — | ✅ versioned+patchable+repair workers | ✅ resources_versions.json + repo-as-CDN mirrors | ◐ backend | ✅? build-time | — |
| **Bookmarks / notes / ranges** | ✅ bookmarks+favorites | ✅ + notes + pin | ✅ + tags | ✅ ranges+notes+export | ◐ favorites | ✅ | ◐ accounts |
| **Read history / continue-reading** | ◐ resume-last-read | ? | ✅ incl. page context | ✅ read_history table | ✅ | ✅ reading_position | ✅ accounts |
| **VOTD / daily content notification** | ❌ | ❌? | ❌ | ✅ VOTD + hourly verse worker | ❌ | ❌ | ✅ daily digest push |
| **Home-screen widget** | ❌ | — | ✅ | ✅ Glance widget | ❌ | ❌ | ❌? |
| **Prayer times / Qibla / Hijri** | ✅ adhan npm + compass + Hijri | ❌ | ❌ (by design) | ❌ (by design) | ❌ | ❌ | ✅ + adhan alarm |
| **Azkar / tasbeeh** | ✅ core (tap-to-count + streaks) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ azkar + tasbeeh + Community Dhikr |
| **Backup/restore** | ◐ basic export/import | ◐ account sync | ✅ Android auto-backup | ✅ export/import | ✅ account | ✅ versioned envelope + preview + merge/replace | ✅ accounts |
| **Themes / dark mode / font scale** | ✅ 6 themes + dark + 8-step scale | ✅ | ✅ | ✅ | ✅ M3 dynamic | ✅ | ✅ |
| **i18n** | ❌ Arabic-only (RTL) | ✅ 19 locales + dir switching | ✅ 45 locales | ✅ | ◐ | ✅ ar/en fastlane | ✅ multi |
| **AI features** | ✅ Gemini explanations (user key) | — | — | — | — | — | — |
| **Ads / monetization** | ❌ (by design) | ❌ | ❌ (donations) | ❌ | ❌ | ❌ | ✅ ads + pay-to-remove IAP |
| **Analytics/tracking** | ❌ (by design) | ❌? | ◐ build-time swap, noop default | ❌ | ❌ | ❌ | ✅ ad-oriented |
| **License** | proprietary (ours) | MIT in package.json BUT no LICENSE file + README no-copy | GPL-3.0 (+CC BY-NC-ND data) | GPL-3.0 | Mostaqem Custom (non-commercial) | GPL-3.0 | proprietary |

## Read-through of the matrix

1. **Our unique ground:** azkar/tasbeeh/streaks + prayer times/Qibla + Arabic-first + local-first privacy + Gemini AI. None of the dedicated Quran apps combine these (they deliberately stay pure readers). Roznama is the only breadth competitor but is ad-funded and server/account-based.
2. **Our biggest gaps (all P0/P1 candidates):** media-session lockscreen controls, live ayah highlight + repeat settings, resumable downloads, versioned content with silent repair, real Arabic search (FTS/index), tafsir breadth, VOTD notification, stronger backup UX.
3. **Borrowable patterns validated across 4+ apps independently:** versioned downloadable content, per-reciter audio timings, download-state caches, read-history with context, storage-cleanup UI, "don't hardcode CDN hosts, use returned URLs".
4. **Deliberate non-goals we share with the best repos:** no accounts (3 of 6), no ads (6 of 6 except Roznama), minimal analytics. Our brand promise matches the mature open-source norm for this audience.
