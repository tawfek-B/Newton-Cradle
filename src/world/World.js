import * as THREE from 'three';
import { createCradleArm } from './Cradle.js';
import { EXRLoader } from 'three/examples/jsm/Addons.js';
import { createTable } from './Table.js';
import { PHYSICS } from '../core/Constants.js';
import { planetsTex, spaceTexture, issTexture } from '../utils/PlanetTextures.js';

export const scene = new THREE.Scene();

export let planets = [];

planets = planetsTex;

// Add all planets to the scene (hidden)
planets.forEach(planet => {
  scene.add(planet.mesh);
});

console.log('All planets initialized and added to scene');


export let currentEnvironment = null;

const exrLoader = new EXRLoader();
let exr = exrLoader.load('/vintage_measuring_lab_2k.exr', (texture) => {

  texture.mapping = THREE.EquirectangularReflectionMapping;

  currentEnvironment = texture;


  scene.background = texture;
  scene.environment = texture;
});

export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  3000
);

camera.position.set(0, 1.5, 4);

export const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const light1 = new THREE.DirectionalLight(0xffffff, 2);
light1.position.set(4, 5, -8);
light1.castShadow = true;
light1.shadow.mapSize.width = 1024;
light1.shadow.mapSize.height = 1024;
light1.shadow.camera.near = 0.5;
light1.shadow.camera.far = 200;
light1.shadow.camera.left = -10;
light1.shadow.camera.right = 10;
light1.shadow.camera.top = 10;
light1.shadow.camera.bottom = -10;
scene.add(light1);

const light2 = new THREE.DirectionalLight(0xffffff, 2);
light2.position.set(4, 5, 0);
light2.castShadow = true;
light2.shadow.mapSize.width = 1024;
light2.shadow.mapSize.height = 1024;
light2.shadow.camera.near = 0.5;
light2.shadow.camera.far = 200;
light2.shadow.camera.left = -10;
light2.shadow.camera.right = 10;
light2.shadow.camera.top = 10;
light2.shadow.camera.bottom = -10;
scene.add(light2);

const light3 = new THREE.DirectionalLight(0xffffff, 2);
light3.position.set(4, 5, 8);
light3.castShadow = true;
light3.shadow.mapSize.width = 1024;
light3.shadow.mapSize.height = 1024;
light3.shadow.camera.near = 0.5;
light3.shadow.camera.far = 200;
light3.shadow.camera.left = -10;
light3.shadow.camera.right = 10;
light3.shadow.camera.top = 10;
light3.shadow.camera.bottom = -10;
scene.add(light3);

// const lightHelper1 = new THREE.DirectionalLightHelper(light1)
// const lightHelper2 = new THREE.DirectionalLightHelper(light2)
// const lightHelper3 = new THREE.DirectionalLightHelper(light3)

// scene.add(lightHelper1)
// scene.add(lightHelper2)
// scene.add(lightHelper3)

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

export let currentPlanet = 'EARTH';

export function handlePlanetChange(newPlanetName) {
  const pickedPlanet = planets.find(p => p.name === newPlanetName);

  if ((!pickedPlanet || !pickedPlanet.mesh) && (newPlanetName !== 'EARTH' && newPlanetName !== 'SPACE' && newPlanetName !== 'ISS' && newPlanetName !== 'NEARTH')) {
    console.warn(`Planet "${newPlanetName}" not found`);
    return;
  }

  // Hide previous planet
  if (currentPlanet && currentPlanet?.mesh) {
    disposePlanet(currentPlanet);
  }

  if (newPlanetName !== 'EARTH' && pickedPlanet?.mesh) {
    pickedPlanet.mesh.visible = true;
  }

  // Environment logic
  if (newPlanetName === 'EARTH' || newPlanetName === 'NEARTH') {
    table.visible = true;
    if (exr) {
      scene.background = exr;
      scene.environment = exr;
    } else {
      // console.log("Earth EXR not loaded");
    }
  } else {
    table.visible = false;
    scene.background = newPlanetName === 'ISS' ? issTexture : spaceTexture;
    scene.environment = null;
  }

  if (newPlanetName === 'EARTH' || newPlanetName === 'NEARTH' || newPlanetName === 'ISS' || newPlanetName === 'SPACE')
    currentPlanet = newPlanetName;
  else
    currentPlanet = pickedPlanet

  console.log(`Switched to: ${newPlanetName === 'EARTH' ? "EARTH" : pickedPlanet?.name || newPlanetName}`);
}

function disposePlanet(planet) {
  const mesh = planet.mesh;
  if (!mesh) return;

  mesh.visible = false;

  if (mesh.geometry) mesh.geometry.dispose();
  if (mesh.material) {
    const mat = mesh.material;
    if (mat.map) mat.map.dispose();
    if (mat.emissiveMap) mat.emissiveMap.dispose();
    mat.dispose();
  }
}