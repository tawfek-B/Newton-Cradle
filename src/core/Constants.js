export const PHYSICS = {
    GRAVITY: 9.81,
    AIR_DAMPING: 0.05,
    FIXED_DT: 1 / 120,
    MAX_DT: 0.016,
    CONSTRAINT_ITERATIONS: 5,
    AIR_DRAG_LINEAR: 0.02,
    AIR_DRAG_QUADRATIC: 0.005
};

export const PENDULUM = {
    DEFAULT_LENGTH: 1,
    MIN_LENGTH: 0.3,
    MAX_LENGTH: 3
};

export const DEBUG = {
    SHOW_VELOCITY: true,
    SHOW_TRAIL: true
};

export const MATERIALS = {
    METAL: {
        // Steel is near-ideal: e ≈ 0.95–0.98 for real steel balls
        restitution: 0.96,
        friction: 0.15,
        density: 7800,
        damping: 0.01
    },

    RUBBER: {
        // Rubber is much LESS elastic than steel
        restitution: 0.45,
        friction: 0.8,
        density: 1200,
        damping: 0.08
    },

    WOOD: {
        restitution: 0.60,
        friction: 0.5,
        density: 700,
        damping: 0.04
    }
};

export const ENERGY = {
    HEAT_LOSS: 0.01,
    SOUND_LOSS: 0.02,
    INTERNAL_FRICTION: 0.03
};

export const COLLISION = {
    HERTZ_STIFFNESS: 10000,
    HERTZ_DAMPING: 50,
    SEPARATION_EPSILON: 1e-6,
    MIN_IMPULSE_FOR_SOUND: 0.05,

    // =====================================================
    // CASCADE ITERATIONS
    // =====================================================
    // Number of collision resolution passes per substep.
    // Each pass can propagate momentum one ball further
    // through the chain. For a 5-ball Newton's Cradle,
    // 4+ passes ensures the full cascade (ball5→ball4→
    // ball3→ball2→ball1) completes within one substep.
    //
    // Higher values = more stable but more CPU.
    // 8 is generous; 4-5 would suffice for 5 balls.
    // =====================================================
    CASCADE_ITERATIONS: 8
};

export const CRADLE = {
    NUM_BALLS: 5,
    BALL_SPACING: 0.4,
    START_ANGLE_DEG: 20
};

export const SIMULATION = {
    SUBSTEPS: 1,
    FIXED_TIMESTEP: true
};