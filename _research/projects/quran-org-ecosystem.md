# The github.com/quran Organization & Ecosystem — Research Map

**For:** Azkar App team (React 18 + TS + Vite + Tailwind + Capacitor 8, Arabic RTL, local-first)
**Date of research:** September 2026 (all live checks performed this session)
**Researcher:** research sub-agent (read-only HTTP GETs; no repos cloned, no code modified)

> **Method & limitations.** api.github.com returned **403 rate limit exceeded** for unauthenticated calls from this IP (verified via GET /rate_limit → core.remaining = 0; endpoint evidence: session tool output). The repo inventory was therefore pulled from the **ungh.cc GitHub mirror** (https://ungh.cc/orgs/quran/repos), which returned **31 public repos**. The mirror does not expose language, license, or archived flags — those were verified per-repo from LICENSE files (raw.githubusercontent.com) and GitHub repo pages where feasible. Star counts and push dates are mirror values (US date format), accurate at fetch time.

---

## 1. Org overview

- **Org:** [github.com/quran](https://github.com/quran) — Quran.com / Quran for Android umbrella org; 31 public repos (ungh mirror, this session). The org operates **quran.com** (web), **quranicaudio.com** (audio), and the open-source **Quran for Android** app.
- **Corporate/brand layer:** the API platform moved under **Quran Foundation** — docs portal [api-docs.quran.foundation](https://api-docs.quran.foundation/) with the page "Migrate from api.quran.com to Quran Foundation Content API" ([migration guide](https://api-docs.quran.foundation/docs/quickstart/migration/)). Old api-docs.quran.com URLs still resolve and mirror the same content.
- **Important:** the **API backend itself is NOT open source.** No repo named quran.com-api (or any gateway service) appears in the current 31-repo list (ungh mirror). What is public: API **docs portals** (qf-api-docs, api-docs), **SDK clients** (api-js), and OAuth2 **example clients**. Learn from the API; don't expect to self-host it.
- **Sibling project, different org:** the **Quranic Universal Library (QUL)** is at [TarteelAI/quranic-universal-library](https://github.com/TarteelAI/quranic-universal-library) (Tarteel org, **not** github.com/quran) with portal [qul.tarteel.ai](https://qul.tarteel.ai/). It is now the best source of open **fonts, mushaf layouts, datasets, and recitation resources**. License: **MIT** ("Copyright (c) 2024-present Tarteel, Inc" — verified from LICENSE file, this session).

---

## 2. Repo inventory (31 public repos, sorted by stars)

`*` = mirror values; License = verified from LICENSE file / GitHub sidebar this session where marked ✅, otherwise "not checked". Languages marked ⚠ are inferred (README/docs), not API-verified.

| Repo | Description (abridged) | Language | Stars* | License | Last push* | Archived? |
|---|---|---|---|---|---|---|
| [quran_android](https://github.com/quran/quran_android) | Quran reading app for Android (Madani mushaf) | Kotlin (⚠) | 2,389 | **GPL-3.0** ✅ (LICENSE file) | 2026-09-05 | Active |
| [quran.com-frontend-next](https://github.com/quran/quran.com-frontend-next) | "The official source code repository for Quran.com" (Next.js) | TypeScript (⚠) | 1,908 | **None found** ✅ (no LICENSE file on master; sidebar none) | 2026-04-27 | Active |
| [quran.com-frontend](https://github.com/quran/quran.com-frontend) | Legacy quran.com frontend (React+Redux+Express, isomorphic) | JavaScript | 1,034 | **MIT** ✅ (sidebar) — but README: "copying the code/project is unacceptable" | 2021-06-28 | Dormant since 2021 |
| [quran-ios](https://github.com/quran/quran-ios) | "QuranEngine — powering the Quran.com iOS app" | Swift (⚠) | 587 | **Apache-2.0** ✅ (sidebar) | 2026-09-07 | Active |
| [quran.com-images](https://github.com/quran/quran.com-images) | Page-image generator from **King Fahd Complex fonts**; outputs images + glyph-bounds DB for word/verse highlight. "Used in quran.com and its mobile apps" | Perl (⚠) | 502 | **No LICENSE file** ✅; README states code is "copyleft GPL", fonts/pages belong to KFGQPC | 2026-02-21 | Maintenance-only |
| [quran.com-frontend-v2](https://github.com/quran/quran.com-frontend-v2) | Intermediate frontend iteration | TypeScript (⚠) | 485 | **GPL-3.0** ✅ (sidebar) | 2025-10-13 | Superseded by -next |
| [audio.quran.com](https://github.com/quran/audio.quran.com) | quranicaudio.com (Node + Postgres) | TypeScript (⚠) | 178 | **MIT** ✅ (LICENSE file) | 2026-06-18 | Active |
| [ayah-detection](https://github.com/quran/ayah-detection) | Scripts to detect ayah markers from Quran images | — | 112 | not checked | 2023-04-02 | Dormant |
| [waqt.org](https://github.com/quran/waqt.org) | Prayer-times calculation website | — | 111 | not checked | 2021-02-12 | Dormant (we already use adhan) |
| [quranicaudio-app](https://github.com/quran/quranicaudio-app) | QuranicAudio.com mobile app | — | 85 | not checked | 2018-11-04 | Dormant |
| [quran-mcp](https://github.com/quran/quran-mcp) | **MCP server** for AI: canonical text, translations, tafsir, search, morphology — "so AI assistants can cite accurately" | TypeScript (⚠) | 83 | **None found** ✅ (sidebar) | 2026-04-02 | Active |
| [tajweed](https://github.com/quran/tajweed) / [quran-tajweed](https://github.com/quran/quran-tajweed) | Tajweed highlighting experiments / tajweed annotation data | — | 75 / 39 | not checked | 2018 / 2017 | Dormant |
| [api-js](https://github.com/quran/api-js) | **@quranjs/api** official JS SDK for the quran.com/QDC API (Node + browser) | TypeScript (⚠) | 51 | **MIT** ✅ (LICENSE file) | 2026-09-07 | Active |
| [qf-api-docs](https://github.com/quran/qf-api-docs) | Quran Foundation API docs portal (Docusaurus) | — | 15 | not checked | 2026-09-09 | Active |
| [api-docs](https://github.com/quran/api-docs) | API docs (Hoppscotch-based) | — | 6 | not checked | 2022-01-15 | Dormant |
| [mcp.quran.ai](https://github.com/quran/mcp.quran.ai) | "Public assets for mcp.quran.ai — skills, documentation, static files" | — | 4 | not checked | 2026-03-19 | Active |
| [quran-oauth2-client-example](https://github.com/quran/quran-oauth2-client-example) / [oauth2-react-native-client-example](https://github.com/quran/oauth2-react-native-client-example) | OAuth2 client examples (for User API) | — | 4 / 3 | not checked | 2026 / 2026 | Active |
| [quran.ai](https://github.com/quran/quran.ai) | quran.ai landing page (AI product) | — | 3 | not checked | 2026-03-29 | Active |
| [mobile-sync](https://github.com/quran/mobile-sync) / [mobile-sync-spm](https://github.com/quran/mobile-sync-spm) | Quran Mobile Sync Engine (bookmarks across apps) | — | 1 / 0 | not checked | 2026-09 | Active |
| Others (≤51★, mostly dormant 2014–2018): [common-components](https://github.com/quran/common-components), [quran.com-fonts](https://github.com/quran/quran.com-fonts), [one.quran.com](https://github.com/quran/one.quran.com), [qursync-android](https://github.com/quran/qursync-android), [beautifulprayer](https://github.com/quran/beautifulprayer), [quran-core](https://github.com/quran/quran-core), [quran-developers](https://github.com/quran/quran-developers), [next-open-graph](https://github.com/quran/next-open-graph), [discussions](https://github.com/quran/discussions) | legacy utilities & experiments | — | — | not checked | — | Dormant/legacy |

Full 31-repo list source: https://ungh.cc/orgs/quran/repos (this session).

---

## 3. Architecture map — how the pieces fit

```
                +-----------------------------+
                |   Quran Foundation platform |   (closed-source gateway)
                |  api.quran.com / api.qurancdn.com/api/v4   |
                |  + User/Search/OAuth2 APIs  |
                +--------------+--------------+
        unauthenticated GETs  |  (verified live this session)
   +--------------------------+---------------------------+
   |                          |                           |
quran.com web          quran_android (GPL-3.0)      quran-ios (Apache-2.0)
frontend-next          page images + glyph bounds   QuranEngine
(Next.js, no license)  audio via same CDNs
   |                          |
   +------------+-------------+
                v
Audio CDN (open URLs, no auth — verified HTTP 200 this session):
• per-ayah:   https://verses.quran.com/{Reciter}/mp3/{SSSAAA}.mp3
             e.g. /Alafasy/mp3/001001.mp3 ; /AbdulBaset/Mujawwad/mp3/112001.mp3
• full-surah: https://download.quranicaudio.com/quran/{reciter}/{surah3}.mp3
             e.g. /quran/mishaari_raashid_al_3afaasee/001.mp3
• metadata/UI: quranicaudio.com  <- source at audio.quran.com (MIT)
```

- **Web app ↔ API v4 ↔ audio CDN:** quran.com-frontend-next is the official quran.com frontend ([README](https://raw.githubusercontent.com/quran/quran.com-frontend-next/master/README.md): "The official source code repository for Quran.com"); it consumes Content API v4 and the audio CDNs above. The Android/iOS apps follow the same pattern (page images from the quran.com-images pipeline + audio CDNs + API).
- **API v4 verified live (unauthenticated, this session):**
  - GET https://api.quran.com/api/v4/chapters/1?language=ar → 200, الفاتحة / Al-Fatihah, verses=7
  - GET .../api/v4/resources/recitations?language=en → 12 recitations (first page)
  - GET .../api/v4/resources/tafsirs → 20 tafsirs incl. **ar-tafsir-muyassar** (التفسير الميسّر — the same tafsir we bundle) plus ar-tafsir-al-tabari, ar-tafseer-al-qurtubi, ar-tafsir-al-baghawi, ar-tafseer-al-saddi …
  - GET .../api/v4/resources/translations?language=en → **126 translations**
  - New host GET https://api.qurancdn.com/api/v4/chapters/1?language=ar → **200** (same payload; Foundation-era host)
- **Platform expansion (docs portal nav, [api-docs.quran.foundation](https://api-docs.quran.foundation/docs/quickstart/migration/)):** Content API 4.x, Search API, **User API (pre-live)**, OAuth2 API with scopes, Analytics API, **Hadith Reference API**, Answer API, plus JS/Python SDKs and a Migration cheat sheet / Legacy Migration Guide.
- **New AI layer (2025–2026):** quran-mcp (MCP server grounding AI in verified Quran text/tafsir), mcp.quran.ai assets, quran.ai landing page, OAuth2 client examples — the org is building an AI-agent ecosystem on top of the same content APIs.
- **QUL (TarteelAI, MIT)** supplies the open data layer the org's apps historically had to generate themselves: fonts, mushaf layouts, datasets, recitation segments ([qul.tarteel.ai/resources](https://qul.tarteel.ai/resources), [docs](https://qul.tarteel.ai/docs/datasets)).

---

## 4. Reusable assets & data (for Azkar App)

| Asset | What it is | How we'd use it | Where | License / attribution |
|---|---|---|---|---|
| **API v4 content endpoints** | Chapters, verses, 126 translations, 20 tafsirs, recitation lists, search | Optional "refresh content on Wi-Fi" channel layered on our local-first JSON; alternative tafsir/translation packs on demand | https://api.quran.com/api/v4/ (also api.qurancdn.com/api/v4) | Free unauthenticated for content endpoints (verified live); OAuth2 only for user-data features. Docs: [Content API 4.0.0](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/) |
| **Per-ayah audio URLs** | verses.quran.com/{Reciter}/mp3/{SSSAAA}.mp3 — verified 200 (audio/mpeg) for Alafasy 001001 and AbdulBaset/Mujawwad 112001 | Same pattern we already use; extend reciter catalog without hosting | verses.quran.com | No blanket redistribution license found; cache for personal use + attribute, don't re-host |
| **Full-surah audio URLs** | download.quranicaudio.com/quran/{reciter}/{surah3}.mp3 — verified 200 (839 KB, surah 001) | **Direct fit for our per-surah download + local cache**; reciter metadata from quranicaudio.com (audio.quran.com project) | download.quranicaudio.com | Site-level free streaming/download; per-recitation agreements — attribute, don't re-host |
| **Mushaf page images + glyph bounds** | Pre-rendered Madani page images + DB of glyph bounding boxes enabling word/verse highlight; "used in quran.com and its mobile apps" | Reference implementation for a future mushaf page view + highlight overlay | [quran.com-images](https://github.com/quran/quran.com-images) | **Code: GPL (per README; no LICENSE file). Fonts & page images: King Fahd Quran Complex property** — check KFGQPC terms before bundling |
| **QUL fonts** | KFGQPC-derived fonts, Digital Khatt, per-font docs/downloads | Arabic Quran text rendering in our UI (complements system fonts) | [qul.tarteel.ai/docs/font](https://qul.tarteel.ai/docs/font) | QUL repo MIT, but **font files carry their own licenses** — verify per-resource ([download docs](https://qul.tarteel.ai/docs/download-resources)) |
| **QUL mushaf layouts** | Machine-readable page/line coordinate layouts (v1 & v2) for multiple mushafs | Layout data for a mushaf-style page view or ayah-highlight mapping (Adapt) | [qul.tarteel.ai/mushaf_layouts](https://qul.tarteel.ai/mushaf_layouts), [docs/mushaf-layout](https://qul.tarteel.ai/docs/mushaf-layout) | Per-resource license on QUL; tooling MIT |
| **QUL datasets & recitation segments** | Ayah-level timestamps, tajweed/waqf datasets, translation resources | Audio-text sync for reciter/TTS playback highlighting; tajweed coloring (Adapt/Learn) | [qul.tarteel.ai/resources/recitation](https://qul.tarteel.ai/resources/recitation), [docs/datasets](https://qul.tarteel.ai/docs/datasets) | Per-resource license on QUL |
| **@quranjs/api SDK** | Typed JS client for the Content API (Node + browser) | Reference for response typing / endpoint shapes even if we don't ship it (not Capacitor-specific) | [quran/api-js](https://github.com/quran/api-js), npm @quranjs/api | **MIT** ✅ |
| **quran-mcp approach** | MCP server that forces AI to fetch **verified** verse text/tafsir instead of trusting model memory: "Misquoting it is not an acceptable error mode" | Principle for our Gemini AI explanations: always ground prompts in our bundled JSON text, cite surah:ayah, defer to tafsir | [quran/quran-mcp](https://github.com/quran/quran-mcp) | No license found — adopt the *idea*, not the code |
| **Tajweed annotation data** | quran-tajweed (annotation for the Qur'an) + tajweed experiments | Future tajweed-highlight layer for our Quran text | [quran-tajweed](https://github.com/quran/quran-tajweed) | not checked — verify before use |

---

## 5. Licensing summary — what we can legally borrow vs. only learn from

| License | Repos | Verdict for Azkar App |
|---|---|---|
| **MIT** ✅ | api-js, audio.quran.com, quran.com-frontend (legacy), TarteelAI/quranic-universal-library | **Can borrow code** with license notice preserved. Caveat: legacy frontend README says "we must stress that copying the code/project is unacceptable" — a social request that sits oddly with MIT; prefer borrowing from api-js / audio.quran.com and treat the legacy frontend as *reference only* (evidence: [README](https://raw.githubusercontent.com/quran/quran.com-frontend/master/README.md)) |
| **Apache-2.0** ✅ | quran-ios | Can borrow with attribution + NOTICE; includes patent grant. Swift code rarely portable to our stack anyway |
| **GPL-3.0** ⚠ | quran_android, quran.com-frontend-v2 | **Learn only** (architecture, UX, pipeline ideas). Copying any code would force GPL onto our app. quran_android LICENSE verified: "GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007" |
| **None found** 🚫 | quran.com-frontend-next (no LICENSE file on master ✅), quran.com-images (no LICENSE file; README claims GPL for code), quran-mcp | **All rights reserved** — never copy code/assets from these. Read, learn, reimplement |
| **Data/fonts (separate terms)** | KFGQPC fonts & mushaf page images; QUL resources; reciter audio | Each carries its own license. KFGQPC: "fonts and pages … belong to the King Fahd Quran Complex" ([quran.com-images README](https://raw.githubusercontent.com/quran/quran.com-images/master/README.md)). QUL: check per-resource license at download time. Audio: per-recitation agreements — attribute, don't assume redistribution rights |

**Bottom line:** the org's *data endpoints* and *audio URLs* are consumable by any app; the *code* is mostly GPL or unlicensed — with only api-js, audio.quran.com, QUL tooling (all MIT) and quran-ios (Apache-2.0) safely borrowable.

---

## 6. What we should ADOPT / ADAPT / LEARN

### ADOPT (drop-in usable now)
1. **Full-surah audio pattern** https://download.quranicaudio.com/quran/{reciter}/{surah}.mp3 (verified 200) + per-ayah verses.quran.com/{reciter}/mp3/{SSSAAA}.mp3 (verified 200) — direct fit for our existing per-surah download & cache; extend our reciter catalog using quranicaudio.com metadata. Evidence: §3 probes.
2. **API v4 as an optional content-refresh channel** (never a runtime dependency — we are offline-first): 126 translations + 20 tafsirs incl. ar-tafsir-muyassar let users add commentary packs on demand. Evidence: §3 endpoint checks.
3. **The quran-mcp grounding principle** for our Gemini explanations: always inject the exact bundled verse text + tafsir into the prompt, require citations, never let the model quote from memory. Evidence: [quran-mcp README](https://raw.githubusercontent.com/quran/quran-mcp/master/README.md).

### ADAPT (reimplement with our stack)
4. **QUL mushaf layouts + glyph-bounds concept** (from quran.com-images) → a mushaf page view with word-tap/highlight in our web app; QUL layout JSONs are purpose-built for this. Evidence: [qul.tarteel.ai/docs/mushaf-layout](https://qul.tarteel.ai/docs/mushaf-layout).
5. **QUL recitation segments/datasets** → synchronized ayah highlighting during reciter/TTS playback (natural next step after our TTS feature). Evidence: [qul.tarteel.ai/resources/recitation](https://qul.tarteel.ai/resources/recitation).
6. **api-js response typing** (MIT) → port the TypeScript types into our own API client if we adopt API v4. Evidence: [quran/api-js](https://github.com/quran/api-js).

### LEARN (ideas & patterns, no code copying)
7. **quran_android's architecture** (GPL-3.0 — ideas only): module-per-feature packaging (madani pages, audio, translations), incremental page-image downloads, offline-first mushaf — mirrors and validates our local-first strategy. Evidence: [repo](https://github.com/quran/quran_android), LICENSE verified GPL-3.0.
8. **quran.com-frontend-next patterns** (no license — read only): audio player UX, RTL typography handling, theme system, Storybook-driven component workflow ([Storybook link in README](https://quran.github.io/quran.com-frontend-next/storybook/master)).
9. **Ecosystem/platform evolution**: single content API → Foundation platform with OAuth2, Search, Hadith, and AI (MCP) layers — a roadmap template if Azkar App ever grows beyond its current scope. Evidence: [api-docs.quran.foundation](https://api-docs.quran.foundation/docs/quickstart/migration/).
10. **waqt.org** (prayer-times site, dormant since 2021) — nothing to adopt; our adhan usage already covers it. Evidence: §2 inventory row.

---

## 7. Links

**Org & code**
- Org: https://github.com/quran • Inventory endpoint used: https://ungh.cc/orgs/quran/repos
- quran_android: https://github.com/quran/quran_android (GPL-3.0)
- quran.com-frontend-next: https://github.com/quran/quran.com-frontend-next (no license)
- Legacy frontend: https://github.com/quran/quran.com-frontend (MIT + README caveat)
- iOS QuranEngine: https://github.com/quran/quran-ios (Apache-2.0)
- Page images: https://github.com/quran/quran.com-images (code GPL per README; fonts KFGQPC)
- QuranicAudio site: https://github.com/quran/audio.quran.com (MIT) → https://quranicaudio.com
- JS SDK: https://github.com/quran/api-js (MIT) → npm @quranjs/api
- MCP server: https://github.com/quran/quran-mcp • https://mcp.quran.ai

**APIs & docs**
- API v4 (live): https://api.quran.com/api/v4/ • alternate host: https://api.qurancdn.com/api/v4/
- API docs: https://api-docs.quran.com/ → https://api-docs.quran.foundation/ (migration: https://api-docs.quran.foundation/docs/quickstart/migration/)
- Content API 4.0.0 reference: https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/

**Sibling ecosystem**
- QUL: https://qul.tarteel.ai/ • repo: https://github.com/TarteelAI/quranic-universal-library (MIT)
- QUL resources/fonts/layouts: https://qul.tarteel.ai/resources • https://qul.tarteel.ai/docs/font • https://qul.tarteel.ai/mushaf_layouts • https://qul.tarteel.ai/docs/datasets
- KFGQPC (fonts copyright holder): https://qurancomplex.gov.sa

---

## Metrics

- findings: 24
- risks_HIGH: 2
- risks_MEDIUM: 2
- risks_LOW: 1
- clarifying_Qs: 0

### Risks register (summary)
- **HIGH — audio licensing ambiguity:** verses.quran.com / quranicaudio.com URLs are open, but no blanket redistribution license was found; our per-surah cache should cache for personal use + attribute, and we should not re-host audio. Evidence: §4 table rows.
- **HIGH — unlicensed flagship code:** quran.com-frontend-next and quran-mcp have no LICENSE file; team must treat them as read-only inspiration. Evidence: §5.
- **MEDIUM — KFGQPC font/image terms:** fonts & page images are King Fahd Complex property; bundling requires checking their license. Evidence: quran.com-images README.
- **MEDIUM — GitHub API rate limit:** unauthenticated api.github.com access from this IP is exhausted (403, core.remaining=0); repo metadata (languages, archived flags, exact star history) came from the ungh mirror + HTML checks, so a few table cells are flagged inferred. Evidence: session tool output.
- **LOW — mirror drift:** ungh star counts/dates are a cached snapshot; re-verify before citing externally.
