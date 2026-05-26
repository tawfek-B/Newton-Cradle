import * as THREE from 'three';
import { DEBUG, MATERIALS } from '../core/Constants.js';
import { Rope } from './Rope.js';
import { createBallDebug } from '../core/Debug.js';
import { updateBallMass } from '../main.js';

function isFiniteVec3(v) {
  return Number.isFinite(v.x)
    && Number.isFinite(v.y)
    && Number.isFinite(v.z);
}

export class Ball {
  constructor(x = 0) {
    this.theta = 0;
    this.omega = 0;
    this.prevTheta = this.theta;

    this.radius = 0.2;
    this.mass = 261.38;

    this.restitution = 0.85;
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

    // =====================================================
    // (MATERIALS)
    // =====================================================
    this.materials = {
      metal: null,
      rubber: null,
      wood: null,
    };

    this.currentMaterialType = "metal";
    const textureLoader = new THREE.TextureLoader();

    // (Metal)
    const metalAlbedo = textureLoader.load(
      "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_BaseColor.jpg",
    );
    const metalMetal = textureLoader.load(
      "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_Metallic.jpg",
    )
    // const metal_disp = textureLoader.load(
    //   "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_Displacement.png",
    // );
    const metal_nor = textureLoader.load(
      "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_Normal.png",
    );
    const metal_ao = textureLoader.load(
      '/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_AmbientOcclusion.jpg',
    );
    const metal_rough = textureLoader.load(
      "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_Roughness.jpg",
    );
    this.materials.metal = new THREE.MeshStandardMaterial({
      map: metalAlbedo,
      // displacementMap: metal_disp,
      metalnessMap: metalMetal,
      roughnessMap: metal_rough,
      displacementScale: 100,
      normalMap: metal_nor,
      aoMap: metal_ao,
      roughness: 0.3,
      metalness: 0.95,
      color: 0xffffff,
    });

    // (Rubber)
    const rubberAlbedo = textureLoader.load(
      "/balls/Rubber/baseball_playground_diff_2k.jpg",
    );

    const rubber_arm = textureLoader.load(
      "/balls/Rubber/baseball_playground_arm_2k.jpg",
    );

    const rubberDisp = textureLoader.load(
      "/balls/Rubber/baseball_playground_disp_2k.png",
    );

    const rubberNor = textureLoader.load(
      "/balls/Rubber/baseball_playground_nor_gl_2k.jpg",
    );

    this.materials.rubber = new THREE.MeshStandardMaterial({
      map: rubberAlbedo,
      displacementMap: rubberDisp,
      displacementScale: 0.01,
      aoMap: rubber_arm,
      normalMap: rubberNor,
      roughness: 0.9,
      metalness: 0.05,
      color: 0xcccccc,
    });

    // (Wood)
    const wood_diff = textureLoader.load(
      "/balls/Wood/rosewood_veneer1_diff_2k.jpg",
    );

    const wood_arm = textureLoader.load(
      "/balls/Wood/rosewood_veneer1_arm_2k.jpg",
    );

    const wood_disp = textureLoader.load(
      "/balls/Wood/wood_cabinet_worn_long_disp_2k.png",
    );
    const wood_nor = textureLoader.load(
      "/balls/Wood/wood_cabinet_worn_long_nor_dx_2k.jpg",
    );
    this.materials.wood = new THREE.MeshStandardMaterial({
      map: wood_diff,
      aoMap: wood_arm,
      normalMap: wood_nor,
      displacementMap: wood_disp,
      displacementScale: 0.01,
      roughness: 0.7,
      metalness: 0.02,
      color: 0xffffff,
    });
    // =====================================================
    // BALL MESH
    // =====================================================

    const geometry = new THREE.SphereGeometry(this.radius, 32, 32);

    const material = new THREE.MeshStandardMaterial({
      color: 0x909090,
      metalness: 1,
    });

    this.mesh = new THREE.Mesh(geometry, material);

    // =====================================================
    // ROPE SETTINGS
    // =====================================================

    this.ropeSegments = 8;

    this.ropeNodeMass = 0.01;

    this.ropeStiffness = 600;

    this.ropeDamping = 10;

    this.ropeAirDrag = 0.01;

    // =====================================================
    // ROPES
    // =====================================================

    this.ropeA = new Rope({
      anchor: this.anchorA,
      ball: this,
      segments: this.ropeSegments,
      nodeMass: this.ropeNodeMass,
      stiffness: this.ropeStiffness,
      damping: this.ropeDamping,
      airDrag: this.ropeAirDrag,
    });

    this.ropeB = new Rope({
      anchor: this.anchorB,
      ball: this,
      segments: this.ropeSegments,
      nodeMass: this.ropeNodeMass,
      stiffness: this.ropeStiffness,
      damping: this.ropeDamping,
      airDrag: this.ropeAirDrag,
    });

    // =====================================================
    // TRAIL
    // =====================================================

    this.trailPoints = [];

    this.maxTrail = DEBUG.SHOW_TRAIL ? 1000 : 0;

    this.trailGeometry = new THREE.BufferGeometry();

    this.trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
    });

    this.trailLine = new THREE.Line(this.trailGeometry, this.trailMaterial);
  }

  updateMass() {
    const volume = (4 / 3) * Math.PI * Math.pow(this.radius, 3);
    this.mass = MATERIALS[this.currentMaterialType.toUpperCase()].density * volume;

    updateBallMass(this.mass);
  }

  setPhysicalMaterial(physicalMat) {
    this.restitution = physicalMat.restitution;
    this.friction = physicalMat.friction;
    this.damping = physicalMat.damping;

    this.updateMass();
  }

  setMaterialType(type) {
    if (type === "metal" && this.materials.metal) {
      this.mesh.material = this.materials.metal;
      this.currentMaterialType = "metal";
      this.setPhysicalMaterial(MATERIALS.METAL);

    } else if (type === "rubber" && this.materials.rubber) {
      this.mesh.material = this.materials.rubber;
      this.currentMaterialType = "rubber";
      this.setPhysicalMaterial(MATERIALS.RUBBER);

    } else if (type === "wood" && this.materials.wood) {
      this.mesh.material = this.materials.wood;
      this.currentMaterialType = "wood";
      this.setPhysicalMaterial(MATERIALS.WOOD);
    }
  }

  // =====================================================
  // RESET ROPES
  // =====================================================

  resetRopes() {
    this.ropeA.reset();
    this.ropeB.reset();
  }

  // =====================================================
  // SCENE
  // =====================================================

  addToScene(scene) {
    scene.add(this.mesh);

    this.ropeA.addToScene(scene);
    this.ropeB.addToScene(scene);

    scene.add(this.trailLine);
  }

  // =====================================================
  // MESH SYNC
  // =====================================================

  syncMesh() {
    if (!isFiniteVec3(this.pos)) {
      this.pos.set(this.pivot.x, this.pivot.y - this.length, 0);

      this.vel.set(0, 0, 0);

      this.resetRopes();
    }

    this.mesh.position.copy(this.pos);

    this.ropeA.syncGeometry();
    this.ropeB.syncGeometry();

    // =====================================================
    // TRAIL
    // =====================================================

    if (isFiniteVec3(this.pos)) {
      this.trailPoints.push(this.pos.clone());
    }

    if (this.trailPoints.length > this.maxTrail) {
      this.trailPoints.shift();
    }

    const positions = [];
    const colors = [];

    for (let i = 0; i < this.trailPoints.length; i++) {
      const p = this.trailPoints[i];

      if (!isFiniteVec3(p)) continue;

      positions.push(p.x, p.y, p.z);

      const t = i / this.trailPoints.length;

      const color = new THREE.Color();

      color.setHSL(t, 1.0, 0.4);

      colors.push(color.r, color.g, color.b);
    }

    this.trailGeometry.dispose();

    this.trailGeometry = new THREE.BufferGeometry();

    this.trailGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );

    this.trailGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3),
    );

    this.trailLine.geometry = this.trailGeometry;
  }
  update(scene) {
    createBallDebug(scene);

    this.syncMesh();
  }
}