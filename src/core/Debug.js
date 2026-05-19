// Central debugging manager used for logs, debug drawing,
// performance monitoring, and development toggles.
import * as THREE from 'three';

function safeNormalize(v) {
    if (v.lengthSq() < 1e-8) {
        return new THREE.Vector3();
    }

    return v.clone().normalize();
}

export function createDebugArrow(
    color = 0xffffff,
    length = 1
) {
    return new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(),
        length,
        color
    );
}

export function updateArrow(
    arrow,
    origin,
    vector,
    scale = 1
) {

    if (!arrow) return;

    const len = vector.length();

    arrow.position.copy(origin);

    if (len < 1e-8) {
        arrow.setLength(0.0001);
        return;
    }

    arrow.setDirection(
        safeNormalize(vector)
    );

    arrow.setLength(len * scale);
}

export function updateBallDebug(
    ball,
    debug
) {

    if (!debug) return;

    // =========================================
    // VELOCITY
    // =========================================

    updateArrow(
        debug.velocity,
        ball.pos,
        ball.vel
    );

    // =========================================
    // TOTAL ACCELERATION
    // =========================================

    updateArrow(
        debug.acceleration,
        ball.pos,
        ball.acc
    );

    // =========================================
    // TANGENTIAL ACCELERATION
    // =========================================

    updateArrow(
        debug.tangential,
        ball.pos,
        ball.acc_tangential
    );

    // =========================================
    // CENTRIPETAL ACCELERATION
    // =========================================

    updateArrow(
        debug.centripetal,
        ball.pos,
        ball.acc_centripetal
    );

    // =========================================
    // TENSION
    // =========================================

    updateArrow(
        debug.tension,
        ball.pos,
        ball.tensionDir
    );

    // =========================================
    // WEIGHT
    // =========================================

    const weight =
        new THREE.Vector3(
            0,
            -9.81 * ball.mass,
            0
        );

    updateArrow(
        debug.weight,
        ball.pos,
        weight
    );
}

export function createBallDebug(
    scene
) {

    const debug = {

        velocity:
            createDebugArrow(0x00ff00),

        acceleration:
            createDebugArrow(0xff0000),

        tangential:
            createDebugArrow(0xffff00),

        centripetal:
            createDebugArrow(0x800080),

        tension:
            createDebugArrow(0x0000ff),

        weight:
            createDebugArrow(0x00ffff)
    };

    Object.values(debug).forEach(
        arrow => scene.add(arrow)
    );

    return debug;
}