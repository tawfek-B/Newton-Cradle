import * as THREE from 'three';
import { Ball } from './objects/Ball.js';
import { updatePendulum } from './physics/Pendulum.js';
import { applyDamping } from './physics/Damping.js';
import { enforceRopeConstraint } from './physics/Constraints.js';
import { Time } from './core/Time.js';

// import { createBallDebug } from './core/Debug.js';

import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { scene, camera, renderer } from './world/World.js';
import { PHYSICS } from './core/Constants.js';

import { createGUI } from './ui/UI.js';
import { createHUD } from './world/HUD.js';
import {
  addVectorsToScene,
  initVectorRendering,
  setVectorVisibility,
  updateVectors
} from './rendering/VectorRenderer.js';

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// =========================
// SINGLE BALL (like before)
// =========================
const ball = new Ball(0);
ball.addToScene(scene);
// ball.debug = createBallDebug(scene)
initVectorRendering(ball);
addVectorsToScene(scene, ball);

let g = PHYSICS.GRAVITY;

// =========================
// TIME SYSTEM
// =========================
const time = new Time();

// =========================
// SETTINGS
// =========================
const settings = {
  velocity: true,
  acceleration: true,
  tension: true,
  centripetal: true,
  tangential: true,
  angular_velocity: true,
  angular_acceleration: true,
  weight: true,
  trail: true
};

const params = {
  mass: 261.38,
  damping: 0,
  length: 1,
  gravity: PHYSICS.GRAVITY,
  angle: 90,
  time_pace: 1,
  scene_offset_y: 0,
  vector_magnitude: 0.1,
  materialType: 'metal'
};

export function updateBallMass(newMass) {
  params.mass = newMass;
}

function handleMaterialChange(type) {
  ball.setMaterialType(type);
  console.log(`Done changing material to: ${type}. New properties - Restitution: ${ball.restitution}, Friction: ${ball.friction}, Damping: ${ball.damping}, Mass: ${ball.mass.toFixed(2)}`);

  if (massController) {
    massController.updateDisplay();
  }
}

params.onMaterialChange = handleMaterialChange;

// =========================
// RESET ANGLE
// =========================
function setAngle() {
  const angle = THREE.MathUtils.degToRad(params.angle);

  ball.theta = angle;
  ball.prevTheta = angle;
  ball.omega = 0;

  ball.pos.set(
    ball.pivot.x + Math.sin(ball.theta) * ball.length,
    ball.pivot.y - Math.cos(ball.theta) * ball.length,
    0
  );

  ball.vel.set(0, 0, 0);
  ball.resetRopes();
}

// =========================
// UI
// =========================
const gui = createGUI(params, settings, setAngle);
createHUD();

let massController = null;
gui.controllers.forEach(controller => {
  if (controller._name === 'mass') {
    massController = controller;
  }
});

ball.setMaterialType(params.materialType);

// =========================
// LOOP
// =========================
function animate() {
  requestAnimationFrame(animate);

  // =========================
  // VISIBILITY TOGGLES
  // =========================
  setVectorVisibility(ball, settings);

  ball.trailLine.visible = settings.trail;

  // =========================
  // PARAMETERS
  // =========================
  ball.length = params.length;

  g = params.gravity;

  scene.position.y = params.scene_offset_y;

  // =========================
  // TIME STEP
  // =========================
  const dt = time.update(params.time_pace);

  // =========================
  // PHYSICS PIPELINE
  // =========================
  updatePendulum(ball, dt, params.damping, params.gravity);
  applyDamping(ball, dt, params.damping);
  if (!ball.ropeA || !ball.ropeB) {
    enforceRopeConstraint(ball);
  }

  ball.mass = params.mass;

  // =========================
  // RENDER UPDATES
  // =========================
  ball.syncMesh();
  updateVectors(ball, params.vector_magnitude, params.gravity);

  controls.update();
  renderer.render(scene, camera);
}

setAngle();
animate();