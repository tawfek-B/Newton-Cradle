export const PHYSICS = {
    GRAVITY: 9.81,
    GRAVITATIONAL_CONSTANT: 6.6743e-11,

    EARTH_AIR_DAMPING: 0.05,
    NEARTH_AIR_DAMPING: 0.05,
    ISS_AIR_DAMPING: 0.05,
    VENUS_AIR_DAMPING: 4.5,
    MARS_AIR_DAMPING: 0.00035,
    JUPITER_AIR_DAMPING: 0.0065,
    SATURN_AIR_DAMPING: 0.0095,
    URANUS_AIR_DAMPING: 0.021,
    NEPTUNE_AIR_DAMPING: 0.0225,
    STRATOSPHERE_AIR_DAMPING: 0.0005,
    SUN_AIR_DAMPING: 5,

    SHEAR_MODULUS: 79e+9,
    
    FIXED_DT: 1 / 120,
    MAX_DT: 0.016,
    CONSTRAINT_ITERATIONS: 5,
    AIR_DRAG_LINEAR: 0.02,
    AIR_DRAG_QUADRATIC: 0.005,
    PLANETS: {
        EARTH_RADIUS: 6371000,
        EARTH_MASS: 5.972e24,

        MOON_RADIUS: 1737000,
        MOON_MASS: 7.342e22,

        SUN_RADIUS: 696340000,
        SUN_MASS: 1.989e30,

        MERCURY_RADIUS: 2439700,
        MERCURY_MASS: 3.285e23,

        VENUS_RADIUS: 6051800,
        VENUS_MASS: 4.867e24,

        MARS_RADIUS: 3389500,
        MARS_MASS: 6.39e23,

        JUPITER_RADIUS: 69911000,
        JUPITER_MASS: 1.898e27,

        SATURN_RADIUS: 58232000,
        SATURN_MASS: 5.683e26,

        URANUS_RADIUS: 25362000,
        URANUS_MASS: 8.681e25,

        NEPTUNE_RADIUS: 24622000,
        NEPTUNE_MASS: 1.024e26,

        PLUTO_RADIUS: 1188300,
        PLUTO_MASS: 1.309e22

    }
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
        restitution: 0.96,
        friction: 0.15,
        density: 7800,
        damping: 0.01
    },
    RUBBER: {
        restitution: 0.85,
        friction: 0.8,
        density: 1200,
        damping: 0.08
    },
    WOOD: {
        restitution: 0.70,
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
    HERTZ_STIFFNESS: 30000,
    HERTZ_DAMPING: 3,
    SEPARATION_EPSILON: 1e-6,
    MIN_IMPULSE_FOR_SOUND: 0.05,

    CASCADE_ITERATIONS: 3
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