import * as THREE from 'three';
import { DEBUG, MATERIALS } from '../core/Constants.js';
import { Rope } from './Rope.js';
import { updateTrail } from '../rendering/TrailRenderer.js';
import { updateBallMass } from '../core/SimulationState.js';
import { payload } from '../payload.json';
import { ballTextures } from '../utils/TextureLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

function isFiniteVec3(v) {
  return Number.isFinite(v.x)
    && Number.isFinite(v.y)
    && Number.isFinite(v.z);
}
console.log('Ball.js loading');

export class Ball {
  constructor(x = 0) {
    this.theta = 0;
    this.omega = 0;
    this.prevTheta = this.theta;

    this.radius = 0.2;
    this.mass = 261.38;

    this.spinAngle = 0;
    this.spinOmega = 0;
    this.spinAlpha = 0;
    this.spinTorque = 0;

    this.spinDamping = 0.05;
    this.temperature = 0;
    this.soundLevel = 0;

    this.damage = 0;
    this.maxDamage = 1;
    this.crackTexture = null;
    this.baseTexture = null;
    this.crackIntensity = 0;

    this.decals = [];
    this.maxDecals = 12;
    this.lastDecalTime = 0;
    this.decalCooldown = 0.2; // seconds
    this.momentOfInertia =
      (2 / 5) * this.mass * this.radius * this.radius;

    this.restitution = 0.96;
    this.friction = 0.2;
    this.damping = 0.01;

    this.debug = null;

    this.omegaVec = new THREE.Vector3();
    this.alphaVec = new THREE.Vector3();

    this.anchorA = new THREE.Vector3(x, 2, 0.5);
    this.anchorB = new THREE.Vector3(x, 2, -0.5);
    this.pivot = new THREE.Vector3(x, 2, 0);

    this.length = 1;

    this.pos = new THREE.Vector3(this.pivot.x, this.pivot.y - this.length, 0);
    this.vel = new THREE.Vector3();
    this.acc = new THREE.Vector3();

    // Surface attachment points (local to ball center, pointing toward each anchor)
    // anchorA=(x,2,0.5), ball.pos=(x,1,0) at rest → dir = (0, 1, 0.5)
    const dirA = this.anchorA.clone().sub(this.pos).normalize();
    const dirB = this.anchorB.clone().sub(this.pos).normalize();
    this.localAttachA = dirA.multiplyScalar(this.radius * 0.95);
    this.localAttachB = dirB.multiplyScalar(this.radius * 0.95);

    this.materials = {
      metal: null,
      rubber: null,
      wood: null,
    };

    this.currentMaterialType = "metal";

    this.materials.metal = new THREE.MeshStandardMaterial({
      map: ballTextures.metalAlbedo,
      metalnessMap: ballTextures.metalMetal,
      roughnessMap: ballTextures.metal_rough,
      normalMap: ballTextures.metal_nor,
      aoMap: ballTextures.metal_ao,
      // displacementMap: ballTextures.metal_disp,

      // displacementScale: 20,
      roughness: 0.3,
      metalness: 0.95,
      normalScale: new THREE.Vector2(2.5, 2.5),

      color: 0xffffff,
    });

    this.materials.rubber = new THREE.MeshStandardMaterial({
      map: ballTextures.rubberAlbedo,
      // displacementMap: ballTextures.rubberDisp,
      aoMap: ballTextures.rubber_arm,
      normalMap: ballTextures.rubberNor,

      // displacementScale: 0.01,
      roughness: 0.9,
      metalness: 0.05,
      normalScale: new THREE.Vector2(2.5, 2.5),

      color: 0xf7ff12,
    });

    this.materials.wood = new THREE.MeshStandardMaterial({
      map: ballTextures.wood_diff,
      aoMap: ballTextures.wood_arm,
      normalMap: ballTextures.wood_nor,
      // displacementMap: ballTextures.wood_disp,

      // displacementScale: 0.01,
      roughness: 0.8,
      metalness: 0.1,
      normalScale: new THREE.Vector2(5, 5),

      // color: 0x5b3115,
    });

    const geometry = new THREE.SphereGeometry(this.radius, 128, 128);

    const material = new THREE.MeshStandardMaterial({
      color: 0x909090,
      metalness: 1,
    });

    this.mesh = new THREE.Mesh(geometry, material);

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.decalMaterial = new THREE.MeshBasicMaterial({
      map: ballTextures.crackTexture,
      transparent: true,
      alphaTest: 0.05,      // discard nearly transparent pixels
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      side: THREE.DoubleSide
    });

    this.decalMaterial.map = ballTextures.crackTexture;
    this.decalMaterial.needsUpdate = true;

    this.decalMaterial.map = ballTextures.crackTexture;
    this.decalMaterial.needsUpdate = true;

    this.ropeSegments = 15;
    this.ropeNodeMass = 0.01;
    this.ropeStiffness = 600;
    this.ropeDamping = 10;
    this.ropeAirDrag = 0.01;

    this.ropeA = new Rope({
      anchor: this.anchorA,
      ball: this,
      attachSide: 'A',
      segments: this.ropeSegments,
      nodeMass: this.ropeNodeMass,
      stiffness: this.ropeStiffness,
      damping: this.ropeDamping,
      airDrag: this.ropeAirDrag,
    });

    this.ropeB = new Rope({
      anchor: this.anchorB,
      ball: this,
      attachSide: 'B',
      segments: this.ropeSegments,
      nodeMass: this.ropeNodeMass,
      stiffness: this.ropeStiffness,
      damping: this.ropeDamping,
      airDrag: this.ropeAirDrag,
    });

    this.trailPoints = [];
    this.maxTrail = DEBUG.SHOW_TRAIL ? 1000 : 0;
    this.trailGeometry = new THREE.BufferGeometry();
    this.trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
    });
    this.trailLine = new THREE.Line(this.trailGeometry, this.trailMaterial);
  }

  updateMass(payload, ball) {
    const volume =
      (4 / 3) * Math.PI * Math.pow(this.radius, 3);
    payload.debug ? this.mass = payload.balls[ball].mass : this.mass =
      MATERIALS[this.currentMaterialType.toUpperCase()].density *
      volume;

    this.momentOfInertia =
      (2 / 5) * this.mass * this.radius * this.radius;

    updateBallMass(this.mass);
  }

  setPhysicalMaterial(physicalMat, payload, ball) {
    this.restitution = physicalMat.restitution;
    this.friction = physicalMat.friction;
    this.damping = physicalMat.damping;

    this.updateMass(payload, ball);
  }

  getSurfaceAttachA() {
    const rotated = this.localAttachA.clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.spinAngle);
    return this.pos.clone().add(rotated);
  }

  getSurfaceAttachB() {
    const rotated = this.localAttachB.clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.spinAngle);
    return this.pos.clone().add(rotated);
  }

  setMaterialType(type, payload, ball) {
    if (type === "metal" && this.materials.metal) {
      this.mesh.material = this.materials.metal;
      this.currentMaterialType = "metal";
      this.setPhysicalMaterial(MATERIALS.METAL, payload, ball);
    } else if (type === "rubber" && this.materials.rubber) {
      this.mesh.material = this.materials.rubber;
      this.currentMaterialType = "rubber";
      this.setPhysicalMaterial(MATERIALS.RUBBER, payload, ball);
    } else if (type === "wood" && this.materials.wood) {
      this.mesh.material = this.materials.wood;
      this.currentMaterialType = "wood";
      this.setPhysicalMaterial(MATERIALS.WOOD, payload, ball);
    }
  }

  applyDamage(amount) {

    this.damage += amount;
    this.damage = Math.min(this.damage, this.maxDamage);

    this.crackMaterial.opacity = this.damage;

    // optional: scale crack visibility
    this.crackMesh.scale.set(
      1 + this.damage * 0.05,
      1 + this.damage * 0.05,
      1 + this.damage * 0.05
    );
  }

  updateCracks() {

    if (!this.lastImpactDir) return;

    const dir = this.lastImpactDir;

    this.crackMesh.lookAt(
      this.pos.clone().add(dir)
    );
  }

  resetRopes() {
    this.ropeA.reset();
    this.ropeB.reset();
  }

  addToScene(scene) {
    scene.add(this.mesh);
    this.ropeA.addToScene(scene);
    this.ropeB.addToScene(scene);
    scene.add(this.trailLine);
  }

  syncMesh() {
    if (!isFiniteVec3(this.pos)) {
      this.pos.set(
        this.pivot.x,
        this.pivot.y - this.length,
        0
      );

      this.vel.set(0, 0, 0);

      this.resetRopes();
    }

    this.mesh.position.copy(this.pos);

    this.mesh.rotation.y = this.spinAngle;

    this.ropeA.syncGeometry();
    this.ropeB.syncGeometry();

    this.trailPoints.push(this.pos.clone());

    if (this.trailPoints.length > this.maxTrail) {
      this.trailPoints.shift();
    }

    this.mesh.rotation.z = this.theta;

    updateTrail(this);
  }

  update() {
    this.syncMesh();
  }
}