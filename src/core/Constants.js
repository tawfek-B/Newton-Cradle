export const PHYSICS = {
    GRAVITY: 9.81,
    AIR_DAMPING: 0.05,
    FIXED_DT: 1 / 120,
    MAX_DT: 0.016,
    CONSTRAINT_ITERATIONS: 5
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
        restitution: 0.85,
        friction: 0.2,
        density: 7800,
        damping: 0.01
    },

    RUBBER: {
        restitution: 0.92,
        friction: 0.8,
        density: 1100,
        damping: 0.05
    },

    WOOD: {
        restitution: 0.65,
        friction: 0.5,
        density: 700,
        damping: 0.03
    }
};

export const ENERGY = {
    HEAT_LOSS: 0.01,
    SOUND_LOSS: 0.02,
    INTERNAL_FRICTION: 0.03
};

export const SIMULATION = {
    SUBSTEPS: 1,
    FIXED_TIMESTEP: true
};