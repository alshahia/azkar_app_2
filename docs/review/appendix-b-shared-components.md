# Appendix B — Shared Components Review (22 files)

> Verbatim report from the dedicated read-only sub-review. App.tsx skimmed for prop contracts only.

---

### components\azkar\AudioController.tsx
- [MEDIUM] :44-58 — RAF loop calls setProgress/setDuration/setIsPaused every frame even when unchanged; whole controller re-renders ~60×/sec during playback.
- [MEDIUM] :63 — Effect depends on isPaused it sets itself ([isPlaying, isPaused]); every pause/resume restarts RAF chain; optimistic local isPaused can desync on failure (:77-85).
- [MEDIUM] :151,172,180,182 — Hardcoded Arabic bypasses translations.
- [MEDIUM] :106,156 — Icon-only buttons without accessible names.
- [LOW] :120,125 — duration||1 / max={duration||100} produce meaningless seek range while metadata is 0.
- [LOW] :71-75 — Seek optimistic value clobbered by next RAF frame (thumb snap-back).

### components\azkar\EditZikrModal.tsx
- [MEDIUM] :87,100,113,125,137,154,161,168,180,187 — All UI strings hardcoded Arabic.
- [LOW] :144 — Count input collapses to 1 when cleared (parseInt||1); min not enforced beyond clamping.
- [LOW] :100-146 — Labels not associated with inputs; no Escape-to-close or focus trap.
- [INFO] :27-30,42 — mounted-gate redundant with createPortal.
- [INFO] :40 — Reset effect keyed on zikr identity can revert in-progress edits mid-edit.

### components\azkar\ExplainZikrModal.tsx
- [HIGH] :30-52 — Uncanceled fetch allows stale-response race; slower older response overwrites newer explanation (setExplanation unconditional).
- [MEDIUM] :35 — Dead/broken env fallback: apiKey || process.env.API_KEY — Vite builds replace process.env with {} (dist shows n||Te.API_KEY with Te={}); fallback always undefined; if ever defined, secret ships in bundle.
- [MEDIUM] :96 — Brittle control flow via error string match ('error.includes("API")').
- [MEDIUM] :57-76,88,101,123 — Dialog lacks role="dialog"/aria-modal/focus trap; close button unnamed; strings bypass i18n.
- [LOW] :43 — catch (err: any); only err.message inspected.
- [LOW] :90-104 — No retry for generic failures; no timeout on Gemini call (spinner can spin forever).

### components\azkar\FocusModeView.tsx
- [HIGH] :38-39 — Crash when azkar shrinks below currentIndex: azkar[currentIndex].id TypeError; no bounds clamp/reset.
- [MEDIUM] :46-53 — Stale currentIndex in dependency array ([playingZikrId, azkar]).
- [MEDIUM] :138 — Tap-counter inaccessible div (no role/tabIndex/keyboard); nav/favorite/play buttons unnamed.
- [MEDIUM] :200 — Hardcoded status strings ('مكتمل'/'اضغط للعد').
- [LOW] :132-137,151-155 — framer-motion props cast through as any (twice).
- [INFO] :35 — firstIncompleteIndex recomputed per render, consumed only as initial state.

### components\azkar\ZikrCard.tsx
- [MEDIUM] :75-76 — Rapid taps lose counts (absolute value from prop closure; App.updateProgress sets absolutely). Same pattern FocusModeView:75.
- [MEDIUM] :121 — Primary counter non-focusable div.
- [MEDIUM] :162,166 — Hardcoded Arabic tooltips; play/favorite/edit buttons have no accessible name.
- [LOW] :6 — ShareIcon imported, never used.
- [LOW] :229 — Blind cast to UserZikr feeds built-ins into editor/delete path.
- [INFO] :134 — Width NaN if zikr.count === 0 (division by zero).

### components\common\Confetti.tsx
- [LOW] :30 — Untyped particle array (any[]).
- [INFO] :15-23 — Canvas ignores devicePixelRatio (blurry on high-DPI); no prefers-reduced-motion respect. Cleanup itself correct.

### components\common\CustomIcons.tsx
- [LOW] :14,91,141,190,197,243,283,331 — Duplicate fixed SVG ids collide across instances; url(#...) resolves to first occurrence.
- [INFO] :380 — Alias export for convenience; otherwise clean.

### components\common\OfflineIndicator.tsx
- [MEDIUM] :19-23 — Listener leak on early unmount (handle assigned in .then; cleanup sees null).
- [MEDIUM] :41-43 — Untranslated banner; no role="status"/aria-live → connectivity changes never announced.
- [INFO] :14-23 — Dual sources update state redundantly; .catch(() => {}) swallows init failures.

### components\common\ScreenErrorBoundary.tsx
- [MEDIUM] :41,44,51 — Hardcoded Arabic fallback UI.
- [LOW] :29-32 — Retry doesn't remount failed subtree (deterministic crash re-throws); consider key-bumping children.

### components\common\Skeleton.tsx
Clean.

### components\common\TimePicker.tsx
- [MEDIUM] :33-38,47,93,102 — Hour state mixes 12h/24h: handleSelect stores num+12, input clamps typed values 1-12 into same state, finalPeriod derived but ignored — pick 11 PM then AM renders raw "23" and saves "11:xx AM".
- [MEDIUM] :40-80 — ClockView redefined inside render → dial remounts each parent render (focus loss).
- [MEDIUM] :87,121,122 — Hardcoded English strings in AR-default app.
- [LOW] :85 — Overlay not dismissible; no Escape; no role="dialog".
- [INFO] :23-27 — Parser trusts "HH:MM AM"; malformed initialTime yields NaN without validation.

### components\home\DashboardLayout.tsx
- [MEDIUM] :40,71 — Hardcoded English ("Featured", "Start your day", "End your day") amid translated siblings.
- [LOW] :8-13 — Dead any-typed prop allAzkar; currentZikr any.
- [LOW] :42-44 — Unnamed icon-only refresh button.

### components\home\FocusLayout.tsx
- [HIGH] :66-77 — Share/Copy/Play buttons have NO onClick handlers — visible, styled, inert.
- [LOW] :8-14 — Unused any-typed prop; currentZikr any.
- [LOW] :47 — Favorite heart button no accessible name.
- [INFO] :25 — No guard for empty currentZikr.

### components\home\HomeHeader.tsx
- [MEDIUM] :78,85 — Hardcoded Arabic 'التقويم'/'القبلة' while siblings use t() in same array.
- [LOW] :101 — Pointless identical ternary (both branches same value).

### components\home\HomeWidgets.tsx
- [MEDIUM] :364-371,422-429 — Uncleaned setTimeout + unhandled rejection in Salawat/Info widgets; rejected repo.getRandom() leaves skeleton forever.
- [MEDIUM] :278-287 — Tasbeeh global progress loses rapid taps (closure read + absolute write); magic id 99999 collision risk.
- [MEDIUM] :49,62,76,88,110,293 — SmartSuggestion/Tasbeeh strings bypass i18n despite useTranslation imported in file.
- [MEDIUM] :101,325 — Clickable divs without semantics.
- [LOW] :133-140,172 — No empty/error branch for verse widget (loading stuck true if category missing); verse typed any.
- [INFO] :252-254 — Center AsmaulHusna button shows refresh icon but only advances name.

### components\home\PrayerTimesWidget.tsx
- [MEDIUM] :11,92,101-107,127-141,157-167 — useTranslation imported never called; entire widget hardcoded Arabic.
- [MEDIUM] :115-117 — Whole card navigates via bare div onClick.
- [LOW] :34-42,50-55 — Countdown stalls up to a minute past prayer time (diff<=0 path never setTimeRemaining).
- [LOW] :92 — Blocking alert() with hardcoded Arabic for geolocation failure.
- [INFO] :170 — Forced en-US time formatting regardless of app language.

### components\home\StreamLayout.tsx
- [HIGH] :53-54 — Share and Copy buttons have no handlers — dead controls.
- [LOW] :7-10 — Biased shuffle (sort(() => 0.5 - Math.random())); Fisher-Yates is correct.
- [LOW] :60 — Hardcoded English footer; empty list shows only footer (no empty state).
- [LOW] :13,18 — any-typed data.

### components\layout\BottomNavBar.tsx
- [INFO] :22-35 — Real text labels (good); active tab lacks aria-current="page". Otherwise clean.

### components\layout\MainLayout.tsx
Clean.

### components\onboarding\NotificationsScreen.tsx
- [MEDIUM] :47-58 — Yes and No do exactly the same thing (navigate('personalize')); opt-in never recorded; step cosmetic.
- [LOW] :11-21 — FeatureItem redefined per render. i18n usage otherwise exemplary.

### components\onboarding\PersonalizationScreen.tsx
- [MEDIUM] :36-47 — Denied notification permission silently swallowed; context stores reminders=true anyway; fire-and-forget scheduleReminder.
- [MEDIUM] :46 — Notification content hardcoded Arabic (App.tsx:291 repeats literals).
- [LOW] :17,20 — Slider/time ignore existing preferences (constant 2 / '05:30 AM').
- [LOW] :90-91 — sr-only switch unlabeled.

### components\onboarding\WelcomeScreen.tsx
- [LOW] :10-16 — FeatureCard redefined per render.
- [LOW] :11,28 — Fixed LTR alignment in RTL-first app (text-left, no rtl: variants).
- [LOW] :29 — Skip never marks onboarding complete → skippers replay onboarding every launch (App gates on flag).

---

## Overall assessment
Structurally sound React; consistently correct effect cleanup in trickier spots (Confetti, RAF loop, ZikrCard hide-timer). Dominant defects product-level: inert action buttons (FocusLayout, StreamLayout), focus-mode carousel crash on shrink, ungated AI race displaying wrong explanation. Systemic i18n bypass cuts across ~half the files. Recurring smells: absolute-value state updates dropping rapid taps; async listeners/timers resolved after unmount; interactive divs instead of buttons; any-typed prop contracts on home layouts. No secrets exposed; no XSS vectors (AI output rendered as text).

## Top issues
1. [HIGH] Inert action buttons — FocusLayout.tsx:66-77, StreamLayout.tsx:53-54.
2. [HIGH] FocusModeView.tsx:38-39 — out-of-range index crashes whole screen.
3. [HIGH] ExplainZikrModal.tsx:30-52 — stale-response overwrite (+ dead env fallback :35).
4. [MEDIUM] Systemic i18n bypass (~12 files), incl. unused t() in PrayerTimesWidget.
5. [MEDIUM] Lifecycle/race cluster — OfflineIndicator leak; Salawat/Info timers; lost-tap counters; TimePicker corruption.
