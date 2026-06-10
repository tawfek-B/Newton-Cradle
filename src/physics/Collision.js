import * as THREE from 'three';
import { COLLISION } from '../core/Constants.js';
import { impulse } from '../utils/PhysicsUtils.js';

export function detectCollision(ball1, ball2) {
    const dist = ball1.pos.distanceTo(ball2.pos);
    const minDist = ball1.radius + ball2.radius;
    return dist < minDist;
}

export function getCollisionNormal(ball1, ball2) {
    const n = new THREE.Vector3()
        .copy(ball2.pos)
        .sub(ball1.pos);

    const len = n.length();

    if (len < 1e-10) {
        n.set(1, 0, 0);
        return n;
    }

    return n.divideScalar(len);
}

export function getContactDeformation(ball1, ball2) {
    const dist = ball1.pos.distanceTo(ball2.pos);
    return Math.max(0, ball1.radius + ball2.radius - dist);
}

// vRel = (v1 - v2) · n. Impulse: j = -(1+e)·vRel / (1/m1 + 1/m2)
export function resolveCollision(ball1, ball2) {
    if (ball1.mass <= 0 || ball2.mass <= 0) {
        separateBalls(ball1, ball2);
        return { impulse: 0, energyLost: 0 };
    }

    const n = getCollisionNormal(ball1, ball2);

    const vRel = ball1.vel.clone()
        .sub(ball2.vel)
        .dot(n);

    let j = 0;
    let energyLost = 0;

    if (vRel > 0) {
        const e = (ball1.restitution + ball2.restitution) / 2;

        const invMass1 = 1.0 / Math.max(ball1.mass, 1e-10);
        const invMass2 = 1.0 / Math.max(ball2.mass, 1e-10);

        j = impulse(ball1.mass, ball2.mass, vRel, 0, e);

        const impulseVec = n.clone().multiplyScalar(j);
        ball1.vel.add(impulseVec.clone().multiplyScalar(invMass1));
        ball2.vel.sub(impulseVec.clone().multiplyScalar(invMass2));

        const reducedMass = 1.0 / (invMass1 + invMass2);
        energyLost = (1 - e * e) * 0.5 * reducedMass * vRel * vRel;
    }

    const spinTransfer = 0.85;

    const avgSpin =
        (ball1.spinOmega +
            ball2.spinOmega) * 0.5;

    ball1.spinOmega =
        THREE.MathUtils.lerp(
            ball1.spinOmega,
            avgSpin,
            spinTransfer
        );

    ball2.spinOmega =
        THREE.MathUtils.lerp(
            ball2.spinOmega,
            avgSpin,
            spinTransfer
        );

    const sepDelta = separateBalls(ball1, ball2);

    return {
        impulse: Math.abs(j),
        energyLost: Math.abs(energyLost),
        normal: n,
        separated: sepDelta
    };
}

function separateBalls(ball1, ball2) {
    const dist = ball1.pos.distanceTo(ball2.pos);
    const overlap = (ball1.radius + ball2.radius) - dist;

    if (overlap <= COLLISION.SEPARATION_EPSILON) {
        return 0;
    }

    const n = getCollisionNormal(ball1, ball2);

    const inv1 = 1.0 / Math.max(ball1.mass, 1e-10);
    const inv2 = 1.0 / Math.max(ball2.mass, 1e-10);
    const totalInvMass = inv1 + inv2;

    const ratio1 = inv1 / totalInvMass;
    const ratio2 = inv2 / totalInvMass;

    const percent = 0.3;
    const slop = 0.0001;

    const correctionMag =
        Math.max(overlap - slop, 0) * percent;

    const correction =
        n.clone().multiplyScalar(correctionMag);

    ball1.pos.sub(correction.clone().multiplyScalar(ratio1));
    ball2.pos.add(correction.clone().multiplyScalar(ratio2));

    return overlap * ratio1;
}

export function computeHertzianForce(ball1, ball2) {
    const dist = ball1.pos.distanceTo(ball2.pos);
    const overlap = ball1.radius + ball2.radius - dist;

    if (overlap <= 0) {
        return new THREE.Vector3();
    }

    const R_eff = (ball1.radius * ball2.radius)
        / (ball1.radius + ball2.radius);

    const k_h = COLLISION.HERTZ_STIFFNESS;

    const forceMag = k_h * Math.pow(overlap, 1.5);

    const n = getCollisionNormal(ball1, ball2);
    const vRel = ball1.vel.clone()
        .sub(ball2.vel)
        .dot(n);

    const dampingForce = COLLISION.HERTZ_DAMPING * Math.max(0, -vRel) * overlap;

    const totalForceMag = forceMag + dampingForce;

    const forceVec = n.clone().multiplyScalar(totalForceMag);

    return forceVec;
}
