export class SoundManager {
    static #instance = null;

    constructor() {
        this.ctx = null;
        this.volume = 0.3;
        this.muted = false;
        this.initialized = false;
        this.buffers = {};
        this.loaded = false;
    }

    static getInstance() {
        if (!SoundManager.#instance) {
            SoundManager.#instance = new SoundManager();
        }
        return SoundManager.#instance;
    }

    getContext() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('SoundManager: Web Audio API not available');
                return null;
            }
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    async loadBuffers() {
        if (this.loaded) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const files = {
            metal: '/metal.mp3',
            rubber: '/rubber.mp3',
            wood: '/wood.mp3'
        };

        try {
            const entries = await Promise.all(
                Object.entries(files).map(async ([key, url]) => {
                    const resp = await fetch(url);
                    const arrayBuffer = await resp.arrayBuffer();
                    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                    return [key, audioBuffer];
                })
            );
            this.buffers = Object.fromEntries(entries);
            this.loaded = true;
        } catch (e) {
            console.warn('SoundManager: Failed to load audio files, collisions will be silent');
        }
    }

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

    playCollisionSound(impactVelocity, materialType1 = 'metal', materialType2 = 'metal', ballRadius = 0.2) {
        const ctx = this.getContext();
        if (!ctx) return;

        if (!this.loaded) {
            this.loadBuffers();
            return;
        }

        const primaryMat = materialType1;
        let buffer = this.buffers[primaryMat] || this.buffers.metal;
        if (!buffer) return;

        const amplitude = Math.min(this.volume * impactVelocity * 3, 0.5);
        if (amplitude < 0.001) return;

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gain = ctx.createGain();
        const now = ctx.currentTime;
        const duration = buffer.duration;

        gain.gain.setValueAtTime(amplitude, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        source.connect(gain);
        gain.connect(ctx.destination);

        source.start(now);
        source.stop(now + duration);
    }
}
