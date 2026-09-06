# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

> The product ships as a single HTML/CSS/Tailwind codebase deployed to both **web (PWA)** and **Android (via Capacitor, primary target)**. iOS is also scaffolded via `@capacitor/ios` but is not the primary install target. Per the skill's platform taxonomy, **adaptive** is the closest match because the project genuinely targets multiple OS surfaces, while the *design language itself* is web (no native UI conventions — no Material, no Cupertino). Native affordances (haptics, status bar, splash, notifications, geolocation, SQLite) are layered on top of the web UI through Capacitor plugins without changing the visual identity. Future iOS-specific design language (or Material for Android) would split this into separate design systems — until then, the design system is the web system, deployed to web + Android with Android as the primary install surface. The Android primary is reflected in `android/build.gradle`, the `appId: 'com.azkar.app'` Capacitor config, and the absence of any iOS-specific UI work.
## Stack

> Omitted: the existing codebase already answers the stack question. Confirmed in `package.json` and `capacitor.config.ts`: React 18 + TypeScript 5 + Vite 5 + Tailwind 3.4 + Capacitor 8 (Android, iOS plugins installed) + Framer Motion + Heroicons + `adhan` (prayer times) + `@google/genai` (Gemini) + `@capacitor-community/sqlite`, `@capacitor/local-notifications`, `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/geolocation`. Service-worker-driven PWA (`public/sw.js`, `public/manifest.json`).

## Users

Primary users are **Arabic-speaking Muslims** who want a calm, always-available companion for daily Islamic remembrances (`أذكار` — adhkar). The interface is Arabic-only (`<html lang="ar" dir="rtl">` in `index.html`, single-key `ar` translation in `translations.ts`), so the audience reads Arabic natively.

They reach for the app in three recurring situations:

- **Start of day / end of day** — to recite morning (`أذكار الصباح`) and evening (`أذكار المساء`) adhkar from authentic sunnah sources.
- **Active worship** — during salah (prayer), wudu, eating, sleep, travel, when entering or leaving the mosque, or while making dua. The category list in `constants.ts` enumerates these occasions (adhan, salah, ruku, sujood, qunoot, food, wudu, travel, janazah, …).
- **Throughout the day** — for short dhikr bursts, tasbeeh counts, Quran reading, prayer-time awareness, and Qibla direction when traveling.

The product also serves users who want to **read and listen to the Quran offline** with tafsir, and users who want **a private spiritual practice tracker** — no account, all data stored locally.

> Inferred: specific demographic age range and sect affinity are not declared in code or docs. The included adhkar and Quranic tafsir (التفسير الميسر) are mainstream Sunni selections, but the app does not gate content by sect. Treat sect-scope as **deliberately not declared**.

## Product Purpose

Azkar App exists to make the daily practice of Islamic remembrances effortless, accurate, and continuous. Success means the user opens the app in the moment they intend to remember Allah, finds what they need without friction, completes the adhkar or Quran reading with their count or progress preserved, and is gently invited back tomorrow through reminders and a streak indicator.

Concretely, success is:

- Reading or reciting adhkar on a mobile device with the Arabic text legible and accurate.
- Tracking per-dhikr counts and a lifetime streak that survives app restarts and offline use.
- Reading the full Quran with offline text, optional offline audio, and on-demand tafsir.
- Receiving scheduled reminders for morning, evening, prayer times, and user-defined categories.
- Personalizing the experience (theme, dark mode, font size, home layout) so the app feels owned, not generic.

## Positioning

A **local-first, Arabic-first, single-developer-quality adhkar and Quran companion** that works offline, ships to Android via Capacitor, requires no account, and adapts to the user's hand and habits (themes, font size, layout, haptics, reminders). The meaningfully different mechanism versus generic Islamic apps is the combination of:

1. **A fully offline content surface** — full Quran text + tafsir (التفسير الميسر) bundled as JSON (`data/static/quran/`), audio cached locally on first play (`services/audioCacheMobile.ts`), and adhkar content embedded in the bundle.
2. **Tap-to-count adhkar flow** — the entire zikr card is a tap target that increments a count, removes the card with a spring animation on completion, and updates a global streak (`components/azkar/ZikrCard.tsx`).
3. **A 6-theme engine + dark mode** with a single primary accent role that adapts across light and dark surfaces (`index.css` `--color-primary-{50..900}` CSS variables; `tailwind.config.js` `colors.primary` mapping; six named themes: emerald, blue, rose, amber, purple, cyan).
4. **Native-feeling transitions without native UI conventions** — page transitions via Framer Motion, haptic feedback via Capacitor Haptics, status-bar and splash-screen styling via Capacitor plugins, all wrapped around an HTML/Tailwind design language that does not pretend to be Material or Cupertino.

## Operating Context

The app is **mobile-first** (a `max-w-md` 28rem column is centered on larger screens in `App.tsx`) and ships to three runtime surfaces:

- **Web browser** — a Vite-built PWA with a service worker (`public/sw.js`) and web manifest (`public/manifest.json`), installable to home screen.
- **Android APK** — built via Capacitor, with status bar tinting, splash screen, local notifications, geolocation, haptics, and SQLite storage (`@capacitor-community/sqlite`).
- **iOS** — Capacitor dependencies (`@capacitor/ios`) are installed and the platform is configured, but no iOS-specific design language has been authored; the same web UI is used.

Users typically have the device in one hand during use. The flow is read-only — the app never asks for an account, email, or social login. Storage is on-device: web uses IndexedDB via `idb-keyval` (`data/storage/web.ts`); native uses SQLite through Capacitor (`data/storage/mobile.ts`). Notifications use Capacitor Local Notifications; prayer times are computed locally via the `adhan` library; Qibla direction uses device geolocation.

The app exposes two external integrations that are **user-supplied, opt-in**, and stored locally in preferences:

- A **Gemini API key** (`UserPreferences.apiKey`) for AI-generated explanations of adhkar via `services/GeminiService.ts`.
- A **TTS voice name** and audio cache settings for reciter audio playback (Quran + adhkar recitation).

## Capabilities and Constraints

Confirmed in code (`types.ts`, `App.tsx`, `AppContext.tsx`, `services/`, `components/`):

**Capabilities**

- 5-tab primary navigation: Home, Quran, Categories, Favorites, Settings.
- Azkar reading with tap-to-count progress, audio playback, share-as-image, AI explanation, edit, favorite.
- Tasbeeh counter as a dedicated screen and a global widget (`GLOBAL_TASBEEH_ID = 99999`).
- Prayer times (`services/PrayerTimesService.ts` via `adhan`) + Qibla compass + Hijri calendar (`utils/hijri.ts`).
- Full Quran reader with offline text, bookmark persistence, resume-from-last-read, reciter selection, per-surah audio download, and on-demand tafsir.
- AI adhkar explanation (Gemini) gated behind a user-provided API key.
- Streak tracking (`UserStats.streak`) and lifetime read count (`UserStats.totalReads`).
- Reminders: morning, evening, per-category custom, and prayer-time.
- Personalization: 6 themes, dark mode, 8-step font scale (`fontSize`: 1–8), 4 home layouts (`focus`, `stream`, `dashboard`, `simple`), haptics toggle, language picker (Arabic-only today).
- Onboarding flow: Welcome → Notifications opt-in → Personalization (language, font size, reminders).
- Backup & restore of local data (`data/backup.ts`).

**Constraints**

- **Arabic-only UI.** `AppLanguage = 'ar'` is a single-value literal. No LTR or English UI surface exists; `<html dir="rtl">` is hardcoded.
- **Local storage only.** No server sync, no account, no cloud backup — the product is local-first by design.
- **External API keys are user-supplied.** AI tafsir and high-quality TTS require the user to enter their own Gemini API key and select a voice. No bundled API key.
- **Mobile-only canvas.** Layout is designed for `max-w-md`; wider viewports center a phone-sized column rather than expanding to multi-pane.
- **No analytics, ads, or tracking libraries** are present in `package.json`.
- **Adhkar content** is curated from static JSON in `data/static/` and `data/categories/` — additions go through the app's own edit/Add-Zikr flow, not via a CMS.

**Deliberately undecided**

- iOS visual adaptation. Capacitor iOS plugins are installed but no iOS-specific UI work has been authored.
- Sect scope. Content draws from mainstream Sunni sources; no explicit declaration of intended audience sect.
- Monetization model. No ads, no paywall, no premium tier are configured.

## Brand Commitments

These are the durable brand facts future work must preserve:

- **Arabic-first.** The product's voice, content, and identity are Arabic. English transliteration is a learning aid, not a translation of the experience.
- **RTL by default.** `dir="rtl"` is hardcoded at the root. The product does not switch to LTR.
- **Local-first privacy.** No account, no analytics, no cloud sync. User data (progress, favorites, bookmarks, settings) stays on the device.
- **Free of charge, free of ads.** No monetization surface is configured.
- **Authentic Islamic content.** Adhkar are sourced from sunnah and rendered with Arabic text, optional transliteration, optional translation, optional benefit, and a reference. Quran is bundled with the standard tafsir (التفسير الميسر).
- **Respectful, calm visual register.** The product is a spiritual companion, not a productivity app. See `DESIGN.md` for the visual rules that flow from this commitment.
- **Offline-first operation.** After the initial bundle, the app works without network. Audio caching makes recitations offline-capable on first play.

> No logo file is checked into the repository at the project root; the only icon assets are `public/images/icon-192.png`, `public/images/icon-512.png`, and inline SVGs in `components/common/CustomIcons.tsx`. Treat the visual mark as "the App.tsx LoadingFallback logo (an eight-pointed star inside a rotated rounded square, with the Arabic wordmark `أذكار` in Amiri)" until a brand-locked logo asset is committed. **No binding visual identity (logo, palette, typography) was asserted by the user; the values documented here are inferred from the incumbent implementation.**

## Evidence on Hand

- **Full Quran text and tafsir bundled** as static JSON: `data/static/quran/text/*.json` (114 surahs) and `data/static/quran/tafsir/*.json` (التفسير الميسر for all 114 surahs).
- **Adhkar content** organized by occasion: `data/categories/daily.ts`, `morningEvening.ts`, `prayers.ts`, `prophetic.ts`, `quranic.ts`, `special.ts`.
- **Quotes and Salawat** static datasets: `data/static/quotes.ts`, `data/static/salawat.ts`.
- **Custom decorative SVGs** for categories: `icons_svg/{morning,evening,mosque,food,wudu,tasbeeh,general}.svg`.
- **PWA assets**: `public/manifest.json`, `public/sw.js`, `public/images/icon-*.png`, `public/images/background_{light,dark}.webp`.
- **Tests** (`vitest`) covering: audio-cache, components, data-utils, hijri, quran-service, surah-reader-resume, sw — `tests/unit/`.
- **Existing app description** (concise, committed): `metadata.json` — *"A mobile-first web application for daily Islamic remembrances (Azkar). Users can browse categories, track their progress, manage favorites, and personalize their experience with features like dark mode and notification reminders."*

**Future work must not fabricate:**

- User counts, testimonials, awards, or download numbers.
- Sect affinity, scholar endorsements, or fiqh rulings beyond what the bundled content already states.
- Marketing claims about retention, engagement, or efficacy.
- Pricing or premium features (none are configured in the codebase).

## Product Principles

Derived from the confirmed product record above. No visual recipes — visual rules live in `DESIGN.md`.

1. **Local-first, always.** Anything the user creates — progress, favorites, bookmarks, custom adhkar — lives on the device and survives restarts. The product is honest about this; it never implies a server is involved.
2. **Arabic is the language of the experience.** UI, content, and primary identity are Arabic. English exists only to teach pronunciation or meaning.
3. **Respect the moment.** The app is used during sacred acts (prayer, recitation, dua). Friction — ads, signups, network errors, janky motion — is a failure mode, not a tradeoff.
4. **Make return effortless.** Streaks, reminders, and resume-from-last-read exist so the user comes back tomorrow without thinking. They never nag.
5. **Personal but private.** Users can theme, resize, and reshape the app to fit their hand and routine, but their personalization never leaves the device.

## Accessibility & Inclusion

- **RTL by default.** Hardcoded at `<html dir="rtl">`. Arabic reading order and right-anchored layouts are the baseline, not an afterthought.
- **User-controlled font size.** `fontSize: 1–8` scales both Arabic and translated text on the zikr card (`components/azkar/ZikrCard.tsx`, `getArabicClass` / `getTranslationClass`) and the Quran reader (CSS custom property `--quran-fs`).
- **Haptics are opt-in.** Users can disable haptic feedback globally (`hapticsEnabled`).
- **Tap targets sized for one-handed phone use.** Primary cards fill the column; icon buttons sit in 32–40px touch areas.
- **No reliance on color alone for state.** Active/inactive nav states pair color with a dot indicator and a label; completion states pair a check icon with text.
- **Theme system supports low-light and high-contrast needs.** Dark mode is a first-class theme, not an inversion, and the user can swap the accent color (6 themes) for personal contrast preference.

No formal accessibility audit (WCAG 2.1 AA, RTL-correct reading order, screen-reader pass) has been recorded. Treat full conformance as **deliberately unverified** — `/impeccable audit` is the next scoped command if the user wants that confirmed.