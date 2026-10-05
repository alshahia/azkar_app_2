# APIs & Data Sources — Verified Strategy for a Local-First App

All endpoints below were **live-verified with read-only GETs** during this research (session date noted in reports). Full detail + verification appendix: `projects/apis-and-packages-ecosystem.md` and `projects/quran-com-developers-api.md`.

## 1. Endpoint health (as verified this session)

| Source | Status | Notes |
|---|---|---|
| `api.quran.com/api/v4/*` (legacy, anonymous) | ✅ 200 | Cloudflare-cached ~8 days; officially in migration path — treat as opportunistic, recheck quarterly |
| `apis.quran.foundation/content/api/v4/*` | ✅ live, OAuth2 client-credentials | Backend-only (secrets can't ship in PWA/Capacitor) — don't adopt for runtime reads |
| `api.qurancdn.com/api/v4/*` | ✅ live (alternate host) | |
| `/quran/tafsirs/{id}/by_ayah/{key}` on legacy host | ❌ 404 (verified 2×) | Tafsir content unreachable anonymously today |
| `resources/chapter_reciters` | ⚠️ 503 (flaky) | |
| `download.qurancdn.com`, `api.quran.foundation` | ❌ DNS-unreachable (from test network) | Never hardcode CDN hosts; use returned absolute URLs + fallbacks |
| `api.alquran.cloud/v1/*` | ✅ 200 | 141 text editions incl. 6 Arabic tafsirs (`ar.muyassar`, `ar.ibnkathir`? → check ids; `ar.jalalayn`, `ar.qurtubi`, `ar.waseet`, `ar.miqbas`, `ar.baghawi`) |
| `api.quran-tafseer.com` | ❌ dead (connection refused) | Do not use |
| `mp3quran.net/api/v3/reciters` | ✅ 200 | **241 reciters** — the live full-surah catalog (legacy `api.mp3quran.net` → 422) |
| `download.quranicaudio.com/quran/{reciter}/{surah3}.mp3` | ✅ 200 | Gapless full-surah; quranicaudio = MIT site (audio.quran.com) |
| `verses.quran.com/{Reciter}/mp3/{SSSAAA}.mp3` | ✅ 200 | Per-ayah |
| `cdn.islamic.network/quran/audio/128/{id}/{ayah}.mp3` | ✅ 200 | **What we already use** (alquran.cloud CDN) |
| `everyayah.com/data/{Reciter}_128kbps/{SSSAAA}.mp3` | ✅ 200 | Per-ayah fallback + recitations.js manifest |
| `verses.quran.com/wbw/` (word audio) | ✅ 200 | Word-by-word audio for future learning features |
| `api.aladhan.com/v1/*` | ✅ 200 | Use `hijriHolidays` only (404 = no holiday); **avoid `specialDays`** (mixed Sufi Urs content); `timingsByCity` geocoding unreliable → lat/long endpoints; we keep on-device `adhan` npm anyway |
| `hisnmuslim.com/api/ar/husn_ar.json` | ✅ 200 | Adhkar corpus — bundle offline (strip BOM, fix http:// links) |
| `hadeethenc.com` API | ❌ DNS failed from test network | Best hadith candidate; re-verify from device/CI before building |
| `sunnah.com` / `dorar.net` | 403 keyed / 403 | Not clean bundle sources |
| `tanzil.net/docs/text_license` | ✅ 200 | CC BY 3.0 **verbatim-only** |
| QUL (`qul.tarteel.ai`) | ✅ live | Word-by-word, mushaf layouts, fonts, recitation segment timings; **no API yet**; per-resource licenses — check at download; repo MIT |
| OpenAPI specs | ✅ public JSON | `api-docs.quran.foundation/openAPI/content/v4.json` (+search/oauth2/user); `@quranjs/api` SDK (MIT) |

## 2. Data strategy per type (bundle vs build-time-gen vs on-demand)

| Data type | Strategy | Primary source | Second |
|---|---|---|---|
| Quran text (Uthmani) | **BUNDLE** (have; regen via build script) | Tanzil (verbatim + attribution) | API v4 / QUL KFGQPC Hafs v1.0 (better word alignment) |
| Tafsir الميسر | **BUNDLE** (have) | KFC text dumps | alquran.cloud `ar.muyassar` |
| Tafsir ابن كثير (+ others) | **HYBRID** — bundle only if license-cleared, else on-demand + ephemeral (≤1 week) cache | alquran.cloud / API v4 id 14 | QUL dumps |
| Translations (future) | **ON-DEMAND** + IDB cache | alquran.cloud editions | quran-json (CC-BY-4.0) |
| Word-by-word | **HYBRID** — QUL SQLite/JSON if license OK, else on-demand | QUL | API v4 `words[]` |
| Full-surah audio | **HYBRID** (current pattern is right): snapshot reciter catalog in bundle, refresh online | mp3quran v3 + quranicaudio | API v4 `chapter_recitations` (has `file_size` for download UI) |
| Per-ayah audio | **ON-DEMAND** + Cache API / native FS | cdn.islamic.network | verses.quran.com, everyayah |
| Audio ↔ text sync | **ADOPT** QUL recitation segment timings | QUL | QuranApp-style per-reciter timing files (re-generate ourselves) |
| Adhkar | **BUNDLE** | hisnmuslim JSON (+attribution) | our existing curated `data/categories/*` |
| Hadith | **ON-DEMAND**, feature-gated | hadeethenc (after DNS check) | — |
| Prayer times / Qibla | **ON-DEVICE** (adhan npm — keep) | — | aladhan only for Hijri holidays |
| Hijri conversion | **ON-DEVICE** `Intl islamic-umalqura` (fallback hijri-converter pkg) | — | — |
| Mushaf fonts | **BUNDLE** KFGQPC Uthmanic Hafs WOFF2 (keep license notice, never subset) | qurancomplex.gov.sa / QUL | mirrors: quranfonts.com, quranwbw/qpc-fonts |
| UI Arabic fonts | **BUNDLE** Amiri / Noto Naskh (OFL) | @fontsource | — |

## 3. Content-regeneration (build-time) pipeline to adopt

Script (Node, in our repo, run manually/CI): API v4 legacy endpoints → regenerate `data/static/quran/text/*.json`, `tafsir/*.json`, reciter catalog JSON → validate diffs → commit. Benefits: no hand-maintained content files, provenance + license baked into the generator, bundle stays first-party (legally safest ground per QF terms).

## 4. Attribution screen checklist

Tanzil Project (text) · King Fahd Complex (text/tafsir/fonts) · reciters + source sites (mp3quran / everyayah / quranicaudio / islamic.network) · hisnmuslim.com · QUL resources used · Amiri/Noto Naskh (OFL notices) · required string when surfacing QF data: *"Quran data provided by Quran Foundation."*

## 5. LLM caution (affects our Gemini feature)

Quran Foundation Developer Terms: **no ML/LLM use of API content without written consent.** Practical rule: prompts may include **our bundled** text/tafsir only; never relay API-fetched translations/tafsirs into Gemini; require citations to surah:ayah and prefer grounding on bundled tafsir (quran-mcp principle — adopt the idea, not their unlicensed code).
