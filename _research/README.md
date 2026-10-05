# Quran / Islamic Apps Research Hub

Competitive & technical research for **our Azkar App** (React 18 + TypeScript + Vite + Tailwind + Capacitor 8, Arabic-first RTL, local-first, offline-first).

**Status:** ✅ COMPLETE — 9 project reports + 3 synthesis docs; full timeline in `progress/research-log.md`. Start reading at `synthesis/lessons-for-azkar-app.md`.

## Our app (research consumer) — key facts
- React 18 + TS 5 + Vite 5 + Tailwind 3.4 + Capacitor 8 (Android primary, iOS scaffolded).
- Arabic-only UI, `dir="rtl"`, no account, no analytics, no monetization.
- Features today: daily azkar (tap-to-count), tasbeeh, prayer times (adhan lib), Qibla, Hijri calendar, full Quran text + التفسير الميسر bundled as JSON, reciter audio w/ per-surah download + cache, TTS (Gemini-key gated AI explanations), streaks, reminders, 6 themes + dark mode, font scale, 4 home layouts, backup/restore, PWA.
- Data: `data/static/quran/text` + `tafsir` (114 surahs), azkar in `data/categories/*`.

## Navigation
### Per-project reports — `projects/`
| File | Subject |
|---|---|
| `projects/quran-com-developers-api.md` | Quran.com API v4 (quran.com/developers) + Quran Foundation |
| `projects/quran-org-ecosystem.md` | github.com/quran org overview & ecosystem |
| `projects/quran-com-frontend-next.md` | quran.com web (Next.js) repo |
| `projects/quran-android.md` | quran/quran_android (Kotlin) |
| `projects/alfaazplus-quranapp.md` | AlfaazPlus/QuranApp (Android) |
| `projects/mostaqem-android.md` | Mostaqem/mostaqem_android (recitations player) |
| `projects/dmouayad-my-quran.md` | DMouayad/my_quran |
| `projects/roznama-app.md` | roznama-app.com |
| `projects/apis-and-packages-ecosystem.md` | Other APIs, datasets & packages usable by us |

### Synthesis (what we should DO) — `synthesis/`
- `synthesis/feature-matrix.md` — feature comparison vs our app
- `synthesis/lessons-for-azkar-app.md` — prioritized, actionable adoption list
- `synthesis/apis-and-data-sources.md` — content/data strategy options

### Cloned repos (gitignored) — `repos/`
`quran-com-frontend-next`, `quran_android`, `QuranApp`, `mostaqem_android`, `my_quran`

### Implementation plan — `plan/`
- `plan/plan-high-level.md` — goal, non-goals, approach, phases, risks, assumptions, self-score
- `plan/milestones-tasklist.md` — M0–M4 time-boxed milestones + M5 backlog; every task names real files, deps, and "done when"

### Progress — `progress/research-log.md`
Append-only log of steps, decisions, failures.
