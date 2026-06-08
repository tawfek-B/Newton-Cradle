import * as THREE from 'three';

import {
    stepPendulumSubstep,
    computePendulumAnalytics
} from '../physics/Pendulum.js';

import { computeEnergy } from '../physics/Energy.js';

import {
    detectCollision,
    resolveCollision
} from '../physics/Collision.js';

import {
    playCollisionSound
} from '../audio/CollisionAudio.js';

import { PHYSICS, COLLISION } from '../core/Constants.js';

import { degToRad } from '../utils/MathUtils.js';
import { project } from '../utils/VectorUtils.js';

const STABLE_H = 1 / 2000;

export class CradleSystem {

    constructor(balls) {
        this.balls = balls;
        this.audioEnabled = true;
        this.prevCollisionPairs = new Set();
    }

    #pairId(i, j) {
        return `${Math.min(i, j)}-${Math.max(i, j)}`;
    }

    #projectBallToArc(ball) {
        const dx = ball.pos.x - ball.pivot.x;
        const dy = ball.pos.y - ball.pivot.y;

        const theta = Math.atan2(dx, -dy);

        ball.pos.set(
            ball.pivot.x + ball.length * Math.sin(theta),
            ball.pivot.y - ball.length * Math.cos(theta),
            0
        );

        ball.theta = theta;

        const radialX = Math.sin(theta);
        const radialY = -Math.cos(theta);

        const radialVel = project(ball.vel, new THREE.Vector3(radialX, radialY, 0));
        ball.vel.sub(radialVel);

        const tangentDirX = Math.cos(theta);
        const tangentDirY = Math.sin(theta);
        ball.omega = (
            ball.vel.x * tangentDirX +
            ball.vel.y * tangentDirY
        ) / Math.max(ball.length, 1e-6);
    }

    #shiftRopeNodes(ball, displacement) {
        const len = displacement.length();
        if (len < 1e-10) return;

        if (ball.ropeA && ball.ropeA.nodes) {
            for (const node of ball.ropeA.nodes) {
                node.add(displacement);
            }
        }

        if (ball.ropeB && ball.ropeB.nodes) {
            for (const node of ball.ropeB.nodes) {
                node.add(displacement);
            }
        }
    }

    update(
        dt,
        globalDamping = 0,
        gravity = PHYSICS.GRAVITY
    ) {
        if (!this.balls || this.balls.length === 0) {
            return;
        }

        const substeps = Math.max(
            1,
            Math.ceil(dt / STABLE_H)
        );

        const h = dt / substeps;

        const gravityVec = new THREE.Vector3(0, -gravity, 0);

        // Apply air damping only when user sets global damping > 0
        const effectiveDamping = globalDamping > 0
            ? PHYSICS.AIR_DAMPING + globalDamping
            : 0;

        const currentCollisionPairs = new Set();

        for (let s = 0; s < substeps; s++) {

            for (let b = 0; b < this.balls.length; b++) {
                const ball = this.balls[b];

                const ok = stepPendulumSubstep(
                    ball,
                    h,
                    effectiveDamping,
                    gravityVec
                );

                if (!ok) break;
            }

            const cascadeIters = COLLISION.CASCADE_ITERATIONS;

            for (let ci = 0; ci < cascadeIters; ci++) {

                let anyCollision = false;

                for (let i = 0; i < this.balls.length; i++) {
                    for (let j = i + 1; j < this.balls.length; j++) {

                        const b1 = this.balls[i];
                        const b2 = this.balls[j];

                        if (!b1 || !b2) continue;

                        if (!detectCollision(b1, b2)) continue;

                        anyCollision = true;

                        const b1PosBefore = b1.pos.clone();
                        const b2PosBefore = b2.pos.clone();

                        const pid = this.#pairId(i, j);

                        const result = resolveCollision(b1, b2);

                        this.#projectBallToArc(b1);
                        this.#projectBallToArc(b2);

                        const b1Disp = new THREE.Vector3()
                            .copy(b1.pos).sub(b1PosBefore);
                        const b2Disp = new THREE.Vector3()
                            .copy(b2.pos).sub(b2PosBefore);

                        this.#shiftRopeNodes(b1, b1Disp);
                        this.#shiftRopeNodes(b2, b2Disp);

                        if (
                            this.audioEnabled
                            && !this.prevCollisionPairs.has(pid)
                            && !currentCollisionPairs.has(pid)
                            && result.impulse > 0.01
                        ) {
                            playCollisionSound(
                                result.impulse,
                                b1.currentMaterialType || 'metal',
                                b2.currentMaterialType || 'metal',
                                (b1.radius + b2.radius) / 2
                            );
                        }

                        currentCollisionPairs.add(pid);
                    }
                }

                if (!anyCollision) break;
            }
        }

        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const b1 = this.balls[i];
                const b2 = this.balls[j];
                if (!b1 || !b2) continue;

                if (detectCollision(b1, b2)) {
                    const b1PosBefore = b1.pos.clone();
                    const b2PosBefore = b2.pos.clone();

                    resolveCollision(b1, b2);

                    this.#projectBallToArc(b1);
                    this.#projectBallToArc(b2);

                    const b1Disp = new THREE.Vector3()
                        .copy(b1.pos).sub(b1PosBefore);
                    const b2Disp = new THREE.Vector3()
                        .copy(b2.pos).sub(b2PosBefore);

                    this.#shiftRopeNodes(b1, b1Disp);
                    this.#shiftRopeNodes(b2, b2Disp);
                }
            }
        }

        this.prevCollisionPairs = currentCollisionPairs;

        for (const ball of this.balls) {
            computePendulumAnalytics(
                ball,
                gravityVec,
                gravity
            );

            ball.energy = computeEnergy(ball, gravity);
        }
    }

    resetToAngle(angleDeg) {
        if (!this.balls || this.balls.length === 0) return;

        const angleRad = degToRad(angleDeg);

        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];

            const isActive = (
                angleDeg > 0
                    ? i === this.balls.length - 1
                    : i === 0
            );

            const theta = isActive ? angleRad : 0;

            ball.theta = theta;
            ball.prevTheta = theta;
            ball.omega = 0;

            ball.pos.set(
                ball.pivot.x + Math.sin(theta) * ball.length,
                ball.pivot.y - Math.cos(theta) * ball.length,
                0
            );

            ball.vel.set(0, 0, 0);

            if (ball.resetRopes) {
                ball.resetRopes();
            }

            ball.E0 = undefined;
        }

        this.prevCollisionPairs.clear();
    }

    setMaterialType(type) {
        for (const ball of this.balls) {
            if (ball.setMaterialType) {
                ball.setMaterialType(type);
            }
        }
    }

    updateMasses(mass) {
        for (const ball of this.balls) {
            ball.mass = mass;
        }
    }

    setElasticity(e) {
        for (const ball of this.balls) {
            ball.restitution = e;
        }
    }

    setLength(length) {
        for (const ball of this.balls) {
            ball.length = length;

            if (ball.ropeA && ball.ropeA.setLength) {
                ball.ropeA.setLength(length);
            }
            if (ball.ropeB && ball.ropeB.setLength) {
                ball.ropeB.setLength(length);
            }
        }
    }
}