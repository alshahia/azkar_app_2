# Quran feature

The القرآن الكريم tab is a fully offline Mushaf reader with bookmarks, audio
recitation, and inline Tafsir Muyassar.

## Data sources

Text is traceable to the **Tanzil Uthmani** project (the de-facto standard for
Hafs script), served via the free alquran.cloud and quran.com APIs. Both were
probed live during development and confirmed reachable:

| Source | Endpoint | Used for |
|---|---|---|
| api.alquran.cloud/v1/quran/quran-uthmani | Bulk Uthmani mushaf text | data/static/quran/text/{n}.json |
| api.alquran.cloud/v1/quran/ar.muyassar | Tafsir Muyassar | data/static/quran/tafsir/{n}.json |
| cdn.islamic.network/quran/audio/128/<id>/<global>.mp3 | Per-ayah recitation | QuranService.ayahAudioUrl() |
| api.alquran.cloud/v1/edition/format/audio | Reciter identifier list | QuranService.RECITERS |

Web search for current best practices was unavailable during development, but
the chosen API set is the same one used by Quran.com own mobile app and by
Tarteel; it is the de-facto reference for accurate Mushaf data in 2024-2025.

## Regenerating the vendored dataset

If the upstream text changes or you want to swap tafsir editions:

1. Download into .tmp_quran_raw/:
   ```ps
   Invoke-WebRequest https://api.alquran.cloud/v1/quran/quran-uthmani -OutFile .tmp_quran_raw/quran-uthmani.json
   Invoke-WebRequest https://api.alquran.cloud/v1/quran/ar.muyassar    -OutFile .tmp_quran_raw/tafsir-muyassar.json
   ```
2. node scripts/generate-quran-data.mjs

The script prints integrity checks and exits non-zero on any mismatch:
- 114 surahs
- 6236 total ayat (the canonical Hafs count)
- 112 Basmala prefixes stripped (113 non-Tawbah surahs, minus Al-Fatiha where the basmala IS ayah 1)
- 30 juz boundaries derived from the actual `juz` field on each ayah
- Per-surah tafsir array length matches text array length

## Architecture

```
services/QuranService.ts
    - imports index.json + juz.json eagerly (~20 KB total)
    - import.meta.glob over text/ and tafsir/ folders (Vite splits each file into its own chunk)
    - exports SURAHS, JUZ_STARTS, RECITERS, searchSurahs, loadSurah, loadTafsir, ...
    - positionFromGlobal(globalNumber) for the audio CDN

components/quran/
    AyahCard          - one ayah block with ornate marker, action row, sajda chip
    AudioMiniPlayer   - sticky bottom player, per-ayah streaming + auto-advance
    BismillahHeader   - decorative basmala above ayah 1 (hidden for 1 and 9)
    BookmarkSheet     - list of saved bookmarks for quick jump
    JuzChips          - 30 juz shortcuts in a horizontal scroll strip
    OrnamentNumber    - rosette-style surah number badge
    ReciterPicker     - bottom-sheet reciter chooser
    SurahRow          - one row in the surah index
    TafsirSheet       - bottom sheet showing Tafsir Muyassar for the active ayah

components/screens/
    QuranScreen       - index: resume banner, search, juz chips, list
    SurahReaderScreen - reader: sticky header, font slider, ayah cards, audio
```

## Persistence

Two new adapter methods (web + mobile) plus backup/export support:

- getQuranBookmarks() / saveQuranBookmarks(list)
- getQuranLastRead() / saveQuranLastRead(value | null)

Backups now include quranBookmarks and quranLastRead sections (version bumped
to 3); old backups continue to import fine because absent sections are
tolerated.

## Auto-tracked resume position ("تابع من حيث توقفت")

The "continue from where you stopped" banner is driven by `quranLastRead`
which is updated **automatically** as the user scrolls through a surah -
no bookmark is required.

### How the position is captured

`SurahReaderScreen` mounts an `IntersectionObserver` over the scrolling
container with a narrow active band (`rootMargin: -20% 0px -55% 0px`) so
that only the ayahs near the top of the viewport are counted. On every
intersection change the topmost visible ayah is pushed into
`setQuranLastRead({ surah, ayah })` via the shared `AppContext`.

The observer's callback uses **stable refs** for `setQuranLastRead` and
`surahId` so the effect does not tear down and reattach on every App
re-render (which would otherwise fire whenever `quranLastRead` changes).

### Unmount flush

A separate effect with an empty dep array registers a cleanup that
flushed the latest ayah to storage when the reader unmounts. This
catches the case where the user scrolls and immediately exits before the
IO callback can fire a final time.

### Banner UI

`QuranScreen` renders the resume banner whenever `quranLastRead` is set,
independent of bookmarks. A small "X" affordance in the corner calls
`clearQuranLastRead()` so the user can dismiss the saved position
(e.g. after finishing a surah they want to start fresh on).

### Guarantees

- The banner reflects the **last ayah the user reached**, not the last
  bookmark they saved.
- Position is saved on every scroll intersection, so the banner stays in
  sync even mid-session.
- Quick exits never lose the latest position - the unmount cleanup
  flushes the ref-tracked current ayah to storage.
- A regression test (`tests/unit/surah-reader-resume.test.tsx`) pins the
  IO + unmount + clear behaviour.

## Navigation

- quran Screen - surah index, lazy-loaded chunks
- surahReader Screen - mushaf reader, params: { surahId, ayah?, bookmarksOnly? }

The Quran tab is the second of five bottom-nav tabs (after الرئيسية) so it is
reachable in one tap from anywhere in the app, matching the pattern used by
Muslim Pro and Quran.com. A matching teal tile is also placed first in the
home QuickAccessGrid.

## Offline audio cache

Per-ayah recitation is streamed from `cdn.islamic.network`. To make subsequent
plays work without an internet connection we wrap the URL with a platform-
native cache that fills the first time each ayah is played.

### Backends

| Platform | Backend | Storage location |
|---|---|---|
| Web / dev | Cache API (`caches.open('quran-audio-v1')`) | Browser-managed; subject to its storage-pressure eviction |
| Mobile (Capacitor) | `Filesystem.writeFile({directory: Data})` under `quran-audio/<reciterId>/<globalAyah>.mp3` | App-private data directory; survives across launches |

The Capacitor Filesystem backend is loaded via `await import()` only when
`Capacitor.isNativePlatform()` is true, so the web bundle never includes it.
Build output confirms the split: `audioCache.ts` rides along with
`SurahReaderScreen` (33 KB); the mobile backend is a separate 8.7 KB chunk
loaded on demand.

### LRU eviction (mobile)

The mobile backend keeps a small JSON index file
(`quran-audio/.index.json`) with `{reciterId, ayah, bytes, lastAccessedAt}`
per entry. After every bulk `downloadSurah()` we evict the oldest entries
(by `lastAccessedAt`) until the total stays within the configured cap
(default 500 MB - override via `audioCache.setMaxBytes(...)`). The web
backend relies on browser storage pressure and does not maintain its own
LRU.

### Concurrency

A per-key `Map<reciterId:ayah, Promise<...>>` guarantees that two
simultaneous `getAudioSourceUrl` calls share one network fetch + write. The
URL returned to the caller is always a `<audio src>`-ready string:

- Web: a `blob:` URL backed by the cached `Response`, revoked when the
  mini-player swaps to the next ayah.
- Mobile: a `Capacitor.convertFileSrc()`-wrapped `file://` URI that the
  Capacitor WebView can load directly.

### User-facing UI

The mini player caches automatically - no action required. Power users can
pre-pin a whole surah for offline recitation:

- Reader header gains a cloud-download icon next to the font / bookmark
  buttons.
- Tapping it opens `AudioDownloadSheet`, which shows:
  - Current cache size and entry count
  - "Download this surah" button with progress bar (X/Y ayahs, MB so far)
  - "Clear cache" action (with confirmation prompt)

The download sheet is intentionally power-user-only; the everyday path is
"play any ayah once, then it works offline forever".

### Failure handling

- Network error on first listen: cache miss is returned and the UI shows
  the existing retry-friendly error string; no exception bubbles up.
- Storage write failure: the remote URL is returned so the user still hears
  the recitation - it just will not be available offline yet.
- Corrupted cache index: treated as empty; the next play repopulates it.

### CORS note

`cdn.islamic.network` does **not** send `Access-Control-Allow-Origin`.
This means:

- The first-fetch `fetch()` in `audioCache` throws a CORS error and the
  module transparently falls back to the remote URL (the `fromCache` flag
  is `false`). The `<audio>` element is created without `crossOrigin`
  so it can still stream the remote URL for simple playback.
- The Cache API itself is same-origin, so once a copy lands in the cache
  (via a non-browser proxy, or via a future CORS-enabled endpoint) every
  subsequent play resolves to a `blob:` URL and bypasses the CORS issue.
- WebAudio features (analyser nodes, MediaStream recording, etc.) would
  require CORS and therefore do not work today. We do not currently use
  any such feature.

If the upstream ever adds CORS, flip `crossOrigin = 'anonymous'` back on
in `AudioMiniPlayer` so the cache write path works on the web.

## Verified reciters

Add a new reciter only after probing:

```ps
$req = [System.Net.HttpWebRequest]::Create("https://cdn.islamic.network/quran/audio/128/<id>/262.mp3")
$req.Method = 'HEAD'; $req.Timeout = 10000
$req.GetResponse()
```

Probed and confirmed: ar.alafasy, ar.husary, ar.minshawi, ar.hudhaify,
ar.mahermuaiqly.
