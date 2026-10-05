# Lessons for Azkar App — Prioritized, Actionable Roadmap

Distilled from 9 evidence-cited reports in `_research/projects/`. Priorities: **P0** = do next, **P1** = next quarter, **P2** = strategic. Effort: **S** ≤1 day, **M** ≤1 week, **L** multi-week. Every item names its source report(s).

---

## 0. Legal guardrails — read before writing any borrowed code

| Source | License | Rule for us |
|---|---|---|
| quran_android | GPL-3.0 + CC BY-NC-ND data | Ideas/architecture/UX only. **Never paste code or ship their data files.** Don't leech their volunteer-funded hosts. |
| QuranApp (AlfaazPlus) | GPL-3.0 | Same — schemas and flows are safe to re-implement; code is not. |
| my_quran | GPL-3.0 | Same. KFGQPC fonts bundled there carry their own license — fetch from KFGQPC directly, keep license files. |
| Mostaqem | Mostaqem Custom (non-commercial, no redistribution) | Hard stop on code. Learn the audio architecture only. |
| quran.com-frontend-next | MIT in package.json but **no LICENSE file** + README forbids copying | Treat as all-rights-reserved: read, learn, re-implement. Never copy code/assets. |
| api-js, audio.quran.com, QUL tooling | MIT | Only safely borrowable code in the ecosystem (preserve notices). |
| Quran Foundation API terms | Developer Terms 2026 | **No redistribution** (don't bundle API-fetched content), cache ≤1 week, required attribution string, **no LLM/ML use without written consent** → keep API content out of Gemini prompts. |
| Tanzil | CC BY 3.0 **verbatim-only** | Attribution + link; never edit the text. |
| KFGQPC fonts | own license | Free for Quranic use, keep notice, no font resale, **never subset the mushaf font**. |
| Reciter audio | no blanket license | Cache for personal use + attribute; **never re-host**. |

**Explicit do-NOT list (all rejected with reasons in the reports):** ads or pay-to-remove IAP (Roznama model conflicts with our brand); accounts/server sync (backup/restore covers it); aladhan `specialDays` dataset (contains Sufi Urs entries — unsuitable); sunnah.com/dorar as bundle sources (keyed/403/unstable); GPL media-session plugin **without a license decision** (@jofr/capacitor-media-session is GPL-3.0); copying JSON data files out of GPL repos.

---

## 1. P0 — do next (highest value ÷ effort)

1. **Media Session in the audio player (P0/S).** Wire `navigator.mediaSession` (metadata + play/pause/seek handlers) in `AudioMiniPlayer.tsx`; on Android WebView use a plugin — decide license first (GPL @jofr vs ~1-day custom MediaSessionCompat plugin). Sources: mostaqem §12, quran-android §A3, frontend-next, ecosystem §6.4. *The single biggest missing piece of our recitation experience.*
2. **Resumable per-surah downloads (P0/S–M).** `.part` file + `Range: bytes=N-` + append via Capacitor Filesystem in `audioCacheMobile.ts`. Source: quran-android (QuranDownloadService pattern).
3. **Versioned content catalog + silent repair (P0/M).** Give every bundled resource an integer version + one `resources_versions.json`; periodic integrity worker re-fetches missing/corrupt surah files; enables content updates independent of app releases. Sources: alfaazplus-quranapp (standout pattern), quran-android.
4. **Backup envelope v2 (P0/M).** Schema-id + versioned JSON envelope, preview-with-counts dialog, **merge vs replace** import, flag-keyed idempotent migrations with dedupe for SQLite/IDB. Source: dmouayad-my-quran §12 (best-in-class backup UX).
5. **Reciter catalog refresh channel (P0/S).** Pull reciter metadata + `file_size` from API v4 `chapter_recitations` (matches our per-surah model exactly) and/or mp3quran v3 (241 reciters); never hardcode CDN hosts — use returned absolute `audio_url` with fallback bases. Sources: quran-com-developers-api §8, apis-and-packages §3.
6. **Attribution screen (P0/S).** Tanzil → King Fahd Complex → reciters+sites (mp3quran/everyayah/quranicaudio/islamic.network) → hisnmuslim → QUL → OFL fonts (Amiri/Noto Naskh). Several licenses legally require it. Source: apis-and-packages §8.
7. **Verse-of-the-Day daily notification (P0/S).** `@capacitor/local-notifications` daily schedule + deep-link into reader. Source: alfaazplus-quranapp (VOTD + Glance widget retention loop).
8. **Arabic text normalization module in TS (P0/M).** Strip Quranic marks (U+0610–061A, 064B–065F, **06D6–06ED**, 08D3–08FF), fold alef/hamza/taa-marbuta, remove PUA/bidi, spelling-variant table — port the *rules* for Quran + azkar search. Source: dmouayad-my-quran §4.

## 2. P1 — next quarter

9. **Per-reciter timing files → live highlight + tap-to-seek (P1/M).** Ship/download per-reciter ayah timing JSON (QUL datasets, MIT repo, per-resource license check) → highlight current ayah during playback, tap-ayah-to-seek, repeat ranges. Sources: quran-android, alfaazplus, apis-and-packages §8.
10. **Repeat-audio state machine (P1/M).** `{from, to, repeatRange, repeatEachVerse, delayMultiplier, -1=∞}` — memorization-grade repeat. Source: frontend-next (XState repeat machine design; re-implement in plain TS/reducer).
11. **Ayah action menu + one central modal container (P1/M).** Overflow menu (copy/bookmark/share/tafsir/play/repeat) gated by a single `verseActionModal` slice-equivalent; add **advanced copy** (range + format). Source: frontend-next §Reading.
12. **Real Arabic search (P1/M).** Build-time index (word→ayah) + lazy bigram index for contains-search in a **Web Worker**, match modes incl. clitic-stripping "flexible", AND/OR, 200-hit cap, `<mark>` via char-offset verse segments. Sources: dmouayad-my-quran §4 + alfaazplus (SQLite FTS5 pattern → ours: IDB/worker equivalent).
13. **Two-lane audio + continuous queue + exact resume (P1/M).** Play local file when cached, stream otherwise (never double-download); auto-extend queue to next surahs of same reciter; persist (surah, reciter, position) and restore "continue listening". Source: mostaqem §12.
14. **Download-manager UX (P1/S–M).** Pause/resume-all, per-item progress, storage-used %, delete one/all, skip-already-downloaded on bulk, storage-cleanup screen. Sources: mostaqem §12, alfaazplus.
15. **Tafsir breadth (P1/M).** UX for multi-tafsir with per-locale defaults (Arabic default = الميسر → Qurtubi/Ibn Kathir options); content via API v4 on-demand+ephemeral cache — note tafsir-by-ayah is **404 on legacy host today**; alternative: license-check a bundleable Ibn Kathir dump (alquran.cloud `ar.ibnkathir`, King Fahd Complex provenance). Sources: quran-com-developers-api §8–9, frontend-next, apis-and-packages §2.
16. **"One screen a day" digest (P1/M).** Home "today" card: azkar progress + one wisdom item + one "حدث في مثل هذا اليوم" from a **366-entry Hijri-aware bundled dataset** (build it once — cheapest proven daily-open driver). Sources: roznama-app §6.
17. **Read-history table (P1/S).** Reader-mode/surah/page context per session → continue-reading + honest streak stats. Source: alfaazplus.
18. **Per-locale defaults files (P1/S).** Structure settings as `defaultSettings/<locale>.ts` now (Arabic), so adding English later is additive not architectural. Source: frontend-next §i18n.
19. **Font strategy hardening (P1/S).** Preload + `document.fonts.ready` gating before Quran render; bundle KFGQPC Uthmanic Hafs WOFF2 (`font-display: block`, local() first, **never subset**); `font-display: swap` for UI fonts. Sources: frontend-next, apis-and-packages §7.

## 3. P2 — strategic

20. **Mushaf page mode (P2/L).** QUL (MIT) mushaf-layout JSONs + glyph-bounds concept (+ page images under separate KFGQPC terms) → real madani page view with word-tap highlight. Sources: quran-android §3, quran-org §6, api §8.
21. **Word-by-word learning (P2/M).** QUL wbw datasets or API v4 `words[]` + word-audio streaming (`verses.quran.com/wbw`, verified 200) → tap-word meanings, memorization aid. Sources: alfaazplus, api §8.
22. **Repo-as-CDN content channel (P2/M).** If content grows beyond what the app bundle should carry: catalogs in a repo + runtime fetch via jsDelivr/GitHub raw + self-host mirror fallback behind manifest-relative paths. Source: alfaazplus (their standout).
23. **Local-first "community dhikr" (P2/S).** Household/group tasbeeh goals shared via QR/export of a counter — no accounts, no server; or skip. Source: roznama-app §6 (their account-based version proves demand).
24. **Polish pack (P2/S each).** What's-new dialog from changelog; keep-screen-on while reading (Wake Lock API); auto-scroll mode; dual reading modes preserving position; header quick-nav (surah/juz/page). Sources: dmouayad-my-quran, frontend-next.
25. **Engineering hygiene (P2/S each).** DB-migration verification in CI; fakes-over-mocks testing doc; no-op CrashReporter interface; Renovate; reproducible-build habit. Sources: quran-android §10, dmouayad-my-quran §10.
26. **Gemini grounding rule (P0/S — do this one early).** Always inject exact bundled verse text + tafsir into prompts, require surah:ayah citations, never let the model quote from memory, **never pipe API-fetched content** into it (QF terms). Sources: quran-org (quran-mcp principle), quran-com-developers-api §9.

## 4. Suggested first sprint (2 weeks)

| Day | Item |
|---|---|
| 1–2 | #1 Media Session wiring (PWA path) + #6 attribution screen |
| 3–5 | #2 resumable downloads + #5 reciter catalog refresh |
| 6–8 | #7 VOTD notification + #26 Gemini grounding + #4 backup envelope v2 |
| 9–10 | #8 Arabic normalization module + normalize our current search |
| 11–14 | #3 versioned content catalog skeleton (versions manifest + integrity check) |

## 5. Housekeeping note

The five reference clones live in `_research/repos/` (gitignored) — `quran-com-frontend-next` alone is ~5.2 GB. Safe to delete any time; the reports preserve everything worth keeping (with file-path evidence).
