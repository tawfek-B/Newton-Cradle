import { SoundManager } from './SoundManager.js';
import { COLLISION } from '../core/Constants.js';

// =====================================================
// COLLISION SOUND GENERATION
// =====================================================
// Generates audio feedback when two balls collide.
// Sound characteristics depend on:
//   - Impact velocity (determines volume/pitch)
//   - Material type (determines frequency/timbre)
//   - Ball size (determines resonance)
//
// From the report: Sound energy comes from the deformation
// of balls during collision — part of the stored elastic
// energy radiates outward as sound waves.
//
// Frequency mapping (empirical, based on real materials):
//   Metal  → high frequency, bright, ringing (800-1200 Hz)
//   Wood   → mid frequency, dull thud (300-500 Hz)
//   Rubber → low frequency, soft thump (100-250 Hz)

export function playCollisionSound(
    impactVelocity,
    materialType1 = 'metal',
    materialType2 = 'metal',
    ballRadius = 0.2
) {
    // Skip sounds for very small impacts
    if (impactVelocity < COLLISION.MIN_IMPULSE_FOR_SOUND) {
        return;
    }

    const sm = SoundManager.getInstance();

    if (sm.isMuted()) {
        return;
    }

    sm.playCollisionSound(
        impactVelocity,
        materialType1,
        materialType2,
        ballRadius
    );
}