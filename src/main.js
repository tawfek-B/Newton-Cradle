import * as THREE from 'three';
import { Ball } from './objects/Ball.js';
import { CradleSystem } from './objects/CradleSystem.js';
import { Time } from './core/Time.js';
import { CRADLE, PHYSICS } from './core/Constants.js';

import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { scene, camera, renderer, planets } from './world/World.js';

import { SoundManager } from './audio/SoundManager.js';
import { createGUI } from './ui/UI.js';
import { createHUD, updateHUD } from './world/HUD.js';
import {
  addVectorsToScene,
  initVectorRendering,
  setVectorVisibility,
  updateVectors
} from './rendering/VectorRenderer.js';

import { check } from './utils/payloadChecker.js'

import { payload } from './payload.json';

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const NUM_BALLS = payload.debug ? payload.numberOfBalls : CRADLE.NUM_BALLS;
const SPACING = CRADLE.BALL_SPACING;

let mainPayload = payload;

export const balls = [];

for (let i = 0; i < NUM_BALLS; i++) {
  const x = (i - (NUM_BALLS - 1) / 2) * SPACING;
  const ball = new Ball(x);
  ball.addToScene(scene);
  balls.push(ball);
}

balls.forEach((ball, index) => {
  initVectorRendering(ball);
  addVectorsToScene(scene, ball);
});

const cradle = new CradleSystem(balls);

//since it currently initializes on planet Earth, these are the initial values (could change later)
const G = PHYSICS.GRAVITATIONAL_CONSTANT;
let M = PHYSICS.PLANETS.EARTH_MASS;
let r = PHYSICS.PLANETS.EARTH_RADIUS;

let g = G * M / (r * r);

const time = new Time();

let _prevLength = null;

const settings = {
  velocity: false,
  acceleration: false,
  tension: false,
  centripetal: false,
  tangential: false,
  angular_velocity: false,
  angular_acceleration: false,
  weight: false,
  trail: false
};

const params = {
  angle: 90,
  numBallsToMove: 1,
  spinOmega: 0,
  mass: 261.38,
  damping: 0.01,
  length: 1,
  gravity: PHYSICS.GRAVITY,
  time_pace: 1,
  // time_pace: 0.2,
  scene_offset_y: 0,
  vector_magnitude: 0.1,
  materialType: 'metal',
  // elasticity: 0.96,
  elasticity: 1,
  ropeDamping: 10,

  HUD: true
};

function handleMaterialChange(type) {
  cradle.setMaterialType(type);
  const firstBall = balls[0];

  // Sync elasticity slider with material's natural restitution
  params.elasticity = firstBall.restitution;

  console.log(`All balls changed to: ${type}. ` +
    `Restitution: ${firstBall.restitution}, ` +
    `Friction: ${firstBall.friction}, ` +
    `Damping: ${firstBall.damping}, ` +
    `Mass per ball: ${firstBall.mass.toFixed(2)}`
  );

  if (massController) {
    massController.updateDisplay();
  }
  if (elasticityController) {
    elasticityController.updateDisplay();
  }
}

function handleBallMaterialChange(type, ballIndex) {
  balls[ballIndex].setMaterialType(type, mainPayload, ballIndex);
}


export function updateBallMass(newMass) {
  params.mass = newMass;
}

params.onMaterialChange = handleMaterialChange;
params.onPlanetChange = handlePlanetChange;

params.elasticity = balls[0].restitution;

function setAngle(spin = 0) {
  const oldLength = balls.length;
  cradle.resetToAngle(params.angle, params.numBallsToMove, params.numberOfBalls, scene);

  if (oldLength !== balls.length)
    balls = cradle.balls;

  balls.forEach((ball, index) => {
    if (!mainPayload.debug)
      if (index === 4)
        ball.spinOmega = spin;
      else
        ball.spinOmega = 0;
    else {
      ball.spinOmega = mainPayload.balls[index].spinOmega
      console.log(ball.spinOmega)
    }

    console.log(ball.spinOmega)

    ball.spinAngle = 0;
    if (ball.ropeA) ball.ropeA.twistAngle = 0;
    if (ball.ropeB) ball.ropeB.twistAngle = 0;
  });
}

// const axisnew = new THREE.AxesHelper(0.5);
// axisnew.position.copy(balls[0].pos);
// axisnew.scale.set(0.5, 0.5, 2);
// scene.add(axisnew);

const gui = createGUI(params, settings, setAngle, NUM_BALLS);
const hudElements = createHUD();

mainPayload = check()
if (mainPayload.debug)
  for (let i = 0; i < mainPayload.numberOfBalls; i++) {
    const key = `${i}`;

    handleBallMaterialChange(mainPayload.balls[key].material, i);

    // balls[i].ropeA.setLength(payload.balls[key].ropeA);
    // balls[i].ropeB.setLength(payload.balls[key].ropeB)
  }

let massController = null;
let elasticityController = null;
let planetController = null;
let gravityController = null;
gui.controllers.forEach(controller => {
  if (controller._name === 'mass') {
    massController = controller;
  }
  if (controller._name === 'Elasticity (e)') {
    elasticityController = controller;
  }
  if (controller._name === 'materialType') {
    materialController = controller;
  }
  if (controller._name === 'Planet') {
    planetController = controller;
  }
  if (controller._name === 'gravity') {
    gravityController = controller;
  }
});

function handlePlanetChange(planet) {
  console.log(planet);

  if (planet === 'SPACE') {
    params.gravity = 0;
  } else if (planet === 'STRATOSPHERE') {
    const M = PHYSICS.PLANETS['EARTH_MASS'];
    const r = PHYSICS.PLANETS['EARTH_RADIUS'] + 30000; // 30 km up
    params.gravity = (G * M) / (r * r);
  } else if (planet === 'ISS') {
    const M = PHYSICS.PLANETS['EARTH_MASS'];
    const r = PHYSICS.PLANETS['EARTH_RADIUS'] + 400000; // 400 km up
    params.gravity = (G * M) / (r * r);
  } else {
    const M = PHYSICS.PLANETS[`${planet}_MASS`];
    const r = PHYSICS.PLANETS[`${planet}_RADIUS`];
    params.gravity = (G * M) / (r * r);
  }

  console.log(params.gravity)

  if (planetController && gravityController) {
    planetController.updateDisplay();
    gravityController.updateDisplay();
  }
}
// Apply initial elasticity override, if we have debug disabled
mainPayload.debug ? null : cradle.setMaterialType(params.materialType);

// Apply initial elasticity
mainPayload.debug ? balls.forEach((ball, i) => { ball.restitution = mainPayload.balls[`${i}`].elasticity; }) : cradle.setElasticity(params.elasticity);

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

function animate() {
  requestAnimationFrame(animate);

  if (!mainPayload.debug)
    for (const ball of balls) {
      //  this fixed the rope slack issue
      ball.length = params.length + 0.15;
    }

  if (_prevLength === null || Math.abs(_prevLength - params.length) > 1e-6) {
    if (!mainPayload.debug)
      cradle.setLength(params.length);
    else {
      balls.forEach((ball, index) => {
        cradle.setBallLength(mainPayload.balls[index].rope, ball)
      });
    }
    _prevLength = params.length;
  }

  mainPayload.debug ? null : cradle.updateMasses(params.mass);
  mainPayload.debug ? null : cradle.setElasticity(params.elasticity);

  for (const ball of balls) {
    if (ball.ropeA) ball.ropeA.damping = params.ropeDamping;
    if (ball.ropeB) ball.ropeB.damping = params.ropeDamping;
  }

  g = params.gravity;
  scene.position.y = params.scene_offset_y;


  for (const ball of balls) {
    ball.trailLine.visible = settings.trail;
  }

  const dt = time.update(params.time_pace * 2.25);

  // Zero spinTorque before physics iteration — it will be accumulated
  // by stepSingleRope during cradle.update()
  for (const ball of balls) {
    ball.spinTorque = 0;
  }

  cradle.update(dt, params.damping, params.gravity);

  for (const ball of balls) {

    const deltaTwist =
      ball.spinOmega * dt;

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

    const totalAngularImpulse =
      ball.spinTorque + ropeTorque * dt;

    ball.spinOmega +=
      totalAngularImpulse /
      ball.momentOfInertia;

    ball.spinOmega *=
      Math.exp(
        -ball.spinDamping * dt
      );

    ball.spinAngle +=
      ball.spinOmega * dt;

    ball.spinAngle = ball.spinAngle % (2 * Math.PI);

    // Slow auto-unwind when ball is nearly at rest
    const restThreshold = 0.01;
    if (Math.abs(ball.spinOmega) < restThreshold && ball.vel.length() < restThreshold) {
      const unwindFactor = Math.pow(0.97, dt * 60);
      ball.spinAngle *= unwindFactor;
      ball.ropeA.twistAngle *= unwindFactor;
      ball.ropeB.twistAngle *= unwindFactor;
    }

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

  const accs = balls.map(ball => ball.acc.length());
  const tans = balls.map(ball => ball.acc_tangential.length());
  const cens = balls.map(ball => ball.acc_centripetal.length());
  const vels = balls.map(ball => ball.vel.length());
  const omegas = balls.map(ball => ball.omegaVec.length());
  const alphas = balls.map(ball => ball.alphaVec.length());
  const tens = balls.map(ball => (ball.tensionA.length() + ball.tensionB.length()) / 2);
  const weights = balls.map(ball => Math.abs(params.gravity) * ball.mass);

  //add all values to HUD for the all balls (can be extended to show multiple balls later if desired)
  updateHUD(hudElements, {
    acc: accs,
    tan: tans,
    cen: cens,
    vel: vels,
    omega: omegas,
    alpha: alphas,
    ten: tens,
    weight: weights
  }, params.HUD);

  controls.update();
  renderer.render(scene, camera);
}

setAngle();
animate();