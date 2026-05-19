import * as THREE from 'three';

import { DEBUG } from '../core/Constants.js';
import { Rope } from './Rope.js';
import { createBallDebug } from '../core/Debug.js';

function isFiniteVec3(v) {
    return Number.isFinite(v.x)
        && Number.isFinite(v.y)
        && Number.isFinite(v.z);
}

export class Ball {

    constructor(x = 0) {

        this.theta = 0;
        this.omega = 0;
        this.prevTheta = this.theta;

        this.radius = 0.2;
        this.mass = 1;

        this.debug = null;

        this.omegaVec = new THREE.Vector3();
        this.alphaVec = new THREE.Vector3();

        this.anchorA =
            new THREE.Vector3(x, 2, 0.5);

        this.anchorB =
            new THREE.Vector3(x, 2, -0.5);

        this.pivot =
            new THREE.Vector3(x, 2, 0);

        this.length = 1;

        this.pos = new THREE.Vector3(
            this.pivot.x,
            this.pivot.y - this.length,
            0
        );

        this.vel = new THREE.Vector3();
        this.acc = new THREE.Vector3();

        // =====================================================
        // BALL MESH
        // =====================================================

        const geometry =
            new THREE.SphereGeometry(
                this.radius,
                32,
                32
            );

        const material =
            new THREE.MeshStandardMaterial({
                color: 0x909090,
                metalness: 1
            });

        this.mesh =
            new THREE.Mesh(
                geometry,
                material
            );

        // =====================================================
        // ROPE SETTINGS
        // =====================================================

        this.ropeSegments = 8;

        this.ropeNodeMass = 0.01;

        this.ropeStiffness = 300;

        this.ropeDamping = 10;

        this.ropeAirDrag = 0.01;

        // =====================================================
        // ROPES
        // =====================================================

        this.ropeA = new Rope({
            anchor: this.anchorA,
            ball: this,
            segments: this.ropeSegments,
            nodeMass: this.ropeNodeMass,
            stiffness: this.ropeStiffness,
            damping: this.ropeDamping,
            airDrag: this.ropeAirDrag
        });

        this.ropeB = new Rope({
            anchor: this.anchorB,
            ball: this,
            segments: this.ropeSegments,
            nodeMass: this.ropeNodeMass,
            stiffness: this.ropeStiffness,
            damping: this.ropeDamping,
            airDrag: this.ropeAirDrag
        });

        // =====================================================
        // TRAIL
        // =====================================================

        this.trailPoints = [];

        this.maxTrail =
            DEBUG.SHOW_TRAIL
                ? 1000
                : 0;

        this.trailGeometry =
            new THREE.BufferGeometry();

        this.trailMaterial =
            new THREE.LineBasicMaterial({
                vertexColors: true
            });

        this.trailLine =
            new THREE.Line(
                this.trailGeometry,
                this.trailMaterial
            );
    }

    // =====================================================
    // RESET ROPES
    // =====================================================

    resetRopes() {

        this.ropeA.reset();
        this.ropeB.reset();
    }

    // =====================================================
    // SCENE
    // =====================================================

    addToScene(scene) {

        scene.add(this.mesh);

        this.ropeA.addToScene(scene);
        this.ropeB.addToScene(scene);

        scene.add(this.trailLine);
    }

    // =====================================================
    // MESH SYNC
    // =====================================================

    syncMesh() {

        if (!isFiniteVec3(this.pos)) {

            this.pos.set(
                this.pivot.x,
                this.pivot.y - this.length,
                0
            );

            this.vel.set(0, 0, 0);

            this.resetRopes();
        }

        this.mesh.position.copy(this.pos);

        this.ropeA.syncGeometry();
        this.ropeB.syncGeometry();

        // =====================================================
        // TRAIL
        // =====================================================

        if (isFiniteVec3(this.pos)) {
            this.trailPoints.push(
                this.pos.clone()
            );
        }

        if (this.trailPoints.length > this.maxTrail) {
            this.trailPoints.shift();
        }

        const positions = [];
        const colors = [];

        for (let i = 0; i < this.trailPoints.length; i++) {

            const p = this.trailPoints[i];

            if (!isFiniteVec3(p)) continue;

            positions.push(
                p.x,
                p.y,
                p.z
            );

            const t =
                i / this.trailPoints.length;

            const color =
                new THREE.Color();

            color.setHSL(
                t,
                1.0,
                0.4
            );

            colors.push(
                color.r,
                color.g,
                color.b
            );
        }

        this.trailGeometry.dispose();

        this.trailGeometry =
            new THREE.BufferGeometry();

        this.trailGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(
                positions,
                3
            )
        );

        this.trailGeometry.setAttribute(
            'color',
            new THREE.Float32BufferAttribute(
                colors,
                3
            )
        );

        this.trailLine.geometry =
            this.trailGeometry;
    }
    update(scene) {

        createBallDebug(scene);
    
        this.syncMesh();
    }
}