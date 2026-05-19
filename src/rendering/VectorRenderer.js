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

function updateText(data, text) {
  const { canvas, ctx, texture } = data;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  texture.needsUpdate = true;
}

export function initVectorRendering(ball) {
  ball.vectorMagnifier = 0.1;

  ball.velLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x00ff00 })
  );
  ball.accLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xff0000 })
  );
  ball.weightLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x7df9ff })
  );
  ball.tanLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffff00 })
  );
  ball.tensionLineA = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x1453fe })
  );
  ball.tensionLineB = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x1453fe })
  );
  ball.cenLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x800080 })
  );
  ball.omegaVecLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x800000 })
  );
  ball.alphaVecLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xff8800 })
  );

  const velLabel = createTextSprite('0');
  ball.velLabel = velLabel.sprite;
  ball.velLabelData = velLabel;

  const accLabel = createTextSprite('0');
  ball.accLabel = accLabel.sprite;
  ball.accLabelData = accLabel;

  const weightLabel = createTextSprite('0');
  ball.weightLabel = weightLabel.sprite;
  ball.weightLabelData = weightLabel;

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
  scene.add(ball.tanLine);
  scene.add(ball.tensionLineA);
  scene.add(ball.tensionLineB);
  scene.add(ball.cenLine);
  scene.add(ball.omegaVecLine);
  scene.add(ball.alphaVecLine);

  scene.add(ball.velLabel);
  scene.add(ball.accLabel);
  scene.add(ball.weightLabel);
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
}

export function updateVectors(ball, mag, gravity = PHYSICS.GRAVITY) {
  const s = mag;

  ball.velLine.geometry.setFromPoints([
    ball.pos,
    ball.pos.clone().add(ball.vel.clone().multiplyScalar(s))
  ]);

  ball.accLine.geometry.setFromPoints([
    ball.pos,
    ball.pos.clone().add(ball.acc.clone().multiplyScalar(s))
  ]);

  ball.weightLine.geometry.setFromPoints([
    ball.pos,
    ball.pos.clone().add(new THREE.Vector3(0, -gravity * ball.mass, 0).multiplyScalar(s))
  ]);

  const tan = ball.acc_tangential || new THREE.Vector3();
  ball.tanLine.geometry.setFromPoints([
    ball.pos,
    ball.pos.clone().add(tan.clone().multiplyScalar(s))
  ]);

  const tA = ball.tensionA || new THREE.Vector3();
  const tB = ball.tensionB || new THREE.Vector3();
  ball.tensionLineA.geometry.setFromPoints([ball.pos, ball.pos.clone().add(tA.clone().multiplyScalar(s))]);
  ball.tensionLineB.geometry.setFromPoints([ball.pos, ball.pos.clone().add(tB.clone().multiplyScalar(s))]);

  const c = ball.acc_centripetal || new THREE.Vector3();
  ball.cenLine.geometry.setFromPoints([
    ball.pos,
    ball.pos.clone().add(c.clone().multiplyScalar(s))
  ]);

  const w = ball.omegaVec || new THREE.Vector3();
  ball.omegaVecLine.geometry.setFromPoints([ball.pos, ball.pos.clone().add(w.clone().multiplyScalar(s))]);

  const a = ball.alphaVec || new THREE.Vector3();
  ball.alphaVecLine.geometry.setFromPoints([ball.pos, ball.pos.clone().add(a.clone().multiplyScalar(s))]);

  updateText(ball.velLabelData, ball.vel.length().toFixed(2) + ' m/s');
  updateText(ball.accLabelData, ball.acc.length().toFixed(2) + ' m/s²');
  updateText(ball.weightLabelData, (Math.abs(gravity) * ball.mass).toFixed(2) + ' N');
  updateText(ball.tanLabelData, tan.length().toFixed(2) + ' m/s²');
  updateText(ball.tensionALabelData, tA.length().toFixed(2) + ' N');
  updateText(ball.tensionBLabelData, tB.length().toFixed(2) + ' N');
  updateText(ball.cenLabelData, c.length().toFixed(2) + ' m/s²');
  updateText(ball.angVelLabelData, w.length().toFixed(2) + ' rad/s');
  updateText(ball.angAccLabelData, a.length().toFixed(2) + ' rad/s²');

  ball.velLabel.position.copy(ball.pos).add(ball.vel.clone().multiplyScalar(s));
  ball.accLabel.position.copy(ball.pos).add(ball.acc.clone().multiplyScalar(s));
  ball.weightLabel.position.copy(ball.pos).add(new THREE.Vector3(0, -gravity * ball.mass * s, 0));
  ball.tanLabel.position.copy(ball.pos).add(tan.clone().multiplyScalar(s));
  ball.tensionALabel.position.copy(ball.pos).add(tA.clone().multiplyScalar(s));
  ball.tensionBLabel.position.copy(ball.pos).add(tB.clone().multiplyScalar(s));
  ball.cenLabel.position.copy(ball.pos).add(c.clone().multiplyScalar(s));
  ball.angVelLabel.position.copy(ball.pos).add(w.clone().multiplyScalar(s));
  ball.angAccLabel.position.copy(ball.pos).add(a.clone().multiplyScalar(s));
}