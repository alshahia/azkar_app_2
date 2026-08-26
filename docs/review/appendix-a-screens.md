# Appendix A — Screen Components Review (19 files)

> Verbatim report from the dedicated read-only sub-review. Evidence cross-checked against shared modules.

## Verification notes
- `azkarRepository.ts:49` injects `ICON_MAPPING['default']` for user categories → the `<category.icon/>` render in CategoriesScreen is safe, no crash.
- `AudioService.stop()` resolves pending play promises with false (`AudioService.ts:248-251`) → sequence loops terminate on unmount.
- `Error("API_KEY_MISSING")/("OFFLINE_AND_NOT_CACHED")` sentinels match screens' message checks exactly.
- `App.tsx:330` updateProgress takes an ABSOLUTE count → read-modify-write callers race.
- `types.ts:77` pins AppLanguage = 'ar'.

---

### AboutUsScreen.tsx
- [MEDIUM] :23-37 — Entire body hardcoded Arabic, bypasses t(); EN users get untranslated screen.
- [LOW] :14 — Icon-only back button has no aria-label (pattern recurs on nearly every screen).
- [INFO] :24 — Version "الإصدار 1.0.0" hardcoded; will drift from real version.

### AddZikrScreen.tsx
- [MEDIUM] :60-63 — Save failure swallowed: catch does console.error only, no error UI.
- [MEDIUM] :48 — Fallback reference concatenates unrelated keys t('azkar_reference')+' '+t('report_bug_field_category_other') → garbled default source stored with saved zikr.
- [MEDIUM] :72,95,106,113,121,127,135,148,161,167,182 — Whole form hardcoded Arabic despite neighboring t() usage.
- [LOW] :42,33 — id from Date.now() collision risk if two creates share a millisecond.
- [LOW] :155 — parseInt||1 snaps emptied field to 1; max=1000 never enforced in JS.
- [LOW] :13 — categoryId frozen pre-load ('morning') while select may display first loaded category.

### AudioSettingsScreen.tsx
- [MEDIUM] :56 — SettingItem declared inside render → rows remount every parent render (same at SettingsScreen:68).
- [MEDIUM] :32-53 — Preview race: finally{setPreviewingVoice(null)} clears indicator even when a newer preview started; overlapping playback attempts possible.
- [MEDIUM] :74 — sr-only checkbox unnamed (label wraps only control; row title outside).
- [MEDIUM] :45-49,91,98,102,124,158,162,168 — Headers/alerts hardcoded Arabic.
- [LOW] :44 — any-cast sentinel message compare; brittle typing.
- [LOW] :128-136 — Voice rows are div onClick: not focusable, no role.

### AzkarDayScreen.tsx
- [HIGH] :33-41 — Stale-closure cleanup: deps [currentIndex]; pressing play never recreates effect, cleanup's isPlaying still false at unmount → audioService.stop() skipped, TTS keeps playing off-screen.
- [HIGH] :183-185 — Share button dead: no onClick, advertised action silently does nothing.
- [MEDIUM] :97 — Hardcoded English "No Azkar loaded for today." in Arabic-first app.
- [MEDIUM] :82-86 — Arabic-only confirm/alert error UX with any-cast checks.
- [LOW] :22-25 — isMorning memo [] frozen; session crossing 5pm keeps morning set.
- [LOW] :31 — currentIndex unbounded if dailyAzkar shrinks after refreshData.

### AzkarListScreen.tsx
- [HIGH] :205-208 — Lost-update: updateProgress(id, progress[id]+n) computed from render-scoped state; taps within one commit overwrite and drop global counts.
- [MEDIUM] :156-174 — Sequence loop reads stale viewMode closure; toggling list/focus mid-playback misroutes scrollIntoView/visibility rules.
- [MEDIUM] :49-57 — Reset effect depends on audioLoopDefault → external pref change wipes session progress.
- [MEDIUM] :128-138 — catch(error:any) + three hardcoded Arabic alerts.
- [LOW] :66-81 — Scroll-jump/flash setTimeouts lack cleanup.
- [LOW] :363 — Hardcoded "لا توجد أذكار" above t('azkar_list_empty').

### CategoriesScreen.tsx
- [MEDIUM] :58 — "شخصي" badge hardcoded.
- [MEDIUM] :12-14,35 — No empty state when search matches nothing; list goes blank.
- [LOW] :76-81 — Plus FAB no accessible name. (Icon crash ruled out — repo injects default icon.)

### CompletionScreen.tsx
- [MEDIUM] :21-26 — incrementStreak/incrementTotalReads in unguarded useEffect([]): StrictMode double-invoke or remount double-counts stats.
- [MEDIUM] :18,51,69 — sessionReads estimated as FULL category total ("estimate" per comment); inflated totals outside true 100% flow.
- [MEDIUM] :58 — "أيام متتالية" hardcoded.

### FavoritesScreen.tsx
- [LOW] :43-62 — Single empty state conflates "no favorites" with "no search hits".
- [LOW] :50 — Heart toggle unlabeled.

### HijriCalendarScreen.tsx
- [MEDIUM] :52-55,143-145 — Intl.DateTimeFormat rebuilt per cell ×3 passes (~100+ constructions/render).
- [MEDIUM] :68,80,141,162 — Copy hardcoded Arabic.
- [LOW] :13 — today frozen at mount; midnight rollover loses highlight.

### HomeScreen.tsx
- [MEDIUM] :84-93 — Random-zikr useState initializer runs once; late-loading categories leave focus/simple layouts stuck on placeholder until manual refresh.
- [LOW] :84 — useState<any> discards Zikr type.
- [LOW] :64 — Footer "نهاية القائمة" hardcoded (:129 brand title defensible).

### NotificationSettingsScreen.tsx
- [MEDIUM] :38-91 — Toggle/add handlers await requestPermissions/scheduleReminder with no try/catch → unhandled rejections; optimistic enabled-state may persist with nothing scheduled.
- [MEDIUM] :26,100-101 — selectedCategory init once (possibly ''); "if (!cat) return;" silently no-ops add.
- [MEDIUM] :46,64,111 + labels — Scheduled notification bodies permanently Arabic; whole screen bypasses t().
- [MEDIUM] :178,197,225 — Unnamed sr-only switches.

### PrayerTimesScreen.tsx
- [MEDIUM] :11,33-40,88 — location null → prayers [] → body silently blank; no set-location prompt/loading branch.
- [MEDIUM] :34-39,58,82,128 — Prayer names/header/method line hardcoded Arabic.
- [LOW] :43-48 — Active prayer computed from new Date() per render, no timer → stale highlight.
- [LOW] :134-143 — ClockIconWrapper ignores 'type' param; identical glyph for all prayers.

### QiblaCompassScreen.tsx
- [HIGH] :92-97 — iOS-granted path adds anonymous deviceorientation listener with NO removeEventListener → leaks past unmount, sensor stays hot.
- [MEDIUM] :108 — Alignment check |(h-q+360)%360|<5 misses wrap-around half-window (356° delta treated unaligned); needs min(d,360−d) — haptic/ping dead zone.
- [MEDIUM] :73-74 — deviceorientationabsolute AND deviceorientation both registered → duplicate event/state churn.
- [MEDIUM] :43,99,131,144-146,170-171,248 — Strings/errors hardcoded Arabic.
- [LOW] :168 — "!heading" treats heading===0 (north) as calibrating; compare to null.
- [LOW] :51,87-102 — any-typed events; permission .catch(console.error) only.

### ReportBugScreen.tsx
- [MEDIUM] :15-33 — No validation; unconditional setTimeout(navigate('settings'),1000) destroys draft even if mailto fails.
- [MEDIUM] :28 — window.open('mailto:...','_self') unreliable in Capacitor WebView (Browser plugin used elsewhere not used here).
- [MEDIUM] :96 — Hardcoded English "Attachments are not supported in this version." amid t()-driven form.
- [INFO] :28 — support@azkarapp.com baked in.

### SearchScreen.tsx
- [MEDIUM] :16-27 — Debounce clears timer but not in-flight search; no stale flag → older query's results can overwrite newer.
- [MEDIUM] :19 — Bare await, no try/catch → unhandled rejection; UI silently keeps old/empty results.
- [MEDIUM] :54,73,84,90,97,121 — All strings hardcoded Arabic.
- [LOW] :131 — (zikr as any).categoryTitle undeclared field; empty chip if absent.
- [LOW] :125 — Composite key with index suffix defeats stable identity; zikr.id alone suffices.

### SessionSummaryScreen.tsx
- [MEDIUM] :26-29,39,73,80,91,99,109 — Zero i18n usage; every string hardcoded Arabic.
- [LOW] :98 — totalAvailable-readCount can display negative; no Math.max guard.

### SettingsScreen.tsx
- [MEDIUM] :50-63 — Restore: importData awaited in onload without try/catch, FileReader.onerror unset → silent failure/unhandled rejection on destructive replace-all.
- [MEDIUM] :68 — Inline SettingItem remount-per-render (as AudioSettings).
- [MEDIUM] :35,49,56-59,107-109,114,186-188 — Dialogs/labels hardcoded Arabic.
- [LOW] :117 — .map(t => ...) shadows translation function t.
- [LOW] :118-132 — Theme swatches have no accessible name.
- [INFO] :21-37 — Blob-anchor backup may fail in Capacitor WebView; needs device test.

### ShareEditorScreen.tsx
- [MEDIUM] :53,63,73,85,94,176 — UI/dialog/error strings hardcoded Arabic.
- [LOW] :24,184-192 — data:any props + redundant param-mirroring wrapper (comment calls it a hack). Otherwise solid: fonts.ready gate, try/catch/finally, native+web branches.

### TasbeehScreen.tsx
- [MEDIUM] :48-51 — Core tap counter uses lost-update pattern; fast tap bursts that batch into one commit drop counts; 100ms debounce narrows but doesn't close the window.
- [MEDIUM] :39-42 — Sound toggle is a no-op stub (tick playback commented out).
- [MEDIUM] :60,96,113,144,159,171,181 — Strings/confirm hardcoded Arabic.
- [LOW] :21,127-128 — lastTap state doubles as debounce + animation trigger → render per tap; ref would suffice.
- [LOW] :105-110 — Arrows/tap target lack accessible names.

---

## Overall assessment
Screens are consistently structured with good dark-mode/RTL handling; the hard parts (audio sequence engine with mirrored refs, html-to-image sharing pipeline) show real care; no XSS sinks; no secrets in these files. Defects are systemic: ~14 of 19 screens hardcode strings despite a live translations layer; async hygiene issues (stale-closure audio cleanup, leaked iOS compass listener, uncancellable searches, read-modify-write count updates); error handling leans on alert/console with missing empty/loading branches; accessibility largely untreated.

## Top issues
1. [HIGH] AzkarDayScreen:33-41 — stale isPlaying in cleanup leaves daily-azkar TTS playing after leaving the screen.
2. [HIGH] QiblaCompassScreen:92-97 — iOS compass listener never removed (+ :108 wrap-around dead zone).
3. [HIGH→MEDIUM] Lost-update writes to shared progress — TasbeehScreen:50 / AzkarListScreen:207.
4. [MEDIUM] Systemic i18n bypass (~14/19 screens) with AppLanguage locked to 'ar'.
5. [MEDIUM] Silent-failure async flows: SearchScreen:16-27, NotificationSettingsScreen:38-91, SettingsScreen:50-63.
