import * as THREE from 'three';

export function enforceRopeConstraint(ball) {
    const r = ball.pos.clone().sub(ball.pivot);
    const dist = r.length();

    if (dist <= ball.length) return;

    const correction = r.multiplyScalar((dist - ball.length) / dist);
    ball.pos.sub(correction);

    const normal = correction.clone().normalize();
    const radialVel = normal.clone().multiplyScalar(ball.vel.dot(normal));
    ball.vel.sub(radialVel);
}

export function getRopeGeometry(ball) {
    const r = ball.pos.clone().sub(ball.pivot);
    const dist = r.length();
    let rHat;

    if (dist > 1e-8) {
        rHat = r.clone().divideScalar(dist);
    } else {
        rHat = new THREE.Vector3(0, -1, 0);
    }

    return { r, dist, rHat, isTaut: dist > ball.length };
}

export function applyTautConstraint(ball, dt, g, damping, isTaut) {
    if (!isTaut) return;

    ball.alpha = -(g / ball.length) * Math.sin(ball.theta);
    ball.omega += ball.alpha * dt;

    if (damping > 0) {
        ball.omega *= Math.exp(-damping * dt);
    }

    ball.theta += ball.omega * dt;

    ball.pos.set(
        ball.pivot.x + ball.length * Math.sin(ball.theta),
        ball.pivot.y - ball.length * Math.cos(ball.theta),
        0
    );

    ball.vel.set(
        ball.length * ball.omega * Math.cos(ball.theta),
        ball.length * ball.omega * Math.sin(ball.theta),
        0
    );
}

export function updateAngularAndAcceleration(ball, r, rHat, gravity, g) {
    ball.theta = Math.atan2(rHat.x, -rHat.y);

    const tangent = new THREE.Vector3(-rHat.y, rHat.x, 0);
    const tangentialSpeed = ball.vel.dot(tangent);
    ball.omega = tangentialSpeed / Math.max(ball.length, 1e-6);

    const r2 = r.lengthSq();
    if (r2 > 1e-8) {
        const omegaZ = (r.x * ball.vel.y - r.y * ball.vel.x) / r2;
        ball.omegaVec.set(0, 0, omegaZ);
    } else {
        ball.omegaVec.set(0, 0, 0);
    }

    ball.alpha = -(g / Math.max(ball.length, 1e-6)) * Math.sin(ball.theta);
    ball.alphaVec.set(0, 0, ball.alpha);

    const speedSq = ball.vel.lengthSq();
    const a_c_mag = speedSq / Math.max(ball.length, 1e-6);

    ball.acc_centripetal = rHat.clone().multiplyScalar(-a_c_mag);

    const g_radial = rHat.clone().multiplyScalar(gravity.dot(rHat));
    ball.acc_tangential = gravity.clone().sub(g_radial);
    ball.acc = ball.acc_tangential.clone().add(ball.acc_centripetal);

    return { speedSq, a_c_mag };
}

export function updateTension(ball, rHat, a_c_mag, g, isTaut) {
    const uA = ball.anchorA.clone().sub(ball.pos);
    const uB = ball.anchorB.clone().sub(ball.pos);

    if (uA.lengthSq() > 1e-8) uA.normalize();
    if (uB.lengthSq() > 1e-8) uB.normalize();

    let TA = 0;
    let TB = 0;

    if (isTaut) {
        const T_total = ball.mass * (a_c_mag + g * Math.cos(ball.theta));
        const v1 = T_total * uA.dot(rHat);
        const v2 = T_total * uB.dot(rHat);
        const m11 = uA.dot(uA);
        const m12 = uA.dot(uB);
        const m22 = uB.dot(uB);
        const det = m11 * m22 - m12 * m12;

        if (Math.abs(det) > 1e-8) {
            // Solve for TA and TB using the determinant
            TA = (v1 * m22 - v2 * m12) / -det;
            TB = (v2 * m11 - v1 * m12) / -det;

            // Ensure TA and TB are positive (tension cannot be negative)
            TA = Math.max(0, TA);
            TB = Math.max(0, TB);
        } else {
            // If determinant is too small, approximate tension as evenly distributed
            TA = TB = T_total / 2;
        }
    } else {
        // If the rope is not taut, tension should be zero
        TA = 0;
        TB = 0;
    }

    // Update ball's tension properties
    ball.TA = TA;
    ball.TB = TB;

    ball.tensionA = uA.clone().multiplyScalar(TA);
    ball.tensionB = uB.clone().multiplyScalar(TB);

    ball.tensionDir =
        ball.tensionA.clone()
            .add(ball.tensionB);

    const tensionMagnitude =
        ball.tensionDir.length();

    ball.spinTorque =
        tensionMagnitude * 0.0002;
}