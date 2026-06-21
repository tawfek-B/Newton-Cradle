export function applyDamping(ball, dt, damping, materialDamping, dampingToggles) {
    const factor = Math.exp(-(dampingToggles[0] ? damping : 0 + dampingToggles[1] ? materialDamping: 0) * dt);

    ball.vel.multiplyScalar(factor);
    ball.omega *= factor;
}

export function applyOmegaDamping(ball, dt, damping, dampingToggles) {
    ball.omega *= Math.exp(-(dampingToggles ? damping : 0) * dt);
}

export function applyTemperatureDamping(ball, dt, heatLoss = 0, dampingToggles) {
    const factor = Math.exp(-heatLoss * dt);
    const temp = Math.max(0, (ball.temperature ?? 0) * factor);

    const motionFactor = dampingToggles[3] ? Math.exp(-0.002 * temp * dt) : 1;
    ball.vel.multiplyScalar(motionFactor);
    ball.omega *= motionFactor;

    ball.temperature = temp;
}

export function applySoundDamping(ball, dt, soundLoss = 0, dampingToggles) {
    const factor = Math.exp(-soundLoss * dt);
    const soundLevel = Math.max(0, (ball.soundLevel ?? 0) * factor);

    const motionFactor = dampingToggles[2] ? Math.exp(-0.001 * soundLevel * dt) : 1;
    ball.vel.multiplyScalar(motionFactor);
    ball.omega *= motionFactor;

    ball.soundLevel = soundLevel;
}
