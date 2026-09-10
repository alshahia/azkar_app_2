# Testing strategy

Inspired by quran_android's `TESTING_STRATEGY.md` (the best single artifact
in the researched ecosystem - see `_research/projects/quran-android.md`
§10), adapted to our vitest + React Testing Library stack.

## Commands

| Check | Command | Enforced in CI |
|---|---|---|
| Unit / component tests | `npm run test` | yes (`.github/workflows/ci.yml`) |
| Lint ratchet — changed files only | `npm run lint:changed [base]` | yes (blocking) |
| Lint full repo | `npm run lint` | advisory (`continue-on-error`) — ~160 pre-existing findings tracked for repair |
| Typecheck + production build | `npm run build` (`tsc && vite build`) | yes |

CI runs the ratchet lint, tests and the build on every PR and on pushes to
`main`, with concurrency-cancel so superseded PR runs stop early. The
ratchet (`scripts/lint-changed.mjs`) lints only files changed vs the base
branch: it is green today and tightens as files get touched. Fix full-repo
findings opportunistically when a file is already being edited.

## Rules

1. **Behavior, not implementation.** Test what the user (or caller) sees -
   rendered output, returned data, persisted state - not private wiring.
2. **Fakes over mocks.** Prefer a tiny in-memory fake (an object that
   satisfies the interface, e.g. a `StorageAdapter` backed by a `Map`, a
   fake `fetch` resolving fixture JSON) over `vi.mock` gymnastics.
   `vi.mock` is reserved for module boundaries we do not own
   (Capacitor plugins, `@google/genai`).
3. **No network in tests.** Every suite must pass offline. Prompts to LLMs
   are tested via the exported pure prompt builders
   (`tests/unit/gemini-prompt.test.ts`), never by calling the API.
4. **Real Arabic fixtures.** Our domain is diacritized Arabic with
   normalization edge cases; fixtures use real strings (`سُبْحَانَ اللَّهِ`),
   not ASCII placeholders.
5. **Fast units.** Individual unit tests stay under ~100 ms; suites avoid
   sleeps and rely on RTL's async utilities instead.
6. **Deterministic.** Time-dependent logic (streaks, Hijri dates) takes its
   clock/date as input or uses injected values - never `new Date()`
   buried in a loop.

## Current inventory (`tests/unit/`)

| File | Covers |
|---|---|
| `data-utils.test.ts` | count parsing, Arabic normalization, stable ids, backup validation |
| `hijri.test.ts` | Hijri date conversion |
| `streak.test.ts` | streak computation |
| `prayer-watch.test.ts` | prayer-time watching logic |
| `quran-service.test.ts` | surah metadata, audio URL building |
| `audio-cache.test.ts` | cache backend keying / index behavior |
| `sw.test.ts` | service-worker behavior |
| `components.test.tsx` | shared component rendering (RTL) |
| `surah-reader-resume.test.tsx` | resume-position capture (IntersectionObserver, unmount flush, clear) |
| `gemini-prompt.test.ts` | LLM prompt grounding contract |

## Adding a test

1. Create `tests/unit/<area>.test.ts(x)` (vitest picks up
   `tests/**/*.test.{ts,tsx}`; environment is jsdom with
   `tests/setup.ts` loading jest-dom).
2. Import from the module under test directly (the `@` alias resolves to
   the repo root, but existing suites use relative paths - keep that).
3. If the module talks to storage/network, inject a fake; if it is a React
   component, render with RTL and assert visible text/roles.

## Known gaps

- No end-to-end layer yet; manual RTL smoke per milestone covers it
  (see `_research/plan/milestones-tasklist.md`).
- Migration-runner and search-worker suites land with M2 and should follow
  these rules from day one.
