import * as THREE from 'three';

import { PHYSICS } from '../core/Constants.js';

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

export function updatePendulum(
    ball,
    dt,
    damping = 0,
    g1 = PHYSICS.GRAVITY
) {

    const g = g1;

    const gravity =
        new THREE.Vector3(
            0,
            -g,
            0
        );

    // =====================================================
    // FULL SYSTEM SUBSTEPS
    // =====================================================

    const stableH =
        1 / 2000;

    const substeps =
        Math.max(
            1,
            Math.ceil(dt / stableH)
        );

    const h =
        dt / substeps;

    for (let s = 0; s < substeps; s++) {

        // =================================================
        // 1. TOTAL FORCE
        // =================================================

        const totalForce =
            gravity.clone()
                .multiplyScalar(ball.mass);

        if (ball.ropeA && ball.ropeB) {

            const ropeForce =
                applyElasticRopeForces(
                    ball,
                    h,
                    gravity
                );

            totalForce.add(
                ropeForce
            );
        }

        // =================================================
        // 2. ACCELERATION
        // =================================================

        const accel =
            totalForce.multiplyScalar(
                1 / Math.max(ball.mass, 1e-6)
            );

        // =================================================
        // 3. INTEGRATION
        // =================================================

        integrateSemiImplicitEuler(
            ball,
            accel,
            h
        );

        // =================================================
        // 4. GLOBAL DAMPING
        // =================================================

        applyDamping(
            ball,
            h,
            damping
        );

        // =================================================
        // 5. POSITION CORRECTION
        // =================================================

        const r =
            ball.pos.clone()
                .sub(ball.pivot);

        const dist =
            r.length();

        if (dist > ball.length) {

            const rHat =
                r.clone()
                    .normalize();

            const stretch =
                dist - ball.length;

            const alpha = 0.5;

            ball.pos.sub(
                rHat.clone()
                    .multiplyScalar(
                        stretch * alpha
                    )
            );

            // =============================================
            // RADIAL VELOCITY CORRECTION
            // =============================================

            const radialSpeed =
                ball.vel.dot(rHat);

            if (radialSpeed > 0) {

                ball.vel.sub(
                    rHat.clone()
                        .multiplyScalar(
                            radialSpeed * 0.2
                        )
                );
            }
        }

        // =================================================
        // 6. SAFETY
        // =================================================

        if (
            !isFiniteVec3(ball.pos)
            || !isFiniteVec3(ball.vel)
        ) {

            ball.pos.set(
                ball.pivot.x +
                Math.sin(ball.theta) * ball.length,

                ball.pivot.y -
                Math.cos(ball.theta) * ball.length,

                0
            );

            ball.vel.set(
                0,
                0,
                0
            );

            if (ball.resetRopes) {
                ball.resetRopes();
            }

            break;
        }
    }

    // =====================================================
    // ANALYTICS
    // =====================================================

    const {
        r: newR,
        rHat,
        isTaut
    } = getRopeGeometry(ball);

    const {
        a_c_mag
    } =
        updateAngularAndAcceleration(
            ball,
            newR,
            rHat,
            gravity,
            g
        );

    updateTension(
        ball,
        rHat,
        a_c_mag,
        g,
        isTaut
    );

    // =====================================================
    // ENERGY
    // =====================================================

    updateEnergyState(
        ball,
        g
    );
}