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

balls.forEach(ball => {
  initVectorRendering(ball);
  addVectorsToScene(scene, ball);
});

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
  // time_pace: 1,
  time_pace: 0.2,
  scene_offset_y: 0,
  vector_magnitude: 0.1,
  materialType: 'wood',
  // elasticity: 0.96,
  elasticity: 1,
  ropeDamping: 10
};

function handleMaterialChange(type) {
  cradle.setMaterialType(type);
  const firstBall = balls[0];

  // Sync elasticity slider with material's natural restitution
  params.elasticity = firstBall.restitution;
  if (elasticityController) {
    elasticityController.updateDisplay();
  }

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
  
  balls.forEach((ball, index) => {
    if (index === 4)
      ball.spinOmega = 50;
    else
      ball.spinOmega = 0;
  });
}

const gui = createGUI(params, settings, setAngle);
createHUD();

let massController = null;
let elasticityController = null;
gui.controllers.forEach(controller => {
  if (controller._name === 'mass') {
    massController = controller;
  }
  if (controller._name === 'elasticity') {
    elasticityController = controller;
  }
});

// Apply initial elasticity override
cradle.setMaterialType(params.materialType);

// Apply initial elasticity
cradle.setElasticity(params.elasticity);

function initAudio() {
  SoundManager.getInstance().initialize();

  window.removeEventListener('click', initAudio);
  window.removeEventListener('keydown', initAudio);
  window.removeEventListener('touchstart', initAudio);
}

window.addEventListener(
  'pointerdown',
  async () => {
    await SoundManager.getInstance().initialize();
  },
  { once: true }
);
window.addEventListener('click', initAudio);
window.addEventListener('keydown', initAudio);
window.addEventListener('touchstart', initAudio);
balls[4].spinOmega = 20;
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
  cradle.setElasticity(params.elasticity);

  for (const ball of balls) {
    if (ball.ropeA) ball.ropeA.damping = params.ropeDamping;
    if (ball.ropeB) ball.ropeB.damping = params.ropeDamping;
  }

  g = params.gravity;
  scene.position.y = params.scene_offset_y;


  for (const ball of balls) {
    ball.trailLine.visible = settings.trail;
  }

  const dt = time.update(params.time_pace) * 2.25;

  cradle.update(dt, params.damping, params.gravity);

  for (const ball of balls) {

    const deltaTwist =
      ball.spinOmega * dt;

    console.log(ball.spinOmega, deltaTwist);

    ball.ropeA.twistAngle += deltaTwist;
    ball.ropeB.twistAngle += deltaTwist;

    const torqueA =
      -ball.ropeA.torsionK *
      ball.ropeA.twistAngle
      - ball.ropeA.torsionDamping *
      ball.ropeA.twistOmega;

    const torqueB =
      -ball.ropeB.torsionK *
      ball.ropeB.twistAngle
      - ball.ropeB.torsionDamping *
      ball.ropeB.twistOmega;

    const ropeTorque =
      torqueA + torqueB;

    ball.spinAlpha =
      (ball.spinTorque + ropeTorque) /
      ball.momentOfInertia;

    ball.spinOmega +=
      ball.spinAlpha * dt;

    ball.spinOmega *=
      Math.exp(
        -ball.spinDamping * dt
      );

    ball.spinAngle +=
      ball.spinOmega * dt;

    ball.ropeA.twistOmega =
      ball.spinOmega;

    ball.ropeB.twistOmega =
      ball.spinOmega;

    ball.syncMesh();
  }

  balls.forEach(ball => {
    updateVectors(ball, params.vector_magnitude, params.gravity);
    setVectorVisibility(ball, settings);
  });

  controls.update();
  renderer.render(scene, camera);
}

setAngle();
animate();