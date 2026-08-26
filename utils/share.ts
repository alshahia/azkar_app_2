
import { Share } from '@capacitor/share';

/**
 * Share plain text via the native share sheet; falls back to copying to the
 * clipboard on platforms where the Share API is unavailable (web desktop).
 * User-cancelled shares are swallowed silently.
 */
export async function shareText(title: string, text: string): Promise<void> {
    try {
        await Share.share({ title, text, dialogTitle: title });
    } catch (err: any) {
        if (err?.message?.includes('cancel')) return;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // No share sheet and no clipboard permission: nothing else we can do.
        }
    }
}

/** Copy text to the clipboard, ignoring permission failures quietly. */
export async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}
