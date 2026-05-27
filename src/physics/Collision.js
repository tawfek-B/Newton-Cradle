import * as THREE from 'three';
import { COLLISION } from '../core/Constants.js';

// =====================================================
// COLLISION DETECTION
// =====================================================
// Checks whether two balls are overlapping.
// From the report: collision occurs if distance < r1 + r2

export function detectCollision(ball1, ball2) {
    const dist = ball1.pos.distanceTo(ball2.pos);
    const minDist = ball1.radius + ball2.radius;
    return dist < minDist;
}

// =====================================================
// COLLISION GEOMETRY
// =====================================================
// Normal direction: n = (p2 - p1) / |p2 - p1|
// This is the line connecting the centers of the two colliding balls

export function getCollisionNormal(ball1, ball2) {
    const n = new THREE.Vector3()
        .copy(ball2.pos)
        .sub(ball1.pos);

    const len = n.length();

    if (len < 1e-10) {
        // Balls are exactly on top of each other — pick a default direction
        n.set(1, 0, 0);
        return n;
    }

    return n.divideScalar(len);
}

// =====================================================
// CONTACT DEFORMATION (Overlap calculation)
// From the report: x = r1 + r2 - d  (contact deformation)
// If x > 0, compression occurs

export function getContactDeformation(ball1, ball2) {
    const dist = ball1.pos.distanceTo(ball2.pos);
    return Math.max(0, ball1.radius + ball2.radius - dist);
}

// =====================================================
// IMPULSE-BASED COLLISION RESOLUTION
// =====================================================
// From the report (التطبيق العملي والقوانين الشاملة):
//
// Normal collision coefficient:
//   n = (p2 - p1) / |p2 - p1|
//
// Relative velocity along normal:
//   v_rel = (v1 - v2) · n
//
// Impulse magnitude (with restitution):
//   j = -(1 + e) * v_rel / (1/m1 + 1/m2)
//
// New velocities:
//   v1_new = v1 + (j / m1) * n
//   v2_new = v2 - (j / m2) * n
//
// Momentum conservation:
//   m1*v1 + m2*v2 = m1*v1_new + m2*v2_new
//
// Energy loss after collision:
//   E_lost = (1 - e^2) * (1/2) * mu * v_rel^2
//   where mu = reduced mass = m1*m2 / (m1 + m2)
//
// IMPORTANT: Position separation (separateBalls) is ALWAYS
// called regardless of vRel sign. Even if balls are moving
// apart, they may still be overlapping and must be separated.

export function resolveCollision(ball1, ball2) {
    // Don't resolve if balls are unaffected by collision
    if (ball1.mass <= 0 || ball2.mass <= 0) {
        // Still separate overlapping balls
        separateBalls(ball1, ball2);
        return { impulse: 0, energyLost: 0 };
    }

    // Get collision normal (from ball1 to ball2)
    const n = getCollisionNormal(ball1, ball2);

    // Relative velocity along collision normal
    const vRel = ball1.vel.clone()
        .sub(ball2.vel)
        .dot(n);

    let j = 0;
    let energyLost = 0;

    // Only apply impulse if balls are approaching (vRel > 0).
    // vRel = (v1 - v2) · n where n points from ball1 to ball2.
    //
    // IMPORTANT sign convention:
    //   n points from ball1 TO ball2 (e.g., from ball4 to ball5).
    //   If ball2 (e.g., ball5) is moving toward ball1 (in -n direction),
    //   then v1 - v2 = 0 - (-v) = v > 0 → vRel > 0 means APPROACHING.
    //
    // When approaching (vRel > 0):
    //   j = -(1+e) * vRel / (1/m1 + 1/m2) → j < 0
    //   ball1 gets j/m1 * n → pushed in -n direction (away from ball2)
    //   ball2 gets -j/m2 * n → pushed in +n direction (away from ball1)
    //
    // If separating (vRel <= 0), just separate positions.
    if (vRel > 0) {
        // Effective restitution (average of both materials)
        const e = (ball1.restitution + ball2.restitution) / 2;

        // Inverse masses
        const invMass1 = 1.0 / Math.max(ball1.mass, 1e-10);
        const invMass2 = 1.0 / Math.max(ball2.mass, 1e-10);

        // Impulse magnitude: j = -(1 + e) * v_rel / (1/m1 + 1/m2)
        j = -(1 + e) * vRel / (invMass1 + invMass2);

        // Apply impulse
        const impulseVec = n.clone().multiplyScalar(j);
        ball1.vel.add(impulseVec.clone().multiplyScalar(invMass1));
        ball2.vel.sub(impulseVec.clone().multiplyScalar(invMass2));

        // Energy lost due to inelastic collision
        const reducedMass = 1.0 / (invMass1 + invMass2);
        energyLost = (1 - e * e) * 0.5 * reducedMass * vRel * vRel;
    }

    // =====================================================
    // ALWAYS separate overlapping balls (critical!)
    // =====================================================
    // Even if vRel >= 0 (balls separating), they may still
    // be geometrically overlapping. The position correction
    // must run every time to prevent persistent clipping.

    const sepDelta = separateBalls(ball1, ball2);

    return {
        impulse: Math.abs(j),
        energyLost: Math.abs(energyLost),
        normal: n,
        separated: sepDelta
    };
}

// =====================================================
// POSITION CORRECTION (Separation)
// =====================================================
// Separates overlapping balls by pushing them apart.
// Correction is distributed based on inverse mass ratio.
// Returns the separation delta applied to ball1 (so callers
// can update rope nodes accordingly).

function separateBalls(ball1, ball2) {
    const dist = ball1.pos.distanceTo(ball2.pos);
    const overlap = (ball1.radius + ball2.radius) - dist;

    if (overlap <= COLLISION.SEPARATION_EPSILON) {
        return 0;
    }

    const n = getCollisionNormal(ball1, ball2);

    // Distribute correction inversely proportional to mass
    const inv1 = 1.0 / Math.max(ball1.mass, 1e-10);
    const inv2 = 1.0 / Math.max(ball2.mass, 1e-10);
    const totalInvMass = inv1 + inv2;

    const ratio1 = inv1 / totalInvMass;
    const ratio2 = inv2 / totalInvMass;

    const correction = n.clone().multiplyScalar(overlap);

    ball1.pos.sub(correction.clone().multiplyScalar(ratio1));
    ball2.pos.add(correction.clone().multiplyScalar(ratio2));

    // Return the magnitude of the correction applied to ball1
    // so rope nodes can be shifted by the same amount
    return overlap * ratio1;
}

// =====================================================
// HERTZIAN CONTACT FORCE (Alternative continuous method)
// =====================================================
// From the report: F = k_h * x^(3/2) + d_h * x_dot
// where:
//   k_h = (4/3) * E_eff * sqrt(R_eff)
//   E_eff = effective Young's modulus
//   R_eff = effective radius = R1*R2 / (R1 + R2)
//   x = contact deformation (overlap)
//   x_dot = rate of deformation
//
// This is an alternative to impulse-based collision.
// It produces more realistic force-over-time behavior
// but requires very small time steps.

export function computeHertzianForce(ball1, ball2) {
    const dist = ball1.pos.distanceTo(ball2.pos);
    const overlap = ball1.radius + ball2.radius - dist;

    if (overlap <= 0) {
        return new THREE.Vector3();
    }

    // Effective radius
    const R_eff = (ball1.radius * ball2.radius)
                / (ball1.radius + ball2.radius);

    // Hertzian stiffness: k_h = (4/3) * E_eff * sqrt(R_eff)
    // Using a simplified constant for the simulation
    const k_h = COLLISION.HERTZ_STIFFNESS;

    // Force magnitude: F = k_h * x^(3/2)
    const forceMag = k_h * Math.pow(overlap, 1.5);

    // Damping: d_h * x_dot
    const n = getCollisionNormal(ball1, ball2);
    const vRel = ball1.vel.clone()
        .sub(ball2.vel)
        .dot(n);

    const dampingForce = COLLISION.HERTZ_DAMPING * Math.max(0, -vRel) * overlap;

    // Total force
    const totalForceMag = forceMag + dampingForce;

    // Force direction (push balls apart)
    const forceVec = n.clone().multiplyScalar(totalForceMag);

    return forceVec;
}