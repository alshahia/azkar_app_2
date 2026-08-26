# Appendix C — Data Layer Review

> Verbatim report from the dedicated read-only sub-review. Scope: types, repositories, storage adapters, deprecated utils; category datasets assessed structurally.

---

## types.ts
- [MEDIUM] :113 — apiKey persisted inside UserPreferences → silently swept into every save and backup export (root cause of plaintext-key leak in exportData).
- [LOW] :77 — AppLanguage restricted to 'ar' contradicts stated AR/EN support.
- [LOW] :127 — navigate params?: any escape hatch in central public interface.
- [INFO] :73-75 — ProgressState numeric keys become string-keyed after JSON round-trips; type slightly lies.
- [INFO] :18 — Category carries React.ComponentType icon → data layer depends on React; datasets non-serializable by design.

## data\azkarData.ts
- [LOW] :1-8 — Dead deprecated re-export; zero importers. Delete candidate.

## data\azkarRepository.ts
- [MEDIUM] :71-75 — Arabic search ignores diacritics: corpus fully vocalized ("سُبْحَانَ اللَّهِ"); normal query without tashkeel never matches → Arabic text search effectively broken for typical input.
- [MEDIUM] :112-126 — Editing a static zikr breaks its identity: hides original, creates Date.now() copy → favorites/progress keyed by old id orphan.
- [LOW] :70 — any-cast in search loop; :79 attaches undeclared categoryTitle.
- [LOW] :145-149 — Deleting unknown id falls through to hideStaticZikr(id) permanently suppressing it, unverified.
- [INFO] :9-12 — Non-atomic three-await snapshot (benign at this scale).

## data\repository.ts
- [MEDIUM] :29-35,60-67 — Date.now() ids collide within a millisecond; mobile bare INSERT into TEXT PRIMARY KEY throws → second add lost via unhandled rejection.
- [INFO] :24,56 — Hardcoded Arabic fallback strings bypass translations.
- [LOW] :16-26 — No error handling around storage reads.

## data\utils.ts
- [MEDIUM] :34-40 — Count heuristics mis-ordered: '33'/'34' checks dead code (contains '3', caught earlier → 3); 'ثلاث' prefix-matches ثلاثين(30) and ثلاث عشرة(13) → both map to 3. Composite Arabic counts silently wrong.
- [INFO] :11-18 — z() parameter order differs from returned RawZikr shape; positional calls invite transposition bugs.

## data\local\storage.ts
- [LOW] :1-4 — Dead deprecated stub; nothing imports it.

## data\static\azkar.ts
- [HIGH] :16-23 — Unstable runtime-assigned static IDs: globalIdCounter++ means persisted identity depends on category registration order at module load; adding/reordering/removing categories shifts subsequent IDs → corrupts favorites, progress, hiddenStaticIds, originalStaticId links across versions. Most consequential design flaw in the data layer.
- [LOW] :22 — Redundant weaker duplicate of z() count parsing (parseInt||1); parsers can disagree.
- [LOW] :18 — any[] parameter where RawZikr[] exists.
- [INFO] :26-71 — Titles hardcoded Arabic (consistent with ar-only build).

## data\static\quotes.ts / salawat.ts
Clean.

## data\storage\defaults.ts
- [LOW] :17 — Default voiceName 'Charon' disagrees with App.tsx fallback 'Kore'.

## data\storage\index.ts
- [MEDIUM] :8-19 — Adapters never self-initialize: initialize() awaited only in App.tsx mount effect; earlier callers (repositories, AudioService.ts:107) hit MobileStorage with db=null where methods silently no-op.
- [INFO] :6 — Platform choice frozen at first call (fine for production).

## data\storage\interface.ts
Clean.

## data\storage\mobile.ts
- [HIGH] :299-320 — importData DELETEs all five user tables then row-inserts in loops: no transaction, no pre-validation; any bad row/PK conflict aborts midway leaving partial restore with original data destroyed, returns false as if nothing happened.
- [HIGH] :90-103 — Silent data loss when db is null: every method guards if (!this.db) return → after failed init ALL writes/reads silently no-op with zero user-visible error.
- [HIGH] :53-67 — No schema migration: DB version pinned at 1, CREATE TABLE IF NOT EXISTS only; comment implies originalStaticId added post-release; no ALTER/PRAGMA migration → upgraded installs fail addUserZikr INSERT (:194) on every add.
- [MEDIUM] :92-96 — Unguarded JSON.parse of kv rows; one corrupted preferences/progress row rejects every read (and boot load).
- [MEDIUM] :143-146,157-160 — Plain INSERTs throw on duplicate id (unlike INSERT OR IGNORE at :234).
- [MEDIUM] :271-285 — apiKey exported in plaintext backup, no warning/redaction.
- [INFO] :84-87 — Init failure surfaces only as console.error; users see factory-fresh app with no indication SQLite data is unreadable.

## data\storage\web.ts
- [MEDIUM] :66-69,76-79,88-91,100-103,124-127 — Unguarded JSON.parse on five stores (inconsistent with guarded getPreferences/getStats); one corrupted value permanently rejects those reads.
- [MEDIUM] :71-74,105-119,129-139 — Read-modify-write races (await-read then setItem, no lock); two rapid toggles or two tabs lose one update.
- [MEDIUM] :196-218 — Import neither validates rows nor matches mobile semantics: arrays written verbatim; arrays absent from backup keep current values whereas MobileStorage wipes them; mid-sequence failure half-applies (no rollback).
- [MEDIUM] :180-193 — apiKey exported in plaintext backup.
- [LOW] :39-41,52-54 — setItem quota errors unhandled.
- [INFO] :31 — language forcibly overridden to 'ar' on read, entrenching ar-only at storage layer.

## utils\localStorage.ts
- [LOW] :10-18 — Deprecated sync loader returns {} as any, console.warn per call; zero importers → delete candidate.
- [LOW] :37-39 — Bypasses storage adapter (reads window localStorage directly; would be wrong on native).

---

## Structural assessment: data\categories\*.ts (skimmed)
All six files structurally consistent and healthy:
- daily/morningEvening/prayers/prophetic/quranic/special each import { z } from '../utils' and consist purely of z(...) entries → every record shares the RawZikr shape by construction; no stray fields to drift from types.ts.
- Export names match static/azkar.ts imports exactly for all six (10 daily, 2 morningEvening, 15 prayers, 8 quranic, 2 prophetic, 7 special); ICON_MAPPING covers all 44 static ids with a default fallback — no category-id mismatches vs code references.
- Duplicate IDs impossible within/across categories because ids are minted centrally by globalIdCounter (flip side = instability finding).
- Sweeps found 0 TODO/FIXME/placeholder/lorem, 0 empty Arabic strings, 0 sub-9-char entries; sampled Arabic fully vocalized and well-formed. Counts arrive as digit strings parsed correctly; only utils.ts's Arabic-word heuristic path is buggy.

## raw data folder
- [INFO] data (2).csv/.json/.xlsx (~1 MB total) — unreferenced dead weight; source-material leftovers inflating the repo (not the bundle).

---

## Overall assessment
Cleanly layered (adapter interface, web/mobile implementations, thin repositories) and structurally sound datasets. Weakest point is identity: static zikr IDs minted from a mutable import-order counter make every persisted reference one dataset reorder away from pointing at wrong content, with no migration story to accompany evolving tables. Robustness gaps compound on mobile: failed init turns the whole adapter into a silent no-op; kv reads parse JSON unguarded; import destroys existing data before validating replacements with no transaction. On web, five stores lack the try/catch their siblings have; RMW helpers race; both platforms export the Gemini API key in plaintext backups. None break the happy path today, but upgrades, corrupted storage, and backup restores are genuinely risky.

## Top issues
1. [HIGH] data/static/azkar.ts:16 — import-order-dependent static IDs destabilize all persisted references across updates.
2. [HIGH] data/storage/mobile.ts:299 — truncates user tables before inserting; untransactional/unvalidated restore loses old and new data alike.
3. [HIGH] data/storage/mobile.ts:90-103 — null-db guards silently drop every write/read after failed initialize.
4. [HIGH] data/storage/mobile.ts:53-67 — no ALTER/migration for added originalStaticId column; upgraded installs fail every add.
5. [MEDIUM] web.ts:180 / mobile.ts:271 — exportData leaks apiKey into shareable plaintext backups (+ web unguarded JSON.parse and RMW races).
