# Full Review Report — Azkar App

Companion files: [README](./README.md) · [Remediation Plan](./02-remediation-plan.md) · Appendices A/B/C (file-by-file detail)

---

## 1. Executive summary

| Severity | Count | Theme |
|---|---|---|
| 🔴 HIGH | 11 | Broken production packaging, data-loss paths, audio/sensor leaks, dead controls |
| 🟠 MEDIUM | ~45 | i18n bypass, async races, error handling, accessibility, performance |
| 🟡 LOW/INFO | ~50 | Dead code, typing, cosmetic |

The codebase is structurally decent (clean layering, strict TypeScript compiles with zero errors, no XSS sinks, no committed secrets, well-formed fully-vocalized Arabic datasets) but has systemic weaknesses: **the production build ships broken**, **persistence has no safety nets**, and **the dhikr counting core can silently drop counts**.

---

## 2. HIGH findings

### H1. PWA/offline is broken in production
- `sw.js` is never copied to `dist/` (Vite `publicDir` does not exist) → registration 404s → zero offline capability, contradicting README's "Offline First". Works only in dev.
- Emitted `dist/assets/manifest-*.json` icons point to `/images/icon.png`, absent from dist → installability broken.
- `/images/background_light.png` / `background_dark.png` referenced at runtime (`WelcomeScreen.tsx:23-24`) → 404 in production and in the APK.
- Stale SW cache list caches `cdn.tailwindcss.com` plus an **Inter** font URL the app doesn't load; cache-first with no revalidation.
- The synced APK bundle hash-matches `dist/` → the Android app inherits every gap above.

### H2. Unstable static zikr IDs
`data/static/azkar.ts:16-23`: IDs minted by an import-order counter (`globalIdCounter++`). Any category reorder/addition shifts every subsequent ID → **favorites, progress, hidden items, and edit-links of installed users silently repoint at wrong content after an update**. Most consequential design flaw in the codebase.

### H3. Destructive, untransactional restore (mobile)
`data/storage/mobile.ts:299-320`: `importData` DELETEs all five user tables *before* inserting, without a transaction or row validation. One bad row mid-restore loses old *and* new data. Web semantics differ from mobile for the same backup file (`web.ts:196-218`).

### H4. Silent no-op storage after failed init (mobile)
`data/storage/mobile.ts:90-103`: every method guards `if (!this.db) return`. If SQLite initialization fails, the app keeps running but **all reads/writes silently do nothing**; users see a factory-fresh app with no error signal.

### H5. No schema migration path
`data/storage/mobile.ts:53-67`: DB pinned at version 1, tables via `CREATE TABLE IF NOT EXISTS`. The post-release `originalStaticId` column has no ALTER path → **upgraded installs fail every add-zikr insert** (`INSERT` lists the missing column, line 194).

### H6. Lost-update race on the core counting feature
`App.tsx:330`: `updateProgress(zikrId, count)` takes an absolute count computed from render-scoped state. Rapid taps batching into one React commit overwrite each other and **drop dhikr counts**. Affected sites: `TasbeehScreen.tsx:48-51`, `AzkarListScreen.tsx:205-208`, `ZikrCard.tsx:75-76`, `FocusModeView.tsx:75`, `HomeWidgets.tsx:278-287` (plus magic id `99999` collision risk).

### H7. TTS continues after leaving the screen
`AzkarDayScreen.tsx:33-41`: unmount cleanup closes over stale `isPlaying` (deps `[currentIndex]`; pressing play never re-runs the effect) → `audioService.stop()` is skipped and daily-azkar audio plays past the screen.

### H8. iOS compass listener leak + alignment dead zone
`QiblaCompassScreen.tsx:92-97`: granted-path adds an anonymous `deviceorientation` listener never removed — survives unmount, keeps setting state, sensor stays hot. `:108`: alignment check `abs((h-q+360)%360)<5` misses wrap-around (356° delta treated unaligned); needs `min(d, 360-d)`.

### H9. Crash when session list shrinks
`FocusModeView.tsx:38-39`: completing/hiding the last card shrinks `azkar` while `currentIndex` stands → `azkar[currentIndex].id` TypeError kills the whole screen (ErrorBoundary catches, screen dies).

### H10. Wrong AI explanation displayed
`ExplainZikrModal.tsx:30-52`: uncanceled Gemini fetch has no stale/abort guard — close & reopen on another zikr lets the slower older response overwrite the newer explanation.

### H11. Inert controls shipped
No onClick handlers at all: `FocusLayout.tsx:66-77` (Share/Copy/Play), `StreamLayout.tsx:53-54` (Share/Copy), `AzkarDayScreen.tsx:183-185` (Share). `TasbeehScreen.tsx:39-42` sound toggle is an admitted stub.

---

## 3. Themed analysis (MEDIUM concentration)

### A. Data integrity & storage (detail in Appendix C)
- Arabic search effectively broken for typical input: corpus fully vocalized, query matched raw — no tashkeel normalization (`azkarRepository.ts:71-75`).
- Editing a static zikr mints a new Date.now() id → progress/favorites orphaned; re-editing the original creates duplicate copies (`azkarRepository.ts:112-126`).
- Date.now() ids collide within a millisecond → bare INSERT into TEXT PRIMARY KEY throws, record silently lost (`repository.ts:29-35`, `AddZikrScreen.tsx:42`).
- Count-word heuristic mis-ordered: '33'/'34' branches unreachable; 'ثلاث' prefix-matches ثلاثين(30)/ثلاث عشرة(13) as **3** (`utils.ts:34-40`).
- Web stores: 5× unguarded JSON.parse; read-modify-write races; quota errors unhandled (`web.ts`).
- Deleting an unknown id permanently hides whatever id arrives (`azkarRepository.ts:145-149`).
- Adapters never self-initialize; any caller before App mount hits null-db no-op (`storage/index.ts:8-19`).
- Datasets themselves: ✅ structurally sound (44 categories consistent, no dupes/placeholders/truncation, fully vocalized).

### B. React correctness & lifecycle
- **Context value never memoized** (`App.tsx:441-464`): any state change — including every counter tap — re-renders the entire tree.
- Post-unmount/leak cluster: OfflineIndicator native-listener race (`:19-23`); HomeWidgets uncleaned setTimeout + unhandled rejection → infinite skeleton (`:364-371,422-429`); SearchScreen stale-response race + bare await (`:16-27`); NotificationSettings bare awaits with optimistic toggles (`:38-91`); Settings restore without catch/onerror on a destructive op (`:50-63`); CompletionScreen stats double-count under StrictMode/remount (`:21-26`).
- AudioController: RAF loop sets state ~60 fps without equality gating; self-dependency effect churn; seek thumb snap-back (`AudioController.tsx:44-85`).
- TimePicker mixes 12h/24h representations — 11 PM renders "23", saves "11 AM" (`TimePicker.tsx:33-102`).
- Inline-defined components remount rows per render (`AudioSettingsScreen.tsx:56`, `SettingsScreen.tsx:68`).
- Streak uses UTC dates vs local days (`App.tsx:335-355`); disabled custom reminders rely on screen-level cancel paths only (`App.tsx:278-328`).
- Onboarding logic flaws: Notifications Yes==No (`NotificationsScreen.tsx:47-58`); Welcome **Skip never marks onboarding complete** → replays every launch (`WelcomeScreen.tsx:29`); denied permission still saved enabled (`PersonalizationScreen.tsx:36-47`).
- Prayer reminders expire after ~48h unless the app is reopened (one-shot schedules, today+tomorrow only, `NotificationService.ts:64-124`).

### C. i18n — English support is not real
`types.ts:77` locks `AppLanguage='ar'`; web storage force-overrides language (`web.ts:31`); translations.ts comments admit EN is dead. Meanwhile **~14/19 screens plus ~12 shared files hardcode user-facing strings** (PrayerTimesWidget imports useTranslation and never calls it; DashboardLayout mixes English literals beside t(); scheduled notification bodies are Arabic-only forever). Mixed-language output is visible today even for Arabic users.

### D. Accessibility (systemic)
Unnamed icon buttons / sr-only switches nearly everywhere; primary interactions are `div onClick` (the dhikr counter cards themselves); no focus traps/Escape/role="dialog" in modals; no aria-live on offline banner; `user-scalable=no` viewport (`index.html:6`); RTL/LTR inconsistencies (`WelcomeScreen.tsx:11,28`).

### E. Performance
Context re-render storm (above); `getAllCategories()` clones the whole dataset per call and search rebuilds per keystroke; Hijri calendar constructs 100+ Intl formatters per render (`HijriCalendarScreen.tsx:52-55,143-145`); Tailwind `content` glob scans node_modules (`tailwind.config.js:8`); repo carries 5.2 MB background_light.png + 825 KB icon used at multiple nominal sizes.

### F. Security
- ✅ No XSS sinks anywhere (dangerouslySetInnerHTML/eval/innerHTML: 0 hits); AI output rendered as text.
- ✅ No real secrets: `.env.local` holds a placeholder (`PLAC…`, 19 chars); BYOK design keeps keys client-side by intent.
- ⚠️ API key stored plaintext in preferences **and exported plaintext in backup JSON** (web + mobile) with no warning/redaction (`web.ts:180-193`, `mobile.ts:271-285`).
- ⚠️ Dead fallback `apiKey || process.env.API_KEY` (`AudioService.ts:117`, `ExplainZikrModal.tsx:35`) — compiles to access-on-`{}` (verified in dist), so `.env.local` is never used; if ever wired via build define, the secret bakes into the client bundle. Remove.
- `npm audit`: **13 vulnerabilities (8 high)** — rollup path traversal (GHSA-mw96-cpmx-2vgc), ws memory disclosure, uuid chain via @capacitor/cli. Build-time only; mostly fixed by non-breaking `npm audit fix`.

### G. Android platform
- Notification `smallIcon 'ic_stat_icon_config_sample'` **does not exist** in resources (`capacitor.config.ts`).
- `adhan.wav` sound referenced but **file absent** anywhere in the project.
- `USE_EXACT_ALARM` + `SCHEDULE_EXACT_ALARM` both declared — Play policy restricts USE_EXACT_ALARM to alarm/calendar apps (rejection risk).
- `allowBackup="true"`; release build `minifyEnabled false`; no `ios/` platform despite the dependency; versionCode 1.

### H. Repo hygiene
Dead weight (zero importers, verified by grep): `src/index.css` (unimported — ironically the *complete* theme sheet), `data/azkarData.ts`, `data/local/storage.ts`, `utils/localStorage.ts`, `raw data/` (~1 MB unreferenced CSV/XLSX/JSON). Duplicate SVG gradient IDs across icon instances (`CustomIcons.tsx`). **No git repository.** No tests, linter, or CI.

---

## 4. What's genuinely good ✅
- Strict TS compiles **zero errors** (`tsc --noEmit` exit 0).
- Clean adapter/repository layering; thin, readable services.
- Datasets verified sound: consistent shapes, complete exports, intact vocalized Arabic, zero placeholders/duplicates.
- `ScreenErrorBoundary` contains screen-level crashes.
- Correct cleanup in the tricky spots (Confetti canvas+rAF, audio sequence loops terminate properly via resolver semantics, ZikrCard hide-timer).
- Consistent dark-mode/RTL structure across screens; html-to-image share pipeline carefully gated on `fonts.ready`.
- No security holes in the rendering path.

---

## 5. Validation results

| Check | Result |
|---|---|
| TypeScript strict compile (`tsc --noEmit`) | PASS (exit 0, no errors) |
| XSS-sink scan (whole source tree) | PASS (0 occurrences) |
| Secret scan (.env, bundles, configs) | PASS (placeholder only) |
| Dataset structural integrity audit | PASS (all 6 category files consistent) |
| Dependency audit (`npm audit`) | COMPLETED — 13 vulns (8 high), build-time deps, fixes available |
| README "Offline First" claim vs prod build | FAIL (H1) |
| Production build reproduction | SKIPPED — would overwrite dist/ (no-changes constraint) |
| Lint / unit tests | SKIPPED — none exist in the project |
| On-device Android verification | SKIPPED — requires build/deploy |

---

## 6. Suggested reading order
1. This file (executive view).
2. [02-remediation-plan.md](./02-remediation-plan.md) — ordered phases with exit criteria.
3. Appendices for file:line evidence while fixing.
