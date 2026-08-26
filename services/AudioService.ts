
import { GoogleGenAI, Modality } from "@google/genai";
import { getStorage } from "../data/storage";

class AudioService {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentBuffer: AudioBuffer | null = null;
  
  // State tracking
  private startTime: number = 0;
  private pausedAt: number = 0;
  private isPaused: boolean = false;
  private isPlaying: boolean = false;
  private playbackRate: number = 1.0;
  
  // Resolution for the active Zikr promise
  private completionResolver: ((value: boolean) => void) | null = null;
  
  // Identifying the current track
  private currentKey: string | null = null;

  constructor() {
    this.setupMediaSession();
  }

  private setupMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => this.resume());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('stop', () => this.stop());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined) {
                this.seek(details.seekTime);
            }
        });
    }
  }

  private updateMediaSessionMetadata(text: string) {
      if ('mediaSession' in navigator) {
          // Truncate text for title if too long
          const title = text.length > 50 ? text.substring(0, 50) + "..." : text;
          
          navigator.mediaSession.metadata = new MediaMetadata({
              title: title,
              artist: "تطبيق أذكار",
              album: "الأذكار اليومية",
              artwork: [
                  { src: '/images/icon-192.png', sizes: '96x96', type: 'image/png' },
                  { src: '/images/icon-192.png', sizes: '128x128', type: 'image/png' },
                  { src: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
                  { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png' },
              ]
          });
          
          // Set initial state
          navigator.mediaSession.playbackState = 'playing';
      }
  }

  private getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return this.audioContext;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; 
    }
    return hash.toString();
  }

  /**
   * Plays Zikr Audio. Returns true if finished naturally, false if stopped manually.
   */
  async playZikrAudio(text: string, voiceName: string = 'Kore', userApiKey?: string): Promise<boolean> {
    try {
      const newKey = `${this.hashString(text)}_${voiceName}`;
      
      // If asking to play the SAME track that is currently paused, just resume
      if (this.currentKey === newKey && this.isPaused && this.currentBuffer) {
          this.resume();
          // Return a new promise that hooks into the existing completion flow
          return new Promise((resolve) => {
              // We need to chain this resolve to the main resolver
              const oldResolver = this.completionResolver;
              this.completionResolver = (val) => {
                  if (oldResolver) oldResolver(val);
                  resolve(val);
              };
          });
      }

      // Otherwise, start fresh
      this.stop(); 
      this.currentKey = newKey;
      
      // Update Lock Screen Metadata
      this.updateMediaSessionMetadata(text);

      const storage = getStorage();
      const prefs = await storage.getPreferences();
      const autoSave = prefs.audioAutoSave;
      
      // 1. Check Local Cache
      const cachedAudio = await storage.getAudio(newKey);
      let base64Audio = cachedAudio;

      // 2. If not found, fetch from API
      if (!base64Audio) {
          // Bring-your-own-key is the only path: build-time env injection would
          // bake a secret into the client bundle.
          const keyToUse = userApiKey;
          if (!keyToUse) throw new Error("API_KEY_MISSING");

          if (!navigator.onLine) {
              throw new Error("OFFLINE_AND_NOT_CACHED");
          }

          const ai = new GoogleGenAI({ apiKey: keyToUse });
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceName },
                },
              },
            },
          });

          // Use || null to ensure type compatibility (string | undefined -> string | null)
          base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
          
          if (!base64Audio) {
            console.warn("No audio data returned from Gemini API");
            return false;
          }

          if (autoSave) {
              await storage.saveAudio(newKey, base64Audio);
          }
      }

      // 3. Decode
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = await this.decodeAudioData(
        this.decodeBase64(base64Audio),
        ctx,
        24000,
        1
      );

      this.currentBuffer = audioBuffer;
      this.pausedAt = 0; // Reset start time
      this.playBuffer(0);

      return new Promise((resolve) => {
        this.completionResolver = resolve;
      });

    } catch (error) {
      console.error("Audio playback failed", error);
      this.cleanup();
      throw error;
    }
  }

  private playBuffer(offset: number) {
      const ctx = this.getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = this.currentBuffer;
      source.playbackRate.value = this.playbackRate;
      source.connect(ctx.destination);
      
      source.onended = () => {
          if (this.isPaused) {
              // Do nothing, waiting for resume
              return;
          }
          // If we are here, it finished naturally OR was stopped manually.
          if (this.isPlaying) {
              this.isPlaying = false;
              if (this.completionResolver) {
                  this.completionResolver(true);
                  this.completionResolver = null;
              }
              if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
              this.cleanup();
          }
      };

      source.start(0, offset);
      this.currentSource = source;
      
      // Correctly track start time relative to the audio context
      this.startTime = ctx.currentTime - offset;
      this.isPlaying = true;
      this.isPaused = false;
      
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  }

  pause() {
      if (this.currentSource && this.isPlaying && !this.isPaused) {
          const ctx = this.getAudioContext();
          // Calculate where we are in the track
          const elapsed = ctx.currentTime - this.startTime;
          this.pausedAt = elapsed; 
          
          this.isPaused = true;
          this.isPlaying = false;
          this.currentSource.stop(); // Triggers onended, but isPaused flag handles it
          this.currentSource = null;
          
          if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
      }
  }

  resume() {
      if (this.currentBuffer && this.isPaused) {
          this.playBuffer(this.pausedAt);
      }
  }

  stop() {
      this.isPaused = false;
      this.isPlaying = false;
      
      if (this.currentSource) {
          try {
              // Remove listener to prevent firing true on manual stop
              this.currentSource.onended = null;
              this.currentSource.stop();
          } catch(e) {}
      }
      
      if (this.completionResolver) {
          this.completionResolver(false); // Resolve false for manual stop
          this.completionResolver = null;
      }
      
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
      this.cleanup();
  }

  setSpeed(rate: number) {
      this.playbackRate = rate;
      if (this.currentSource && this.isPlaying) {
          this.currentSource.playbackRate.value = rate;
      }
  }

  seek(time: number) {
      if (!this.currentBuffer) return;
      
      const wasPlaying = this.isPlaying;
      
      // Stop current source without triggering completion
      if (this.currentSource) {
          this.currentSource.onended = null;
          try { this.currentSource.stop(); } catch(e){}
      }
      
      // Update position
      this.pausedAt = time;
      
      if (wasPlaying) {
          this.playBuffer(time);
      } else {
          // If paused or stopped, just update position state
          this.isPaused = true;
      }
  }

  // --- Getters for UI ---

  getDuration(): number {
      return this.currentBuffer ? this.currentBuffer.duration : 0;
  }

  getCurrentTime(): number {
      if (this.isPaused) return this.pausedAt;
      if (!this.isPlaying || !this.audioContext) return 0;
      
      // Calculate based on context time
      const curr = (this.audioContext.currentTime - this.startTime); 
      
      // Clamping
      if (curr > this.getDuration()) return this.getDuration();
      return Math.max(0, curr);
  }

  isPlayingState(): boolean {
      return this.isPlaying;
  }

  isPausedState(): boolean {
      return this.isPaused;
  }

  private cleanup() {
      this.currentSource = null;
      this.currentBuffer = null;
      this.currentKey = null;
      this.startTime = 0;
      this.pausedAt = 0;
      this.isPaused = false;
      this.isPlaying = false;
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

export const audioService = new AudioService();
