import * as THREE from 'three';
import { currentPlanet, scene } from '../world/World.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import {
    stepPendulumSubstep,
    computePendulumAnalytics
} from '../physics/Pendulum.js';

import {
    applyTemperatureDamping,
    applySoundDamping
} from '../physics/Damping.js';

import { computeEnergy } from '../physics/Energy.js';

import {
    computeHertzianForce,
    detectCollision,
    resolveCollision
} from '../physics/Collision.js';

import {
    playCollisionSound
} from '../audio/CollisionAudio.js';

import { PHYSICS, COLLISION, ENERGY } from '../core/Constants.js';

import { degToRad } from '../utils/MathUtils.js';

const STABLE_H = 1 / 2000;

export class CradleSystem {

    constructor(balls) {
        this.balls = balls;
        this.audioEnabled = true;
        this.prevCollisionPairs = new Set();
    }

    pairId(i, j) {
        return `${Math.min(i, j)}-${Math.max(i, j)}`;
    }


    reTightenRope(ball) {
        const r = ball.pos.clone().sub(ball.pivot);
        const dist = r.length();

        if (dist < 1e-8) return;

        const correction = dist - ball.length;

        if (correction > 0) {
            const dir = r.multiplyScalar(1 / dist);
            ball.pos.sub(dir.multiplyScalar(correction * 0.8));
        }

        const radialVel = r.normalize().multiplyScalar(ball.vel.dot(r.normalize()));
        ball.vel.sub(radialVel);
    }

    update(
        dt,
        globalDamping = 0,
        gravity = PHYSICS.GRAVITY,
        height = 0.8,
        dampingToggles
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

        const air_damping = (PHYSICS[`${currentPlanet.name || currentPlanet}_AIR_DAMPING`]) || 0


        const effectiveDamping = air_damping + globalDamping;

        const currentCollisionPairs = new Set();

        for (let s = 0; s < substeps; s++) {

            for (let b = 0; b < this.balls.length; b++) {
                const ball = this.balls[b];

                const ok = stepPendulumSubstep(
                    ball,
                    h,
                    effectiveDamping,
                    gravityVec,
                    dampingToggles
                );

                if (!ok) break;

                applyTemperatureDamping(
                    ball,
                    h,
                    ENERGY.HEAT_LOSS,
                    dampingToggles
                );

                applySoundDamping(
                    ball,
                    h,
                    ENERGY.SOUND_LOSS,
                    dampingToggles
                );
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

                        const pid = this.pairId(i, j);

                        // Apply Hertz contact force during this substep
                        const F = computeHertzianForce(b1, b2);

                        if (F.lengthSq() > 0) {

                            b1.vel.add(
                                F.clone().multiplyScalar(h / Math.max(b1.mass, 1e-10))
                            );

                            b2.vel.sub(
                                F.clone().multiplyScalar(h / Math.max(b2.mass, 1e-10))
                            );
                        }

                        const forceMag = F.length();

                        const n = computeHertzianForce(b1, b2).normalize();
                        const normal = b1.pos.clone().sub(b2.pos).normalize();

                        const position = b1.pos.clone().add(
                            normal.clone().multiplyScalar(-b1.radius * 1.3)
                        );

                        const localPos = b1.mesh.worldToLocal(position.clone());

                        spawnDecal(
                            b1,
                            position,
                            normal,
                            forceMag * 50,
                            h
                        );
                        // Existing impulse solver
                        const result = resolveCollision(b1, b2);

                        const energyLoss = Math.max(0, result.energyLost || 0);
                        if (energyLoss > 0) {
                            const thermalGain = Math.min(0.02, energyLoss * 0.02);
                            const soundGain = Math.min(0.01, energyLoss * 0.01);

                            b1.temperature = Math.max(0, (b1.temperature ?? 0) + thermalGain);
                            b2.temperature = Math.max(0, (b2.temperature ?? 0) + thermalGain);
                            b1.soundLevel = Math.max(0, (b1.soundLevel ?? 0) + soundGain);
                            b2.soundLevel = Math.max(0, (b2.soundLevel ?? 0) + soundGain);
                        }

                        this.reTightenRope(b1);
                        this.reTightenRope(b2);

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

                // for (const ball of this.balls) {
                //     if (ball.ropeA) ball.ropeA.enforceConstraints();
                //     if (ball.ropeB) ball.ropeB.enforceConstraints();
                // }
                if (!anyCollision) break;
            }
        }

        this.prevCollisionPairs = currentCollisionPairs;

        for (const ball of this.balls) {
            computePendulumAnalytics(
                ball,
                gravityVec,
                gravity
            );

            ball.energy = computeEnergy(ball, gravity, height);
        }
    }


    resetToAngle(angleDeg, numBallsToMove, offset, isSymmetric = false, leftBalls = 0, rightBalls = 0) {
        if (!this.balls || this.balls.length === 0) return;

        const angleRad = degToRad(angleDeg);

        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];

            let isActive = false;
            let theta = 0;

            if (!isSymmetric) {
                isActive = (
                    angleDeg > 0
                        ? i >= this.balls.length - numBallsToMove
                        : i <= numBallsToMove - 1
                );
                theta = isActive ? angleRad : 0;
            }
            else {
                isActive = ((i < leftBalls) || i >= this.balls.length - rightBalls);
                //this is used if the user put over half for both left and right while the numbe rof balls is odd
                //for example move 3 from the left and 3 from the right, while the number of balls is 5
                //then it will randomly choose one ball from the middle to move either left or right
                let rand = (leftBalls === Math.ceil(this.balls.length / 2) && rightBalls === Math.ceil(this.balls.length / 2) && (this.balls.length % 2 === 1));

                theta = isActive ? ((i < leftBalls - (rand ? Math.round(Math.random()) : 0)) ? -1 : 1) * angleRad : 0
            }

            ball.theta = theta;
            ball.prevTheta = theta;
            ball.omega = 0;

            ball.pos.set(
                ball.pivot.x + Math.sin(theta) * ball.length,
                ball.pivot.y - Math.cos(theta) * ball.length,
                isActive ? offset : 0,
            );

            ball.vel.set(0, 0, 0);

            ball.spinAngle = 0;
            ball.spinOmega = 0;
            ball.spinAlpha = 0;
            ball.spinTorque = 0;

            if (ball.ropeA) ball.ropeA.twistAngle = 0;
            if (ball.ropeB) ball.ropeB.twistAngle = 0;

            if (ball.resetRopes) {
                ball.resetRopes();
            }

            ball.E0 = undefined;
        }

        this.prevCollisionPairs.clear();
    }

    setMaterialType(type) {
        this.balls.forEach((ball, index) => {
            if (ball.setMaterialType) {
                ball.setMaterialType(type, index);
            }
        });
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
            ball.length = length + 0.2;

            if (ball.ropeA && ball.ropeA.setLength) {
                ball.ropeA.setLength(length);
            }
            if (ball.ropeB && ball.ropeB.setLength) {
                ball.ropeB.setLength(length);
            }
        }
    }
    setBallLength(length, ball) {
        ball.length = length + 0.2;

        if (ball.ropeA && ball.ropeA.setLength) {
            ball.ropeA.setLength(length);
        }
        if (ball.ropeB && ball.ropeB.setLength) {
            ball.ropeB.setLength(length);
        }

    }
}
function spawnDecal(ball, position, normal, forceMag, dt) {
    if (forceMag < 0.2) return;

    ball.lastDecalTime += dt;
    if (ball.lastDecalTime < ball.decalCooldown) return;
    ball.lastDecalTime = 0;

    if (ball.decals.length >= ball.maxDecals) {
        const old = ball.decals.shift();
        ball.mesh.remove(old);
        old.geometry.dispose();
        old.material.dispose();
    }

    // Convert the world-space hit position/normal into the ball's LOCAL space
    ball.mesh.updateMatrixWorld();
    const invMatrix = ball.mesh.matrixWorld.clone().invert();

    const localPos = position.clone().applyMatrix4(invMatrix);
    const localNormal = normal.clone().transformDirection(invMatrix).normalize();

    // nudge slightly inward along the local normal so it hugs the curvature
    localPos.add(localNormal.clone().multiplyScalar(-0.01));

    const dummy = new THREE.Object3D();
    dummy.position.copy(localPos);
    dummy.lookAt(localPos.clone().add(localNormal));

    // Proxy mesh: same geometry as the ball, but identity transform,
    // so DecalGeometry does its projection math in LOCAL space
    const proxy = new THREE.Mesh(ball.mesh.geometry);
    proxy.updateMatrixWorld();

    const decalGeo = new DecalGeometry(
        proxy,
        localPos,
        dummy.rotation,
        new THREE.Vector3(0.25, 0.25, 0.15) // shallow depth relative to radius 0.2
    );

    const decalMesh = new THREE.Mesh(decalGeo, ball.decalMaterial);
    decalMesh.renderOrder = 999;

    ball.mesh.add(decalMesh);
    ball.decals.push(decalMesh);
}