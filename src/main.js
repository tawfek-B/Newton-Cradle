import * as THREE from 'three';
import { Ball } from './objects/Ball.js';
import { CradleSystem } from './objects/CradleSystem.js';
import { Time } from './core/Time.js';
import { CRADLE, PHYSICS } from './core/Constants.js';

import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { scene, camera, renderer } from './world/World.js';

import { SoundManager } from './audio/SoundManager.js';
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

const NUM_BALLS = CRADLE.NUM_BALLS;
const SPACING = CRADLE.BALL_SPACING;

const balls = [];

for (let i = 0; i < NUM_BALLS; i++) {
  const x = (i - (NUM_BALLS - 1) / 2) * SPACING;
  const ball = new Ball(x);
  ball.addToScene(scene);
  balls.push(ball);
}

const displayBall = balls[Math.floor(NUM_BALLS / 2)];
initVectorRendering(displayBall);
addVectorsToScene(scene, displayBall);

const cradle = new CradleSystem(balls);

let g = PHYSICS.GRAVITY;

const time = new Time();

let _prevLength = null;

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

function handleMaterialChange(type) {
  cradle.setMaterialType(type);
  const firstBall = balls[0];
  console.log(`All balls changed to: ${type}. ` +
    `Restitution: ${firstBall.restitution}, ` +
    `Friction: ${firstBall.friction}, ` +
    `Damping: ${firstBall.damping}, ` +
    `Mass per ball: ${firstBall.mass.toFixed(2)}`
  );

  if (massController) {
    massController.updateDisplay();
  }
}

export function updateBallMass(newMass) {
  params.mass = newMass;
}

params.onMaterialChange = handleMaterialChange;

function setAngle() {
  cradle.resetToAngle(params.angle);
}

const gui = createGUI(params, settings, setAngle);
createHUD();

let massController = null;
gui.controllers.forEach(controller => {
  if (controller._name === 'mass') {
    massController = controller;
  }
});

cradle.setMaterialType(params.materialType);

// Preload collision audio buffers
SoundManager.getInstance().loadBuffers();

function animate() {
  requestAnimationFrame(animate);

  for (const ball of balls) {
    ball.length = params.length;
  }

  if (_prevLength === null || Math.abs(_prevLength - params.length) > 1e-6) {
    cradle.setLength(params.length);
    _prevLength = params.length;
  }

  cradle.updateMasses(params.mass);

  g = params.gravity;
  scene.position.y = params.scene_offset_y;

  setVectorVisibility(displayBall, settings);

  for (const ball of balls) {
    ball.trailLine.visible = settings.trail;
  }

  const dt = time.update(params.time_pace);

  cradle.update(dt, params.damping, params.gravity);

  for (const ball of balls) {
    ball.syncMesh();
  }

  updateVectors(displayBall, params.vector_magnitude, params.gravity);

  controls.update();
  renderer.render(scene, camera);
}

setAngle();
animate();