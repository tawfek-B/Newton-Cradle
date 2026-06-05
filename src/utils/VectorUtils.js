export function project(v, onto) {
    const dot = v.dot(onto);
    const lenSq = onto.lengthSq();
    if (lenSq < 1e-10) return onto.clone().set(0, 0, 0);
    return onto.clone().multiplyScalar(dot / lenSq);
}

export function reflect(v, normal) {
    const dot = v.dot(normal);
    return v.clone().sub(normal.clone().multiplyScalar(2 * dot));
}

export function angleBetween(v1, v2) {
    const dot = v1.dot(v2);
    const len = v1.length() * v2.length();
    if (len < 1e-10) return 0;
    return Math.acos(Math.max(-1, Math.min(1, dot / len)));
}
