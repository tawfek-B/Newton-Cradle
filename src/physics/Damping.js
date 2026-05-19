export function applyDamping(ball, dt, damping) {
    const factor = Math.exp(-damping * dt);

    ball.vel.multiplyScalar(factor);
    ball.omega *= factor;
}

export function applyOmegaDamping(ball, dt, damping) {
    ball.omega *= Math.exp(-damping * dt);
}