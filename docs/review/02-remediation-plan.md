# Remediation Plan — Azkar App

**Status:** PLANNED — nothing below has been executed. Work starts only on your explicit go-ahead, one phase at a time.
**Ordering principle:** protect users' persisted data first → stop visible breakage → restore shipped features → platform compliance → quality systems. Later phases depend on earlier ones (noted where true).
**Evidence references:** finding IDs (H1–H11) map to [01-full-report.md](./01-full-report.md); file:line detail lives in Appendices A/B/C.

## Ground rules for every phase
1. Branch per phase off the Phase 0 baseline; small reviewable commits.
2. After every phase: clean `npx tsc --noEmit` + manual regression checklist (below) + no new `npm install` without justification.
3. Never edit datasets and storage schema in the same commit as unrelated refactors.
4. Any step that touches upgrade-path behavior gets a before/after upgrade test on a real device.

### Standing regression checklist (run each phase)
- Fresh install → onboarding → read azkar, count taps ×10 fast, favorite, close/reopen → favorites + counts survive restart.
- Settings → Export backup → wipe app data → Import backup → data identical.
- Morning/evening reminder fires at set time; disabling it cancels pending notification.
- Audio: play zikr, leave screen mid-playback (Azkar Day + Azkar List) → audio stops.
- Dark mode + each theme renders correctly; RTL layout intact.

---

## Phase 0 — Safety net & baseline
**Objective:** make every later change reversible. Currently there is **no git history at all**.
**Tasks**
- Initialize git; verify `.gitignore` covers `node_modules/`, `dist/`, `*.local` (already does); initial commit tagged `pre-fix-baseline`.
- Record tool versions (Node 24.x) and a copy of the current dist chunk-hash list for later comparison.
**Exit criteria:** clean status; tag exists; working tree reproducible from commit.
**Risks:** none. **Effort:** S. **Blocks:** everything.

---

## Phase 1 — Data layer critical fixes (H2, H3, H4, H5 + related MEDIUMs)
**Objective:** persisted data becomes trustworthy across upgrades; destructive operations become safe.
**Key tasks (in order)**
1. **Stable content IDs (H2)** — replace the import-order counter (`data/static/azkar.ts:16-23`) with deterministic IDs minted once in source (explicit literals, or FNV-1a hash of categoryId+arabicText). Ship a one-time migration mapping legacy numeric ids → new ids by matching arabic text (favorites, progress keys, hiddenStaticIds, originalStaticId). Document any unavoidable resets.
2. **Transactional, validated import (H3)** — wrap mobile importData (`mobile.ts:299-320`) in a transaction; validate every row's shape BEFORE deleting anything; align web import semantics (`web.ts:196-218`) so one backup restores identically on both platforms; return structured errors, never half-applied state.
3. **Self-initializing adapter (H4)** — storage methods await a shared initialize promise (`storage/index.ts`); failed init raises a user-visible error state instead of silent no-op guards (`mobile.ts:90-103`).
4. **Schema migrations (H5)** — adopt PRAGMA user_version + ALTER-table migration runner (`mobile.ts:53-67`); migration #1 adds original_static_id when missing.
5. **Read robustness** — try/catch around all five unguarded JSON.parse calls in web.ts and kv reads (`mobile.ts:92-96`), falling back to defaults; serialize read-modify-write helpers (`web.ts:105-139`) via a simple promise queue.
6. **Search correctness** — normalize Arabic (strip tashkeel, unify alef/hamza/taa marbuta) on corpus and query in repository search.
7. **ID generation** — replace bare Date.now() ids (`repository.ts:29-35,60-67`, `AddZikrScreen.tsx:42`) with monotonic composite ids; INSERT OR IGNORE semantics consistently.
8. **Count-word heuristic** — reorder checks longest-first in `data/utils.ts:34-40` (ثلاثين→30, ثلاث عشرة→13 beat ثلاث→3); delete unreachable branches.
9. **Backup privacy** — exclude apiKey from exportData by default (`web.ts:180-193`, `mobile.ts:271-285`); optional explicit include-key toggle.
**Exit criteria:** corrupt-row restore keeps old data; upgraded-install add-zikr works; two consecutive loads produce identical id sets; search finds a bare query inside vocalized text; export contains no apiKey; standing checklist green.
**Risks:** ID migration is the riskiest change in this plan — do it first on a branch with a device upgrade test from the currently-shipped APK.
**Effort:** L.

---

## Phase 2 — Runtime correctness & lifecycle
**Objective:** stop silent misbehavior users can feel: dropped counts, crashes, runaway audio/sensors, wrong AI text.
**Quick wins first**
- Restore the missing purple/cyan theme blocks into the live stylesheet (root index.css — they exist only in unimported src/index.css) and fix invalid rgba(var(--space-separated), a) scrollbar colors.
- Align default voiceName ('Charon' vs 'Kore') between defaults.ts:17 and App.tsx:99,146.
**Core tasks**
1. **Counter API (H6)** — add incrementProgress(zikrId, by=1) using functional setState; migrate the five call sites (ZikrCard:75, FocusModeView:75, TasbeehScreen:48-51, AzkarListScreen:205-208, HomeWidgets:278-287); export the Tasbeeh magic id 99999 as a named constant outside zikr id space.
2. **Bounds clamp (H9)** — effect clamps/resets currentIndex when azkar.length shrinks (FocusModeView).
3. **Audio lifecycle (H7)** — unconditional audioService.stop() on unmount (or isPlayingRef pattern) in AzkarDayScreen; audit the AzkarList sequence path for the same closure shape.
4. **Compass (H8)** — named handler removed on EVERY exit path incl. granted-iOS branch; register exactly one orientation event source; alignment uses min(d, 360−d); heading===0 handled via null check.
5. **AI race (H10)** — request-id guard or AbortController in ExplainZikrModal; fetch timeout; replace error-string matching with typed sentinels.
6. **Async hygiene batch** — OfflineIndicator handle-race; HomeWidgets timer cleanup + loading fallbacks; SearchScreen stale-flag + try/catch; NotificationSettings try/catch around toggles; Settings restore catch + FileReader.onerror + explicit confirm; CompletionScreen idempotent stat increment (session key).
7. **TimePicker state model** — single normalized minutes-since-midnight state; derive display; honor AM/PM selection.
8. **Streak dates** — local-date string helper instead of toISOString() (App.tsx:335).
9. **Onboarding truthfulness** — record the notification Yes/No answer; Skip marks onboarding complete; persist reminders=true only when permission actually granted.
10. **Prayer reminder freshness** — reschedule prayer notifications on Capacitor App resume events so they don't silently expire after ~48 h.
**Exit criteria:** 20-fast-tap test yields exactly +20; leaving screens stops audio; compass releases sensor; reopening explain modal on a second zikr never shows the first zikr's text; standing checklist green.
**Risks:** low individually; keep each fix an isolated commit.
**Effort:** M–L.

---

## Phase 3 — Dead controls & feature stubs (H11)
**Objective:** every visible control does what it claims.
**Tasks**
- Wire FocusLayout Share/Copy/Play (:66-77) and StreamLayout Share/Copy (:53-54) to existing services (share-editor flow, Clipboard API, audio service).
- Wire AzkarDayScreen Share button (:183-185) to the same share pipeline.
- Tasbeeh sound toggle: implement tick sound or remove the toggle until real.
- Fix HomeWidgets center AsmaulHusna affordance (icon matches action, :252-254).
**Exit criteria:** manual tap-through of home layouts + azkar day + tasbeeh shows zero inert controls.
**Depends on:** Phase 2 (counter API) for play wiring. **Effort:** S–M.

---

## Phase 4 — Production packaging, PWA & Android resources (H1)
**Objective:** what ships equals what works in dev.
**Tasks**
1. Introduce Vite public/; move manifest.json, sw.js, optimized images into it; regenerate real 192/512 icons (currently one 825 KB PNG declared twice); compress background_light.png (5.2 MB target WebP ≤ ~300 KB) and the dark variant.
2. Rewrite sw.js: drop cdn.tailwindcss.com + wrong Inter fonts entry; network-first navigations with cache fallback + versioned cache name; keep cache-first only for hashed assets.
3. Verify build output: dist contains sw.js, valid manifest with resolving icons, backgrounds; Lighthouse PWA pass; offline reload works.
4. Android: add the configured notification smallIcon drawable (or point config at an existing icon); add res/raw/adhan.wav or remove the sound attribute; exact-alarm strategy decision (drop USE_EXACT_ALARM, keep SCHEDULE_EXACT_ALARM + runtime rationale) for Play policy; consider minifyEnabled true; allowBackup decision.
5. Cap-sync Android; diff android/app/src/main/assets/public/; device smoke test.
**Exit criteria:** installed APK/PWA shows themed backgrounds, correct notification icon/sound, passes offline airplane-mode relaunch; permission surface Play-compliant.
**Depends on:** Phases 1–3 recommended (ship fixed behavior, not broken behavior). **Effort:** M.

---

## Phase 5 — Security & dependency hygiene
**Tasks**
- Run npm audit fix (non-breaking set); separately evaluate the @capacitor/cli pin bump for the uuid chain.
- Delete dead process.env.API_KEY fallbacks (AudioService.ts:117, ExplainZikrModal.tsx:35) — BYOK stays the only path; switch hint-branching to typed sentinels.
- Confirm .env.local stays placeholder-only or document its intended use.
**Exit criteria:** npm audit high-count zero or documented-accepted; no env-based secret path exists in client code. **Effort:** S.

---

## Phase 6 — i18n (⚠ needs your decision before starting)
The app is Arabic-only at the type level while advertising English (types.ts:77, web.ts:31, ~26 files with hardcoded strings per Appendices A/B).
- **Option A — Commit to Arabic-only:** strip EN translations, remove language-switcher remnants, fold hardcoded strings into the ar dictionary for consistency. Cheap, honest.
- **Option B — True bilingual:** widen AppLanguage, wire dir switching, translate ~26 files, localize scheduled-notification bodies, add pseudo-locale testing. Expensive.
**Recommendation:** Option A now; B as a future product initiative.
**Exit criteria:** no mixed-language screens (DashboardLayout etc.), no unreachable translation tables. **Effort:** S (A) / L (B).

---

## Phase 7 — Accessibility pass
**Tasks:** accessible-names inventory (icon buttons, sr-only switches, FABs); convert interactive divs to buttons or role=button+keyboard handlers (counter cards, widget tiles, voice rows); dialog roles + focus trap + Escape (EditZikrModal, ExplainZikrModal, TimePicker); aria-live offline banner; restore pinch-zoom (index.html viewport); RTL-aware alignment utilities (WelcomeScreen).
**Exit criteria:** screen-reader walkthrough of the core loop (browse → read → count → favorite → settings) completes without unnamed controls. **Effort:** M.

---

## Phase 8 — Performance
**Tasks:** split App context (stable actions object via useCallback/useMemo so counter taps don't re-render the whole tree); throttle/value-gate the AudioController RAF loop (~4 Hz); memoized repository snapshot + incremental search over the normalized index (builds on Phase 1 normalization); module-level Intl formatter caches (HijriCalendarScreen); narrow Tailwind content globs away from node_modules; lazy-decode large imagery.
**Exit criteria:** tap-counter interaction measurably stops re-rendering nav/screens (React Profiler); Hijri month render within typical frame budget. **Effort:** M.

---

## Phase 9 — Hygiene, tests & CI
**Tasks:** delete verified-dead files (after merging src/index.css themes in Phase 2 quick-wins: src/index.css, data/azkarData.ts, data/local/storage.ts, utils/localStorage.ts; archive raw data/); dedupe CustomIcons SVG gradient ids; adopt Vitest + Testing Library with first tests: storage adapters (corrupt row, restore rollback), counter increments under simulated burst, TimePicker parsing/formatting, search normalization; ESLint flat config with react-hooks/exhaustive-deps, jsx-a11y, and a guard against reintroducing deprecated utils; npm scripts lint/typecheck/test + simple CI on push.
**Exit criteria:** CI green on typecheck+lint+test; deleted-file greps stay empty. **Effort:** M.

---

## Dependency graph & sequencing summary

| Phase | Depends on | Can run in parallel with |
|---|---|---|
| 0 baseline | — | — |
| 1 data critical | 0 | nothing (do first) |
| 2 runtime correctness | 0 (1 helpful) | — |
| 3 dead controls | 2 | 4 |
| 4 packaging/PWA | 0 | 2, 3 |
| 5 security/deps | 0 | any |
| 6 i18n | your decision gate | 7, 8 |
| 7 accessibility | 2 (dialog overlap) | 6, 8 |
| 8 performance | 1 (normalized index) | 6, 7 |
| 9 hygiene/tests | all (locks in gains) | — |

**Recommended order:** 0 → 1 → 2 → 3 → 4 → 5 → 9 (tests earlier if preferred) → 6 (decision gate) → 7 → 8.

---

*Saved reports: [README](./README.md) · [01-full-report](./01-full-report.md) · [Appendix A](./appendix-a-screens.md) · [Appendix B](./appendix-b-shared-components.md) · [Appendix C](./appendix-c-data-layer.md)*
