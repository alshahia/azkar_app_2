import { Share } from '@capacitor/share';

// ============================================================================
// Simple share + clipboard helpers
// ============================================================================

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

// ============================================================================
// Feature-rich share helpers (merged from shareUtils.ts)
// ============================================================================

export interface ShareData {
    title: string;
    text: string;
    url?: string;
}

export interface ShareOptions {
    platform?: 'native' | 'twitter' | 'whatsapp' | 'telegram' | 'copy';
    hashtags?: string[];
}

export async function shareContent(data: ShareData, options: ShareOptions = {}): Promise<boolean> {
    const { platform = 'native', hashtags = [] } = options;

    // Try native share API first (if platform is native or not specified)
    if (platform === 'native' && navigator.share) {
        try {
            await navigator.share(data);
            return true;
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                return false;
            }
        }
    }

    // Platform-specific sharing
    const encodedText = encodeURIComponent(data.text);
    const encodedUrl = encodeURIComponent(data.url || window.location.href);
    const encodedHashtags = hashtags.map(h => encodeURIComponent(h)).join(',');

    let shareUrl = '';

    switch (platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=${encodedHashtags}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
            break;
        case 'copy':
        default:
            // Fallback to clipboard
            try {
                const text = `${data.title}\n\n${data.text}${data.url ? '\n\n' + data.url : ''}`;
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                console.error('Share failed:', error);
                return false;
            }
    }

    // Open share URL in new window
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
        return true;
    }

    return false;
}

export function generateShareText(type: 'zikr' | 'progress' | 'khatma' | 'verse', data: Record<string, unknown>): string {
    switch (type) {
        case 'zikr':
            return `${data.text}\n\n— ${data.source || 'تطبيق الأذكار'}`;
        case 'progress':
            return `قرأت ${data.pages} صفحة من القرآن الكريم\n\n— تطبيق الأذكار`;
        case 'khatma':
            return `ختمة جديدة: ${data.name}\n\n— تطبيق الأذكار`;
        case 'verse':
            return `${data.text}\n\n${data.surah} ${data.ayah}\n\n— تطبيق الأذكار`;
        default:
            return '';
    }
}

export function canShare(): boolean {
    return !!navigator.share || !!navigator.clipboard;
}

export function getSharePlatforms(): Array<{ id: string; name: string; icon: string }> {
    return [
        { id: 'native', name: 'مشاركة', icon: '📤' },
        { id: 'twitter', name: 'تويتر', icon: '🐦' },
        { id: 'whatsapp', name: 'واتساب', icon: '💬' },
        { id: 'telegram', name: 'تيليجرام', icon: '✈️' },
        { id: 'copy', name: 'نسخ', icon: '📋' },
    ];
}
