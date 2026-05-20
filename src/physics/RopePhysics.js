import * as THREE from 'three';

function isFiniteVec3(v) {

    return Number.isFinite(v.x)
        && Number.isFinite(v.y)
        && Number.isFinite(v.z);
}

function clampVecLength(v, maxLen) {

    const len = v.length();

    if (len > maxLen && len > 1e-8) {

        v.multiplyScalar(
            maxLen / len
        );
    }
}

// =====================================================
// SINGLE ROPE STEP
// =====================================================

function stepSingleRope(
    rope,
    dt,
    gravity,
    outForce
) {

    const ball =
        rope.ball;

    const nodes =
        rope.nodes;

    const vels =
        rope.vels;

    if (!nodes || nodes.length === 0) {
        return;
    }

    const links =
        nodes.length + 1;

    const segRest =
        Math.max(
            rope.restLength / links,
            1e-4
        );

    const maxExt =
        segRest * 0.1;

    const extEps =
        segRest * 0.02;

    // =====================================================
    // NODE PHYSICS
    // =====================================================

    for (let i = 0; i < nodes.length; i++) {

        const p =
            nodes[i];

        const v =
            vels[i];

        const prevP =
            i === 0
                ? rope.anchor
                : nodes[i - 1];

        const prevV =
            i === 0
                ? new THREE.Vector3()
                : vels[i - 1];

        const nextP =
            i === nodes.length - 1
                ? ball.pos
                : nodes[i + 1];

        const nextV =
            i === nodes.length - 1
                ? ball.vel
                : vels[i + 1];

        // =====================================================
        // SPRING GEOMETRY
        // =====================================================

        const dPrev =
            p.clone().sub(prevP);

        const dNext =
            nextP.clone().sub(p);

        const lenPrev =
            Math.max(
                dPrev.length(),
                1e-6
            );

        const lenNext =
            Math.max(
                dNext.length(),
                1e-6
            );

        const nPrev =
            dPrev.clone()
                .divideScalar(lenPrev);

        const nNext =
            dNext.clone()
                .divideScalar(lenNext);

        let extPrev =
            THREE.MathUtils.clamp(
                Math.max(0, lenPrev - segRest),
                0,
                maxExt
            );

        let extNext =
            THREE.MathUtils.clamp(
                Math.max(0, lenNext - segRest),
                0,
                maxExt
            );

        if (extPrev < extEps) extPrev = 0;
        if (extNext < extEps) extNext = 0;

        // =====================================================
        // DAMPING
        // =====================================================

        const relPrev =
            v.clone()
                .sub(prevV)
                .dot(nPrev);

        const relNext =
            nextV.clone()
                .sub(v)
                .dot(nNext);

        const dampPrev =
            extPrev > 0
                ? -rope.damping * relPrev
                : 0;

        const dampNext =
            extNext > 0
                ? rope.damping * relNext
                : 0;

        // =====================================================
        // FORCES
        // =====================================================

        const fPrev =
            nPrev.clone()
                .multiplyScalar(
                    -rope.stiffness * extPrev +
                    dampPrev
                );

        const fNext =
            nNext.clone()
                .multiplyScalar(
                    rope.stiffness * extNext +
                    dampNext
                );

        const fGravity =
            gravity.clone()
                .multiplyScalar(
                    rope.nodeMass
                );

        const fAir =
            v.clone()
                .multiplyScalar(
                    -rope.airDrag
                );

        const fTotal =
            fPrev
                .add(fNext)
                .add(fGravity)
                .add(fAir);

        // =====================================================
        // INTEGRATION
        // =====================================================

        const a =
            fTotal.multiplyScalar(
                1 / Math.max(
                    rope.nodeMass,
                    1e-6
                )
            );

        clampVecLength(a, 200);

        v.add(
            a.multiplyScalar(dt)
        );

        clampVecLength(v, 15);

        if (!isFiniteVec3(v)) {

            v.set(0, 0, 0);
        }
    }

    // =====================================================
    // POSITION UPDATE
    // =====================================================

    for (let i = 0; i < nodes.length; i++) {

        nodes[i].add(
            vels[i]
                .clone()
                .multiplyScalar(dt)
        );

        if (!isFiniteVec3(nodes[i])) {

            nodes[i].copy(
                rope.anchor
            );

            vels[i].set(
                0,
                0,
                0
            );
        }
    }

    // =====================================================
    // BALL PULL FORCE
    // =====================================================

    const tail =
        nodes[nodes.length - 1];

    const tailVel =
        vels[vels.length - 1];

    const dTail =
        ball.pos.clone()
            .sub(tail);

    const lenTail =
        Math.max(
            dTail.length(),
            1e-6
        );

    const nTail =
        dTail.clone()
            .divideScalar(lenTail);

    let extTail =
        THREE.MathUtils.clamp(
            Math.max(0, lenTail - segRest),
            0,
            maxExt
        );

    if (extTail < extEps) {
        extTail = 0;
    }

    const relTail =
        ball.vel.clone()
            .sub(tailVel)
            .dot(nTail);

    const pullDamping =
        extTail > 0
            ? -rope.damping * relTail
            : 0;

    const pullMag =
        rope.stiffness * extTail +
        pullDamping;

    const fTail =
        nTail.clone()
            .multiplyScalar(-pullMag);

    outForce.add(fTail);
}

// =====================================================
// FULL ELASTIC SYSTEM
// =====================================================

export function applyElasticRopeForces(
    ball,
    dt,
    gravity
) {

    if (!ball.ropeA || !ball.ropeB) {

        return new THREE.Vector3();
    }

    const ropeForce =
        new THREE.Vector3();

    stepSingleRope(
        ball.ropeA,
        dt,
        gravity,
        ropeForce
    );

    stepSingleRope(
        ball.ropeB,
        dt,
        gravity,
        ropeForce
    );

    clampVecLength(
        ropeForce,
        1000
    );

    return ropeForce;
}