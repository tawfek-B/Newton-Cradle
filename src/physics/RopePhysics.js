import * as THREE from 'three';
import { clamp } from '../utils/MathUtils.js';

function isFiniteVec3(v) {
    return Number.isFinite(v.x)
        && Number.isFinite(v.y)
        && Number.isFinite(v.z);
}

function clampVecLength(v, maxLen) {
    const len = v.length();
    if (len > maxLen && len > 1e-8) {
        v.multiplyScalar(maxLen / len);
    }
}

function stepSingleRope(rope, dt, gravity, outForce) {
    const ball = rope.ball;
    const nodes = rope.nodes;
    const vels = rope.vels;

    if (!nodes || nodes.length === 0) return;

    const endpoint = rope.getTargetEndpoint();
    const links = nodes.length + 1;
    const segRest = Math.max(rope.restLength / links, 1e-4);
    const maxExt = segRest * 0.18;
    const extEps = segRest * 0.02;

    for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        const v = vels[i];

        const prevP = i === 0 ? rope.anchor : nodes[i - 1];
        const prevV = i === 0 ? new THREE.Vector3() : vels[i - 1];
        const nextP = i === nodes.length - 1 ? endpoint : nodes[i + 1];

        // Surface velocity for the last node: center vel + tangential velocity from spin
        let nextV;
        if (i === nodes.length - 1) {
            const leverArm = endpoint.clone().sub(ball.pos);
            // v_tangential = omega × r for Y-axis spin
            // omega = (0, spinOmega, 0), so v = (-spinOmega * r_z, 0, spinOmega * r_x)
            const tangentialVel = new THREE.Vector3(
                -ball.spinOmega * leverArm.z,
                0,
                ball.spinOmega * leverArm.x
            );
            
            nextV = ball.vel.clone()
                .add(tangentialVel.multiplyScalar(0.7));
        } else {
            nextV = vels[i + 1];
        }

        const dPrev = p.clone().sub(prevP);
        const dNext = nextP.clone().sub(p);
        const lenPrev = Math.max(dPrev.length(), 1e-6);
        const lenNext = Math.max(dNext.length(), 1e-6);
        const nPrev = dPrev.clone().divideScalar(lenPrev);
        const nNext = dNext.clone().divideScalar(lenNext);

        let extPrev = clamp(Math.max(0, lenPrev - segRest), 0, maxExt);
        let extNext = clamp(Math.max(0, lenNext - segRest), 0, maxExt);

        if (extPrev < extEps) extPrev = 0;
        if (extNext < extEps) extNext = 0;

        const relPrev = v.clone().sub(prevV).dot(nPrev);
        const relNext = nextV.clone().sub(v).dot(nNext);

        const dampPrev = extPrev > 0 ? -rope.damping * relPrev : 0;
        const dampNext = extNext > 0 ? rope.damping * relNext : 0;

        const fPrev = nPrev.clone().multiplyScalar(-rope.stiffness * extPrev + dampPrev);
        const fNext = nNext.clone().multiplyScalar(rope.stiffness * extNext + dampNext);
        const fGravity = gravity.clone().multiplyScalar(rope.nodeMass);
        const fAir = v.clone().multiplyScalar(-rope.airDrag * 1.5);

        const fTotal = fPrev.add(fNext).add(fGravity).add(fAir);
        const a = fTotal.multiplyScalar(1 / Math.max(rope.nodeMass, 1e-6));

        clampVecLength(a, 200);
        v.add(a.multiplyScalar(dt));
        clampVecLength(v, 15);

        if (!isFiniteVec3(v)) {
            v.set(0, 0, 0);
        }
    }

    for (let i = 0; i < nodes.length; i++) {
        nodes[i].add(vels[i].clone().multiplyScalar(dt));

        if (!isFiniteVec3(nodes[i])) {
            nodes[i].copy(rope.anchor);
            vels[i].set(0, 0, 0);
        }
    }

    const tail = nodes[nodes.length - 1];
    const tailVel = vels[vels.length - 1];
    const dTail = endpoint.clone().sub(tail);
    const lenTail = Math.max(dTail.length(), 1e-6);
    const nTail = dTail.clone().divideScalar(lenTail);

    let extTail = clamp(Math.max(0, lenTail - segRest), 0, maxExt);
    if (extTail < extEps) extTail = 0;

    // Use surface velocity for relative velocity calculation
    const leverArm = endpoint.clone().sub(ball.pos);
    const tangentialVel = new THREE.Vector3(
        -ball.spinOmega * leverArm.z,
        0,
        ball.spinOmega * leverArm.x
    );
    const surfaceVel = ball.vel.clone().add(tangentialVel);
    const relTail = surfaceVel.clone().sub(tailVel).dot(nTail);

    const pullDamping = extTail > 0 ? -rope.damping * relTail : 0;
    const pullMag = rope.stiffness * extTail + pullDamping;
    const fTail = nTail.clone().multiplyScalar(-pullMag);

    outForce.add(fTail);

    // Compute torque from rope force at surface point
    // tau = r × F where r = lever arm, F = fTail
    // Y component (spin axis): tau_y = r_z * F_x - r_x * F_z
    const torqueY = leverArm.z * fTail.x - leverArm.x * fTail.z;

    // Scale by substep size (dt = h) to get angular impulse for this substep.
    // This is critical: stepSingleRope is called N times per frame, and without
    // scaling, the accumulated torque would be overestimated by Nx.
    const angularImpulse = torqueY * dt;
    ball.spinTorque += angularImpulse;
}

export function applyElasticRopeForces(ball, dt, gravity) {
    if (!ball.ropeA || !ball.ropeB) {
        return new THREE.Vector3();
    }

    const ropeForce = new THREE.Vector3();
    stepSingleRope(ball.ropeA, dt, gravity, ropeForce);
    stepSingleRope(ball.ropeB, dt, gravity, ropeForce);

    clampVecLength(ropeForce, 1000);

    // Clamp total angular impulse after both ropes have contributed
    const MAX_IMPULSE = 10;
    ball.spinTorque = Math.max(-MAX_IMPULSE, Math.min(MAX_IMPULSE, ball.spinTorque));

    return ropeForce;
}