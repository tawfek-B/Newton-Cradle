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
        this.restLength = 1;

        this.line = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xffffff })
        );

        this.reset();
    }

    reset() {
        this.nodes = [];
        this.vels = [];
        this.restLength = this.anchor.distanceTo(this.ball.pos);

        for (let i = 1; i < this.segments; i++) {
            const t = i / this.segments;
            const p = this.anchor.clone().lerp(this.ball.pos, t);
            this.nodes.push(p);
            this.vels.push(new THREE.Vector3());
        }
    }

    setLength(length) {
        this.restLength = length;
        this.reset();
    }

    getSafeNodes() {
        return this.nodes.filter(isFiniteVec3);
    }

    syncGeometry() {
        const expectedSegLength = this.restLength / this.segments;
        let rebuild = false;

        for (let i = 0; i < this.nodes.length - 1; i++) {
            const d = this.nodes[i].distanceTo(this.nodes[i + 1]);
            if (Math.abs(d - expectedSegLength) > expectedSegLength * 0.5) {
                rebuild = true;
                break;
            }
        }

        const safeNodes = this.getSafeNodes();
        if (safeNodes.length !== this.nodes.length || rebuild) {
            this.reset();
        }

        const points = [this.anchor, ...this.nodes, this.ball.pos].filter(isFiniteVec3);
        this.line.geometry.setFromPoints(points);
    }

    addToScene(scene) {
        scene.add(this.line);
    }
}