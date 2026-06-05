import GUI from 'lil-gui';
import { PHYSICS } from '../core/Constants.js';

export function createGUI(params, settings, onApplyAngle) {
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
    'trail'
  ];

  gui.add(params, 'angle', -150, 150);
  gui.add({ apply: onApplyAngle }, 'apply').name('Apply Angle');

  gui.add(params, 'mass', 1, 350, 1);
  gui.add(params, 'length', 0.5, 2);
  gui.add(params, 'damping', -1, 1);
  gui.add(params, 'gravity', -PHYSICS.GRAVITY * 2, PHYSICS.GRAVITY * 2);

  gui.add(params, 'time_pace', 0.01, 4, 0.01);
  gui.add(params, 'scene_offset_y', -3, 3, 0.01).name('Scene Height');
  gui.add(params, 'vector_magnitude', 0.1, 1, 0.01).name('Vector Magnitude');

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
    folder.add(settings, 'trail').onChange(syncMasterToggle)
  ];

  return gui;
}