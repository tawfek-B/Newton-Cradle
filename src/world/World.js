import * as THREE from 'three';
import { createCradleArm } from './Cradle.js';
import { EXRLoader } from 'three/examples/jsm/Addons.js';
import { createTable } from './Table.js';

export const scene = new THREE.Scene();
const loader = new EXRLoader();
loader.load('/vintage_measuring_lab_2k.exr', (texture) => {

  texture.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = texture;
  scene.environment = texture; // VERY important for lighting

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
document.body.appendChild(renderer.domElement);

// light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//fullscreen
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