import * as THREE from 'three';
import { PHYSICS } from '../core/Constants.js';

function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 256;
  canvas.height = 128;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = 999;
  sprite.scale.set(1, 0.5, 2);

  return { sprite, canvas, ctx, texture };
}

import { updateLabel } from './LabelRenderer.js';
import { momentum } from '../utils/PhysicsUtils.js';

export function initVectorRendering(ball) {
  ball.vectorMagnifier = 0.1;

  const makeArrow = (color) =>
    new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      0,
      color,
      1,
      1
    );

  ball.velLine = makeArrow(0x00ff00);
  ball.accLine = makeArrow(0xff0000);
  ball.weightLine = makeArrow(0x7df9ff);
  ball.momentumLine = makeArrow(0x89f336);
  ball.tanLine = makeArrow(0xffff00);
  ball.tensionLineA = makeArrow(0x1453fe);
  ball.tensionLineB = makeArrow(0x1453fe);
  ball.cenLine = makeArrow(0x800080);
  ball.omegaVecLine = makeArrow(0x800000);
  ball.alphaVecLine = makeArrow(0xff8800);

  const velLabel = createTextSprite('0');
  ball.velLabel = velLabel.sprite;
  ball.velLabelData = velLabel;

  const accLabel = createTextSprite('0');
  ball.accLabel = accLabel.sprite;
  ball.accLabelData = accLabel;

  const weightLabel = createTextSprite('0');
  ball.weightLabel = weightLabel.sprite;
  ball.weightLabelData = weightLabel;

  const momentumLabel = createTextSprite('0');
  ball.momentumLabel = momentumLabel.sprite;
  ball.momentumLabelData = momentumLabel;

  const tanLabel = createTextSprite('0');
  ball.tanLabel = tanLabel.sprite;
  ball.tanLabelData = tanLabel;

  const tensionALabel = createTextSprite('0');
  ball.tensionALabel = tensionALabel.sprite;
  ball.tensionALabelData = tensionALabel;

  const tensionBLabel = createTextSprite('0');
  ball.tensionBLabel = tensionBLabel.sprite;
  ball.tensionBLabelData = tensionBLabel;

  const cenLabel = createTextSprite('0');
  ball.cenLabel = cenLabel.sprite;
  ball.cenLabelData = cenLabel;

  const angVelLabel = createTextSprite('0');
  ball.angVelLabel = angVelLabel.sprite;
  ball.angVelLabelData = angVelLabel;

  const angAccLabel = createTextSprite('0');
  ball.angAccLabel = angAccLabel.sprite;
  ball.angAccLabelData = angAccLabel;
}

export function addVectorsToScene(scene, ball) {
  scene.add(ball.velLine);
  scene.add(ball.accLine);
  scene.add(ball.weightLine);
  scene.add(ball.momentumLine);
  scene.add(ball.tanLine);
  scene.add(ball.tensionLineA);
  scene.add(ball.tensionLineB);
  scene.add(ball.cenLine);
  scene.add(ball.omegaVecLine);
  scene.add(ball.alphaVecLine);

  scene.add(ball.velLabel);
  scene.add(ball.accLabel);
  scene.add(ball.weightLabel);
  scene.add(ball.momentumLabel);
  scene.add(ball.tanLabel);
  scene.add(ball.tensionALabel);
  scene.add(ball.tensionBLabel);
  scene.add(ball.cenLabel);
  scene.add(ball.angVelLabel);
  scene.add(ball.angAccLabel);
}

export function setVectorVisibility(ball, settings) {
  ball.velLine.visible = settings.velocity;
  ball.velLabel.visible = settings.velocity;

  ball.accLine.visible = settings.acceleration;
  ball.accLabel.visible = settings.acceleration;

  ball.tensionLineA.visible = settings.tension;
  ball.tensionALabel.visible = settings.tension;
  ball.tensionLineB.visible = settings.tension;
  ball.tensionBLabel.visible = settings.tension;

  ball.cenLine.visible = settings.centripetal;
  ball.cenLabel.visible = settings.centripetal;

  ball.tanLine.visible = settings.tangential;
  ball.tanLabel.visible = settings.tangential;

  ball.omegaVecLine.visible = settings.angular_velocity;
  ball.angVelLabel.visible = settings.angular_velocity;

  ball.alphaVecLine.visible = settings.angular_acceleration;
  ball.angAccLabel.visible = settings.angular_acceleration;

  ball.weightLine.visible = settings.weight;
  ball.weightLabel.visible = settings.weight;

  ball.momentumLine.visible = settings.momentum;
  ball.momentumLabel.visible = settings.momentum;
}

export function updateVectors(ball, mag, gravity = PHYSICS.GRAVITY) {
  const s = mag;

  const tan = ball.acc_tangential || new THREE.Vector3();
  const tA = ball.tensionA || new THREE.Vector3();
  const tB = ball.tensionB || new THREE.Vector3();
  const c = ball.acc_centripetal || new THREE.Vector3();
  const w = ball.omegaVec || new THREE.Vector3();
  const a = ball.alphaVec || new THREE.Vector3();

  const scaledMomentum = ball.vel.clone().multiplyScalar(ball.mass / 75);
  const scaledVel = ball.vel.clone().multiplyScalar(s);
  const scaledAcc = ball.acc.clone().multiplyScalar(s);
  const scaledWeight = new THREE.Vector3(0, -gravity * ball.mass, 0).multiplyScalar(s / 75);
  const scaledTan = tan.clone().multiplyScalar(s);
  const scaledTA = tA.clone().multiplyScalar(s / 75);
  const scaledTB = tB.clone().multiplyScalar(s / 75);
  const scaledC = c.clone().multiplyScalar(s);
  const scaledW = w.clone().multiplyScalar(s);
  const scaledA = a.clone().multiplyScalar(s);

  const setArrow = (arrow, vector) => {
    arrow.position.copy(ball.pos);

    if (vector.lengthSq() > 1e-12) {
      arrow.setDirection(vector.clone().normalize());
      arrow.setLength(vector.length());
    } else {
      arrow.setDirection(new THREE.Vector3(0, 1, 0));
      arrow.setLength(0);
    }
  };

  setArrow(ball.momentumLine, scaledMomentum);
  setArrow(ball.velLine, scaledVel);
  setArrow(ball.accLine, scaledAcc);
  setArrow(ball.weightLine, scaledWeight);
  setArrow(ball.tanLine, scaledTan);
  setArrow(ball.tensionLineA, scaledTA);
  setArrow(ball.tensionLineB, scaledTB);
  setArrow(ball.cenLine, scaledC);
  setArrow(ball.omegaVecLine, scaledW);
  setArrow(ball.alphaVecLine, scaledA);

  updateLabel(ball.velLabelData, ball.vel.length().toFixed(2) + ' m/s');
  updateLabel(ball.accLabelData, ball.acc.length().toFixed(2) + ' m/s²');
  updateLabel(ball.tanLabelData, tan.length().toFixed(2) + ' m/s²');
  updateLabel(ball.tensionALabelData, tA.length().toFixed(2) + ' N');
  updateLabel(ball.tensionBLabelData, tB.length().toFixed(2) + ' N');
  updateLabel(ball.cenLabelData, c.length().toFixed(2) + ' m/s²');
  updateLabel(ball.angVelLabelData, w.length().toFixed(2) + ' rad/s');
  updateLabel(ball.angAccLabelData, a.length().toFixed(2) + ' rad/s²');
  updateLabel(ball.weightLabelData, (Math.abs(gravity) * ball.mass).toFixed(2) + ' N');
  updateLabel(ball.momentumLabelData, (ball.vel.length() * ball.mass).toFixed(2) + ' kg.m/s');

  ball.velLabel.position.copy(ball.pos).add(scaledVel);
  ball.accLabel.position.copy(ball.pos).add(scaledAcc);
  ball.tanLabel.position.copy(ball.pos).add(scaledTan);
  ball.tensionALabel.position.copy(ball.pos).add(scaledTA);
  ball.tensionBLabel.position.copy(ball.pos).add(scaledTB);
  ball.cenLabel.position.copy(ball.pos).add(scaledC);
  ball.angVelLabel.position.copy(ball.pos).add(scaledW);
  ball.angAccLabel.position.copy(ball.pos).add(scaledA);
  ball.weightLabel.position.copy(ball.pos).add(scaledWeight);
  ball.momentumLabel.position.copy(ball.pos).add(scaledMomentum);
}