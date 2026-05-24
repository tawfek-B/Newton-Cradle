// Material.js
// Stores physical material properties such as restitution,
// friction, density, and damping coefficients.

export class PhysicalMaterial {
  constructor(name, restitution, friction, density, damping) {
    this.name = name; 
    this.restitution = restitution; 
    this.friction = friction; 
    this.density = density;
    this.damping = damping;
  }
// helper method to apply material properties to a ball
  applyToBall(ball) {
    ball.restitution = this.restitution;
    ball.friction = this.friction;
    ball.damping = this.damping;
    // ball.mass = this.density * ball.volume;
  }
}

// =====================================================
// Define some common materials
// =====================================================
export const MATERIALS = {
  METAL: new PhysicalMaterial("metal", 0.85, 0.2, 7800, 0.01),
  RUBBER: new PhysicalMaterial("rubber", 0.92, 0.8, 1100, 0.05),
  WOOD: new PhysicalMaterial("wood", 0.65, 0.5, 700, 0.03),
};

export function getMaterialByName(name) {
  switch (name) {
    case "metal":
      return MATERIALS.METAL;
    case "rubber":
      return MATERIALS.RUBBER;
    case "wood":
      return MATERIALS.WOOD;
    default:
      return MATERIALS.METAL;
  }
}
