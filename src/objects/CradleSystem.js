// =====================================================
// CRADLE SYSTEM
// =====================================================
// Main Newton's Cradle manager responsible for updating,
// synchronizing, and controlling all balls and collisions.
//
// Physics pipeline per frame:
//   For each substep:
//     1. Pendulum substep (gravity + rope forces + integration + damping)
//        for each ball individually
//     2. Detect & resolve collisions between ALL ball pairs
//     3. Shift rope nodes to follow collision separation
//   After all substeps:
//     4. Compute analytics (angular, tension, energy)
//
// CRITICAL: Collision detection happens WITHIN each substep,
// NOT after all pendulum updates. This prevents balls from
// tunneling through each other during the many substeps that
// happen per frame (typically ~32 substeps for 60fps).
//
// Collision approach (from the report):
//   - Impulse-based: j = -(1+e) * v_rel / (1/m1 + 1/m2)
//   - Restitution coefficient e from material properties
//   - Position correction to separate overlapping balls
//   - Separation ALWAYS runs (even when vRel > 0) to prevent
//     persistent overlap caused by pendulum constraint fighting
//     the collision response.
//
// Audio approach (from the report, الفكرة السادسة):
//   - Sound is radiated energy from the deformation process
//   - Volume proportional to impact velocity
//   - Frequency dependent on material type

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

const STABLE_H = 1 / 2000;

export class CradleSystem {

    constructor(balls) {
        this.balls = balls;
        this.audioEnabled = true;

        // Track previous collision state per pair to avoid
        // retriggering sounds on every frame of contact
        this.prevCollisionPairs = new Set();
    }

    // =====================================================
    // PAIR ID (for deduplication)
    // =====================================================

    #pairId(i, j) {
        return `${Math.min(i, j)}-${Math.max(i, j)}`;
    }

    // =====================================================
    // PROJECT BALL TO PENDULUM ARC after collision
    // =====================================================
    // CRITICAL: After collision resolution separates two
    // balls by pushing them apart, the balls are no longer
    // on their pendulum arcs (dist from pivot != length).
    //
    // Without this correction, the pendulum position
    // correction in stepPendulumSubstep (NEXT substep)
    // will pull balls back toward their old arc position,
    // partially undoing the collision separation and
    // creating a tug-of-war that kills momentum.
    //
    // This function snaps the ball back onto its arc at
    // the NEW angle, updates theta accordingly, and
    // recomputes omega from the tangential velocity.
    // The rope physics handles the elastic deformation
    // naturally without fighting the collision response.

    #projectBallToArc(ball) {
        const dx = ball.pos.x - ball.pivot.x;
        const dy = ball.pos.y - ball.pivot.y;

        // Compute angle from vertical: theta = atan2(dx, -dy)
        // theta > 0 means ball is to the RIGHT of pivot
        // theta < 0 means ball is to the LEFT of pivot
        const theta = Math.atan2(dx, -dy);

        // Snap position exactly onto the pendulum arc
        ball.pos.set(
            ball.pivot.x + ball.length * Math.sin(theta),
            ball.pivot.y - ball.length * Math.cos(theta),
            0
        );

        // Also update theta so analytics are consistent
        ball.theta = theta;

        // =====================================================
        // CONSTRAINT: Remove radial velocity component
        // =====================================================
        // The pendulum constraint allows ONLY tangential velocity.
        // After collision, the impulse and position separation
        // may have added a radial component (velocity toward/away
        // from pivot). This must be removed to keep the ball on
        // its arc, otherwise the next substep's integration moves
        // the ball off the arc and the position correction fights it.
        //
        // Radial direction = from pivot toward ball = (sin(theta), -cos(theta))
        // Tangent direction = perpendicular to radial = (cos(theta), sin(theta))

        const radialX = Math.sin(theta);
        const radialY = -Math.cos(theta);

        const radialSpeed =
            ball.vel.x * radialX + ball.vel.y * radialY;

        // Subtract radial component from velocity
        ball.vel.x -= radialSpeed * radialX;
        ball.vel.y -= radialSpeed * radialY;

        // Recompute omega from remaining tangential velocity
        const tangentDirX = Math.cos(theta);
        const tangentDirY = Math.sin(theta);
        ball.omega = (
            ball.vel.x * tangentDirX +
            ball.vel.y * tangentDirY
        ) / Math.max(ball.length, 1e-6);
    }

    // =====================================================
    // SHIFT ROPE NODES after collision separation
    // =====================================================
    // When collision pushes a ball, the rope nodes need to
    // move with it. Otherwise, the elastic rope will pull
    // the ball back to its pre-collision position, fighting
    // the collision separation.
    //
    // We compute the displacement by comparing the ball's
    // position before and after the collision resolution
    // (including arc projection), then apply that same
    // displacement to all rope nodes.

    #shiftRopeNodes(ball, displacement) {
        const len = displacement.length();
        if (len < 1e-10) return;

        // Shift ropeA nodes
        if (ball.ropeA && ball.ropeA.nodes) {
            for (const node of ball.ropeA.nodes) {
                node.add(displacement);
            }
        }

        // Shift ropeB nodes
        if (ball.ropeB && ball.ropeB.nodes) {
            for (const node of ball.ropeB.nodes) {
                node.add(displacement);
            }
        }
    }

    // =====================================================
    // MAIN UPDATE
    // =====================================================

    update(
        dt,
        globalDamping = 0,
        gravity = PHYSICS.GRAVITY
    ) {
        if (!this.balls || this.balls.length === 0) {
            return;
        }

        // =====================================================
        // COMPUTE SUBSTEP PARAMETERS
        // =====================================================
        // Match the Pendulum.js substep logic exactly so we
        // stay synchronized with the same physics rate.

        const substeps = Math.max(
            1,
            Math.ceil(dt / STABLE_H)
        );

        const h = dt / substeps;

        const gravityVec = new THREE.Vector3(0, -gravity, 0);

        // Apply base air damping from constants (the report's AIR_DRAG_LINEAR)
        // The user's damping slider ADDS on top of the base air drag,
        // so even at '0' damping there is realistic air resistance.
        const effectiveDamping = PHYSICS.AIR_DAMPING + globalDamping;

        // =====================================================
        // SUBSTEP LOOP (with collision INSIDE each substep)
        // =====================================================
        // CRITICAL: Collision detection runs EVERY substep, not
        // once per frame. This prevents balls from tunneling
        // through each other during the ~32 substeps per frame.
        //
        // Sound dedup logic:
        //   prevCollisionPairs = pairs that collided in the PREVIOUS frame
        //   currentCollisionPairs = pairs colliding THIS frame
        //   Sound plays for pairs that are in currentFrame but NOT in prevFrame.
        //   At frame end: prevCollisionPairs = currentCollisionPairs
        // This way, sound replays when balls separate and re-collide.

        const currentCollisionPairs = new Set();

        for (let s = 0; s < substeps; s++) {

            // =================================================
            // A. PENDULUM SUBSTEP for each ball
            // =================================================

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

            // =================================================
            // B. COLLISION DETECTION & RESOLUTION
            //    with CASCADE ITERATIONS
            // =================================================
            // CRITICAL: Multiple iterations per substep to allow
            // momentum to propagate through the entire chain.
            //
            // Problem: Pairs are processed in order
            //   (0,1) → (0,2) → ... → (3,4)
            // When ball5 (idx 4) hits ball4 (idx 3), pair (3,4)
            // is processed LAST. If ball4 gets pushed into ball3
            // (idx 2), pair (2,3) was ALREADY processed for this
            // substep. Cascade stops at one ball per substep.
            //
            // Fix: Run multiple collision iterations per substep.
            // Each iteration re-checks ALL pairs for new overlaps
            // created by previous iterations. With CASCADE_ITERATIONS
            // iterations, the full cascade (ball5→ball4→ball3→
            // ball2→ball1) completes within a single substep.
            //
            // Additionally, after each collision resolution, we
            // project both balls onto their pendulum arcs. This
            // prevents the pendulum position correction (in next
            // substep's stepPendulumSubstep) from fighting the
            // collision separation.
            //
            // Sound dedup logic:
            //   prevCollisionPairs = pairs that collided in the
            //     PREVIOUS frame
            //   currentCollisionPairs = pairs colliding THIS frame
            //   Sound plays for pairs that are in currentFrame
            //     but NOT in prevFrame.
            //   At frame end: prevCollisionPairs =
            //     currentCollisionPairs

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

                        // Save positions BEFORE resolution
                        // (includes any previous cascade overlap)
                        const b1PosBefore = b1.pos.clone();
                        const b2PosBefore = b2.pos.clone();

                        // Get pair ID for dedup tracking
                        const pid = this.#pairId(i, j);

                        // Resolve: impulse + ALWAYS separate positions
                        const result = resolveCollision(b1, b2);

                        // =============================
                        // ARC PROJECTION (CRITICAL!)
                        // =============================
                        // After collision separates the balls,
                        // snap both back onto their pendulum arcs.
                        // This prevents the pendulum position
                        // correction from fighting the collision.

                        this.#projectBallToArc(b1);
                        this.#projectBallToArc(b2);

                        // Compute total displacement from before
                        // collision to new arc-projected position
                        const b1Disp = new THREE.Vector3()
                            .copy(b1.pos).sub(b1PosBefore);
                        const b2Disp = new THREE.Vector3()
                            .copy(b2.pos).sub(b2PosBefore);

                        // Shift rope nodes to follow
                        this.#shiftRopeNodes(b1, b1Disp);
                        this.#shiftRopeNodes(b2, b2Disp);

                        // =============================
                        // C. COLLISION SOUND
                        // =============================
                        // Only trigger on NEW collisions:
                        //   - Pair NOT colliding in previous frame
                        //   - AND not yet played this frame

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

                        // Mark pair as colliding this frame
                        currentCollisionPairs.add(pid);
                    }
                }

                // Early exit: no collisions found at all in this
                // iteration — skip remaining cascade iterations
                if (!anyCollision) break;
            }
        }

        // =====================================================
        // C+. POST-SUBSTEP SEPARATION PASS
        // =====================================================
        // After all substeps, check for any residual overlap.
        // This is much less likely now that arc projection and
        // cascade iterations handle the heavy lifting, but we
        // keep a single pass for safety.

        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const b1 = this.balls[i];
                const b2 = this.balls[j];
                if (!b1 || !b2) continue;

                if (detectCollision(b1, b2)) {
                    const b1PosBefore = b1.pos.clone();
                    const b2PosBefore = b2.pos.clone();

                    resolveCollision(b1, b2);

                    // Also project to arc in the post-pass
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

        // =====================================================
        // D. UPDATE COLLISION PAIR HISTORY (for next frame's sound)
        // =====================================================
        // Replace prevCollisionPairs with currentCollisionPairs.
        // Next frame, only pairs NOT in this set will trigger sound.

        this.prevCollisionPairs = currentCollisionPairs;

        // =====================================================
        // E. COMPUTE ANALYTICS
        // =====================================================

        for (const ball of this.balls) {
            computePendulumAnalytics(
                ball,
                gravityVec,
                gravity
            );

            ball.energy = computeEnergy(ball, gravity);
        }
    }

    // =====================================================
    // RESET
    // =====================================================

    resetToAngle(angleDeg) {
        if (!this.balls || this.balls.length === 0) return;

        const angleRad = THREE.MathUtils
            ? THREE.MathUtils.degToRad(angleDeg)
            : angleDeg * Math.PI / 180;

        // Reset all balls to rest position
        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];

            // Only angle the rightmost ball (or leftmost for negative angles)
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

            // Reset energy tracking
            ball.E0 = undefined;
        }

        // Clear collision pair history
        this.prevCollisionPairs.clear();
    }

    // =====================================================
    // MATERIAL CHANGE (apply to all balls)
    // =====================================================

    setMaterialType(type) {
        for (const ball of this.balls) {
            if (ball.setMaterialType) {
                ball.setMaterialType(type);
            }
        }
    }

    // =====================================================
    // MASS UPDATE (apply to all balls)
    // =====================================================

    updateMasses(mass) {
        for (const ball of this.balls) {
            ball.mass = mass;
        }
    }

    // =====================================================
    // LENGTH UPDATE (apply to all balls)
    // =====================================================

    setLength(length) {
        for (const ball of this.balls) {
            ball.length = length;

            // Reset ropes with new length
            if (ball.ropeA && ball.ropeA.setLength) {
                ball.ropeA.setLength(length);
            }
            if (ball.ropeB && ball.ropeB.setLength) {
                ball.ropeB.setLength(length);
            }
        }
    }
}