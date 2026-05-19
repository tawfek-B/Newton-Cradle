import * as THREE from 'three';

function isFiniteVec3(v) {
    return Number.isFinite(v.x)
        && Number.isFinite(v.y)
        && Number.isFinite(v.z);
}

export class Rope {

    constructor({
        anchor,
        ball,
        segments = 8,
        nodeMass = 0.01,
        stiffness = 300,
        damping = 10,
        airDrag = 0.01
    }) {

        this.anchor = anchor;
        this.ball = ball;

        this.segments = segments;

        this.nodeMass = nodeMass;
        this.stiffness = stiffness;
        this.damping = damping;
        this.airDrag = airDrag;

        this.nodes = [];
        this.vels = [];

        this.restLength = 0;

        this.line = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({
                color: 0xffffff
            })
        );

        this.reset();
    }

    // =====================================================
    // RESET ROPE
    // =====================================================

    reset() {

        this.nodes = [];
        this.vels = [];

        this.restLength =
            this.anchor.distanceTo(this.ball.pos);

        for (let i = 1; i < this.segments; i++) {

            const t = i / this.segments;

            const p =
                this.anchor.clone().lerp(
                    this.ball.pos,
                    t
                );

            this.nodes.push(p);

            this.vels.push(
                new THREE.Vector3()
            );
        }
    }

    // =====================================================
    // SAFE NODE ACCESS
    // =====================================================

    getSafeNodes() {

        return this.nodes.filter(isFiniteVec3);
    }

    // =====================================================
    // RENDER UPDATE
    // =====================================================

    syncGeometry() {

        const safeNodes =
            this.getSafeNodes();

        if (safeNodes.length !== this.nodes.length) {
            this.reset();
        }

        const points = [
            this.anchor,
            ...this.nodes,
            this.ball.pos
        ].filter(isFiniteVec3);

        this.line.geometry.setFromPoints(points);
    }

    // =====================================================
    // SCENE
    // =====================================================

    addToScene(scene) {

        scene.add(this.line);
    }
}