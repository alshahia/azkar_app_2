# Remediation Execution Log

Live record of the phased plan in [02-remediation-plan.md](./02-remediation-plan.md).

| Commit | Phase | Summary | Validation |
|---|---|---|---|
| `0b31720` | 0 | Baseline snapshot incl. review docs, tagged `pre-fix-baseline` | clean tree |
| `ccc4c54` | 1 | Data-layer integrity: stable deterministic IDs (FNV-1a of category+normalized text), legacy-id boot migration, self-initializing SQLite adapter + visible failure event, PRAGMA migrations, transactional validated restore on both platforms (semantics aligned), guarded JSON parsing, serialized web mutations, diacritic-insensitive Arabic search, collision-safe entity ids, corrected count-word ladder, apiKey redacted from backups | `tsc` exit 0 · behavioral smoke suite ALL PASS (44 categories, 813 unique stable ids, exact legacy map 1..813, parser ladder cases) |
| `f3c8b21` | 5 | Dead env API-key fallback removed (BYOK only); `npm audit fix`: 13 → 5 vulns; remainder requires breaking Vite 8 / capacitor-cli bumps — accepted as build-time-only risk | audit report |
| `73c2114` | 2 | Atomic incrementProgress API + 5 lost-update sites fixed; FocusModeView clamp+guard; AzkarDay TTS stop-on-unmount ref; ExplainZikrModal stale-request guard + sentinels + 30s timeout; async hygiene batch (OfflineIndicator race, HomeWidgets timers/errors, Search stale+catch, NotificationSettings revert-on-fail, Settings restore catch/onerror, CompletionScreen StrictMode guard); TimePicker minutes-of-day normalization; local-date streak keys; prayer reminders rescheduled on app resume; onboarding truthfulness (choice persisted, Skip completes, denied permission honored); purple/cyan themes merged into live stylesheet + valid scrollbar syntax + voiceName defaults aligned | `tsc` exit 0 · 11/11 targeted checks |
| `76c5107` | 4 | PWA packaging fixed (public/: sw v3 network-first, manifest w/ real icons); backgrounds PNG→WebP 5.2MB→24KB/56KB; broken adhan.wav refs removed; USE_EXACT_ALARM dropped for Play policy; per-density notification icons generated; production build verified; cap sync verified | build exit 0 · dist contains sw/manifest/images · android assets verified |
| `f3ba4cc` | 3+6A+7 | Dead controls wired (Share/Copy/Play in Focus+Stream layouts, AzkarDay share, Tasbeeh WebAudio tick, AsmaulHusna affordance); Arabic-only consolidation (EN table deleted, mixed-language strings Arabized); a11y minimums (lang/dir, zoom restored, switch + icon-button labels, dialog roles + Escape, aria-live/current) | `tsc` exit 0 |
| `9968053` | 8 | RAF progress loop throttled ~60fps→~4Hz state writes; Intl formatters module-cached; Tailwind globs narrowed off node_modules; final rebuild + sync | `tsc` exit 0 · build exit 0 |
| (this commit) | 9 | Dead files removed (src/index.css, data/azkarData.ts, data/local/storage.ts, utils/localStorage.ts — zero importers verified); Vitest+Testing Library scaffolding w/ 9 unit tests (parsers, normalization, ID determinism, backup validation, component smoke); ESLint flat config (ts-eslint + react-hooks incl. exhaustive-deps + jsx-a11y); lint auto-fix applied; **test suite caught & fixed real bug**: hundred-rule word-bounding (رقميه false positive) | `tsc` 0 · tests 9/9 · lint baseline recorded |

## Decisions recorded
- **Phase 6 i18n (owner):** Arabic-only consolidation. EN translation table removed; mixed-language leftovers converted to Arabic literals. Purely-Arabic hardcoded strings are canonical by design.
- **Remaining 5 audit findings:** dev-toolchain only (esbuild dev-server advisory via vite ≤6 chain; uuid via @capacitor/cli pin). Fixing requires breaking major bumps (Vite 8 / cli pin) — deferred deliberately.
- **Residual known issue:** per-card *session* counts still use absolute writes (global persisted counts are now atomic). Cosmetic under rapid taps; revisit with Phase 8 state refactor.
- **Chunk warning:** index chunk >500 kB minified (170 kB gzip) — code-splitting candidate noted for Phase 8.

## Pending / known limitations
- **Lint debt register:** baseline 89 errors / 50 warnings — dominated by React-compiler-class hook rules (`set-state-in-effect` ×24, `static-components` ×17), `no-unused-vars` ×36 and residual `jsx-a11y` interaction rules on legacy div-based surfaces. Fixing is an architectural refactor deliberately out of scope for this pass.
- App context value not yet memoized/split (Phase-8 stretch item; requires coordinated refactor of ~20 consumers).
- Session-level (per-card) counters still use absolute writes; global persisted counts are atomic.
- CustomIcons SVG ids unique across icon types but duplicate when one icon type renders multiply (`useId` refactor candidate).
- Remaining 5 audit findings require breaking major bumps (Vite 8 / capacitor-cli pin) — build-time-only risk accepted.
- index chunk >500 kB minified (170 kB gzip) — code-splitting candidate.
