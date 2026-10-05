# Azkar App — Fix Plan (Sub-Agent Ready)

> **Generated:** 2026-09-28  
> **Total Issues:** 45  
> **Phases:** 6  
> **Estimated Total Effort:** ~12 days

---

## Phase 0: Foundation & Safety Net

**Goal:** Establish tooling so all subsequent fixes are verifiable.

### Task 0.1 — Add ESLint Configuration
**Files:** `.eslintrc.cjs` (new), `package.json` (edit)  
**Description:**
- Create `.eslintrc.cjs` with TypeScript + React + Hooks rules
- Extend `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:react-hooks/recommended`
- Add `eslint-plugin-react-hooks` and `@typescript-eslint/eslintParser` to devDependencies
- Ensure `npm run lint` passes (fix any pre-existing violations or add inline disables with justification)

**Acceptance Criteria:**
- `npm run lint` exits 0
- No new lint errors introduced
- Config covers: unused vars, exhaustive deps, no-explicit-any, react-key, jsx-a11y

---

### Task 0.2 — Add CI Pipeline
**Files:** `.github/workflows/ci.yml` (new)  
**Description:**
- Create GitHub Actions workflow that runs on push/PR
- Steps: checkout, setup Node 20, `npm ci`, `npm run lint`, `npm run build`, `npm test`
- Cache `node_modules` between runs

**Acceptance Criteria:**
- Workflow file is valid YAML
- All 4 steps run in order
- Build artifacts are uploaded

---

### Task 0.3 — Add Root Error Boundary
**Files:** `App.tsx` (edit)  
**Description:**
- Wrap the entire `<App />` return in a top-level `ScreenErrorBoundary` (or a new `RootErrorBoundary`)
- The boundary should show a full-screen error with a 'reload app' button that calls `window.location.reload()`
- Log the error to console with a `[RootErrorBoundary]` prefix

**Acceptance Criteria:**
- If any unhandled error escapes, the user sees a friendly error page, not a white screen
- The error page has a working reload button

---

## Phase 1: Critical Bug Fixes (P0)

**Goal:** Fix bugs that break core functionality.

### Task 1.1 — Fix Broken Quran Search (Worker Never Receives Queries)
**Files:** `components/screens/SearchScreen.tsx` (edit)  
**Description:**
The `ensureWorker()` function creates the worker and sends a `load` message, but **never sends `search` messages**. The worker's `onmessage` handler processes `search` messages, but the screen only calls `ensureWorker()` and then nothing.

**Fix:**
1. After `ensureWorker()` returns the worker, send a search message:
   `w.postMessage({ id: seq, type: 'search', query: trimmedQuery, mode: 'and' });`
2. Store the callback in `inflightRef.current` before posting
3. Handle the `error` message type from the worker (currently only `ready` and `result` are handled)
4. Add a timeout: if no response in 10s, reject the pending callback and show an error

**Acceptance Criteria:**
- Typing a query in search returns Quran results
- Results show highlighted matching text
- Worker errors are caught and logged
- No memory leaks from pending callbacks

---

### Task 1.2 — Fix `loadSurah` Null Check in Search
**Files:** `components/screens/SearchScreen.tsx` (edit)  
**Description:**
In the search results processing loop, `loadSurah(surah)` may return ayahs, but a specific ayah number from the search index might not exist in the loaded data. The code does `const a = ayahByNum.get(r.a)` and then `a.text` without checking if `a` is defined.

**Fix:
```typescript
const a = ayahByNum.get(r.a);
if (!a) continue; // Skip if ayah not found
```

**Acceptance Criteria:**
- Search with any query never crashes
- Missing ayahs are silently skipped

---

### Task 1.3 — Fix `onHide` Callback Stability in ZikrCard
**Files:** `components/azkar/ZikrCard.tsx` (edit), `components/screens/AzkarListScreen.tsx` (edit)  
**Description:**
The `onHide` callback is called inside a `useEffect` with a 800ms delay. If `onHide` is not memoized with `useCallback`, it changes identity on every parent render, causing the effect to re-run and potentially creating an infinite loop or unexpected card disappearance.

**Fix:**
1. In `AzkarListScreen.tsx`, ensure the `onHide` callback passed to `ZikrCard` is wrapped in `useCallback` with stable dependencies
2. In `ZikrCard.tsx`, add `onHide` to the `useEffect` dependency array (it's already there, but verify the parent memoizes it)
3. Consider using a ref for the `onHide` callback to avoid re-running the effect:
   ```typescript
   const onHideRef = useRef(onHide);
   onHideRef.current = onHide;
   // In effect: onHideRef.current(zikr.id)
   ```

**Acceptance Criteria:**
- Completing a zikr hides it exactly once
- No infinite re-render loops
- Rapid completion of multiple zikr works correctly

---

### Task 1.4 — Fix CompletionScreen Double-Count on Remount
**Files:** `components/screens/CompletionScreen.tsx` (edit)  
**Description:**
The `statsUpdatedRef` guard prevents double-invocation in StrictMode, but if the component unmounts and remounts (e.g., user navigates back and forth), the ref resets and stats are counted again.

**Fix:**
1. Move the 'has stats been updated' flag to a module-level `Set<string>` keyed by `categoryId + sessionReads` so it persists across remounts
2. Or: lift the streak/totalReads update to the parent (`AzkarListScreen`) and pass the result down as props
3. Add `incrementStreak` and `incrementTotalReads` to the `useEffect` dependency array (or use refs)

**Acceptance Criteria:**
- Navigating to CompletionScreen and back, then forward again, does not double-count
- Streak increments exactly once per session

---

### Task 1.5 — Fix `handleBackButton` Exiting App
**Files:** `App.tsx` (edit)  
**Description:**
On mobile (Capacitor), `window.history.back()` at the root can exit the app entirely. There's no check for `history.length > 1`.

**Fix:**
```typescript
const handleBackButton = useCallback(() => {
    if (screen !== 'home') {
        navigate('home');
    } else if (window.history.length > 1) {
        window.history.back();
    }
    // If at root with no history, do nothing (stay in app)
}, [screen, navigate]);
```

**Acceptance Criteria:**
- On mobile, pressing back at the home screen does not exit the app
- Back button navigates to home from any screen

---

### Task 1.6 — Fix AudioService Object URL Memory Leak
**Files:** `services/AudioService.ts` (edit)  
**Description:**
If `URL.createObjectURL` is used for blob URLs, these are never revoked, causing memory leaks.

**Fix:**
1. Track all created object URLs in a `Set<string>`
2. In `stop()` and `pause()`, revoke the current object URL
3. Add a `dispose()` method that revokes all URLs
4. Call `dispose()` in a cleanup effect where `AudioService` is used

**Acceptance Criteria:**
- No `URL.createObjectURL` without matching `URL.revokeObjectURL`
- Memory usage does not grow during extended audio playback

---

### Task 1.7 — Fix WebStorage Mutation Queue Data Loss
**Files:** `data/storage/web.ts` (edit)  
**Description:**
The mutation queue batches writes, but if the app is closed before the queue flushes, pending mutations are lost.

**Fix:**
1. Add a `visibilitychange` listener that flushes the queue when the page becomes hidden
2. Add a `beforeunload` listener that flushes the queue
3. Expose a `flush()` method on `WebStorage` that returns the `mutationQueue` promise
4. Call `flush()` in `App.tsx` on `beforeunload`

**Acceptance Criteria:**
- Rapid app close does not lose pending writes
- `flush()` returns a promise that resolves when all writes complete

---

## Phase 2: Code Quality & Architecture (P1)

**Goal:** Improve maintainability, reduce technical debt.

### Task 2.1 — Extract State from App.tsx into Custom Hooks
**Files:** `App.tsx` (edit), `hooks/usePreferences.ts` (new), `hooks/useStats.ts` (new), `hooks/useProgress.ts` (new), `hooks/useFavorites.ts` (new), `hooks/useNavigation.ts` (new)  
**Description:**
`App.tsx` is 897 lines and contains all state management. Extract into custom hooks:
- `usePreferences()` — theme, dark style, font size, language
- `useStats()` — streak, total reads, last active date
- `useProgress()` — per-zikr progress counts
- `useFavorites()` — favorite zikr IDs
- `useNavigation()` — current screen, navigate function

**Acceptance Criteria:**
- `App.tsx` is reduced to < 400 lines
- Each hook is independently testable
- No behavior change

---

### Task 2.2 — Add `React.memo` to Expensive Components
**Files:** `components/azkar/ZikrCard.tsx`, `components/home/PrayerTimesWidget.tsx`, `components/home/HomeWidgets.tsx`, `components/screens/AzkarListScreen.tsx`  
**Description:**
Wrap components that re-render frequently in `React.memo` with custom comparison functions where needed.

**Acceptance Criteria:**
- `ZikrCard` only re-renders when its specific props change
- `PrayerTimesWidget` only re-renders when prayer times or countdown changes
- No visual regressions

---

### Task 2.3 — Add Input Validation for Custom Zikr
**Files:** `components/screens/AddZikrScreen.tsx` (edit), `data/azkarRepository.ts` (edit)  
**Description:**
When users add custom azkar, validate:
- Arabic text: required, max 2000 chars, must contain at least one Arabic character
- Count: required, integer between 1 and 999
- Category: must be selected
- Translation: optional, max 5000 chars

**Acceptance Criteria:**
- Submitting invalid data shows inline error messages
- No invalid data reaches storage
- Error messages are in Arabic

---

### Task 2.4 — Add Pagination/Virtualization to Long Lists
**Files:** `components/screens/AzkarListScreen.tsx` (edit), `components/screens/SurahReaderScreen.tsx` (edit)  
**Description:**
For categories with many azkar or long surahs, render only visible items using `react-window` or a simple 'load more' pattern.

**Acceptance Criteria:**
- Lists with 100+ items scroll smoothly
- Memory usage is bounded
- No visual regressions

---

### Task 2.5 — Fix Memory Leaks in Event Listeners
**Files:** `components/common/OfflineIndicator.tsx`, `services/AudioService.ts`, `services/NotificationService.ts`  
**Description:**
Audit all `addEventListener` / `addListener` calls and ensure cleanup in `useEffect` return or `dispose()`.

**Acceptance Criteria:**
- No listener leaks after component unmount
- All `useEffect` hooks with listeners have cleanup functions

---

### Task 2.6 — Add Loading State for Initial Data Load
**Files:** `App.tsx` (edit), `components/common/LoadingScreen.tsx` (new)  
**Description:**
Show a loading screen while `WebStorage` or `MobileStorage` initializes.

**Acceptance Criteria:**
- User sees a branded loading screen during init
- Loading screen disappears when data is ready
- No flash of unstyled content

---

### Task 2.7 — Standardize Error Handling
**Files:** All service files, `utils/logger.ts` (new)  
**Description:**
Create a `Logger` service with `info`, `warn`, `error` methods. Replace `console.error` with `Logger.error`. In production, `Logger.error` could send to a telemetry service.

**Acceptance Criteria:**
- All services use `Logger` instead of `console.error`
- `Logger` respects log levels
- No `console.error` in production code (except in `Logger` itself)

---

## Phase 3: Testing (P2)

**Goal:** Achieve > 70% coverage on critical paths.

### Task 3.1 — Add Tests for SearchScreen
**Files:** `tests/unit/search-screen.test.tsx` (new)  
**Description:**
Test the Quran search flow:
- Worker receives search messages
- Results are rendered with highlights
- Worker errors are handled
- Null ayah results are skipped

**Acceptance Criteria:**
- All test cases pass
- Tests mock the Worker API

---

### Task 3.2 — Add Tests for ZikrCard
**Files:** `tests/unit/zikr-card.test.tsx` (new)  
**Description:**
Test the zikr card interaction:
- Tap increments counter
- Completion triggers `onHide`
- Favorite toggle works
- Play/stop audio works

**Acceptance Criteria:**
- All test cases pass
- Tests use `@testing-library/react`

---

### Task 3.3 — Add Tests for CompletionScreen
**Files:** `tests/unit/completion-screen.test.tsx` (new)  
**Description:**
Test the completion flow:
- Streak increments exactly once
- Total reads updates correctly
- Reset banner shows when appropriate

**Acceptance Criteria:**
- All test cases pass
- Tests verify no double-counting

---

### Task 3.4 — Add Tests for AudioService
**Files:** `tests/unit/audio-service.test.ts` (new)  
**Description:**
Test audio playback:
- Play starts audio
- Pause pauses audio
- Stop stops and cleans up
- Object URLs are revoked

**Acceptance Criteria:**
- All test cases pass
- Tests mock `AudioContext` and `fetch`

---

### Task 3.5 — Add Tests for WebStorage
**Files:** `tests/unit/web-storage.test.ts` (new)  
**Description:**
Test storage operations:
- Initialize loads defaults
- Mutations are serialized
- Backup/restore works
- Corrupted data falls back gracefully

**Acceptance Criteria:**
- All test cases pass
- Tests use `fake-indexeddb` or mock `localStorage`

---

### Task 3.6 — Add Integration Tests
**Files:** `tests/integration/` (new directory)  
**Description:**
Add integration tests for critical user flows:
- Complete a zikr session -> see completion screen -> streak updates
- Search for a zikr -> navigate to it -> play audio
- Add custom zikr -> appears in list -> edit -> delete

**Acceptance Criteria:**
- All integration tests pass
- Tests run in < 30 seconds

---

## Phase 4: Security & Performance (P2)

**Goal:** Harden the app and improve performance.

### Task 4.1 — Remove API Key from Committed File
**Files:** `.env.local` (edit), `.gitignore` (edit)  
**Description:**
- Remove `GEMINI_API_KEY` from `.env.local`
- Add `.env.local` to `.gitignore`
- Create `.env.example` with `GEMINI_API_KEY=your_key_here`
- Update documentation

**Acceptance Criteria:**
- `.env.local` is in `.gitignore`
- `.env.example` exists with placeholder
- No real keys in git history

---

### Task 4.2 — Add Service Worker Update Strategy
**Files:** `public/sw.js` (edit)  
**Description:**
- Add version-based cache invalidation
- Show a 'new version available' toast
- Auto-update on next page load

**Acceptance Criteria:**
- Users are notified of updates
- Old caches are cleaned up
- No stale assets served

---

### Task 4.3 — Add Request Deduplication
**Files:** `services/PrayerTimesService.ts`, `services/QuranService.ts`  
**Description:**
If multiple components request the same data simultaneously, deduplicate the requests.

**Acceptance Criteria:**
- Concurrent requests for the same data result in one API call
- All callers receive the same response

---

### Task 4.4 — Add Cache Invalidation to audioCache
**Files:** `services/audioCache.ts` (edit)  
**Description:**
- Add TTL to cached audio entries
- Periodically clean expired entries
- Expose a `clearExpired()` method

**Acceptance Criteria:**
- Expired cache entries are removed
- `clearExpired()` is called on app start

---

## Phase 5: UX & Accessibility (P3)

**Goal:** Polish the user experience.

### Task 5.1 — Add Onboarding Flow
**Files:** `components/onboarding/WelcomeScreen.tsx`, `components/onboarding/NotificationsScreen.tsx`, `components/onboarding/PersonalizationScreen.tsx`  
**Description:**
- Welcome screen with app introduction
- Notification permission request
- Personalization (theme, font size)
- Skip option for returning users

**Acceptance Criteria:**
- New users see onboarding on first launch
- Onboarding can be skipped
- Preferences are saved after onboarding

---

### Task 5.2 — Add Dark Mode Toggle to UI
**Files:** `components/screens/SettingsScreen.tsx` (edit)  
**Description:**
- Add a visible dark mode toggle in settings
- Toggle switches between light/dark/system
- Preference is persisted

**Acceptance Criteria:**
- Dark mode toggle is visible in settings
- Toggle works immediately
- Preference persists across sessions

---

### Task 5.3 — Add Tablet/Desktop Responsive Layout
**Files:** `components/layout/MainLayout.tsx` (edit), `index.css` (edit)  
**Description:**
- Add responsive breakpoints for tablet (768px+) and desktop (1024px+)
- Use a sidebar navigation on larger screens
- Center content with max-width on desktop

**Acceptance Criteria:**
- App looks good on tablet and desktop
- Navigation adapts to screen size
- No horizontal scrolling on any device

---

### Task 5.4 — Accessibility Audit & Fixes
**Files:** All components  
**Description:**
- Add `aria-label` to all icon-only buttons
- Ensure color contrast meets WCAG AA
- Add `role` attributes where needed
- Test keyboard navigation

**Acceptance Criteria:**
- All buttons have accessible names
- Color contrast ratio >= 4.5:1 for text
- Keyboard navigation works throughout

---

### Task 5.5 — Add Biometric Lock (Optional)
**Files:** `services/BiometricService.ts` (new), `components/screens/LockScreen.tsx` (new)  
**Description:**
- Use Capacitor biometric auth plugin
- Lock app on launch if enabled
- Fallback to device passcode

**Acceptance Criteria:**
- Biometric lock can be enabled in settings
- App prompts for biometric on launch
- Fallback to passcode works

---

## Phase 6: Monitoring & Analytics (P3)

**Goal:** Detect issues in production.

### Task 6.1 — Add Crash Reporting
**Files:** `services/CrashReportingService.ts` (new)  
**Description:**
- Integrate Sentry or a simple custom crash reporter
- Catch unhandled promise rejections
- Catch uncaught errors
- Send to a logging endpoint

**Acceptance Criteria:**
- Unhandled errors are reported
- Reports include stack traces and user context
- No PII in reports

---

### Task 6.2 — Add Basic Analytics
**Files:** `services/AnalyticsService.ts` (new)  
**Description:**
- Track screen views
- Track feature usage (search, audio, favorites)
- Track errors
- Respect user privacy (opt-in)

**Acceptance Criteria:**
- Analytics events are fired for key user actions
- No PII in analytics
- Analytics can be disabled in settings

---

## Dependency Graph

```
Phase 0 (Foundation)
  |-- 0.1 ESLint
  |-- 0.2 CI
  +-- 0.3 Root Error Boundary
       |
       v
Phase 1 (Critical Bugs) ----- All independent, can run in parallel
  |-- 1.1 Quran Search
  |-- 1.2 loadSurah Null Check
  |-- 1.3 onHide Stability
  |-- 1.4 CompletionScreen Double-Count
  |-- 1.5 Back Button Exit
  |-- 1.6 AudioService Leak
  +-- 1.7 WebStorage Data Loss
       |
       v
Phase 2 (Code Quality)
  |-- 2.1 Extract State ------- Depends on 1.3, 1.4
  |-- 2.2 React.memo ---------- Independent
  |-- 2.3 Input Validation ---- Independent
  |-- 2.4 Pagination ---------- Independent
  |-- 2.5 Memory Leaks -------- Depends on 1.6
  |-- 2.6 Loading State ------- Independent
  +-- 2.7 Error Handling ------ Independent
       |
       v
Phase 3 (Testing) ------------ Depends on Phase 1 and 2
  |-- 3.1-3.6 All tests
       |
       v
Phase 4 (Security) ----------- Independent
  |-- 4.1-4.4 All independent
       |
       v
Phase 5 (UX) ----------------- Independent
  |-- 5.1-5.5 All independent
       |
       v
Phase 6 (Monitoring) ---------- Independent
  |-- 6.1-6.2 All independent
```

---

## Sub-Agent Assignment Strategy

### Parallel Wave 1 (after Phase 0):
- **Agent A:** Task 1.1 + 1.2 (Search fixes)
- **Agent B:** Task 1.3 + 1.4 (ZikrCard + CompletionScreen)
- **Agent C:** Task 1.5 + 1.6 + 1.7 (App.tsx + AudioService + WebStorage)

### Parallel Wave 2 (after Wave 1):
- **Agent A:** Task 2.1 (Extract state)
- **Agent B:** Task 2.2 + 2.5 (React.memo + memory leaks)
- **Agent C:** Task 2.3 + 2.4 (Validation + pagination)

### Parallel Wave 3 (after Wave 2):
- **Agent A:** Task 3.1 + 3.2 (Search + ZikrCard tests)
- **Agent B:** Task 3.3 + 3.4 (CompletionScreen + AudioService tests)
- **Agent C:** Task 3.5 + 3.6 (WebStorage + integration tests)

### Parallel Wave 4 (independent, can start anytime):
- **Agent A:** Task 4.1 + 4.2 (Security + SW)
- **Agent B:** Task 4.3 + 4.4 (Dedup + cache)
- **Agent C:** Task 5.1 + 5.2 (Onboarding + dark mode)

### Parallel Wave 5 (independent):
- **Agent A:** Task 5.3 + 5.4 (Responsive + a11y)
- **Agent B:** Task 6.1 + 6.2 (Crash reporting + analytics)

---

## Definition of Done

For each task:
- [ ] Code changes are made
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm test` passes (all tests, not just new ones)
- [ ] No new TypeScript errors
- [ ] No new ESLint warnings
- [ ] Changes are committed with a descriptive message
- [ ] PR is created with a clear description

---

## Notes for Sub-Agents

1. **Always run `npm run lint` before committing** -- the ESLint config is strict
2. **Always run `npm test` before committing** -- do not break existing tests
3. **Match the existing code style** -- 2-space indent, single quotes, semicolons
4. **Use Arabic for user-facing strings** -- wrap in `t()` for i18n
5. **Comment in English** -- code comments should be in English
6. **Test on mobile viewport** -- the app is mobile-first
7. **Verify RTL works** -- all layouts must work in right-to-left
