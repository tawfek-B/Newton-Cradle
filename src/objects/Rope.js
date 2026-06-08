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
        this.restLength = Math.max(length, 0.1);
        this.reset();
    }

    getSafeNodes() {
        return this.nodes.filter(isFiniteVec3);
    }

    syncGeometry() {
        if (this.nodes.length === 0) {
            this.reset();
            return;
        }

        const expectedSegLength = this.restLength / this.segments;
        let needsReset = false;

        for (let i = 0; i < this.nodes.length - 1; i++) {
            const d = this.nodes[i].distanceTo(this.nodes[i + 1]);
            if (Math.abs(d - expectedSegLength) > expectedSegLength * 1.5) {
                needsReset = true;
                break;
            }
        }

        const safeNodes = this.getSafeNodes();
        if (safeNodes.length !== this.nodes.length || needsReset) {
            this.reset();
        }

        // At rest (velocity≈0): rope renders as taut straight line
        // In motion: shows full physics-based rope dynamics
        const ball = this.ball;
        const speed = ball.vel ? ball.vel.length() : 0;
        const omega = ball.omega || 0;
        const motion = speed * speed + omega * omega;

        const thresholdLow = 0.01;
        const thresholdHigh = 0.3;
        let blend = 0;
        if (motion > thresholdLow) {
            blend = Math.min(1, Math.max(0,
                (motion - thresholdLow) / (thresholdHigh - thresholdLow)
            ));
        }

        const allPoints = [this.anchor];
        const numNodes = this.nodes.length;
        for (let i = 0; i < numNodes; i++) {
            const t = (i + 1) / (numNodes + 1);
            const straightPos = this.anchor.clone().lerp(ball.pos, t);
            const blendedPos = straightPos.clone().lerp(this.nodes[i], blend);
            allPoints.push(blendedPos);
        }
        allPoints.push(ball.pos);

        const renderPoints = allPoints.filter(isFiniteVec3);

        if (renderPoints.length >= 2) {
            this.line.geometry.setFromPoints(renderPoints);
        }
    }

    addToScene(scene) {
        scene.add(this.line);
    }
}