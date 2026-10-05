# High-Level Plan — Apply Quran-App Research to Azkar App

**Date:** 2026-09 (post-research). **Prepared per am-planning skill discipline** (no agents_manager pipeline exists in this repo — artifacts adapted to `_research/plan/`; TASK-FILE-WAS-MISSING: plan tasks live in `milestones-tasklist.md` instead of a tasks/<id>.md file).

## Goal
Turn the 26 research recommendations (`../synthesis/lessons-for-azkar-app.md`) into shipped features across 5 time-boxed milestones, preserving the brand: Arabic-first RTL, local-first, offline-first, no accounts/ads/analytics, GPL-clean code.

## Non-goals (explicit)
- No backend/server, no accounts, no cloud sync (backup files cover portability).
- No ads, IAP, or analytics — ever.
- No super-app breadth (games, encyclopedias, watch apps) — the Roznama anti-pattern.
- No GPL/no-license code or data copied from researched repos (ideas/schemas/UX only).
- No i18n expansion yet — only the cheap per-locale defaults prep (M5).
- No iOS-specific design pass (out of scope of this plan).

## Approach
Sequence by **user-perceived value ÷ risk**, anchored to code that already exists (verified this session):
- The audio experience is the biggest gap (Quran player lacks Media Session; downloads are not resumable; no queue/resume) → **Milestone 1** first; it also completes the already-pending "Background Audio Playback" item in the repo's `TASK.md`.
- Data integrity (migration runner, backup v2, content versioning) lands **before** heavy content features so every later milestone evolves storage safely → **Milestone 2**.
- Reading experience (ayah menu, repeat, timing highlight, tafsir switching) is the largest build → **Milestone 3** after the data layer is hardened.
- Engagement loops (VOTD, daily digest, on-this-day) are cheap once the above exist → **Milestone 4**.
- Strategic items (mushaf page mode, word-by-word, gapless surah mode) stay a **backlog (M5)** with license gates called out.
Each milestone ends with a releasable app (validation: `npm run test`, `npm run lint`, `npm run build` + RTL manual smoke list).

## Phases (one line each)
1. **M0 — Foundations & guardrails** (~½ wk): attribution screen, Gemini grounding, CI + testing baseline.
2. **M1 — Audio experience** (~2 wks): Media Session for Quran player, resumable downloads, reciter catalog refresh, playback resume, cross-surah queue, download manager UX.
3. **M2 — Data integrity & search** (~1½ wks): migration runner, backup v2 (preview + merge), Arabic normalization, Quran search index + worker, content versioning.
4. **M3 — Reading experience** (~2 wks): ayah action menu + central modal, repeat settings, per-reciter timing highlight/seek, tafsir switching, read history, KFGQPC font hardening.
5. **M4 — Engagement & daily habit** (~1 wk): Verse-of-the-Day notification, Hijri on-this-day dataset, "Today" digest card, what's-new dialog, wake lock.
6. **M5 — Strategic backlog** (unsized, license-gated): mushaf page mode, word-by-word, full-surah gapless, repo-as-CDN, community dhikr, per-locale defaults, engineering hygiene.

## Risks acknowledged (from research → plan handling)
- **QF legacy API retirement** (HIGH) → reciter/tafsir data fetched by *build-time scripts* into first-party bundles; runtime fetches optional; quarterly recheck logged in `../progress/research-log.md`.
- **License contamination** (HIGH) → M0 adds an attribution screen + a PR checklist rule ("no code/data from GPL/no-license repos"); every content addition carries a license task gate.
- **Android WebView Media Session limits** (MED) → M1-T2 spike decides: PWA path first (works today), then custom thin Capacitor plugin vs GPL `@jofr/capacitor-media-session` — **user decision required**.
- **Data loss in storage migrations** (MED) → migration runner with per-migration flags + unit tests lands in M2 *before* schema-touching features; backup v2 adds a safe restore path.
- **Audio licensing ambiguity** (HIGH) → cache-for-personal-use + attribute; never re-host; never bundle API-fetched content (QF terms).
- **Storage growth** (MED) → download manager + storage-cleanup screen in M1.

## Open assumptions (user must override before confirming if disagree)
1. **Pace:** solo developer, ~full-time → M0–M4 ≈ 7 calendar weeks + buffer ≈ 8. Part-time: roughly double.
2. **M1-T2 media-session plugin choice** needs a decision (default: PWA-first, defer Android plugin).
3. **M3-T4 second tafsir**: default = on-demand + ephemeral cache behind a flag (bundle Ibn Kathir only if license-cleared).
4. **M4-T2 on-this-day content source** needs a user-approved authentic source before dataset curation starts.
5. Milestone order M1→M2 may swap if the user prefers search over audio first (recommended order kept: audio is the pending TASK.md item and highest-value gap).
6. Arabic-only UI stays throughout M0–M4.

## Plan self-score
- **Testability (1–5): 4** — normalization, migrations, backup, search index, timing math, catalog scripts all unit-testable; RTL/UI flows need a manual smoke checklist per milestone (provided).
- **Scope (1–5): 4** — M0–M4 are sized for ~7 focused weeks; M5 explicitly unsized/backlog so the core plan stays credible.
- **Dependencies (1–5): 5** — every task lists named files + prerequisites; the only external blockers are the 4 flagged user decisions above.
