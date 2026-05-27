// =====================================================
// SOUND MANAGER
// =====================================================
// Singleton that manages the Web Audio API context
// and generates collision sounds procedurally.
//
// Uses a single AudioContext created on first user interaction.
// Sound is synthesized (no external audio files needed):
//   - Oscillator with frequency dependent on material
//   - Gain envelope for natural decay
//   - Volume proportional to impact velocity
//
// From the report (الفكرة السادسة: التبدد - Sound Energy):
// "جزء من عملية تشوه الطاقة فتشع تلك الطاقة للخارج على شكل صوت"
// (Part of the deformation process radiates energy outward as sound)

export class SoundManager {
    static #instance = null;

    constructor() {
        this.ctx = null;
        this.volume = 0.3;
        this.muted = false;
        this.initialized = false;
    }

    // =====================================================
    // SINGLETON
    // =====================================================

    static getInstance() {
        if (!SoundManager.#instance) {
            SoundManager.#instance = new SoundManager();
        }
        return SoundManager.#instance;
    }

    // =====================================================
    // AUDIO CONTEXT (lazy init on first interaction)
    // =====================================================

    getContext() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext
                    || window.webkitAudioContext)();
            } catch (e) {
                console.warn(
                    'SoundManager: Web Audio API not available'
                );
                return null;
            }
        }

        // Resume if suspended (browser autoplay policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        return this.ctx;
    }

    // =====================================================
    // VOLUME / MUTE
    // =====================================================

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    getVolume() {
        return this.volume;
    }

    setMuted(muted) {
        this.muted = muted;
    }

    isMuted() {
        return this.muted;
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    // =====================================================
    // COLLISION SOUND SYNTHESIS
    // =====================================================
    // Procedurally generates a short impact sound using:
    //   - Sine wave oscillator
    //   - Quick frequency decay (pitch drop for realism)
    //   - Exponential gain ramp (natural sound decay)
    //   - Volume scaled by impact velocity

    playCollisionSound(
        impactVelocity,
        materialType1 = 'metal',
        materialType2 = 'metal',
        ballRadius = 0.2
    ) {
        const ctx = this.getContext();

        if (!ctx) return;

        // =====================================================
        // MATERIAL FREQUENCY MAP
        // =====================================================
        // Each material has a characteristic sound frequency
        // based on its stiffness and density

        const freqMap = {
            metal:  800 + Math.random() * 100,
            rubber: 200 + Math.random() * 50,
            wood:   400 + Math.random() * 80
        };

        const baseFreq = (
            (freqMap[materialType1] || freqMap.metal)
          + (freqMap[materialType2] || freqMap.metal)
        ) / 2;

        // Larger balls produce lower frequencies
        const sizeFactor = 0.2 / Math.max(ballRadius, 0.01);
        const freq = baseFreq * sizeFactor;

        // =====================================================
        // VOLUME / AMPLITUDE
        // =====================================================
        // Volume scales with impact velocity but caps at 0.5
        // to prevent harsh sounds

        const amplitude = Math.min(
            this.volume * impactVelocity * 3,
            0.5
        );

        if (amplitude < 0.001) return;

        // =====================================================
        // SOUND DURATION
        // =====================================================
        // Harder hits produce slightly longer sounds
        // Metal rings longer than rubber or wood

        const durationMap = {
            metal:  0.15,
            rubber: 0.06,
            wood:   0.08
        };

        const avgDuration = (
            (durationMap[materialType1] || durationMap.metal)
          + (durationMap[materialType2] || durationMap.metal)
        ) / 2;

        const duration = avgDuration * (1 + impactVelocity * 0.5);

        // =====================================================
        // AUDIO GRAPH SETUP
        // =====================================================

        const now = ctx.currentTime;

        // --- Oscillator (tone generator) ---
        const osc = ctx.createOscillator();
        osc.type = 'sine';

        // Frequency: starts at base, drops quickly
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(
            Math.max(freq * 0.4, 50),
            now + duration
        );

        // --- Gain envelope (volume control) ---
        const gain = ctx.createGain();

        // Attack: instant, then exponential decay
        gain.gain.setValueAtTime(amplitude, now);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + duration
        );

        // --- Connect and play ---
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }
}