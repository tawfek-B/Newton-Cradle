import { SoundManager } from './SoundManager.js';
import { COLLISION } from '../core/Constants.js';

export function playCollisionSound(
    impactVelocity,
    materialType1 = 'metal',
    materialType2 = 'metal',
    ballRadius = 0.2
) {
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
