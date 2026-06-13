import * as THREE from 'three';
import { DEBUG, MATERIALS } from '../core/Constants.js';
import { Rope } from './Rope.js';
import { updateTrail } from '../rendering/TrailRenderer.js';
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

    this.spinAngle = 0;
    this.spinOmega = 0;
    this.spinAlpha = 0;
    this.spinTorque = 0;

    this.spinDamping = 0.05;

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
    const textureLoader = new THREE.TextureLoader();

    const metalAlbedo = textureLoader.load(
      "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_BaseColor.jpg",
    );
    metalAlbedo.colorSpace = THREE.SRGBColorSpace;
    const metalMetal = textureLoader.load(
      "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_Metallic.jpg",
    );
    metalMetal.colorSpace = THREE.NoColorSpace;
    const metal_nor = textureLoader.load(
      "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_Normal.png",
    );
    metal_nor.colorSpace = THREE.NoColorSpace;
    const metal_ao = textureLoader.load(
      '/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_AmbientOcclusion.jpg',
    );
    metal_ao.colorSpace = THREE.NoColorSpace;
    const metal_rough = textureLoader.load(
      "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_Roughness.jpg",
    );
    metal_rough.colorSpace = THREE.NoColorSpace;
    const metal_disp = textureLoader.load(
      "/balls/Metal/Poliigon_MetalGalvanizedZinc_7184_Displacement.jpg",
    );
    metal_disp.colorSpace = THREE.NoColorSpace;
    this.materials.metal = new THREE.MeshStandardMaterial({
      map: metalAlbedo,
      metalnessMap: metalMetal,
      roughnessMap: metal_rough,
      normalMap: metal_nor,
      aoMap: metal_ao,
      // displacementMap: metal_disp,

      // displacementScale: 20,
      roughness: 0.3,
      metalness: 0.95,
      normalScale: new THREE.Vector2(2.5, 2.5),

      color: 0xffffff,
    });

    const rubberAlbedo = textureLoader.load(
      "/balls/Rubber/rubberized_track_diff_1k.jpg",
    );
    rubberAlbedo.colorSpace = THREE.SRGBColorSpace;
    const rubber_arm = textureLoader.load(
      "/balls/Rubber/rubberized_track_arm_1k.jpg",
    );
    rubber_arm.colorSpace = THREE.NoColorSpace;
    const rubberDisp = textureLoader.load(
      "/balls/Rubber/rubberized_track_disp_1k.png",
    );
    rubberDisp.colorSpace = THREE.NoColorSpace;
    const rubberNor = textureLoader.load(
      "/balls/Rubber/rubberized_track_nor_gl_1k.png",
    );
    rubberNor.colorSpace = THREE.NoColorSpace;
    this.materials.rubber = new THREE.MeshStandardMaterial({
      map: rubberAlbedo,
      // displacementMap: rubberDisp,
      aoMap: rubber_arm,
      normalMap: rubberNor,
      
      // displacementScale: 0.01,
      roughness: 0.9,
      metalness: 0.05,
      normalScale: new THREE.Vector2(2.5, 2.5),

      color: 0xffffff,
    });

    const wood_diff = textureLoader.load(
      "/balls/Wood/herringbone_parquet_diff_1k.jpg",
    );
    wood_diff.colorSpace = THREE.SRGBColorSpace;
    const wood_arm = textureLoader.load(
      "/balls/Wood/herringbone_parquet_arm_1k.jpg",
    );
    wood_arm.colorSpace = THREE.NoColorSpace;
    const wood_disp = textureLoader.load(
      "/balls/Wood/herringbone_parquet_disp_1k.png",
    );
    wood_disp.colorSpace = THREE.NoColorSpace;
    const wood_nor = textureLoader.load(
      "/balls/Wood/herringbone_parquet_nor_gl_1k.png",
    );
    wood_nor.colorSpace = THREE.NoColorSpace;
    this.materials.wood = new THREE.MeshStandardMaterial({
      map: wood_diff,
      aoMap: wood_arm,
      normalMap: wood_nor,
      // displacementMap: wood_disp,
      
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

  updateMass() {
    const volume =
      (4 / 3) * Math.PI * Math.pow(this.radius, 3);

    this.mass =
      MATERIALS[this.currentMaterialType.toUpperCase()].density *
      volume;

    this.momentOfInertia =
      (2 / 5) * this.mass * this.radius * this.radius;

    updateBallMass(this.mass);
  }

  setPhysicalMaterial(physicalMat) {
    this.restitution = physicalMat.restitution;
    this.friction = physicalMat.friction;
    this.damping = physicalMat.damping;
    this.updateMass();
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