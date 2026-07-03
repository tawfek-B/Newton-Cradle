import GUI from 'lil-gui';
import { PHYSICS } from '../core/Constants.js';
import { parameter } from 'three/tsl';
import { balls } from '../core/SimulationState.js';
import { payload } from '../payload.json';
import { handlePlanetChange } from '../world/World.js';
import { setting } from '../menus/SelectionMenu.js';

export function createGUI(params, settings, onApplyAngle, numBalls, updateDampingToggles) {
  const gui = new GUI();
  const vectorKeys = [
    'velocity',
    'acceleration',
    'tension',
    'centripetal',
    'tangential',
    'angular_velocity',
    'angular_acceleration',
    'weight',
    'momentum',
    'trail'
  ];

  gui.add(params, 'angle', -150, 150).name('Angle');

  //for some reason, putting step as step(1) makes the number increment by 100
  const numBallsController = gui.add(params, 'numBallsToMove').name(`Balls to Move (1 - ${balls.length})`)
    .step(0.01).min(1).max(params.numberOfBalls).onChange((value) => {
      numBallsController.setValue(Math.round(value));
    });

  const offsetController = gui.add(params, 'offset', 0, 1, 0.01).name('Offset')

  const spinController = gui.add(params, 'spinOmega', 0, 20, 1).name("Spin Speed");

  gui.add({ apply: () => onApplyAngle(spinController.getValue(), false) }, 'apply').name('Apply Angle');

  const leftBalls = gui.add(params, 'numLeft', 0, Math.ceil(numBalls / 2), 1).name(`Left balls to move (0 - ${Math.ceil(numBalls / 2)}`);
  const rightBalls = gui.add(params, 'numRight', 0, Math.ceil(numBalls / 2), 1).name(`Right balls to move (0 - ${Math.ceil(numBalls / 2)}`);

  gui.add({ apply: () => onApplyAngle(spinController.getValue(), true, leftBalls.getValue(), rightBalls.getValue()) }, 'apply').name('Apply Symmetric Angle');

  const elasticity = gui.add(params, 'elasticity', 0, 1, 0.01).name('Elasticity (e)');
  (setting === 'express' || setting === 'load' || setting !== 'default') ? elasticity.disable() : null;

  const mass = gui.add(params, 'mass', 1, 350, 1);
  (setting === 'express' || setting === 'load' || setting !== 'default') ? mass.disable() : null;

  const length = gui.add(params, 'length', 0.5, 2);
  (setting === 'express' || setting === 'load' || setting !== 'default') ? length.disable() : null;

  // gui.add(params, 'damping', -1, 1);
  gui.add(params, 'gravity', -PHYSICS.GRAVITY * 2, PHYSICS.GRAVITY * 2);

  gui.add(params, 'time_pace', 0.01, 4, 0.01);
  gui.add(params, 'scene_offset_y', -3, 3, 0.01).name('Scene Height');
  gui.add(params, 'vector_magnitude', 0.1, 1, 0.01).name('Vector Magnitude');
  // gui.add(params, 'ropeDamping', 0, 20, 0.1).name('Rope Damping');

  const materialOptions = {
    'Metal': 'metal',
    'Rubber': 'rubber',
    'Wood': 'wood'
  };
  gui.add(params, 'materialType', materialOptions).name('Material').onChange(value => {
    if (params.onMaterialChange) {
      params.onMaterialChange(value);
    }
  });

  const planets = {
    "Earth": "EARTH",
    "Moon": "MOON",
    "Sun": "SUN",
    "Mercury": "MERCURY",
    "Venus": "VENUS",
    "Mars": "MARS",
    "Jupiter": "JUPITER",
    "Saturn": "SATURN",
    "Uranus": "URANUS",
    "Neptune": "NEPTUNE",
    "Pluto": "PLUTO",

    'Outer Space': 'SPACE',
    'Negative Earth': 'NEARTH',
    'Stratosphere': 'STRATOSPHERE',
    'Internation Space Station (ISS)': 'ISS'
  }

  gui.add(params, 'planet', planets).name('Planet/Location').setValue('EARTH').onChange(value => {
    if (params.onPlanetChange) {

      params.onPlanetChange(value);
      handlePlanetChange(value)
      console.log("PLANET CHANGED");
    }
  });

  const dampingFolder = gui.addFolder('Damping Folder');

  dampingFolder.add(params, 'generalDampingToggle').name('General Damping').onChange(updateDampingToggles);
  dampingFolder.add(params, 'damping', -1, 1);
  dampingFolder.add(params, 'materialDampingToggle').name('Material Damping').onChange(updateDampingToggles);
  dampingFolder.add(params, 'soundDampingToggle').name('Sound Damping').onChange(updateDampingToggles);
  dampingFolder.add(params, 'temperatureDampingToggle').name('Temperature Damping').onChange(updateDampingToggles);


  const folder = gui.addFolder('Vectors');

  const allVectorsState = {
    selected: vectorKeys.every((key) => settings[key])
  };

  const syncMasterToggle = () => {
    allVectorsState.selected = vectorKeys.every((key) => settings[key]);
    selectAllController.updateDisplay();
  };

  const setAllVectors = (value) => {
    vectorKeys.forEach((key) => {
      settings[key] = value;
    });
  };

  const selectAllController = folder
    .add(allVectorsState, 'selected')
    .name('Select / Deselect All')
    .onChange((value) => {
      setAllVectors(value);
      vectorControllers.forEach((controller) => controller.updateDisplay());
      syncMasterToggle();
    });


  const vectorControllers = [
    folder.add(settings, 'velocity').onChange(syncMasterToggle),
    folder.add(settings, 'acceleration').onChange(syncMasterToggle),
    folder.add(settings, 'tension').onChange(syncMasterToggle),
    folder.add(settings, 'centripetal').onChange(syncMasterToggle),
    folder.add(settings, 'tangential').onChange(syncMasterToggle),
    folder.add(settings, 'angular_velocity').name('angular velocity').onChange(syncMasterToggle),
    folder.add(settings, 'angular_acceleration').name('angular acceleration').onChange(syncMasterToggle),
    folder.add(settings, 'weight').onChange(syncMasterToggle),
    folder.add(settings, 'momentum').onChange(syncMasterToggle),
    folder.add(settings, 'trail').onChange(syncMasterToggle)
  ];

  gui.add(params, 'HUD').name('Show HUD').onChange(value => {
    if (params.onHUDToggle) {
      params.onHUDToggle(value);
    }
  }
  )

  return gui;
}