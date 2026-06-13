import * as THREE from 'three';

function isFiniteVec3(v) {
    return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

export class Rope {
    constructor({
        anchor, ball, attachSide,
        segments = 12,           // more nodes = smoother rope
        nodeMass = 0.015,        // increased
        stiffness = 650,         // much lower but still responsive
        damping = 18,            // increased
        airDrag = 0.012
    }) {
        this.anchor = anchor;
        this.ball = ball;
        this.attachSide = attachSide;
        this.segments = segments;
        this.nodeMass = nodeMass;
        this.stiffness = stiffness;
        this.damping = damping;
        this.airDrag = airDrag;

        this.nodes = [];
        this.vels = [];
        this.restLength = 1;
        this.twistAngle = 0;
        this.twistOmega = 0;
        this.torsionK = 25;
        this.torsionDamping = 3;

        this.line = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 })
        );

        this.line.castShadow = true;

        this.reset();
        this.restLength = this.anchor.distanceTo(this.getTargetEndpoint());
    }

    getTargetEndpoint(spinAngleOverride) {
        const spinAngle = spinAngleOverride !== undefined ? spinAngleOverride : this.ball.spinAngle;
        const localAttach = this.attachSide === 'A' ? this.ball.localAttachA : this.ball.localAttachB;
        const rotated = localAttach.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spinAngle);
        return this.ball.pos.clone().add(rotated);
    }

    enforceConstraints() {
        const segRest = this.restLength / (this.nodes.length + 1);

        for (let i = 0; i < this.nodes.length - 1; i++) {
            const a = this.nodes[i];
            const b = this.nodes[i + 1];
            const delta = b.clone().sub(a);
            const len = delta.length();

            if (len > segRest * 1.12) {
                const over = (len - segRest) / len;
                const factor = len > segRest * 1.6 ? 0.45 : 0.25;
                const corr = delta.multiplyScalar(over * factor);
                a.add(corr);
                b.sub(corr);
            }
        }

        // Last segment to attachment point
        const last = this.nodes[this.nodes.length - 1];
        const end = this.getTargetEndpoint();
        const d = end.clone().sub(last);
        const dLen = d.length();
        if (dLen > segRest * 1.1) {
            const factor = dLen > segRest * 1.5 ? 0.55 : 0.3;
            last.add(d.multiplyScalar(factor));
        }
    }

    reset() {
        this.nodes = [];
        this.vels = [];
        this.twistAngle = 0;
        this.twistOmega = 0;

        const endpoint = this.getTargetEndpoint();
        for (let i = 1; i < this.segments; i++) {
            const t = i / this.segments;
            const p = this.anchor.clone().lerp(endpoint, t);
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

        // Safety reset
        const expectedSegLength = this.restLength / this.segments;
        let needsReset = false;
        for (let i = 0; i < this.nodes.length - 1; i++) {
            const d = this.nodes[i].distanceTo(this.nodes[i + 1]);
            if (Math.abs(d - expectedSegLength) > expectedSegLength * 2) {
                needsReset = true;
                break;
            }
        }
        if (this.getSafeNodes().length !== this.nodes.length || needsReset) {
            this.reset();
        }

        const endpoint = this.getTargetEndpoint();
        const speed = this.ball.vel?.length() || 0;
        const omega = this.ball.omega || 0;
        const motion = speed * speed + omega * omega * 0.3; // further downweighted

        const thresholdLow = 0.001;
        const thresholdHigh = 0.4;   // higher = stays blended longer → less snapping

        let blend = 0;
        const distToRest = Math.abs(this.anchor.distanceTo(endpoint) - this.restLength);
        if (motion < thresholdLow && distToRest < 0.02) {
            blend = 0;
        } else {
            blend = Math.min(1, Math.max(0, (motion - thresholdLow) / (thresholdHigh - thresholdLow)));
        }

        const allPoints = [this.anchor];
        const ropeAxis = endpoint.clone().sub(this.anchor).normalize();

        const reference = Math.abs(ropeAxis.y) < 0.9 
            ? new THREE.Vector3(0, 1, 0) 
            : new THREE.Vector3(1, 0, 0);

        const side = new THREE.Vector3().crossVectors(ropeAxis, reference).normalize();
        const up = new THREE.Vector3().crossVectors(side, ropeAxis).normalize();

        for (let i = 0; i < this.nodes.length; i++) {
            const t = (i + 1) / (this.nodes.length + 1);
            const straightPos = this.anchor.clone().lerp(endpoint, t);
            let blendedPos = straightPos.clone().lerp(this.nodes[i], blend);

            // Twist
            const twist = this.twistAngle * t;
            const twistOffset = side.clone()
                .multiplyScalar(Math.sin(twist) * 0.005)
                .add(up.clone().multiplyScalar(Math.cos(twist) * 0.005));
            blendedPos.add(twistOffset);

            allPoints.push(blendedPos);
        }
        allPoints.push(endpoint);

        const renderPoints = allPoints.filter(isFiniteVec3);
        if (renderPoints.length >= 2) {
            this.line.geometry.setFromPoints(renderPoints);
        }
    }

    addToScene(scene) {
        scene.add(this.line);
    }
}