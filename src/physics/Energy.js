// Calculates kinetic, potential, total, and dissipated energy
// for analysis, debugging, and graphs.
import { PHYSICS } from '../core/Constants.js';

export function computeEnergy(ball, gravity = PHYSICS.GRAVITY) {
  const KE = 0.5 * ball.mass * ball.vel.lengthSq();
  const PE = ball.mass * gravity * ball.pos.y;

  const total = KE + PE;

  if (ball.E0 === undefined) ball.E0 = total;

  const error = (total - ball.E0) / Math.max(Math.abs(ball.E0), 1e-8);

  return { KE, PE, total, error };
}

export function updateEnergyState(ball, g = PHYSICS.GRAVITY) {
  const KE =
    Math.abs(0.5 * ball.mass * ball.vel.lengthSq());

  const PE =
    Math.abs(ball.mass * g *
      (ball.pos.y));

  let E = KE + PE;

  if (ball.E0 === undefined) {
    ball.E0 = E;
  }

  const error =
    (E - ball.E0) /
    Math.max(Math.abs(ball.E0), 1e-8);

  E *= (1 - error);

  return { KE, PE, E, error };
}