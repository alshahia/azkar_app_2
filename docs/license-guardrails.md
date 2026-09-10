# License guardrails

One page. Read before copying anything into this repo. Research basis:
`_research/synthesis/apis-and-data-sources.md`,
`_research/plan/plan-high-level.md` (risks).

## Hard rules by source type

| Source type | Rule |
|---|---|
| GPL repos (quran_android, QuranApp, my_quran) | **Learn ideas, never paste code or data files.** No transliteration, no "adapted from". |
| No-license repos (quran.com-frontend-next) | Same as GPL + do not clone UI verbatim; README explicitly forbids copying. |
| Recitation audio (cdn.islamic.network, verses.quran.com, ...) | **Stream + cache locally + attribute. Never re-host, redistribute, or bundle audio files.** |
| Quran Foundation content (api v4 / QUL / quran.com data) | Never bundle; runtime fetch only with attribution and **cache ≤ 1 week**; **never pipe into an LLM** without written consent. Our bundled text/tafsir (alquran.cloud/Tanzil) is first-party - keep it that way. |
| Tanzil text | Verbatim + attribution (CC BY 3.0). No wording changes. |
| KFGQPC fonts (future, M3) | Keep the license notice, **never subset** the mushaf font. |
| npm dependencies | License-check before adding: MIT/BSD/Apache/OFL fine; GPL/AGPL not; unclear = ask. |

## Before merging a PR that touches content

1. Every new bundled text/tafsir/font/audio source has an entry in
   `data/static/licenses.ts` (id, license, URL) - the About screen picks
   it up automatically.
2. If the source is Quran Foundation hosted: also surface
   `QF_ATTRIBUTION_STRING` next to the content.
3. No file in the diff was copied from a GPL / no-license repo
   (check `_research/repos/` clones - they are reference-only and
   gitignored).
4. New prompt code only ever passes **bundled** text to the LLM
   (enforced by `tests/unit/gemini-prompt.test.ts`).

## Before merging a PR that adds a dependency

1. `npm ls <pkg>` to confirm it is actually needed (prefer the smallest
   dependency).
2. Check its LICENSE: MIT / BSD / Apache-2.0 / OFL acceptable;
   GPL-family requires a user decision first.

PR template (`.github/pull_request_template.md`) mirrors the two
checklists above.
