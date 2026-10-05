# Quran.com Developer API (v4) — Research for Azkar App

**Date:** 2026-09-09 · **Agent:** research (am-research) · **Scope:** quran.com/developers + Quran Foundation API v4
**Method:** public anonymous GETs (read-only) + docs fetches from this research environment. All live checks were run without credentials; network quirks of the test network are flagged where they may not reproduce elsewhere.

---

## 1. Overview

- quran.com/developers is the front door, but the actual developer platform is **Quran Foundation** (the nonprofit org behind quran.com): docs portal **https://api-docs.quran.com** which is a mirror of **https://api-docs.quran.foundation** (both served identical content during testing). Evidence: https://api-docs.quran.com/ (fetched; "Quran Foundation Documentation Portal"), https://api-docs.quran.foundation/legal/developer-terms/ (fetched).
- There are **two generations of the same v4 content API**:
  - **Legacy anonymous API** — `https://api.quran.com/api/v4/...`. **Still live and anonymous** (verified: `GET /chapters?language=en` → 200, 114 chapters, served from Cloudflare cache `cf-cache-status: HIT`, `Cache-Control: public, max-age=691200` ≈ 8 days).
  - **Current "Quran Foundation Content APIs"** — `https://apis.quran.foundation/content/api/v4/...` (production) and `https://apis-prelive.quran.foundation/content/api/v4/...` (pre-live). OAuth2 client-credentials, backend-only. Official migration guide states: *endpoints, query parameters, and response shapes remain the same*; only base URL + auth change. Evidence: https://api-docs.quran.com/docs/quickstart/migration/ (fetched).
- `api.quran.foundation` did **not resolve** from our test network (DNS failure, 2 attempts); the `api-docs.quran.foundation` docs host and the legacy API host both worked. Not investigated further — noted as a regional/DNS caveat.
- Official SDKs: **`@quranjs/api`** (npm, v3.4.0, MIT — "Quran Foundation's Official JS SDK", https://registry.npmjs.org/@quranjs/api, https://github.com/quranjs/api) and a Python SDK. Scaffold: `npx @quranjs/create-app` (Next.js starter). Evidence: https://api-docs.quran.com/docs/sdk/javascript/, https://api-docs.quran.com/ (fetched).
- **OpenAPI specs exist and are public JSON** (found via the portal's `llms.txt`, 51,529 bytes, fetched):
  - Content APIs v4: `https://api-docs.quran.foundation/openAPI/content/v4.json`
  - Search APIs v1: `.../openAPI/search/v1.json` · OAuth2 v1: `.../openAPI/oauth2-apis/v1.json` · User APIs v1: `.../openAPI/user-related-apis/v1.json` · Analytics v1: `.../openAPI/analytics/v1.json`
  - Reference hub: https://api-docs.quran.foundation/docs/api-reference/ · Field reference: https://api-docs.quran.foundation/docs/api/field-reference/
  - `https://api-docs.quran.com/swagger.json` and `/openapi.json` are **404** (probed) — the spec lives on the quran.foundation docs host, not the legacy host.

## 2. Auth & limits

| Surface | Auth | Verified |
|---|---|---|
| Legacy `api.quran.com/api/v4` reads | **None** — anonymous GETs | ✅ 200 on chapters, verses, search, scripts, tafsir list, juzs, audio endpoints |
| Foundation Content APIs | **OAuth2 Client Credentials**: `POST {authBaseUrl}/oauth2/token` with `scope=content`; then header `x-auth-token: <access_token>` + `x-client-id: <client_id>` on every request | 📄 docs only (no credentials available here) |
| Foundation Search API | Content credentials **+ separate permission grant** ("Search requires separate pre-live permission before the included search surface works") | 📄 docs homepage (fetched) |
| Foundation "Public" browser client (`@quranjs/api/public`) | PKCE (`client_id` only, no secret) — for **Connected Apps / user data (bookmarks, notes)**, NOT for content reads | 📄 https://api-docs.quran.com/docs/sdk/javascript/public-quickstart/ (fetched) |

- **Backend-only rule:** "Frontend or mobile app clients cannot use [client credentials]… its pre-live `client_id`, and its one-time `client_secret`" — secrets must live on a server; a backend proxy is the documented pattern. Evidence: https://api-docs.quran.com/docs/quickstart/, https://api-docs.quran.com/docs/quickstart/first-api-call/ (search snippets).
- **Environments:** pre-live auth `https://prelive-oauth2.quran.foundation` / API `https://apis-prelive.quran.foundation`; production auth `https://oauth2.quran.foundation` / API `https://apis.quran.foundation`. Evidence: migration page (fetched, environment table).
- **Rate limits:** no numeric limit found in any fetched page; Developer Terms say "Exceed published rate limits or quotas" is prohibited (numbers not verified — **unknown**). Legacy responses showed no rate-limit headers (Cloudflare cache HIT masks origin headers). Evidence: Developer Terms §3.1 (fetched); live headers from `GET /chapters`.
- **Token lifecycle (docs):** cache token, re-request before expiry, retry once on 401. Evidence: https://api-docs.quran.foundation/docs/quickstart/token-management/ (search snippet).

## 3. Resources & endpoints (legacy base: `https://api.quran.com/api/v4`)

| Resource | Endpoint | Verified live | Notes |
|---|---|---|---|
| Chapters (114) | `GET /chapters?language=en` | ✅ | incl. `name_arabic`, `verses_count`, `pages:[1,1]`, `revelation_place` |
| Chapter info | `GET /chapters/{id}/info?language=ar` | ✅ | `chapter_info.text` is **HTML** (headings, paragraphs) |
| Verses by chapter | `GET /verses/by_chapter/{n}?words=true&translations=20&fields=text_uthmani&per_page=10` | ✅ | pagination object; `words[]` when `words=true` |
| Verses by page | `GET /verses/by_page/{n}` | ✅ | page 1 → 7 records |
| Verses by juz | `GET /verses/by_juz/{n}` | ✅ | juz 1 → 148 records |
| Verses by hizb | `GET /verses/by_hizb/{n}` | ✅ | hizb 1 → 81 records |
| Juz list | `GET /juzs` | ✅ | **60 entries** (30 juz + 30 hizb entries; `juz_number` 1..30 in first 30, second set is hizb-level with verse_mapping) |
| Uthmani script | `GET /quran/verses/uthmani?chapter_number=112` | ✅ | `{id, verse_key, text_uthmani}` |
| Imlaei (simple) script | `GET /quran/verses/imlaei?chapter_number=112` | ✅ | same shape |
| Indopak script | `GET /quran/verses/indopak?chapter_number=112` | ✅ | `text_indopak` field |
| Search | `GET /search?q=mercy&size=2&page=0&language=en` | ✅ (legacy) | multi-translation results with `<em>` highlights; **permission-gated on Foundation** |
| Translations list | `GET /resources/translations` | ✅ | **126 translations**; Arabic language has *none* under "translations" — Arabic content lives in tafsirs |
| Tafsirs list | `GET /resources/tafsirs` | ✅ | **20 tafsirs**; Arabic: Muyassar (id 16), Ibn Kathir (14), Tabari (15), Qurtubi (90), Sa'di (91), Baghawi (94), al-Wasit/Tantawi (93); English Ibn Kathir (169) |
| Tafsir by ayah | `GET /quran/tafsirs/{id}/by_ayah/{verse_key}` | ❌ **404 on legacy** (tested id 16 @ 1:1, id 169 @ 2:255, twice) | documented in versioned docs (…/4.0.0/tafsirs/) — treat as Foundation-only / currently broken on legacy host |
| Verse recitations list | `GET /resources/recitations?language=en` | ✅ | 12 reciters (fields `recitation_name` often null, `style` e.g. Murattal/Mujawwad) |
| Verse audio files | `GET /recitations/{recitation_id}/by_chapter/{n}?per_page=300` | ✅ | `audio_files: [{verse_key, url}]` — **no segments/timestamps in current responses** (docs label the example "First page (no segments/timestamps)") |
| Chapter (full-surah) audio | `GET /chapter_recitations/{recitation_id}?language=en` | ✅ | absolute `audio_url` on `download.quranicaudio.com/qdc/...`, `file_size`, `format:"mp3"` |
| Chapter reciters (new) | `GET /resources/chapter_reciters?language=en` | ❌ **503 twice** | flaky/unstable at test time |
| Word-by-word | via `words=true` on verse endpoints | ✅ | see §4 + example below |

Evidence: all "✅" rows were fetched live and returned the shapes shown in §6; doc pages listed in §10. Foundation equivalent = same paths under `https://apis.quran.foundation/content/api/v4/`.

**Mushaf page mode:** v4 exposes `page_number` on every verse and `page_number`/`line_number` on every word (verified in word payloads) — enough to group verses/words into madani pages. **Full mushaf layout data (exact line/page rendering) is not a v4 JSON resource**; Quran Foundation publishes it via **QUL (Quranic Universal Library)**: https://qul.tarteel.ai/resources/mushaf-layout (repo: https://github.com/TarteelAI/quranic-universal-library, MIT; per-dataset licenses apply). Docs also have a "Page Layout API Guide" and "Font & Page Rendering" section (nav of fetched pages).

## 4. Audio pipeline (verified)

| Layer | Data source | URL base (verified) | Example |
|---|---|---|---|
| Verse audio (recitations/{id}) | `url: "Alafasy/mp3/001001.mp3"` (relative) | `https://verses.quran.com/` | `https://verses.quran.com/Alafasy/mp3/001001.mp3` → **200**, `audio/mpeg`, 146,830 B |
| **Word audio** | word `audio_url: "wbw/001_001_001.mp3"` | `https://verses.quran.com/wbw/` | `https://verses.quran.com/wbw/001_001_001.mp3` → **200**, 44,975 B |
| Full-surah downloads | `chapter_recitations/{id}` returns **absolute** URLs | `https://download.quranicaudio.com/qdc/{reciter}/{style}/{n}.mp3` | `.../qdc/mishari_al_afasy/murattal/1.mp3` (`file_size: 839808`) |
| Legacy CDN | docs historically cite `download.qurancdn.com` | ❌ **DNS-unreachable from test network (2 fails)** | do **not** hardcode; prefer `verses.quran.com` + returned absolute URLs |

- **Word-timing segments for karaoke-style highlight are NOT in current legacy audio responses** (verified: `audio_files` items contain only `verse_key` + `url`; docs example says "First page (no segments/timestamps)"). For per-word highlight timing, Quran Foundation publishes audio-timing datasets via **QUL** (https://qul.tarteel.ai/docs/datasets) — that's the practical source today.
- Word audio is ~45 KB/word — fine for on-demand streaming, wrong for bundling (6,236 verses × ~4–20 words).
- Pattern to ADOPT: this is exactly our existing per-surah download model (surah-level `file_size` + download URL + local cache), already proven in our app.

## 5. Content licensing & attribution (critical for us)

Source: **Quran Foundation Developer Terms of Service** (last updated 2026-08-26), https://api-docs.quran.foundation/legal/developer-terms/ (fetched, quoted below) + FAQ https://api-docs.quran.foundation/docs/tutorials/faq/ (fetched).

- **Display OK:** "Developer may display QF Content to end users within the Application", including commercial apps (charges, subscriptions, ads, donations, freemium) — provided content is not sold/sublicensed/redistributed separately.
- **Quran text must not be modified** in any way; snippets must preserve original context and meaning.
- **No redistribution without a signed commercial license:** "…before selling, sublicensing, or redistributing QF Content or raw API data—for example, as a dataset, data feed, API, **content package, or other separately distributed product**." → ⚠️ **shipping API-fetched content inside our app bundle/assets is a redistribution risk.** Our own bundled JSON (already shipped) is our existing asset; *new* content fetched from the API should not be baked into shipped bundles without that license.
- **Cache limit: 1 week** — "Cache or store QF Content longer than 1 week" is prohibited **except** (a) express permission, or (b) content available through **Content Sync APIs** (then re-sync at least every 7 days and apply changes). Content Sync exception "does not cover Mushaf font files or images" (contact the provider). Evidence: Terms §3.1 (fetched). Docs sections exist: Content Sync → Getting Started / Client Flow / Offline Cache Patterns / Full Copies and Recovery (docs nav, fetched).
- **No scraping/indexing outside API responses; no ML training** on QF Content "without written consent" → ⚠️ relevant to our **Gemini AI-explanations** feature: feeding API-fetched tafsir/translation text into an external LLM prompt is arguably "use … to build … machine-learning models" adjacent / third-party transmission — do it only with our own bundled content, or get written consent.
- **Attribution (FAQ, fetched):** display **"Quran data provided by Quran Foundation."** wherever Quranic content is surfaced; **credit each translation, tafsir edition, and recitation by its named source/edition** per its own licensing terms. The API surfaces these names (`translated_name`, `author_name`, tafsir `name`, recitation `name`/style).
- **Per-resource licenses still apply** ("any source-specific license requirements", Terms §2.2). The Quran text itself is public-domain scripture; translations/tafsirs carry their own copyrights (e.g. Saheeh International is a copyrighted translation — id 20 in the API). QUL datasets: repo is MIT, individual datasets carry per-dataset licenses — check each before bundling.
- **Legacy anonymous API:** no separate formal ToS found for it (it is the system being migrated); the Foundation terms are the official frame going forward. Unknown / not verifiable here.

## 6. Example responses (trimmed, from live GETs)

`GET /chapters?language=en` (first item):
```json
{"id":1,"revelation_place":"makkah","revelation_order":5,"bismillah_pre":false,
 "name_simple":"Al-Fatihah","name_complex":"Al-Fātiĥah","name_arabic":"الفاتحة",
 "verses_count":7,"pages":[1,1],
 "translated_name":{"language_name":"english","name":"The Opener"}}
```

`GET /verses/by_chapter/1?words=true&word_fields=text_uthmani&translations=20&fields=text_uthmani&per_page=1` (verse 1, trimmed):
```json
{"id":1,"verse_number":1,"verse_key":"1:1","hizb_number":1,"rub_el_hizb_number":1,"ruku_number":1,
 "manzil_number":1,"sajdah_number":null,"text_uthmani":"بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
 "page_number":1,"juz_number":1,
 "words":[
   {"id":1,"position":1,"audio_url":"wbw/001_001_001.mp3","char_type_name":"word",
    "text_uthmani":"بِسْمِ","page_number":1,"line_number":2,"text":"بِسْمِ",
    "translation":{"text":"In (the) name","language_name":"english"},
    "transliteration":{"text":"bis'mi","language_name":"english"}},
   {"id":5,"position":5,"audio_url":null,"char_type_name":"end","text_uthmani":"١",...}
 ],
 "translations":[{"id":96343,"resource_id":20,
   "text":"In the name of Allāh,<sup foot_note=195932>1</sup> the Entirely Merciful..."}]}
```
Pagination: `{"per_page":1,"current_page":1,"next_page":2,"total_pages":7,"total_records":7}`

`GET /quran/verses/indopak?chapter_number=112`:
```json
{"id":6222,"verse_key":"112:1","text_indopak":"قُلۡ هُوَ اللّٰهُ اَحَدٌ"}
```

`GET /search?q=mercy&size=2&page=0&language=en` (one result, trimmed):
```json
{"verse_key":"7:151","verse_id":1105,
 "text":"قَالَ رَبِّ ٱغْفِرْ لِى ...","highlighted":null,
 "words":[{"char_type":"word","text":"قَالَ"},...],
 "translations":[
   {"text":"He said: My Lord! Have <em>mercy</em> on me...","resource_id":19,"name":"M. Pickthall"},
   {"text":"He said, "My Lord, forgive me..."","resource_id":149,"name":"Fadel Soliman, Bridges’ translation"}]}
```
(Note: legacy `search` pagination fields printed empty at test time — search pagination shape differs/depended on params; verify when integrating.)

`GET /chapter_recitations/7?language=en` (one item):
```json
{"id":911,"chapter_id":1,"file_size":839808.0,"format":"mp3",
 "audio_url":"https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/1.mp3"}
```

`GET /recitations/7/by_chapter/1?per_page=3`:
```json
{"audio_files":[{"verse_key":"1:1","url":"Alafasy/mp3/001001.mp3"}, ...],
 "pagination":{"per_page":10,"current_page":1,"next_page":null,"total_pages":1,"total_records":7}}
```

`GET /juzs` (first entry):
```json
{"id":61,"juz_number":1,"verse_mapping":{"1":"1-7","2":"1-141"},"first_verse_id":1,"last_verse_id":148,"verses_count":148}
```

Arabic tafsirs available (from `GET /resources/tafsirs` — 20 total, Arabic subset):
`16 ar-tafsir-muyassar` (التفسير الميسر) · `14 ar-tafsir-ibn-kathir` (ابن كثير) · `15 ar-tafsir-al-tabari` · `90 ar-tafseer-al-qurtubi` · `91 ar-tafseer-al-saddi` (السعدي) · `94 ar-tafsir-al-baghawi` · `93 ar-tafsir-al-wasit` (الطنطاوي).

## 7. React integration notes (our stack: React 18 + Vite + Capacitor, no backend)

- **No official React-specific SDK.** `@quranjs/api` has two entrypoints: server (Content APIs, needs client secret) and `@quranjs/api/public` (browser PKCE — for Connected-App user flows, **not** content reads). A React PWA cannot safely read Content APIs directly; docs push a **backend proxy** (First API Call page: "a backend proxy pattern"). We have no backend — this is a structural mismatch with our no-account, local-first design.
- **Legacy anonymous API is browser-friendly today** (anonymous GETs; heavy Cloudflare edge caching, `max-age` 8 days — pairs well with SWR/HTTP caching). CORS was not explicitly verified from a browser context in this research (API GETs ran via PowerShell); quran.com's own open-source frontend (https://github.com/quran/quran.com-frontend-next) calls it from the browser, but verify CORS before committing.
- Practical pattern for us if we integrate: **fetch-on-demand + IndexedDB cache + graceful degradation** (feature hides or falls back to bundled data when offline/4xx/5xx), never a hard startup dependency. Sanitize HTML in translations/tafsir (`<sup foot_note>`, `<em>`, `<h2>/<p>` in chapter info).
- Capacitor Android: same fetch code; audio via streaming (`<audio>`) for verse/wbw clips and download-to-file for full-surah audio (matches our current reciter cache).
- Keep API enrichments **out** of shipped bundles (Terms: no redistribution; fonts/images outside Content Sync exception).

## 8. What API v4 unlocks for us (vs. our bundled-JSON approach)

| # | Unlock | Value for Azkar App | Cost / friction |
|---|---|---|---|
| 1 | **Multiple Arabic tafsirs** (الميسر + ابن كثير، الطبري، القرطبي، السعدي، البغوي، الوسيط) | Tafsir switcher in reader; much richer Arabic study | ❌ `by_ayah` 404 on legacy; Foundation needs OAuth+backend; 1-week cache rule blocks permanent storage; redistribution ban blocks bundling |
| 2 | **Word-by-word data** (per-word Uthmani text + translation + transliteration + `wbw` audio URL) | Word-tap meanings, memorization aid, word-audio learning — big differentiator, no local dataset needed | Payloads grow (~`words[]` per verse); 45 KB/word audio must stream, not bundle; word-**timing** segments still need QUL datasets |
| 3 | **Search across 126 translations + Quran text** | Server-side search with zero local index | Search is **permission-gated** on Foundation; legacy search pagination shape iffy; offline search still needs a local index for core use |
| 4 | **Reciter catalog** (12 verse-level reciters + chapter recitations with `file_size`) | Effortless reciter picker; stays fresh without shipping new audio metadata | Only if we accept network dependency for catalog; our per-surah download model already matches `chapter_recitations` — low-risk adoption |
| 5 | **Mushaf page mode** | `page_number`/`line_number` on every word + QUL layouts/fonts → real madaf page rendering | Layout engine work is significant; exact fonts/images licensing is outside the API terms (contact providers); QUL datasets are the practical source |
| 6 | **Verse metadata** (juz/hizb/rub/ruku/manzil/sajdah in every verse) | Free enrichment for reading plans, memorization tracker | Trivial — already in payloads we'd fetch |
| 7 | **Content Sync APIs** | The one Foundation feature designed for **offline/local-first** apps (full copies, ≤7-day re-sync) | Requires OAuth backend + credentials → conflicts with our no-account architecture today |

**Recommendation — hybrid (ADOPT / ADAPT / LEARN):**
- **ADOPT (data model, not runtime):** use v4 endpoints + QUL datasets in a **build-time script** to regenerate our bundled JSON (114 surahs text, الميسر, reciter metadata) instead of hand-maintained files. Bundling content we generate from public-domain scripture + our own licensed sources stays our safest legal ground.
- **ADAPT (runtime enrichment):** add optional, network-gated features on top of the **legacy anonymous API** while it lives — on-demand extra tafsirs (once the tafsir endpoint is reachable), word-tap meanings + word audio streaming (`verses.quran.com/wbw`), search. Cache ephemerally (respect the 1-week spirit), degrade gracefully offline. Do **not** make any reader screen fail without it.
- **LEARN:** attribution surface ("Quran data provided by Quran Foundation" + per-edition credit); the Content-Sync offline pattern (≤7-day re-sync) as the future shape if we ever add a tiny sync backend; reciter-catalog breadth (our catalog is smaller than the API's 12+ reciters).
- **Do NOT migrate reads to Foundation Content APIs now:** client credentials + backend proxy + permission-gated search + redistribution/cache terms all conflict with local-first, no-account, no-backend. Revisit only if we ship a companion backend.

## 9. Risks & gotchas

| Risk | Severity | Mitigation |
|---|---|---|
| Legacy anonymous API is officially in a migration path (docs: "Migrate from api.quran.com…") → unannounced retirement/deprecation possible | **HIGH** | Treat as opportunistic enrichment only; never a hard dependency; regenerate bundles offline via build script; recheck quarterly |
| Terms prohibit redistribution & >1-week caching (unless Content Sync) → conflicts with bundling API content and long-lived device caches | **HIGH** | Keep bundle as first-party content; API content only ephemeral; if we ever want durable offline from QF, use Content Sync (needs backend) or obtain written permission |
| `/quran/tafsirs/{id}/by_ayah/{key}` returns **404 on legacy host** (verified twice); tafsir content effectively unreachable anonymously today | **HIGH** (blocks tafsir unlock on legacy) | Verify against `openAPI/content/v4.json` + Foundation access; or bundle additional tafsirs from QUL/public-domain sources instead |
| `download.qurancdn.com` DNS-unreachable from test network; `resources/chapter_reciters` 503 twice; `api.quran.foundation` DNS failure | **MEDIUM** | Never hardcode CDN hosts; use returned absolute `audio_url`; implement fallback bases + retries; regional reachability varies |
| Rate-limit numbers unknown (legacy); Cloudflare caching masks origin behavior | **MEDIUM** | Stay polite: batch `per_page`, cache aggressively, backoff on 429/5xx |
| HTML embedded in content (`<sup foot_note>` in translations, `<em>` in search, `<h2>/<p>` in chapter_info) | **MEDIUM** | Sanitize/render deliberately; footnotes are valuable — render them as real footnotes |
| Foundation Search needs a separate permission; search pagination shape on legacy printed empty in testing | **LOW** | Verify search params/pagination live before building UI around it |
| `/juzs` returns 60 entries (30 juz + 30 hizb entries) — easy to mis-consume; `recitation_name` often null (use `style`/name from chapter reciters) | **LOW** | Filter by `juz_number` ≤ 30; defensive field access |
| CORS from browser unverified in this research | **LOW** | One-line probe from the app dev server before committing |

**Confidence:** MEDIUM–HIGH. Everything marked ✅ was verified by direct live GETs with captured payloads; auth model, terms, SDK, and spec locations verified from official fetched docs. Unverified/unknown: numeric rate limits, CORS behavior, Foundation-hosted behavior with real credentials, tafsir-by-ayah on Foundation, long-term deprecation timeline of the legacy host.

## 10. Links

- Portal / landing: https://quran.com/developers · https://api-docs.quran.com · (mirror) https://api-docs.quran.foundation
- Migration guide: https://api-docs.quran.com/docs/quickstart/migration/ · Quickstart: https://api-docs.quran.com/docs/quickstart/ · First API call: https://api-docs.quran.com/docs/quickstart/first-api-call/
- OpenAPI specs: Content v4 → https://api-docs.quran.foundation/openAPI/content/v4.json · Search v1 → .../openAPI/search/v1.json · OAuth2 v1 → .../openAPI/oauth2-apis/v1.json · User v1 → .../openAPI/user-related-apis/v1.json · index `llms.txt` → https://api-docs.quran.com/llms.txt · Reference hub → https://api-docs.quran.foundation/docs/api-reference/
- Versioned legacy docs: https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/content-apis/ (tafsirs, list-surah-recitation, verses-by-chapter-number, etc.)
- SDK: https://api-docs.quran.com/docs/sdk/javascript/ · public client: https://api-docs.quran.com/docs/sdk/javascript/public-quickstart/ · npm: https://registry.npmjs.org/@quranjs/api · repo: https://github.com/quranjs/api
- Legal: Developer Terms → https://api-docs.quran.foundation/legal/developer-terms/ · FAQ (attribution) → https://api-docs.quran.foundation/docs/tutorials/faq/ · quran.com site T&C → https://quran.com/terms-and-conditions
- QUL (layouts, fonts, word data, audio timings): https://qul.tarteel.ai/ · mushaf layouts → https://qul.tarteel.ai/resources/mushaf-layout · datasets → https://qul.tarteel.ai/docs/datasets · repo (MIT) → https://github.com/TarteelAI/quranic-universal-library
- Legacy API base (anonymous): https://api.quran.com/api/v4/ · Legacy audio bases verified: `https://verses.quran.com/`, `https://download.quranicaudio.com/qdc/`
