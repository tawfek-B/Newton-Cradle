import * as THREE from 'three';

// =====================================================
// SEMI-IMPLICIT EULER
// =====================================================

export function integrateSemiImplicitEuler(
    body,
    acceleration,
    dt
) {

    body.vel.add(
        acceleration.clone().multiplyScalar(dt)
    );

    body.pos.add(
        body.vel.clone().multiplyScalar(dt)
    );
}

// =====================================================
// VERLET
// =====================================================

export function integrateVerlet(
    body,
    acceleration,
    dt
) {

    if (!body.prevPos) {

        body.prevPos =
            body.pos.clone().sub(
                body.vel.clone().multiplyScalar(dt)
            );
    }

    const current =
        body.pos.clone();

    const next =
        body.pos.clone()
            .multiplyScalar(2)
            .sub(body.prevPos)
            .add(
                acceleration.clone().multiplyScalar(
                    dt * dt
                )
            );

    body.vel.copy(
        next.clone()
            .sub(current)
            .divideScalar(Math.max(dt, 1e-6))
    );

    body.pos.copy(next);

    body.prevPos.copy(current);
}

// =====================================================
// RK4
// =====================================================

export function integrateRK4(
    body,
    accelerationFunc,
    dt
) {

    const p0 = body.pos.clone();
    const v0 = body.vel.clone();

    const a1 = accelerationFunc(p0, v0);
    const v1 = v0.clone();

    const a2 = accelerationFunc(
        p0.clone().add(
            v1.clone().multiplyScalar(dt * 0.5)
        ),
        v0.clone().add(
            a1.clone().multiplyScalar(dt * 0.5)
        )
    );

    const v2 =
        v0.clone().add(
            a1.clone().multiplyScalar(dt * 0.5)
        );

    const a3 = accelerationFunc(
        p0.clone().add(
            v2.clone().multiplyScalar(dt * 0.5)
        ),
        v0.clone().add(
            a2.clone().multiplyScalar(dt * 0.5)
        )
    );

    const v3 =
        v0.clone().add(
            a2.clone().multiplyScalar(dt * 0.5)
        );

    const a4 = accelerationFunc(
        p0.clone().add(
            v3.clone().multiplyScalar(dt)
        ),
        v0.clone().add(
            a3.clone().multiplyScalar(dt)
        )
    );

    const v4 =
        v0.clone().add(
            a3.clone().multiplyScalar(dt)
        );

    const velDelta =
        a1.clone()
            .add(a2.clone().multiplyScalar(2))
            .add(a3.clone().multiplyScalar(2))
            .add(a4)
            .multiplyScalar(dt / 6);

    const posDelta =
        v1.clone()
            .add(v2.clone().multiplyScalar(2))
            .add(v3.clone().multiplyScalar(2))
            .add(v4)
            .multiplyScalar(dt / 6);

    body.vel.add(velDelta);

    body.pos.add(posDelta);
}