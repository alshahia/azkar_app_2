# APIs & Packages Ecosystem Survey — Azkar App (React 18 + TS + Vite + Capacitor 8)

Scope: external APIs, datasets, npm packages, and fonts an **Arabic-only, local-first, offline-first** Islamic web/Capacitor app can ADOPT / ADAPT / LEARN from. Verification legend: **✅ = live-verified via read-only GET during this research session**; **📄 = documented / found in sources but not live-verified**; **⚠️ = problem or caution found**.

---

## 0. One-page summary table

| Source | What for | Auth | License / Attribution | Verdict for us |
|---|---|---|---|---|
| api.quran.com/api/v4 ✅ | Quran text, metadata, 20 tafsirs, recitations | None (fair use) | Mixed per-resource (Tanzil, QPC, per-tafsir) | Pointer only — deep-dive is another agent's task |
| api.alquran.cloud/v1 ✅ | Whole Quran (many Arabic editions) + 6 Arabic tafsirs + audio editions + translations | None (fair use) | Upstream per edition (Tanzil / KFGQPC / KFC…); API is open source (github.com/DigitalCloud/api.alquran.cloud) | **ADOPT** as on-demand fallback + cross-check source |
| tanzil.net ✅ (license page) | Canonical Quran text downloads (Uthmani/Simple + translations) | None | **CC BY 3.0, verbatim-only** + attribution + link to tanzil.net | **KEEP** as our bundled text source |
| QUL — qul.tarteel.ai ✅ (site/docs) | Datasets: mushaf text (KFGQPC Hafs v1.0), fonts, word-by-word, ayah audio segments, translations, tafsir | None | **Per-resource licenses** — must check each before production (FAQ) | **ADOPT** for word-by-word, fonts, segment timings |
| api.quran-tafseer.com ❌ | Tafsir JSON API | None | Unknown | **SKIP** — host refused connection (dead/unreachable) ✅ |
| everyayah.com ✅ | Per-ayah MP3, many reciters | None | Free distribution, no formal license; attribute reciter | **ADOPT** as per-ayah fallback |
| cdn.islamic.network ✅ | Per-ayah + per-surah audio keyed by alquran.cloud editions | None | Same upstream recitations; Islamic Network CDN | **ADOPT** for per-ayah repeat/memorization |
| verses.quran.com (qurancdn) ✅ | Per-ayah MP3 mirrors (Cloudflare CDN) | None | Free distribution; attribute reciter | ADOPT (best-performing mirror) |
| mp3quran.net API v3 ✅ | Catalog of 241 reciters + full-surah MP3 servers | None | Free recitation distribution; attribute reciter | **KEEP** for our per-surah download feature |
| download.quranicaudio.com ✅ | Gapless full-surah MP3 (QuranAudio / quran.com backend) | None | Free distribution | ADOPT as gapless source |
| api.aladhan.com/v1 ✅ | Prayer times, Hijri ↔ Gregorian, Hijri holidays, qibla, asma-ul-husna | None (fair use ~1 req/s) | Free service; attribution appreciated (aladhan.com/prayer-times-api) | **ADOPT only for Hijri holidays**; times stay on-device |
| `adhan` npm (in use) | On-device prayer times | — | MIT | **KEEP** — offline, no API needed |
| api.sunnah.com ⚠️ | Hadith collections (Bukhari, Muslim, …) | **API key** (X-API-KEY) ✅ 403 without key | Attribution to sunnah.com requested; history of instability (GitHub issues #253, #1427) | ADAPT — optional online feature; **not** a bundling source |
| hadeethenc.com ⚠️ | Multilingual Hadith Encyclopedia (rich Arabic content, app-friendly) | None | Free API for apps (Postman docs published) | **ADOPT after DNS check** — api.hadeethenc.com did not resolve from our network ✅ |
| dorar.net ⚠️ | Hadith search / Sunnah encyclopedia | Unofficial API 403 ✅ | Content © Dorar al-Sunna; reuse permission needed | LEARN — do not bundle |
| hisnmuslim.com API ✅ | Adhkar (Hisn al-Muslim) JSON + audio URLs | None | Book content widely redistributed; keep attribution | **ADOPT for offline bundling** (tiny) — note ⚠️ http:// links + BOM |
| islamhouse.com API 📄 | Multilingual Islamic content incl. hadith | Free API key | Their terms; key-gated | LEARN — key gating clashes with our no-account model |
| @tarekeldeeb/quran-madina-react v1.0.2 ✅ (npm) | Madina mushaf pages in React (wrapper of quran-madina-html), built for Capacitor WebView | — | ISC | **KEEP** (already in use); pin + vendor fonts |
| react-quran v1.4.0 ✅ (npm) | Flow-style Quran viewer (surah/ayah list) | — | MIT | LEARN — alternative, not page-faithful |
| quran-json v3.1.2 ✅ (npm) | Quran text + transliteration + translations JSON | — | CC-BY-4.0 | LEARN (handy for future translations) |
| moment-hijri v3.0.0 / hijri-converter v1.1.1 / hijri-date v0.2.2 ✅ (npm) | Hijri ↔ Gregorian conversion | — | MIT (all three) | LEARN — prefer built-in `Intl` islamic-umalqura first |
| @jofr/capacitor-media-session v4.0.0 ✅ (npm) | Media notifications, lockscreen controls, background audio (Capacitor) | — | **GPL-3.0-or-later ⚠️ viral** | ADAPT — only after license review; check capawesome alternative 📄 |
| KFGQPC Uthmanic Hafs font 📄 | Faithful Madani mushaf display font | None | KFGQPC license (free for Quranic use; no standalone resale; keep notice) | **ADOPT** — bundle WOFF2 in app |
| Amiri / Noto Naskh Arabic 📄 | UI/body Arabic fonts | None | SIL OFL 1.1 | ADOPT for UI (not for mushaf fidelity) |

---

## 1. Quran text & metadata APIs

### 1.1 api.quran.com/api/v4 (pointer)
Live ✅ (`GET https://api.quran.com/api/v4/chapters?language=en` → 200, full chapter list). Deep dive is another agent's job — see only: tafsir catalog verified in §2, audio mirrors in §3.

### 1.2 api.alquran.cloud (AlQuran Cloud / Islamic Network)
- **Base:** `https://api.alquran.cloud/v1` — docs: https://alquran.cloud/api — terms: https://alquran.cloud/terms-and-conditions — source: https://github.com/DigitalCloud/api.alquran.cloud
- **Auth/limits:** none; fair-use rate limiting (no published hard numbers).
- **Verified ✅:** `GET /v1/edition/format/text` → **141 text editions**. Arabic identifiers returned:
  - Quran: `quran-uthmani`, `quran-uthmani-min`, `quran-simple`, `quran-simple-clean`, `quran-simple-enhanced`, `quran-simple-min`, `quran-unicode`, `quran-tajweed`, `quran-wordbyword`, `quran-wordbyword-2`, `quran-kids`, `quran-corpus-qd`, `quran-buck`, `quran-uthmani-quran-academy`
  - Tafsir: `ar.muyassar`, `ar.jalalayn`, `ar.waseet`, `ar.qurtubi`, `ar.miqbas`, `ar.baghawi`
- **"quran-aca" does not exist** as an edition. The closest match to that name is `quran-uthmani-quran-academy` (Uthmani text with Quran Academy sign variant). If you saw "ACA" in a tutorial, it likely meant the AlQuran Cloud *API* itself, not an edition.
- **Useful endpoints:** `/surah/{n}/{edition}`; `/ayah/{ref}/editions/{id1,id2}` (✅ tested: `/v1/ayah/2:255/editions/quran-uthmani,ar.muyassar` → 200 with full Uthmani text + Tafsir Muyassar, edition metadata names "King Fahad Quran Complex" as source); `/quran/{edition}` returns the whole Quran as one JSON (handy for building a bundle); `/edition/type/tafsir` lists tafsirs.
- **License:** per-edition upstream (Tanzil text, KFGQPC, KFC tafsirs…). Attribution flows through edition metadata; still keep a credits screen.
- **Verdict: ADOPT** as our on-demand fallback / gap-filler (e.g., extra tafsirs, future translations). Don't make it a hard runtime dependency of core features.

### 1.3 tanzil.net (canonical text downloads)
- **Download:** https://tanzil.net/download/ (Uthmani, Simple, + translations, ZIP/SQL).
- **License ✅ (fetched https://tanzil.net/docs/text_license):** "Tanzil Quran Text … License: Creative Commons Attribution 3.0". Terms of use, verbatim:
  - "Permission is granted to copy and distribute verbatim copies of this text, but **CHANGING IT IS NOT ALLOWED**."
  - "This Quran text can be used in any website or application, provided that its source (**Tanzil Project**) is clearly indicated, and a **link is made to tanzil.net**…"
  - The copyright notice must be included in all verbatim copies.
- **Implication for us:** we may bundle the text (as we do) but must ship attribution + link, and must not edit ayah text in place.
- **Verdict: KEEP** as bundled text; add Tanzil attribution if not already in credits.

### 1.4 QUL — Quranic Universal Library (qul.tarteel.ai)
- **Base:** https://qul.tarteel.ai — resources: https://qul.tarteel.ai/resources — docs: https://qul.tarteel.ai/docs — FAQ: https://qul.tarteel.ai/docs/faq — GitHub: https://github.com/TarteelAI/quranic-universal-library
- **What it offers (downloadable datasets, JSON/SQLite):** mushaf text in multiple riwayat (incl. **KFGQPC Hafs v1.0**), **fonts** (QPC Uthmanic + others), **word-by-word data** (word text, position, transliteration/translation layers), **ayah audio segment timings** (per-ayah start/end inside gapless files — enables highlight-on-gapless!), translations, tafsirs.
- **API:** none yet — docs nav literally shows "API Coming soon" ✅ (fetched). FAQ: "QUL primarily provides downloadable datasets. Integrators usually package data into their own API or database layer."
- **License:** **per-resource** — FAQ: "Can I use QUL data commercially? Check repository license terms and dataset-specific licensing details before production use." Commercial-use discussion per resource tracked in GitHub issues (e.g., issue #589). QUL's own code is Apache-2.0; the *data* carries separate licenses.
- **Verdict: ADOPT** — best single source for word-by-word + fonts + segment timings; audit each resource's license file at download time.

---

## 2. Tafsir sources

| Source | Arabic tafsirs available | How to fetch | Status / license |
|---|---|---|---|
| alquran.cloud editions | Muyassar, Jalalayn, Waseet, Qurtubi, Miqbas, Baghawi | `GET /v1/ayah/{ref}/ar.muyassar` etc. | ✅ live; upstream = KFC/various |
| quran.com v4 | 20 total; Arabic incl. **16 Muyassar, 14 Ibn Kathir, 15 Tabari, 90 Qurtubi, 93 al-Wasit** | `GET /v4/resources/tafsirs` (✅ verified list) then `/v4/quran/tafsirs/{id}?verse_key=2:255` 📄 | ✅ live |
| api.quran-tafseer.com | Historically Muyassar, Ibn Kathir… | `GET /tafseer/{id}/{surah}/{ayah}` | ❌ **dead/unreachable** — "connection refused" ✅ |
| QUL | Tafsir datasets per resource | Download JSON/SQLite from /resources | 📄 per-resource license |
| hadeethenc.com | Hadith encyclopedia only (no tafsir) | — | ⚠️ DNS issue (§5) |

- We already bundle **التفسير الميسر** — its source is King Fahd Quran Complex (confirmed in alquran.cloud edition metadata ✅), so KFC attribution is the right credit.
- **Recommended:** keep Muyassar bundled; add **Ibn Kathir** as the second tafsir — either bundled from a QUL/dataset dump (preferred for offline-first) or on-demand via alquran.cloud → cache in IndexedDB.

---

## 3. Audio sources (per-ayah vs gapless)

| Source | URL pattern | Mode | Verified sample ✅ | Notes |
|---|---|---|---|---|
| everyayah.com | `https://everyayah.com/data/{ReciterFolder}/{SSSAAA}.mp3` (surah 3 digits + ayah 3 digits) | **Per-ayah** | `/data/Alafasy_128kbps/002255.mp3` → 200, audio/mpeg, 831,865 B | Machine-readable reciter list incl. ayah counts: `https://everyayah.com/data/recitations.js` ✅. No formal license — community-hosted; attribute reciter. HTTPS works ✅ |
| cdn.islamic.network | `https://cdn.islamic.network/quran/audio/{bitrate}/{edition}/{globalAyahNumber}.mp3` (editions from alquran.cloud) | **Per-ayah** | `/128/ar.alafasy/262.mp3` → 200 | Pairs natively with alquran.cloud edition ids; also `audio-surah` path for whole-surah files 📄 |
| verses.quran.com (qurancdn) | `https://verses.quran.com/{Reciter}/mp3/{SSSAAA}.mp3` | **Per-ayah** | `/Alafasy/mp3/002255.mp3` → 200, same byte size as everyayah (same recordings) | Cloudflare CDN — best global latency; what quran.com serves |
| download.quranicaudio.com | `https://download.quranicaudio.com/quran/{reciter_dir}/{SSS}.mp3` | **Gapless, full-surah** | `/quran/mishaari_raashid_al_3afaasee/001.mp3` → 200, 839,808 B | Catalog site: quranicaudio.com; backend of quran.com audio |
| mp3quran.net | Catalog: `https://mp3quran.net/api/v3/reciters?language=ar` → files `{moshaf.server}{SSS}.mp3` | **Full-surah (one file per surah)** | ✅ 241 reciters; e.g. server `https://server6.mp3quran.net/akdr/` + `surah_list` | Docs: https://www.mp3quran.net/ar/api. ⚠️ Old host `api.mp3quran.net/api/reciters` now returns **422** ✅ — use v3 |

**Licensing notes:** recitations are distributed freely by the reciters/these sites; there is **no standardized open license** across them. Safe practice: store reciter + source site in credits; don't modify/redistribute edited audio; check per-reciter restrictions for app-store distribution (rare, but some reciters reserve rights).

**Per-ayah vs gapless for us:**
- Reading mode (page-like) → gapless full-surah files (mp3quran v3 / quranicaudio) preserve tajweed flow. QUL **audio segment timings** can add ayah highlighting even on gapless files.
- Memorization/repeat mode → per-ayah files (islamic.network or verses.quran.com) make ayah-level loops trivial.
- We already do per-surah download + local cache — mp3quran v3 API is a good catalog backbone; verses.quran.com / cdn.islamic.network as per-ayah mirrors.

---

## 4. Prayer times & Hijri calendar

### api.aladhan.com/v1 (online)
- **Base:** `https://api.aladhan.com/v1` — docs: https://aladhan.com/prayer-times-api and https://aladhan.com/islamic-calendar-api — no auth; fair use ~1 req/s.
- **Verified ✅:** `timingsByCity?city=Riyadh&country=Saudi Arabia&method=4` → 200 (Fajr 04:18, Maghrib 18:04, method "Umm Al-Qura University, Makkah"). ⚠️ Watch out: its *city geocoding* returned odd coordinates in `meta` (lat 8.88/long 7.77 for a Riyadh request) — **prefer the lat/long endpoints** for determinism.
- **Verified ✅:** `gToH?date=15-02-2026` → 27 Shaʿbān 1447 with a `holidays: []` array per date and `method: HJCoSA`.
- `hijriHolidays?date=01-01-1447` → **404** ✅ — the API returns 404 when a date has no holidays (treat 404 as "no holiday", not as breakage).
- ⚠️ `specialDays` → 78 entries ✅ but includes Sufi Urs/birth anniversaries mixed with Ashura etc. — **not suitable as-is** for our audience; prefer per-date `hijriHolidays` or a small self-maintained offline list (Ashura, Arafah, Eid, Ramadan…).

### adhan npm (on-device — already in use)
Same calculation methods (Umm al-Qura, MWL, Egypt, Karachi, ISNA), fully offline, no rate limits. **Keep it as the only source of daily times.** An API earns its keep only for: Hijri **holiday names/special days**, city search, or asma-ul-husna — all cacheable, all non-critical.

### Hijri conversion libraries (offline)
- **Built-in first:** `new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', …)` — zero dependency; supported by modern Chromium (Android WebView included). Validate against min WebView target.
- npm ✅ (registry checks): `moment-hijri` v3.0.0 (MIT, requires moment.js), `hijri-converter` v1.1.1 (MIT, small), `hijri-date` v0.2.2 (MIT, stale). ⚠️ `umalqura` (npm) **does not exist** (404) — don't chase it.

---

## 5. Hadith & adhkar content

| Source | Status | Auth | Offline-bundling reality |
|---|---|---|---|
| api.sunnah.com/v1 | Alive but **403 without key** ✅ | Free API key (`X-API-KEY`, sunnah.com/developers) | No official dumps; instability history (github.com/sunnah-com/api issues #253, #1427). Optional online feature at best |
| hadeethenc.com API | ⚠️ `api.hadeethenc.com` DNS failed 2× from our network ✅; API documented (Postman: documenter.getpostman.com/view/5211979/TVev3j7q; repo: github.com/islamhouse-dev/hadith-api — README shows the sections response shape) | None | Most promising hadith source for us (multilingual, built for apps) — **retry from a device/CI before committing**; designed to be cached for offline |
| dorar.net | `dorar_api.json?skey=…` → **403** ✅ (hotlink protection / params changed) | Official API service announced (dorar.net/article/389) | Content © Dorar al-Sunna; community proxy exists (github.com/AhmedElTabarani/dorar-hadith-api). LEARN; don't bundle |
| hisnmuslim.com | ✅ Live | None | **Best adhkar bundling source**: `https://www.hisnmuslim.com/api/ar/husn_ar.json` → categories `{ID, TITLE, AUDIO_URL, TEXT}`; per-category files like `/api/ar/27.json`. ⚠️ raw JSON with BOM + **http://** URLs (mixed-content!). Hisn al-Muslim content is widely redistributed; keep attribution to the book/compilation |
| islamhouse.com API | 📄 Documented | Free API key | Key-gated; same org as hadeethenc repo. LEARN |

- **Verdict:** bundle hisnmuslim JSON (tiny, offline-first ✓). For hadith: hadeethenc on-demand + cache (after connectivity check); sunnah.com only as an optional keyed feature. Nothing hadith-related is cleanly licensed for wholesale offline bundling — individual GitHub dumps exist but quality/licensing varies and wasn't verified here.

---

## 6. JS/React-specific evaluation

### 6.1 Quran rendering — @tarekeldeeb/quran-madina-react (in use)
- npm ✅: **v1.0.2, ISC** — "React wrapper for the quran-madina-html custom element — render Madina-style Quran pages (no images) in React on web and mobile (via a Capacitor WebView)." Base engine: `quran-madina-html` v1.0.1 (github.com/tarekeldeeb/quran-madina-html).
- Provides: page-faithful Madina mushaf layout (no page images), pairs with QPC fonts — exactly the right model for a mushaf-style reader in Capacitor.
- Alternatives ✅: `react-quran` v1.4.0 (MIT) — flow viewer (surah/ayah), **not** page-faithful; fine for a simple reader, wrong for mushaf fidelity.
- ⚠️ Risks: 1.0.x, small maintainer surface. Mitigation: pin exact version, vendor the font files, consider dropping to the vanilla `quran-madina-html` element if the wrapper lags.
- **Verdict: KEEP** (already in use; best fit).

### 6.2 Quran text datasets on npm
- `quran-json` v3.1.2 (CC-BY-4.0 ✅): text + transliteration + translations — handy if we ever add translations.
- `quran-text` (npm) — **does not exist** (404 ✅). Our bundled Tanzil JSON remains the right Arabic-only approach.

### 6.3 Hijri libs — see §4. Prefer `Intl` islamic-umalqura; moment-hijri only if moment is already present; hijri-converter as tiny fallback.

### 6.4 Audio playback + Media Session in Capacitor
- In the Android WebView, plain HTML5 `<audio>` plays but **Media Session API is not implemented in WebView** → no lockscreen/notification controls and unreliable background playback. On the **PWA** (Chrome), `navigator.mediaSession` works natively — use it there.
- Capacitor plugins ✅ (npm registry): `@jofr/capacitor-media-session` v4.0.0 — media notifications, media keys, **background audio** — but license **GPL-3.0-or-later ⚠️** (viral; review before bundling into a proprietary app).
- Capawesome advertises a Media Session plugin (https://capawesome.io/docs/sdks/capacitor/media-session/) 📄 but npm 404s under both `@capawesome/…` and `@capawesome-team/…` scopes ✅ — verify its current distribution before planning around it.
- `@capacitor-community/native-audio` v8.0.0 (MIT ✅) — low-latency native audio but **no** Media Session.
- **Recommendation:** PWA → HTML5 Audio + native MediaSession; Android → HTML5 audio + a Media-Session plugin (resolve GPL question first; otherwise a thin custom plugin wrapping Android MediaSessionCompat is ~a day of work).

### 6.5 Caching audio (IndexedDB strategy)
- **Capacitor Android:** keep downloaded surah MP3s in **native file storage via `@capacitor/filesystem`** (survives WebView cache eviction, streamable by path) — matches our existing per-surah download feature. IndexedDB for metadata only (reciter, surah, size, etag, last-verified).
- **PWA:** Cache API (`caches.open('audio-v1')` + `cache.add(url)`) for per-ayah files — simple, evictable by the browser, no Blob-to-URL juggling.
- IndexedDB Blobs: OK for small sets (bookmarks' snippets, short files), poor fit for hundreds of MB of MP3 (memory pressure, no native streaming).
- CDNs here support standard HTTP caching; if we ever stream from cache with `Range`, verify per-CDN Range support first.

---

## 7. Arabic web typography for Quran

| Font | Role | License | Get it |
|---|---|---|---|
| **KFGQPC Uthmanic Hafs** (KFGQPC HAFS Uthmanic Script / UthmanicHafs1 Ver18) | The mushaf font — faithful Madani rasm | KFGQPC license (ScanCode ID `kfgqpc-uthmanic-script-hafs`; OpenHub "King Fahd Glorious Quran Printing Complex License"): free use/redistribution **for Quranic purposes**, keep notice, no standalone font resale. ⚠️ Exact text ships as LICENSE with the font — verify at download time | qurancomplex.gov.sa (`/TTF/`, AllPartsFonts.zip) per github.com/quranwbw/qpc-fonts README 📄; QUL fonts resources 📄; mirrors: quranfonts.com/font/qpc-hafs 📄 |
| **Amiri** | UI / book-style naskh (beautiful, but not mushaf-faithful rasm) | SIL OFL 1.1 | Google Fonts, `@fontsource/amiri` |
| **Noto Naskh Arabic** | Body/UI Arabic, broad coverage | SIL OFL 1.1 | `@fontsource/noto-naskh-arabic` |

**@font-face + offline best practice for us:**
1. **Self-host everything in the app bundle** (WOFF2) — zero font CDN dependency at runtime (offline-first requirement).
2. UI fonts: `font-display: swap` + system-Arabic fallback stack.
3. Mushaf font: `font-display: block` (or `optional`) to avoid flash-of-wrong-glyph reflow on Quran pages; `local('KFGQPC Uthman Taha Naskh')` first (many Android devices ship it) then bundled WOFF2 — pattern shown in github.com/quranwbw/qpc-fonts README 📄.
4. `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the mushaf font even same-origin (fonts are fetched CORS-mode).
5. **Never subset the mushaf font** (Uthmani ligatures/kerning break); subsetting UI fonts is fine.

---

## 8. Recommended data strategy for our app

| Data type | Strategy | Source | Rationale |
|---|---|---|---|
| Quran text (Uthmani) | **BUNDLE** (have) | Tanzil (CC BY 3.0 verbatim + attribution + link) | Offline core; license is the constraint, not size |
| Optional: switch text to QUL KFGQPC Hafs v1.0 | **BUNDLE** (evaluate) | QUL | Word-level alignment with QUL word-by-word + fonts; check per-resource license first |
| Tafsir Muyassar | **BUNDLE** (have) | KFC text (via alquran.cloud/QUL dumps) | ~few MB, core Arabic feature |
| Second tafsir (Ibn Kathir) | **HYBRID** — bundle if license permits, else on-demand+cache | quran.com v4 id 14 / alquran.cloud | Size vs offline value |
| Translations (future) | **ON-DEMAND + IndexedDB cache** | alquran.cloud editions, quran-json (CC-BY-4.0) | Huge per-language; never bundle all |
| Word-by-word | **HYBRID** — bundle SQLite from QUL if license OK, else on-demand | QUL | Few MB; high value for learning features |
| Full-surah reciter audio | **HYBRID** (current pattern is right) | mp3quran v3 catalog (snapshot catalog in bundle, refresh online) + native FS storage | Offline listening is core; mirrors: quranicaudio |
| Per-ayah audio (repeat/memorize) | **ON-DEMAND + Cache API/filesystem** | cdn.islamic.network, verses.quran.com, everyayah fallback | Small files; only cache what user repeats |
| Ayah-highlight on gapless audio | **ADOPT** QUL audio segment timings | QUL | Solves highlight-vs-gapless conflict |
| Adhkar | **BUNDLE** | hisnmuslim.com JSON (+attribution) | Tiny; core offline feature; fix http:// links by bundling audio or text-only |
| Hadith | **ON-DEMAND + cache** (feature-gated) | hadeethenc (after DNS check), sunnah.com keyed optional | No clean wholesale-bundle license found |
| Prayer times | **ON-DEVICE** (adhan npm — keep) | — | Offline, deterministic; never API-dependent |
| Hijri holidays/special days | **HYBRID** — small self-maintained offline list; optionally aladhan `hijriHolidays` per-date cached yearly | api.aladhan.com | `specialDays` list unsuitable (⚠️ mixed content); 404 = no holiday |
| Hijri date conversion | **ON-DEVICE** | `Intl` islamic-umalqura (fallback hijri-converter) | Zero-dep first |
| Fonts | **BUNDLE** (all) | KFGQPC (mushaf), Amiri/Noto Naskh (UI) | Hard offline requirement |
| GemAI (Gemini) | unchanged | user-supplied key | Out of scope of this survey |

### Attribution screen checklist (add if missing)
Tanzil Project (text) → King Fahd Complex (text/tafsir/fonts) → reciter names + source site (mp3quran/everyayah/quranicaudio/islamic.network) → hisnmuslim.com → QUL resources used → Amiri/Noto Naskh (OFL notice).

---

## Appendix — verification log (read-only GETs, this session)

| # | Request | Result |
|---|---|---|
| 1 | `GET api.quran.com/api/v4/chapters?language=en` | 200 ✅ |
| 2 | `GET api.alquran.cloud/v1/edition/format/text` | 200 ✅ — 141 editions; Arabic ids listed §1.2 |
| 3 | `GET api.alquran.cloud/v1/ayah/2:255/editions/quran-uthmani,ar.muyassar` | 200 ✅ — text + tafsir returned |
| 4 | `GET api.quran-tafseer.com/tafseer` | ❌ connection refused (2× total incl. base host) |
| 5 | `GET api.mp3quran.net/api/reciters` | ⚠️ 422 — legacy host; use `mp3quran.net/api/v3/reciters` (200 ✅, 241 reciters) |
| 6 | `GET everyayah.com/data/Alafasy_128kbps/002255.mp3` | 200 ✅ audio/mpeg 831,865 B |
| 7 | `GET download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001.mp3` | 200 ✅ audio/mpeg |
| 8 | `GET verses.quran.com/Alafasy/mp3/002255.mp3` | 200 ✅ |
| 9 | `GET cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3` | 200 ✅ |
| 10 | `GET api.aladhan.com/v1/timingsByCity?city=Riyadh&country=Saudi Arabia&method=4` | 200 ✅ (odd geo-coords in meta ⚠️) |
| 11 | `GET api.aladhan.com/v1/gToH?date=15-02-2026` | 200 ✅ |
| 12 | `GET api.aladhan.com/v1/hijriHolidays?date=01-01-1447` | 404 ✅ (= no holiday that date) |
| 13 | `GET api.aladhan.com/v1/specialDays` | 200 ✅ — 78 entries, unsuitable mix ⚠️ |
| 14 | `GET api.hadeethenc.com/api/v1/encyclopedia/sections?language=ar` | ❌ DNS "no such host" 2× ⚠️ (API documented; repo README shows response shape) |
| 15 | `GET www.hisnmuslim.com/api/ar/husn_ar.json` | 200 ✅ (BOM + http:// links ⚠️) |
| 16 | `GET api.sunnah.com/v1/collections` (no key) | 403 ✅ (key required; API alive) |
| 17 | `GET dorar.net/dorar_api.json?skey=صحيح` | 403 ✅ |
| 18 | npm registry: @tarekeldeeb/quran-madina-react, quran-madina-html, react-quran, quran-json, moment-hijri, hijri-converter, hijri-date, howler, @jofr/capacitor-media-session, @capacitor-community/native-audio | 200 ✅ (versions/licenses in §0/§6) |
| 19 | npm registry: quran-text, umalqura, @capawesome(-team)/capacitor-media-session | 404 ✅ (do not exist / renamed) |
| 20 | `GET tanzil.net/docs/text_license` | 200 ✅ — CC BY 3.0, verbatim-only terms quoted §1.3 |
| 21 | `GET qul.tarteel.ai/docs/faq` + GitHub repo README | 200 ✅ — downloadable datasets, no API yet, per-resource licensing |
| 22 | `GET everyayah.com/data/recitations.js` | 200 ✅ — reciter/ayah-count manifest |
| 23 | `GET quran.com/api/v4/resources/tafsirs` | 200 ✅ — 20 tafsirs, Arabic ids §2 |
| 24 | `GET scancode-licensedb.aboutcode.org/kfgqpc-uthmanic-script-hafs.html` | 200 but page content truncated to site boilerplate ⚠️ — verify font LICENSE file at download time |

*End of report. Nothing outside `_research/` was modified; no repositories were cloned.*
