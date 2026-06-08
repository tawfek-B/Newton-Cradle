import * as THREE from 'three';

function isFiniteVec3(v) {
    return Number.isFinite(v.x)
        && Number.isFinite(v.y)
        && Number.isFinite(v.z);
}

export function updateTrail(ball) {
    const positions = [];
    const colors = [];

    for (let i = 0; i < ball.trailPoints.length; i++) {
        const p = ball.trailPoints[i];
        if (!isFiniteVec3(p)) continue;
        positions.push(p.x, p.y, p.z);
        const t = i / ball.trailPoints.length;
        const color = new THREE.Color();
        color.setHSL(t, 1.0, 0.4);
        colors.push(color.r, color.g, color.b);
    }

    ball.trailGeometry.dispose();
    ball.trailGeometry = new THREE.BufferGeometry();
    ball.trailGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );
    ball.trailGeometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3)
    );
    ball.trailLine.geometry = ball.trailGeometry;
}
