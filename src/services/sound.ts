import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * High-Fidelity Studio Audio Synthesizer & Sound Player
 * Generates broadcast-grade acoustic and synthetic chimes using Web Audio API graph
 * with high-pass filtration, EQ presence boost, and dynamic compression.
 */
class SoundEngine {
  private audioCtx: any = null;

  private getAudioContext(): any {
    if (typeof window === 'undefined') return null;
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (e) {
      return null;
    }
  }

  /**
   * Builds an audio mastering chain (High-Pass -> EQ Presence -> Compressor -> Master Gain)
   */
  private createMasteringChain(ctx: AudioContext, masterVolume: number = 0.8) {
    const destination = ctx.destination;

    // 1. Dynamic Master Compressor to prevent clipping and add broadcast punch
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, ctx.currentTime);
    compressor.knee.setValueAtTime(12, ctx.currentTime);
    compressor.ratio.setValueAtTime(4, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    // 2. High-Pass filter to strip subsonic rumble (< 120Hz)
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.setValueAtTime(120, ctx.currentTime);

    // 3. Presence EQ Boost (+2.5dB at 3.2kHz for chime brilliance)
    const presenceBoost = ctx.createBiquadFilter();
    presenceBoost.type = 'peaking';
    presenceBoost.frequency.setValueAtTime(3200, ctx.currentTime);
    presenceBoost.Q.setValueAtTime(1.2, ctx.currentTime);
    presenceBoost.gain.setValueAtTime(2.5, ctx.currentTime);

    // 4. Master Volume Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolume, ctx.currentTime);

    // Wire up: Input -> highPass -> presenceBoost -> compressor -> masterGain -> destination
    highPass.connect(presenceBoost);
    presenceBoost.connect(compressor);
    compressor.connect(masterGain);
    masterGain.connect(destination);

    return { input: highPass, ctx };
  }

  /**
   * System Default: Apple-style crisp dual bell chime
   */
  private playDefaultChime(ctx: AudioContext, chainInput: AudioNode) {
    const t = ctx.currentTime;
    const notes = [
      { freq: 880, start: t, dur: 0.35, gain: 0.5 },       // A5
      { freq: 1174.66, start: t + 0.12, dur: 0.6, gain: 0.6 }, // D6
      { freq: 1760, start: t + 0.12, dur: 0.45, gain: 0.25 },  // A6 overtone
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, n.start);

      gain.gain.setValueAtTime(0.001, n.start);
      gain.gain.exponentialRampToValueAtTime(n.gain, n.start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, n.start + n.dur);

      osc.connect(gain);
      gain.connect(chainInput);

      osc.start(n.start);
      osc.stop(n.start + n.dur + 0.05);
    });
  }

  /**
   * Celebration Bell: Harmonic bell chime with festive overtones and sparkle
   */
  private playCelebrationBell(ctx: AudioContext, chainInput: AudioNode) {
    const t = ctx.currentTime;
    const chords = [
      { freq: 523.25, start: t, dur: 0.9, gain: 0.4 },        // C5
      { freq: 659.25, start: t + 0.04, dur: 0.9, gain: 0.35 }, // E5
      { freq: 783.99, start: t + 0.08, dur: 1.0, gain: 0.4 },  // G5
      { freq: 1046.5, start: t + 0.12, dur: 1.2, gain: 0.5 },  // C6
      { freq: 2093.0, start: t + 0.12, dur: 0.8, gain: 0.2 },  // C7 Shimmer
    ];

    chords.forEach((c) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.freq, c.start);

      gain.gain.setValueAtTime(0.001, c.start);
      gain.gain.exponentialRampToValueAtTime(c.gain, c.start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.start + c.dur);

      osc.connect(gain);
      gain.connect(chainInput);

      osc.start(c.start);
      osc.stop(c.start + c.dur + 0.05);
    });
  }

  /**
   * Apple Aurora: Gentle ambient warm synth harmony
   */
  private playAuroraTone(ctx: AudioContext, chainInput: AudioNode) {
    const t = ctx.currentTime;
    const voices = [
      { freq: 440, start: t, dur: 1.1, gain: 0.3 },         // A4
      { freq: 659.25, start: t + 0.02, dur: 1.2, gain: 0.35 }, // E5
      { freq: 880, start: t + 0.05, dur: 1.3, gain: 0.35 },   // A5
      { freq: 1108.73, start: t + 0.08, dur: 1.4, gain: 0.3 }, // C#6
    ];

    voices.forEach((v) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(v.freq, v.start);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, v.start);

      gain.gain.setValueAtTime(0.001, v.start);
      gain.gain.linearRampToValueAtTime(v.gain, v.start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, v.start + v.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(chainInput);

      osc.start(v.start);
      osc.stop(v.start + v.dur + 0.05);
    });
  }

  /**
   * Melodic Harp: Rapid cascading harp arpeggio
   */
  private playMelodicHarp(ctx: AudioContext, chainInput: AudioNode) {
    const t = ctx.currentTime;
    const notes = [
      { freq: 659.25, offset: 0.0, dur: 0.7 },   // E5
      { freq: 783.99, offset: 0.06, dur: 0.75 }, // G5
      { freq: 987.77, offset: 0.12, dur: 0.8 },  // B5
      { freq: 1174.66, offset: 0.18, dur: 0.85 }, // D6
      { freq: 1567.98, offset: 0.24, dur: 1.0 },  // G6
    ];

    notes.forEach((n) => {
      const startTime = t + n.offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.45, startTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + n.dur);

      osc.connect(gain);
      gain.connect(chainInput);

      osc.start(startTime);
      osc.stop(startTime + n.dur + 0.05);
    });
  }

  /**
   * Pop Accent: Crisp, energetic modern bubble pop
   */
  private playPopAccent(ctx: AudioContext, chainInput: AudioNode) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.09);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.65, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);

    osc.connect(gain);
    gain.connect(chainInput);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  /**
   * Main sound trigger method
   */
  public async playSound(soundId: string): Promise<void> {
    if (soundId === 'silent') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      return;
    }

    try {
      await Haptics.selectionAsync();
    } catch (e) {}

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const { input } = this.createMasteringChain(ctx, 0.85);

      switch (soundId) {
        case 'chime':
          this.playCelebrationBell(ctx, input);
          break;
        case 'aurora':
          this.playAuroraTone(ctx, input);
          break;
        case 'harp':
          this.playMelodicHarp(ctx, input);
          break;
        case 'pop':
          this.playPopAccent(ctx, input);
          break;
        case 'default':
        default:
          this.playDefaultChime(ctx, input);
          break;
      }
    } catch (err) {
      // Graceful fallback
    }
  }
}

export const SoundService = new SoundEngine();
