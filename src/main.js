import * as THREE from 'three';

import { setting } from './menus/SelectionMenu.js';
import { simulationConfig } from './menus/ConfigStore.js';

import { balls } from './core/SimulationState.js';
import { CradleSystem } from './objects/CradleSystem.js';
import { Time } from './core/Time.js';
import { CRADLE, PHYSICS, MATERIALS } from './core/Constants.js';
import { Ball } from './objects/Ball.js';

import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { scene, camera, renderer, planets } from './world/World.js';

import { createGUI } from './ui/UI.js';
import { createHUD, updateHUD } from './world/HUD.js';
import {
  addVectorsToScene,
  initVectorRendering,
  setVectorVisibility,
  updateVectors
} from './rendering/VectorRenderer.js';

import { check } from './utils/PayloadChecker.js';
import { payload } from './payload.json';
import { showRandomFact } from './utils/FactCard.js';
import { showRandomQuote } from './utils/Quotes.js';
import { playRandomAmbience, playRandomQuote } from './utils/AudioUtils.js';
import { kineticEnergy, potentialEnergy } from './utils/PhysicsUtils.js';
import { computeEnergy } from './physics/Energy.js';

let mainPayload = payload;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

document.getElementById('express-menu')?.remove();

if (setting === 'express' || setting === 'custom') {
  mainPayload = await simulationConfig;
}

const isDebugMode = setting === 'load' || setting === 'express' || setting === 'custom';

const NUM_BALLS = isDebugMode ? mainPayload.numberOfBalls : CRADLE.NUM_BALLS;
const SPACING = CRADLE.BALL_SPACING;


for (let i = 0; i < NUM_BALLS; i++) {
  const x = (i - (NUM_BALLS - 1) / 2) * SPACING;
  const ball = new Ball(x);
  ball.addToScene(scene);
  balls.push(ball);
}
balls.forEach((ball, index) => {

  // if(mainPayload.balls[index]?.position) {
  //     const ballToSwap = balls[mainPayload.balls[index]?.position - 1];
  //     const temp = ballToSwap.pos.x;
  //     ballToSwap.pos.x = ball.pos.x;
  //     ball.pos.x = temp;
  //     console.log(temp)
  // }

  initVectorRendering(ball);
  addVectorsToScene(scene, ball);
});

const cradle = new CradleSystem(balls);

const G = PHYSICS.GRAVITATIONAL_CONSTANT;
let g = G * PHYSICS.PLANETS.EARTH_MASS / (PHYSICS.PLANETS.EARTH_RADIUS ** 2);

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
  momentum: false,
  trail: false
};

export const params = {
  angle: 90,
  numBallsToMove: 1,
  numLeft: 1,
  numRight: 1,
  offset: 0,
  spinOmega: 0,
  mass: 261.38,
  damping: 0,
  length: 1,
  gravity: PHYSICS.GRAVITY,
  time_pace: 1,
  scene_offset_y: 0,
  vector_magnitude: 0.1,
  materialType: 'metal',
  elasticity: 0.96,
  // ropeDamping: 10,
  HUD: true,

  generalDampingToggle: true,
  // generalDamping: 0.01,

  materialDampingToggle: true,
  // materialDamping: MATERIALS[balls[0].currentMaterialType.toUpperCase()].damping,

  temperatureDampingToggle: true,

  soundDampingToggle: true

};

function handleMaterialChange(type) {
  cradle.setMaterialType(type);
  const firstBall = balls[0];

  if (setting === 'express') {
    balls.forEach(ball => {
      ball.restitution = mainPayload.elasticity;
      ball.mass = mainPayload.mass;
    });
  }

  params.elasticity = firstBall.restitution;
  params.mass = firstBall.mass;

  console.log(`All balls changed to: ${type}. Restitution: ${firstBall.restitution}`);

  massController?.updateDisplay();
  elasticityController?.updateDisplay();
  materialDampingController?.updateDisplay();
}

function handleBallMaterialChange(type, ballIndex) {
  balls[ballIndex].setMaterialType(type, mainPayload, ballIndex);
}

export function updateBallMass(newMass) {
  params.mass = newMass;
}

let dampingToggles = [
  true, true, true, true
];

function updateDampingToggles() {
  dampingToggles = [params.generalDampingToggle,
  params.materialDampingToggle,
  params.soundDampingToggle,
  params.temperatureDampingToggle,
  ]
}

params.onMaterialChange = handleMaterialChange;
params.onPlanetChange = handlePlanetChange;

function setAngle(spin = 0, isSymmetric = false, leftBalls = 0, rightBalls = 0) {
  const oldLength = balls.length;
  cradle.resetToAngle(params.angle, params.numBallsToMove, params.offset, isSymmetric, leftBalls, rightBalls); // change to maybe a boolean for which ball to move

  if (oldLength !== balls.length) {
    Object.assign(balls, cradle.balls);
  }

  balls.forEach((ball, index) => {
    ball.spinOmega = (isDebugMode || setting === 'load' || setting === 'custom') ? 0 : (index === 4 ? spin : 0);
    ball.spinAngle = 0;
    if (ball.ropeA) ball.ropeA.twistAngle = 0;
    if (ball.ropeB) ball.ropeB.twistAngle = 0;
  });
  applyDebugPositions();
}

function applyDebugPositions(num) {
  if (!isDebugMode) return;

  balls.forEach((ball, i) => {
    const targetIndex = mainPayload.balls?.[i]?.position;

    if (targetIndex === undefined) return;

    const targetX =
      (targetIndex - (NUM_BALLS - 1) / 2) * SPACING;

    ball.pos.x = targetX;

    if (ball.prevPos) {
      ball.prevPos.x = targetX;
    }

    ball.syncMesh();
  });
}

const gui = createGUI(params, settings, setAngle, NUM_BALLS, updateDampingToggles);
const hudElements = createHUD();

mainPayload = (setting !== 'express' && setting !== 'custom') ? check() : mainPayload;

if (isDebugMode && setting !== 'express') {
  for (let i = 0; i < mainPayload.numberOfBalls; i++) {
    const key = `${i}`;
    handleBallMaterialChange(mainPayload.balls[key].material, i);
    balls[i].mass = mainPayload.balls[key].mass;
  }
}

// Find GUI controllers
const massController = gui.controllers.find(c => c._name === 'mass');
const elasticityController = gui.controllers.find(c => c._name === 'Elasticity (e)');
const planetController = gui.controllers.find(c => c._name === 'Planet');
const gravityController = gui.controllers.find(c => c._name === 'gravity');
const materialDampingController = gui.controllers.find(c => c._name === 'General Damping');

function handlePlanetChange(planet) {
  if (planet === 'SPACE') {
    params.gravity = 0;
  } else if (planet === 'STRATOSPHERE') {
    const r = PHYSICS.PLANETS.EARTH_RADIUS + 30000;
    params.gravity = (G * PHYSICS.PLANETS.EARTH_MASS) / (r * r);
  } else if (planet === 'ISS') {
    const r = PHYSICS.PLANETS.EARTH_RADIUS + 400000;
    params.gravity = (G * PHYSICS.PLANETS.EARTH_MASS) / (r * r);
  }
  else if (planet === 'NEARTH') {
    const r = PHYSICS.PLANETS.EARTH_RADIUS;
    params.gravity = - (G * PHYSICS.PLANETS.EARTH_MASS) / (r * r);
  } else {
    const M = PHYSICS.PLANETS[`${planet}_MASS`];
    const r = PHYSICS.PLANETS[`${planet}_RADIUS`];
    params.gravity = (G * M) / (r * r);
  }

  planetController?.updateDisplay();
  gravityController?.updateDisplay();
}

if (!isDebugMode) {
  cradle.setMaterialType(params.materialType);
  cradle.setElasticity(params.elasticity);
} else {
  balls.forEach((ball, i) => {
    ball.restitution = setting !== 'express'
      ? mainPayload.balls[`${i}`].elasticity
      : mainPayload.elasticity;
  });
}

if (setting === 'express') {
  balls.forEach(() => handleMaterialChange(mainPayload.material));
}

function animate() {
  requestAnimationFrame(animate);

  if (!isDebugMode && setting !== 'load' && setting !== 'custom') {
    balls.forEach(ball => ball.length = params.length + 0.2);
  }

  if (_prevLength === null || Math.abs(_prevLength - params.length) > 1e-6) {
    if (!isDebugMode && setting !== 'load' && setting !== 'custom') {
      cradle.setLength(params.length);
    } else {
      balls.forEach((ball, index) => {
        const ropeLength = setting !== 'express'
          ? mainPayload.balls[index].rope
          : mainPayload.rope;
        cradle.setBallLength(ropeLength, ball);
      });
    }
    _prevLength = params.length;
  }

  if (!isDebugMode && setting !== 'custom' && setting !== 'load') {
    cradle.updateMasses(params.mass);
    cradle.setElasticity(params.elasticity);
  }

  balls.forEach(ball => {
    if (ball.ropeA) ball.ropeA.damping = 10;
    if (ball.ropeB) ball.ropeB.damping = 10;
  });

  g = params.gravity;
  scene.position.y = params.scene_offset_y;

  balls.forEach(ball => ball.trailLine.visible = settings.trail);

  const dt = time.update(params.time_pace * 2.5);

  // Reset spinTorque
  balls.forEach(ball => ball.spinTorque = 0);

  cradle.update(dt, params.damping, params.gravity, null, dampingToggles);

  // Update spin physics
  balls.forEach(ball => {
    const deltaTwist = ball.spinOmega * dt;

    ball.ropeA.twistAngle += deltaTwist;
    ball.ropeB.twistAngle += deltaTwist;

    const torqueA = -ball.ropeA.torsionK * ball.ropeA.twistAngle * 3500 - ball.ropeA.torsionDamping * ball.ropeA.twistOmega;
    const torqueB = -ball.ropeB.torsionK * ball.ropeB.twistAngle * 3500 - ball.ropeB.torsionDamping * ball.ropeB.twistOmega;

    const totalAngularImpulse = ball.spinTorque + (torqueA + torqueB) * dt;

    ball.spinOmega += totalAngularImpulse / ball.momentOfInertia;
    ball.spinOmega *= Math.exp(-ball.spinDamping * dt);
    ball.spinAngle = (ball.spinAngle + ball.spinOmega * dt) % (2 * Math.PI);

    const restThreshold = 0.01;
    if (Math.abs(ball.spinOmega) < restThreshold && ball.vel.length() < restThreshold) {
      const unwindFactor = Math.pow(0.97, dt * 60);
      ball.spinAngle *= unwindFactor;
      ball.ropeA.twistAngle *= unwindFactor;
      ball.ropeB.twistAngle *= unwindFactor;
    }

    ball.ropeA.twistOmega = ball.spinOmega;
    ball.ropeB.twistOmega = ball.spinOmega;

    ball.syncMesh();
  });

  balls.forEach(ball => {
    updateVectors(ball, params.vector_magnitude, params.gravity);
    setVectorVisibility(ball, settings);
  });

  // HUD Update
  const accs = balls.map(b => b.acc.length());
  const tans = balls.map(b => b.acc_tangential.length());
  const cens = balls.map(b => b.acc_centripetal.length());
  const vels = balls.map(b => b.vel.length());
  const omegas = balls.map(b => b.omegaVec.length());
  const alphas = balls.map(b => b.alphaVec.length());
  const tens = balls.map(b => (b.tensionA.length() + b.tensionB.length()) / 2);
  const weights = balls.map(b => Math.abs(params.gravity) * b.mass);
  const momentums = balls.map(b => b.vel.length() * b.mass);

  const energies = balls.map(b => computeEnergy(b, params.gravity, params.length - 0.2));

  const Ps = balls.map((b, index) => energies[index].PE)
  const Ks = balls.map((b, index) => energies[index].KE)
  const Es = balls.map((b, index) => energies[index].total)

  updateHUD(hudElements, {
    acc: accs, tan: tans, cen: cens, vel: vels,
    omega: omegas, alpha: alphas, ten: tens, weight: weights, momentum: momentums,
    Penergy: Ps, Kenergy: Ks, Energy: Es

  }, params.HUD);

  controls.update();
  renderer.render(scene, camera);
}

setAngle();
animate();

// Show a new fact every 30-50 seconds, fade in/out from the top
setInterval(showRandomFact, 30000 + Math.random() * 20000);
// Show the first fact after a short delay
setTimeout(showRandomFact, 3000);

// Show a quote every 40 seconds
setInterval(showRandomQuote, 40000);
// Show the first quote after a short delay
setTimeout(showRandomQuote, 2000);

playRandomAmbience();
setInterval(playRandomQuote, 30000 + Math.random() * 10000);
