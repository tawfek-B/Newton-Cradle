export function impulse(m1, m2, v1, v2, e) {
    return -(1 + e) * (v1 - v2) / ((1 / m1) + (1 / m2));
}

export function kineticEnergy(mass, velocity) {
    return 0.5 * mass * velocity * velocity;
}

export function potentialEnergy(mass, gravity, height) {
    return mass * gravity * height;
}

export function momentum(mass, velocity) {
    return mass * velocity;
}

export function force(mass, acceleration) {
    return mass * acceleration;
}
