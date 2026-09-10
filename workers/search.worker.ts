// =====================================================================
//  Quran search worker (M2-T4).
// =====================================================================
//  Background worker that answers free-text queries over the bundled
//  search_index.json. The SearchScreen posts { type:'search', query, mode }
//  messages and renders the returned character-offset highlights inline.
//
//  Why a worker: the index holds ~16k unique tokens / 6236 posts; running
//  the same scan on the main thread blocks the UI for hundreds of ms on
//  device-class hardware. The worker keeps input latency < 16 ms even on
//  200-result queries.
//
//  Index layout is the same as what scripts/generate-quran-data.mjs writes:
//    { meta, tokens: string[], posts: [{s, a, h: number[]}] }
//  Char offsets are computed against the *rendered* Uthmani string; the
//  consumer (SearchScreen) is responsible for loading that string from
//  loadSurah(s).a[i].text.

/// <reference lib="webworker" />
import indexUrl from '../data/static/quran/search_index.json?url';
import { tokenizeAyah } from './quranSearchTokens';

type SearchMode = 'and' | 'or';
interface SearchPost { s: number; a: number; h: number[]; }
interface SearchIndex { meta: { version: number; totalPosts: number }; tokens: string[]; posts: SearchPost[]; }

let INDEX: SearchIndex | null = null;
let INDEX_LOADING: Promise<SearchIndex> | null = null;

async function loadIndex(): Promise<SearchIndex> {
    if (INDEX) return INDEX;
    if (INDEX_LOADING) return INDEX_LOADING;
    INDEX_LOADING = (async () => {
        const res = await fetch(indexUrl);
        if (!res.ok) throw new Error('quran-search-worker: failed to load index: ' + res.status);
        const json = await res.json() as SearchIndex;
        INDEX = json;
        return json;
    })();
    return INDEX_LOADING;
}

/** Tokenize the query, dedupe, and drop empties. */
function queryTokens(q: string): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const t of tokenizeAyah(q)) {
        if (!seen.has(t)) { seen.add(t); out.push(t); }
    }
    return out;
}

/**
 * For each query token, collect every token id in the index that matches:
 *   - exact id hit
 *   - prefix match (startsWith on the indexed word)
 * Each query token's match set is kept distinct so AND / OR semantics are
 * trivially computed from per-token membership.
 */
function tokenMatchesPerQuery(tokens: string[], index: SearchIndex): Map<string, Set<number>> {
    const out = new Map<string, Set<number>>();
    for (const qt of tokens) {
        const s = new Set<number>();
        for (let i = 0; i < index.tokens.length; i++) {
            if (index.tokens[i] === qt || index.tokens[i].startsWith(qt)) {
                s.add(i);
            }
        }
        out.set(qt, s);
    }
    return out;
}

/** Compute posts whose token-id set intersects (or is covered by) every per-query set. */
function intersectPosts(perQuery: Map<string, Set<number>>, index: SearchIndex, mode: SearchMode): SearchPost[] {
    const out: SearchPost[] = [];
    if (perQuery.size === 0) return out;
    const sets = Array.from(perQuery.values());
    // Anchor: scan the smallest set to minimize lookups.
    let anchor = sets[0];
    let anchorIdx = 0;
    for (let i = 1; i < sets.length; i++) {
        if (sets[i].size < anchor.size) { anchor = sets[i]; anchorIdx = i; }
    }
    for (const post of index.posts) {
        const postHitSet = new Set(post.h);
        let matched = false;
        if (mode === 'and') {
            matched = true;
            for (let i = 0; i < sets.length; i++) {
                if (i === anchorIdx) continue;
                let any = false;
                for (const id of sets[i]) if (postHitSet.has(id)) { any = true; break; }
                if (!any) { matched = false; break; }
            }
        } else {
            // OR: any per-query set has at least one id in common with the post.
            for (const s of sets) {
                for (const id of s) if (postHitSet.has(id)) { matched = true; break; }
                if (matched) break;
            }
        }
        if (matched) out.push(post);
        if (out.length >= 200) break;
    }
    return out;
}

interface IncomingSearch { id: number; type: 'search'; query: string; mode: SearchMode; }
interface IncomingLoad { id: number; type: 'load'; }
type Incoming = IncomingSearch | IncomingLoad;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (e: MessageEvent<Incoming>) => {
    const msg = e.data;
    try {
        if (msg.type === 'load') {
            await loadIndex();
            (ctx as any).postMessage({ id: msg.id, type: 'ready' });
            return;
        }
        if (msg.type === 'search') {
            const index = await loadIndex();
            const trimmed = msg.query.trim();
            if (!trimmed) {
                (ctx as any).postMessage({ id: msg.id, type: 'result', results: [] });
                return;
            }
            const qTokens = queryTokens(trimmed);
            if (qTokens.length === 0) {
                (ctx as any).postMessage({ id: msg.id, type: 'result', results: [] });
                return;
            }
            const perQuery = tokenMatchesPerQuery(qTokens, index);
            // All-empty per-query sets mean nothing matches anywhere.
            let anyMatched = false;
            for (const s of perQuery.values()) if (s.size > 0) { anyMatched = true; break; }
            if (!anyMatched) {
                (ctx as any).postMessage({ id: msg.id, type: 'result', results: [] });
                return;
            }
            const posts = intersectPosts(perQuery, index, msg.mode);
            (ctx as any).postMessage({ id: msg.id, type: 'result', results: posts, queryTokens: qTokens });
        }
    } catch (err) {
        (ctx as any).postMessage({ id: msg.id, type: 'error', error: String((err as Error).message || err) });
    }
};

export {}; // ensure this file is treated as a module under isolatedModules.
