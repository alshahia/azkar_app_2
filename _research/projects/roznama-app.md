# Roznama (الروزنامة / roznama-app.com) — Product Research

**Research date:** live fetches done during this session (latest observed store updates: Play "Sep 8, 2026", iOS v57 "Aug 26, 2026)
**Consumer:** "Azkar App" — React 18 + TS + Vite + Tailwind + Capacitor 8, Arabic-only RTL, local-first, no ads/analytics/accounts
**Rule honored:** every major claim ends with an evidence URL/endpoint. Verdicts labeled VERIFIED (fetched directly) vs INFERRED (reasoned, marked).

---

## 1. What it is

**VERIFIED — it IS an Islamic "super-app":** a family-oriented Arabic daily companion combining **faith (Quran, hadith, azkar, prayer times) + culture (encyclopedias) + health tools + casual games** in one free, ad-supported app.

| Attribute | Value | Evidence |
|---|---|---|
| Brand | الروزنامة / "Roznama" — tagline "نافذة على عالم جميل" ("a window onto a beautiful world") | https://roznama-app.com/ (fetched HTML, title `الروزنامة - Roznama`) |
| Positioning | "Your ultimate daily companion … faith, culture, entertainment, and health in one app"; "a safe place for every family member" | Play listing description + homepage text |
| Android developer | **Roz APPS** (package `com.roznamaaa`; legacy app kept live as `com.roznamaaa_old`) | https://play.google.com/store/apps/details?id=com.roznamaaa&hl=en&gl=US ; https://www.appbrain.com/app/...com.roznamaaa_old |
| iOS seller | **FOCUS CODE LTD**, bundle `com.jalal-apps.roznama` (INFERRED: bundle id suggests the iOS app predates the current brand, ~2018, and was rebranded/transferred) | iTunes Lookup API: https://itunes.apple.com/lookup?id=1358495907 |
| Scale | Android **1M+ downloads, 4.6★, ~7,805 ratings**; legacy app another 500K+ downloads / 4.55★ / 5,696 reviews; iOS US: 42 ratings @ 4.38 (Android is clearly the main platform) | Play listing (fetched); AppBrain legacy page; iTunes Lookup |
| Self-description | LinkedIn: "Roznama APP is a Mobile Gaming Apps company" | https://linkedin.com/company/roznama-app (search snippet — not fetched directly) |
| Name etymology | INFERRED: "roznama" (روزنامة/روزنامه) is a Persian-Arabic loanword meaning daily calendar/record → "the daily one" | general knowledge; consistent with "daily companion" branding |

**Not related to:** rozenama.com (e-commerce store manager) or any Persian newspaper archive — name collision only. https://rozenama.com/

## 2. Platforms & tech

| Platform | Presence | Evidence |
|---|---|---|
| Android (primary) | Google Play `com.roznamaaa`, 183–231 MB APK, Android 7.1+ (per Aptoide mirror) | Play listing; https://apkcombo.com/ar/al-roznama-prayer-times/com.roznamaaa/ |
| iOS | App Store `id1358495907`, v57, **614 MB**, min iOS 15, 17+ (US)/16+ | https://itunes.apple.com/lookup?id=1358495907 ; https://apps.apple.com/us/app/al-roznama/id1358495907 |
| Windows | Microsoft Store `9N4F4T0JL07K` (free) | https://apps.microsoft.com/detail/9N4F4T0JL07K (linked from homepage) |
| Web | Marketing site only (no web app) | https://roznama-app.com/ |
| Roadmap claim | "Soon: tablets, smart watches, computers" | homepage text |

**Tech findings:**
- **Website (VERIFIED):** static HTML5, `dir="rtl" lang="ar"`, Bootstrap 5.2.3, jQuery 3.7.1, WOW.js + Animate.css, SweetAlert2, Google Fonts **Tajawal**; pages: `index.html`, `index-en.html`, `updates.html` (JS-loaded changelog — entries not in static HTML), `terms.html` (combined terms+privacy). (fetched HTML of all pages)
- **App framework (UNKNOWN):** not disclosed anywhere fetched. Store metadata (614 MB iOS size, huge feature surface, multiplayer backend) is consistent with a cross-platform framework but this is INFERRED — do not cite a framework.
- **Backend (VERIFIED existence):** online multiplayer games + "Community Dhikr … collect counts with other users" (iOS v57 release notes) prove server infrastructure; provider unknown. (iTunes Lookup releaseNotes)
- **Site perf note:** ~41 KB landing page with 4 third-party CDNs (jsdelivr, cdnjs, Google Fonts, jQuery) — heavier external dependency than our offline-first posture needs.

## 3. Feature list (from homepage text + store descriptions — VERIFIED claims about *claimed* features)

Numbers are the site's own marketing counts: **+42 mini-apps, +20 tools, +6 encyclopedias, +27 games** (https://roznama-app.com/).

| Cluster | Contents |
|---|---|
| Islamic | Quran with tajwid marks, tafsir, **translations into 9 languages**, meanings/i'rab (إعراب) + أسباب النزول encyclopedia; audio by chosen reciter; Prophets' stories; Islamic videos; duas & azkar; zakat calculator; Qibla; adhan alarm; hadith collection ("hundreds of thousands… verified", per iOS description); Asma' Allah al-Husna with meanings; prayer times by city; tasbeeh (misbaha) |
| Cultural | Proverbs & general knowledge; **Arabic poetry encyclopedia** (Jahili → modern); **"on this day in history"** (events/births/deaths/occasions); medical; cooking; **dream interpretation**; photos; name meanings |
| Tools | Calories; date (Hijri↔Gregorian) conversion; moon phases; world clock; **medication reminder**; **menstrual cycle tracker**; pregnancy calculator; BMI; unit/length converters; "melanin" calculator; barcode reader; weather; shopping list; weekly study planner; flashlight |
| Games | +27 classic games, solo or **online multiplayer with family** (e.g., الكنز المفقود, السمكري الذكي, شمس وقمر, كراج السيارات) |
| Platform | **Personal accounts saving progress** (Quran + encyclopedias); Hijri+Gregorian calendar; weather; **daily news, articles, wisdom quotes + notifications**; dark mode; multi-language app UI; "works offline" (iOS description claim); **Community Dhikr** (v57: practice dhikr together, collective counts) |

⚠️ Note: features are self-reported; depth/quality of each was not verifiable without installing.

## 4. Monetization & business model

| Mechanism | Detail | Evidence |
|---|---|---|
| Ads | Play listing badge **"Contains ads"**; privacy policy admits traffic analysis "to provide advertising and promotional services", possibly shared with external parties | Play listing (fetched); https://roznama-app.com/terms.html (fetched) |
| IAP — pay to remove ads (time-boxed) | **"Disable ads for one year $11.99 / six months $8.99 / three months $5.99"** — no premium content paywall found | App Store page IAP section (fetched): https://apps.apple.com/us/app/al-roznama/id1358495907 |
| Subscriptions in terms | Terms section 7 starts "there are two types of subscriptions…" (page truncated) | https://roznama-app.com/terms.html |
| Data collected (their own policy) | Name, email, **geographic location**, device type/platform; marketing notifications opt-out via Settings | https://roznama-app.com/terms.html |
| Content licensing | Terms: all IP proprietary, personal use only, no copying/redistribution/derivatives without written permission → **nothing reusable from their catalog; no open licenses or attribution published for their Quran/tafsir/hadith sources** | https://roznama-app.com/terms.html |
| Cost structure hint | Free core + ad inventory across a huge engagement surface (games, encyclopedias) = classic ad-monetized super-app | Play "Contains ads" + LinkedIn "Mobile Gaming Apps company" |

**Respectful-monetization verdict:** the *form* is mild (ad removal only, time-boxed, no content hostage) but the *base* is ad-funded with ad-oriented data collection — **incompatible with our no-ads/no-analytics brand**.

## 5. UX / retention patterns (extracted)

1. **"One daily app" hub** — brand itself means "daily"; everything designed to be today's default open. (site tagline + Play description)
2. **Daily digest loop** — daily news, articles, wisdom + **"on this day in history"** encyclopedia: fresh content daily without heavy personalization servers. (homepage text)
3. **Layered notifications** — adhan/prayer alarms + azkar "smart reminders" + daily content push + optional marketing push (opt-out in settings). (homepage + iOS description + terms)
4. **Persistent progress** — accounts save Quran/encyclopedia progress; cross-device ambition (watch/PC "soon"). (homepage + iOS description)
5. **Communal worship** — **Community Dhikr**: collective counting with other users (new in v57) → social accountability as a habit anchor. (iTunes Lookup releaseNotes)
6. **Family trust positioning** — "safe for all family members", family multiplayer games: trust as the differentiator vs. ad-heavy Quran apps. (homepage text)
7. **Visible momentum** — public changelog page (`updates.html`) + frequent store updates (v57; Sep 2026 Play update) → release notes as retention/marketing surface. (fetched pages)
8. **Migration insurance** — kept legacy app (`com.roznamaaa_old`, 500K+ installs) live while the new listing passed 1M: zero-risk user migration. (Play + AppBrain)
9. **Offline claim on a server-backed app** — "Works offline" marketed even though accounts/multiplayer exist → offline is table stakes for this audience. (iOS description)
10. **Breadth over depth** — 6 encyclopedias + 20 tools + 27 games in one binary: 614 MB iOS install; maximal screen-time surface for ad inventory. (iTunes Lookup fileSizeBytes)

## 6. Applicable lessons for our Azkar App (fit vs not-fit)

### ✅ ADOPT / ADAPT (fits no-ads, local-first brand)
| Lesson | How for us |
|---|---|
| **Daily digest "one screen a day"** | A "today" home card: today's azkar progress + one wisdom item + one "حدث في مثل هذا اليوم" entry — all from **bundled local JSON** (we already bundle full Quran+tafsir; adding an on-this-day/wisdom dataset is cheap and offline). Highest-value adopt. |
| **"On this day" content engine** | 366-day offline dataset (Hijri-aware) = infinite fresh-feeling content, zero server. |
| **Public changelog / "what's new"** | Small in-app release-notes screen after updates — builds habit of noticing improvement. |
| **Trust made explicit** | We *are* what Roznama only claims: surface a visible "no ads · no tracking · works offline" badge/settings blurb — convert our posture into UX. |
| **Reminder taxonomy beyond fixed prayer times** | Their med/cycle/pregnancy reminders show the pattern: time-of-day + interval + context reminders. Adapt for azkar windows, streak-rescue nudges, custom reminders (we have the base). |
| **Content depth around the mushaf** | i'rab (الإعراب) + أسباب النزول alongside tafsir is the next incremental bundled-text layer users respond to — **license-check sources first** (we'd need openly licensed corpora; Roznama publishes none). |
| **Dhikr "together" (adapt, local-first)** | Community Dhikr proves demand for shared worship counting. Local-first adaptation: household/group tasbeeh goals via optional export/link (QR share of a shared counter), **no accounts, no server** — or skip; do NOT copy their account-based approach. |

### ❌ NOT FIT (reject explicitly)
| Pattern | Why rejected |
|---|---|
| Ads + pay-to-remove-ads IAP | Direct conflict with our no-ads brand; their model depends on it. |
| Ad-oriented data collection (name/email/location, third-party sharing) | Antithetical to local-first; their own terms admit it. |
| Accounts for progress sync | We already have backup/restore; optional file export preserves the benefit with zero infrastructure. |
| Super-app breadth (games, 20 utilities, 6 encyclopedias in one binary) | 614 MB / bloat strategy exists to sell ad inventory; our lean per-surah download model is the right counter-pattern. |
| Smartwatch/PC breadth, online multiplayer games | Out of scope for Capacitor 8 azkar focus. |

### 🧭 Generic lessons for Arabic RTL reading apps (independent of Roznama)
- Tajawal (their site font) vs. our fonts: Arabic UI font choice is a differentiator; test reading comfort for long tafsir passages.
- Daily-habit loops beat feature count for this audience: "one screen a day" + streak + prayer-anchored reminders is the proven engagement triad (also seen in our other research subjects).
- "Safe for the family" messaging resonates in Arabic store copy — mirror it honestly.

## 7. Links

- Site (AR): https://roznama-app.com/ · EN: https://roznama-app.com/index-en.html · Updates: https://roznama-app.com/updates.html · Terms+Privacy: https://roznama-app.com/terms.html
- Google Play: https://play.google.com/store/apps/details?id=com.roznamaaa (hl=en&gl=US fetched) · Legacy: https://play.google.com/store/apps/details?id=com.roznamaaa_old
- App Store: https://apps.apple.com/us/app/al-roznama/id1358495907 · Lookup API: https://itunes.apple.com/lookup?id=1358495907
- Microsoft Store: https://apps.microsoft.com/detail/9N4F4T0JL07K
- Socials: facebook.com/roznamaaa · instagram.com/roznamaaa · tiktok.com/@roznamaaa · t.me/roznamaaa · twitter.com/AppRoznama · youtube.com/@roznamaaa · WhatsApp channel 0029VaBOdiBCMY0NOfOsHg3E · linkedin.com/company/roznama-app
- Support: app.roznama@gmail.com (Play support email + site mailto)
- Mirrors consulted: apkcombo.com, aptoide.com (sham-lab), apkpure.com, appbrain.com, uptodown.com

## Verification & confidence notes

- All store/site data above fetched live this session via direct GETs (Play listing, App Store page, iTunes Lookup API, 4 site pages) + web search.
- UNKNOWN: app framework, backend provider, legal entity mapping (Roz APPS vs FOCUS CODE LTD), exact changelog entries (updates.html is JS-rendered), Android data-safety details beyond "Data is encrypted in transit".
- Main risk when citing this research: feature list is self-reported marketing copy, not install-tested.

## Metrics

- findings: 24
- risks_HIGH: 0
- risks_MEDIUM: 2 (self-reported features unverified; no reusable licenses from Roznama content)
- risks_LOW: 1 (JS-rendered changelog not readable statically)
- clarifying_Qs: 0
