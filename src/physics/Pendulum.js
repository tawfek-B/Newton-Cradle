import * as THREE from 'three';

import { MATERIALS, PHYSICS } from '../core/Constants.js';

import {
    getRopeGeometry,
    updateAngularAndAcceleration,
    updateTension
} from './Constraints.js';

import {
    applyElasticRopeForces
} from './RopePhysics.js';

import { applyDamping } from './Damping.js';

import { updateEnergyState } from './Energy.js';

import {
    integrateSemiImplicitEuler
} from './Integrator.js';

function isFiniteVec3(v) {
    return Number.isFinite(v.x)
        && Number.isFinite(v.y)
        && Number.isFinite(v.z);
}

function resetBallToSafeState(ball) {
    ball.pos.set(
        ball.pivot.x +
        Math.sin(ball.theta) * ball.length,
        ball.pivot.y -
        Math.cos(ball.theta) * ball.length,
        0
    );
    ball.vel.set(0, 0, 0);
    if (ball.resetRopes) {
        ball.resetRopes();
    }
}

export function stepPendulumSubstep(ball, h, damping, gravityVec, dampingToggles) {
    const totalForce =
        gravityVec.clone()
            .multiplyScalar(ball.mass);

    if (ball.ropeA && ball.ropeB) {
        const ropeForce =
            applyElasticRopeForces(ball, h, gravityVec);
        totalForce.add(ropeForce);
    }

    const accel =
        totalForce.multiplyScalar(
            1 / Math.max(ball.mass, 1e-6)
        );

    integrateSemiImplicitEuler(ball, accel, h);
    applyDamping(ball, h, damping, MATERIALS[ball.currentMaterialType.toUpperCase()].damping, dampingToggles);

    if (PHYSICS.AIR_DRAG_QUADRATIC > 0) {
        const speed = ball.vel.length();
        if (speed > 0) {
            const quadFactor = 1 - PHYSICS.AIR_DRAG_QUADRATIC * speed * h;
            // ball.vel.multiplyScalar(Math.max(0, quadFactor));
            ball.omega *= Math.max(0, 1 - PHYSICS.AIR_DRAG_QUADRATIC * Math.abs(ball.omega) * h);
        }
    }

    const r = ball.pos.clone().sub(ball.pivot);
    const dist = r.length();

    if (dist > ball.length) {
        const rHat = r.clone().normalize();
        const stretch = dist - ball.length;
        const alpha = 0.5;
        ball.pos.sub(rHat.clone().multiplyScalar(stretch * alpha));

        const radialSpeed = ball.vel.dot(rHat);
        if (radialSpeed > 0) {
            ball.vel.sub(rHat.clone().multiplyScalar(radialSpeed));
        }
    }

    if (!isFiniteVec3(ball.pos) || !isFiniteVec3(ball.vel)) {
        resetBallToSafeState(ball);
        return false;
    }

    return true;
}

export function updatePendulum(ball, dt, damping = 0, g1 = PHYSICS.GRAVITY) {
    const g = g1;
    const gravity = new THREE.Vector3(0, -g, 0);
    const stableH = 1 / 2000;
    const substeps = Math.max(1, Math.ceil(dt / stableH));
    const h = dt / substeps;

    for (let s = 0; s < substeps; s++) {
        const ok = stepPendulumSubstep(ball, h, damping, gravity);
        if (!ok) break;
    }

    computePendulumAnalytics(ball, gravity, g);
}

export function computePendulumAnalytics(ball, gravityVec, g) {
    const {
        r: newR,
        rHat,
        isTaut
    } = getRopeGeometry(ball);

    let a_c_mag = 0;
    const analytics =
        updateAngularAndAcceleration(ball, newR, rHat, gravityVec, g);

    if (analytics) {
        a_c_mag = analytics.a_c_mag;
    }

    updateTension(ball, rHat, a_c_mag, g, isTaut);
    updateEnergyState(ball, g);
}