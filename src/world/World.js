import * as THREE from 'three';
import { createCradleArm } from './Cradle.js';
import { EXRLoader } from 'three/examples/jsm/Addons.js';
import { createTable } from './Table.js';
import { PHYSICS } from '../core/Constants.js';
import { initializePlanets, spaceTexture, issTexture } from '../utils/PlanetTextures.js';

export const scene = new THREE.Scene();

export let planets = [];

await initializePlanets().then(loadedPlanets => {
  planets = loadedPlanets;

  loadedPlanets.forEach(planet => {
    scene.add(planet.mesh);
  });

  console.log('All planets initialized and added to scene');

}).catch(err => console.error('Planet initialization failed', err));

console.log(planets)

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

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(-2, 5, -4);
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 200;
light.shadow.camera.left = -10;
light.shadow.camera.right = 10;
light.shadow.camera.top = 10;
light.shadow.camera.bottom = -10;
scene.add(light);

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

export let currentPlanet = null;

export function handlePlanetChange(newPlanetName) {
  const pickedPlanet = planets.find(p => p.name === newPlanetName);
  
  if ((!pickedPlanet || !pickedPlanet.mesh) && (newPlanetName !== 'EARTH' && newPlanetName !== 'SPACE' && newPlanetName !== 'ISS')) {
    console.warn(`Planet "${newPlanetName}" not found`);
    return;
  }

  // Hide previous planet
  if (currentPlanet && currentPlanet.mesh) {
    disposePlanet(currentPlanet);
  }

  if (newPlanetName !== 'EARTH' && pickedPlanet?.mesh) {
    pickedPlanet.mesh.visible = true;
  }

  
  // Environment logic
  if (newPlanetName === 'EARTH') {
    table.visible = true;
    if (exr) {
      scene.background = exr;
      scene.environment = exr;
      console.log("Earth EXR loaded");
    } else {
      console.log("Earth EXR not loaded");
    }
  } else {
    table.visible = false;
    scene.background = newPlanetName === 'ISS' ? issTexture : spaceTexture;
    console.log(scene.back)
    scene.environment = null;
  }

  currentPlanet = pickedPlanet;
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