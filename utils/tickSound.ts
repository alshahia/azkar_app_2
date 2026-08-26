
let ctx: AudioContext | null = null;

/**
 * Short UI tick for the Tasbeeh counter. Lazily creates a shared AudioContext
 * and synthesises the click (no audio asset needed).
 */
export function playTick(): void {
    try {
        if (!ctx) {
            ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.07);
    } catch {
        // Audio not available (e.g. blocked autoplay): stay silent.
    }
}
