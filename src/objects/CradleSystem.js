// Main Newton's Cradle manager responsible for updating,
// synchronizing, and controlling all balls and collisions.
import { updatePendulum } from '../physics/Pendulum.js';
import { applyDamping } from '../physics/Damping.js';
import { enforceRopeConstraint } from '../physics/Constraints.js';
import { computeEnergy } from '../physics/Energy.js';
import { updateBallDebug } from '../core/Debug.js';

export class CradleSystem {
  constructor(balls) {
    this.balls = balls;
  }

  update(dt, gravity = PHYSICS.GRAVITY) {
    for (const ball of this.balls) {
      updatePendulum(ball, dt);
      if (!ball.ropeA || !ball.ropeB) {
        enforceRopeConstraint(ball);
      }

      ball.energy = computeEnergy(ball, gravity);
      updateBallDebug(ball, ball.debug);
    }
  }
}