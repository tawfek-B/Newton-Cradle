import { PHYSICS } from '../core/Constants.js';
import { kineticEnergy, potentialEnergy } from '../utils/PhysicsUtils.js';

export function computeEnergy(ball, gravity = PHYSICS.GRAVITY, height = 0.8) {
  const KE = kineticEnergy(ball.mass, ball.vel.length());
  const PE = potentialEnergy(ball.mass, gravity, ball.pos.y - height);
  const total = KE + PE;

  if (ball.E0 === undefined) ball.E0 = total;

  const error = (total - ball.E0) / Math.max(Math.abs(ball.E0), 1e-8);
  return { KE, PE, total, error };
}

export function updateEnergyState(ball, g = PHYSICS.GRAVITY) {
  const KE = Math.abs(kineticEnergy(ball.mass, ball.vel.length()));
  const PE = Math.abs(potentialEnergy(ball.mass, g, ball.pos.y));
  let E = KE + PE;

  if (ball.E0 === undefined) {
    ball.E0 = E;
  }

  const error = (E - ball.E0) / Math.max(Math.abs(ball.E0), 1e-8);
  E *= (1 - error);
  return { KE, PE, E, error };
}