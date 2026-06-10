export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

export function degToRad(deg) {
    return deg * Math.PI / 180;
}

export function radToDeg(rad) {
    return rad * 180 / Math.PI;
}
