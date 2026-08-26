# Remediation Execution Log

Live record of the phased plan in [02-remediation-plan.md](./02-remediation-plan.md).

| Commit | Phase | Summary | Validation |
|---|---|---|---|
| `0b31720` | 0 | Baseline snapshot incl. review docs, tagged `pre-fix-baseline` | clean tree |
| `ccc4c54` | 1 | Data-layer integrity: stable deterministic IDs (FNV-1a of category+normalized text), legacy-id boot migration, self-initializing SQLite adapter + visible failure event, PRAGMA migrations, transactional validated restore on both platforms (semantics aligned), guarded JSON parsing, serialized web mutations, diacritic-insensitive Arabic search, collision-safe entity ids, corrected count-word ladder, apiKey redacted from backups | `tsc` exit 0 · behavioral smoke suite ALL PASS (44 categories, 813 unique stable ids, exact legacy map 1..813, parser ladder cases) |
| `f3c8b21` | 5 | Dead env API-key fallback removed (BYOK only); `npm audit fix`: 13 → 5 vulns; remainder requires breaking Vite 8 / capacitor-cli bumps — accepted as build-time-only risk | audit report |
| `73c2114` | 2 | Atomic incrementProgress API + 5 lost-update sites fixed; FocusModeView clamp+guard; AzkarDay TTS stop-on-unmount ref; ExplainZikrModal stale-request guard + sentinels + 30s timeout; async hygiene batch (OfflineIndicator race, HomeWidgets timers/errors, Search stale+catch, NotificationSettings revert-on-fail, Settings restore catch/onerror, CompletionScreen StrictMode guard); TimePicker minutes-of-day normalization; local-date streak keys; prayer reminders rescheduled on app resume; onboarding truthfulness (choice persisted, Skip completes, denied permission honored); purple/cyan themes merged into live stylesheet + valid scrollbar syntax + voiceName defaults aligned | `tsc` exit 0 · 11/11 targeted checks |
| `76c5107` | 4 | PWA packaging fixed (public/: sw v3 network-first, manifest w/ real icons); backgrounds PNG→WebP 5.2MB→24KB/56KB; broken adhan.wav refs removed; USE_EXACT_ALARM dropped for Play policy; per-density notification icons generated; production build verified; cap sync verified | build exit 0 · dist contains sw/manifest/images · android assets verified |

## Decisions recorded
- **Phase 6 i18n (owner):** Arabic-only consolidation. EN translation table removed; mixed-language leftovers converted to Arabic literals. Purely-Arabic hardcoded strings are canonical by design.
- **Remaining 5 audit findings:** dev-toolchain only (esbuild dev-server advisory via vite ≤6 chain; uuid via @capacitor/cli pin). Fixing requires breaking major bumps (Vite 8 / cli pin) — deferred deliberately.
- **Residual known issue:** per-card *session* counts still use absolute writes (global persisted counts are now atomic). Cosmetic under rapid taps; revisit with Phase 8 state refactor.
- **Chunk warning:** index chunk >500 kB minified (170 kB gzip) — code-splitting candidate noted for Phase 8.

## Pending
- Phases 3 + 6A + 7 combined pass (in flight)
- Phase 8 performance (context split/memoization, RAF throttle, Intl cache, manualChunks)
- Phase 9 hygiene/tests/CI (Vitest scaffolding, ESLint flat config, dead-file deletion, final rebuild)
