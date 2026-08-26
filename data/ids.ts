
import { normalizeArabic } from './arabic';

/**
 * Stable identity utilities.
 *
 * History: static zikr ids used to be assigned by a module-load counter, which
 * made every persisted reference (favorites, progress, hidden list, edit links)
 * break whenever categories were reordered or added. IDs are now derived
 * deterministically from (categoryId, text).
 */

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const fnv1a32 = (s: string): number => {
    let h = FNV_OFFSET;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, FNV_PRIME) >>> 0;
    }
    return h >>> 0;
};

/** Legacy sequential ids were < ~500; the global Tasbeeh pseudo-id is 99999.
 *  Stable ids therefore live at or above this boundary. */
export const MIN_STABLE_ID = 1000000;

export const stableZikrId = (categoryId: string, arabic: string, salt: number = 1): number => {
    let n = fnv1a32(categoryId + '|' + normalizeArabic(arabic) + (salt > 1 ? '|' + salt : ''));
    if (n < MIN_STABLE_ID) n += MIN_STABLE_ID;
    return n >>> 0;
};

let entitySeq = 0;

/** Collision-safe id for user-created entities (quotes, salawat, custom azkar).
 *  Replaces bare Date.now(), which collided when two entities were created in
 *  the same millisecond. */
export const makeEntityId = (): number => {
    entitySeq = (entitySeq + 1) % 1000;
    return Date.now() * 1000 + entitySeq;
};
