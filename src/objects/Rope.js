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
        attachSide,
        segments = 8,
        nodeMass = 0.01,
        stiffness = 300,
        damping = 10,
        airDrag = 0.01
    }) {
        this.anchor = anchor;
        this.ball = ball;
        this.attachSide = attachSide;  // 'A' or 'B'
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

        this.torsionK = 20;
        this.torsionDamping = 2;

        this.line = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xffffff })
        );

        this.reset();

        const tempBall = this.ball.spinAngle;
        this.ball.spinAngle = 0;
        
        const restEndpoint = this.getTargetEndpoint();
        
        this.ball.spinAngle = tempBall;
        
        this.restLength = this.anchor.distanceTo(restEndpoint);
    }

    
    enforceConstraints() {
        const segRest = this.restLength / (this.nodes.length + 1);
        
        // Stronger constraint when near taut
        for (let i = 0; i < this.nodes.length - 1; i++) {
            const a = this.nodes[i];
            const b = this.nodes[i + 1];
            const delta = b.clone().sub(a);
            const len = delta.length();
    
            if (len > segRest * 1.08) {
                const over = (len - segRest) / len;
                const factor = len > segRest * 1.5 ? 0.7 : 0.45; // stronger when very stretched
                const corr = delta.multiplyScalar(over * factor);
                a.add(corr);
                b.sub(corr);
            }
        }
    
        const last = this.nodes[this.nodes.length - 1];
        const end = this.getTargetEndpoint();
        const d = end.clone().sub(last);
        const dLen = d.length();
    
        if (dLen > segRest * 1.05) {
            const factor = dLen > segRest * 1.4 ? 0.75 : 0.55;
            last.add(d.multiplyScalar(factor));
        }
    }

    /**
     * Returns the world-space endpoint on the ball surface for this rope.
     * @param {number} [spinAngleOverride] - Optional override for spinAngle.
     *        If not provided, uses the ball's current spinAngle.
     */
    getTargetEndpoint(spinAngleOverride) {
        const spinAngle = spinAngleOverride !== undefined ? spinAngleOverride : this.ball.spinAngle;

        if (this.attachSide === 'A') {
            const rotated = this.ball.localAttachA.clone()
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), spinAngle);
            return this.ball.pos.clone().add(rotated);
        }
        if (this.attachSide === 'B') {
            const rotated = this.ball.localAttachB.clone()
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), spinAngle);
            return this.ball.pos.clone().add(rotated);
        }
        return this.ball.pos;
    }

    reset() {
        this.nodes = [];
        this.vels = [];
        
        this.twistAngle = 0;
        this.twistOmega = 0;

        const endpoint = this.getTargetEndpoint();

        for (let i = 1; i < this.segments; i++) {
            const t = i / this.segments;

            const p =
                this.anchor.clone().lerp(
                    endpoint,
                    t
                );

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

        const ball = this.ball;
        const endpoint = this.getTargetEndpoint();

        const speed = ball.vel ? ball.vel.length() : 0;
        const omega = ball.omega || 0;
        
        const motion = speed * speed + omega * omega;

        const thresholdLow = 0.1;
        const thresholdHigh = 3.5;
        let blend = 0;

        const distanceFromAnchor = this.anchor.distanceTo(endpoint);

        if (motion < thresholdLow || Math.abs(distanceFromAnchor - this.restLength) < 0.00001) {
            blend = 0; // Fully taut
        } else {
            blend = Math.min(1, Math.max(0,
                (motion - thresholdLow) / (thresholdHigh - thresholdLow)
            ));
        }

        const allPoints = [this.anchor];

        const ropeAxis =
            endpoint.clone().sub(this.anchor).normalize();

        const reference =
            Math.abs(ropeAxis.y) < 0.9
                ? new THREE.Vector3(0, 1, 0)
                : new THREE.Vector3(1, 0, 0);

        const side =
            new THREE.Vector3()
                .crossVectors(ropeAxis, reference)
                .normalize();

        const up =
            new THREE.Vector3()
                .crossVectors(side, ropeAxis)
                .normalize();

        const numNodes = this.nodes.length;

        for (let i = 0; i < numNodes; i++) {

            const t =
                (i + 1) / (numNodes + 1);

            const straightPos =
                this.anchor.clone().lerp(
                    endpoint,
                    t
                );

            const blendedPos =
                straightPos.clone().lerp(
                    this.nodes[i],
                    blend
                );

            const twist =
                this.twistAngle * t;

            const twistOffset =
                side.clone()
                    .multiplyScalar(
                        Math.sin(twist) * 0.005
                    )
                    .add(
                        up.clone()
                            .multiplyScalar(
                                Math.cos(twist) * 0.005
                            )
                    );

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