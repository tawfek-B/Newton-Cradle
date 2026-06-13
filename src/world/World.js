import * as THREE from 'three';
import { createCradleArm } from './Cradle.js';
import { EXRLoader } from 'three/examples/jsm/Addons.js';
import { createTable } from './Table.js';

export const scene = new THREE.Scene();
const loader = new EXRLoader();
loader.load('/vintage_measuring_lab_2k.exr', (texture) => {

  texture.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = texture;
  scene.environment = texture;

});

export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.set(0, 1.5, 4);

export const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(2, 5, 4);
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 20;
light.shadow.camera.left = -10;
light.shadow.camera.right = 10;
light.shadow.camera.top = 10;
light.shadow.camera.bottom = -10;
scene.add(light);

// const helper = new THREE.DirectionalLightHelper(light);
// scene.add(helper);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('dblclick', () => {
  if (!document.fullscreenElement) {
    renderer.domElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

const leftArm = createCradleArm();
leftArm.position.z = -0.5;

const rightArm = createCradleArm();
rightArm.position.z = 0.5;

scene.add(leftArm);
scene.add(rightArm);

const table = new createTable();
scene.add(table)
