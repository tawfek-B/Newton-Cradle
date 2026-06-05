import * as THREE from "three";
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

    async initialize() {
        if (this.initialized) return;

        const ctx = this.getContext();

        if (!ctx) return;

        await ctx.resume();

        await this.loadBuffers();

        this.initialized = true;

        console.log('Sound initialized');
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

        const clamped = Math.max(0, Math.min(1, vol));

        const curved = Math.pow(clamped, 0.6);

        const threshold = 0.02;

        this.volume = curved < threshold ? 0 : curved;
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

    playCollisionSound(
        impactVelocity,
        materialType1 = 'metal',
        materialType2 = 'metal',
        ballRadius = 0.2
    ) {
        const ctx = this.getContext();

        if (!ctx || !this.loaded || this.muted) {
            return;
        }

        // Pick dominant material
        const primaryMat = materialType1 || materialType2 || 'metal';

        const buffer =
            this.buffers[primaryMat] ||
            this.buffers[materialType2] ||
            this.buffers.metal;

        if (!buffer) {
            return;
        }

        // Normalize collision strength
        const normalizedVelocity = Math.min(
            Math.max(impactVelocity / 600, 0),
            1
        );

        // Perceptual loudness curve
        // Makes softer hits more audible without
        // making loud hits painfully sharp
        let amplitude = Math.pow(normalizedVelocity, 0.65);

        // Radius affects resonance/impact weight
        // Larger balls sound slightly louder/deeper
        const radiusFactor = THREE.MathUtils.clamp(
            ballRadius / 0.2,
            0.75,
            1.5
        );

        amplitude *= radiusFactor;

        amplitude *= this.volume;

        amplitude = Math.min(amplitude, 0.9);

        switch (materialType1) {
            case 'rubber':
                amplitude *= 30;
                break;
            case 'wood':
                amplitude *= 275;    //sounds were too quiet with other materials
                break;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gain = ctx.createGain();

        const now = ctx.currentTime;
        const duration = buffer.duration;

        // Slight pitch variation adds realism
        source.playbackRate.value =
            0.97 + Math.random() * 0.06;

        // Larger balls sound slightly lower pitched
        source.playbackRate.value /= radiusFactor * 0.05 + 1;

        gain.gain.setValueAtTime(amplitude, now);

        // Fast transient attack
        gain.gain.linearRampToValueAtTime(
            amplitude * 0.85,
            now + 0.01
        );

        // Natural decay
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + duration * 0.8
        );

        source.connect(gain);
        gain.connect(ctx.destination);

        source.start(now);
        source.stop(now + duration);
    }
}
