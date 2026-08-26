# Azkar App — Full Code Review (Read-Only Audit)

**Date:** Review session completed 2026-08-26
**Scope:** Entire application at repository root (`E:\flutter\azkar-app_6`)
**Constraint honored:** Strictly read-only. No app file was created, modified, deleted, built, or installed during the audit. The only files added to the workspace are the ones inside `docs/review/`.

## What the app is

A mobile-first Islamic daily-remembrance (dhikr) app:

| Aspect | Detail |
|---|---|
| Stack | React 18.3 + TypeScript 5.4 (strict) + Vite 5 + Tailwind CSS 3 |
| Packaging | PWA (manual service worker) + Capacitor 8 Android (`com.azkar.app`) |
| State | React Context + hooks (single provider in `App.tsx`) |
| Storage | Adapter pattern: WebStorage (localStorage) / MobileStorage (@capacitor-community/sqlite) |
| Services | Gemini AI (zikr explanation + TTS audio), adhan (prayer times), haptics, notifications |
| Content | 44 static azkar categories (~244 KB vocalized Arabic), quotes, salawat |
| Language | Arabic-first; English translations exist but are unreachable (type-level) |

## Environment observed

- Windows host; working dir `E:\flutter\azkar-app_6`
- Node v24.11.1, npm 11.16.0
- **No git repository initialized** (no `.git`) — see remediation Phase 0
- Dependencies installed (`node_modules` present); `dist/` and Capacitor-synced `android/app/src/main/assets/public/` exist and are hash-consistent with each other

## Report set

| File | Contents |
|---|---|
| [01-full-report.md](./01-full-report.md) | Executive summary, all HIGH findings, themed MEDIUM/LOW analysis, validation results |
| [02-remediation-plan.md](./02-remediation-plan.md) | Phased, ordered fix plan with exit criteria (not yet executed) |
| [appendix-a-screens.md](./appendix-a-screens.md) | Verbatim detailed findings: 19 screen components |
| [appendix-b-shared-components.md](./appendix-b-shared-components.md) | Verbatim detailed findings: 22 shared components |
| [appendix-c-data-layer.md](./appendix-c-data-layer.md) | Verbatim detailed findings: types, repositories, storage adapters, dataset audit |

## Method

1. Direct manual review of configs, entry points, services, storage layer, platform manifests.
2. Three independent read-only sub-reviews (screens / shared components / data layer), cross-checked against shared-module evidence.
3. Static validation: `tsc --noEmit` (exit 0), XSS-sink scan (0 hits), secret scan (placeholder only), dataset structural audit (sound), `npm audit` (13 vulns, build-time deps).
4. Production-build behavior verified forensically from existing `dist/` output (no rebuild was performed, per the no-changes constraint).

## Headline numbers

11 HIGH · ~45 MEDIUM · ~50 LOW/INFO findings. Top risks: broken production PWA packaging, unstable static content IDs, untransactional destructive restore, silent no-op storage after failed init, lost-update races on the dhikr counter, audio/sensor leaks past unmount, and several shipped-but-inert controls.
