import { ambienceAudio } from '../MainMenu.js';
import { simulationConfig } from './ConfigStore.js';

export let expressConfig = null;

const container = document.createElement('div');
container.id = 'express-menu';
container.style.position = 'fixed';
container.style.inset = '0';
container.style.display = 'grid';
container.style.placeItems = 'center';
container.style.background =
  'linear-gradient(135deg, #141517 0%, rgb(20, 22, 26) 45%, #1c1d21 100%)';
container.style.color = '#eff6ff';
container.style.fontFamily = 'Segoe UI, Arial, sans-serif';
container.style.zIndex = '10';

document.body.appendChild(container);

const menuCard = document.createElement('div');
menuCard.style.width = 'min(90vw, 500px)';
menuCard.style.padding = '40px 30px';
menuCard.style.borderRadius = '24px';
menuCard.style.background = 'rgba(15, 23, 42, 0.85)';
menuCard.style.border = '1px solid rgba(148, 163, 184, 0.3)';
menuCard.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.6)';

menuCard.classList.add('fade-card');


menuCard.innerHTML = `
<h1 style="margin:0 0 30px 0;text-align:center;color:#e0f2fe;">
  Express Setup
</h1>

<div style="display:flex;flex-direction:column;gap:18px;">

  <label>
    Number of Balls
    <input id="numBalls" type="range" min="1" max="10" value="5">
    <span id="numBallsValue">5</span>
  </label>

  <label>
    Rope Length
    <input id="rope" type="range" min="0.5" max="2" step="0.01" value="1">
    <span id="ropeValue">1.00</span>
  </label>

  <label>
    Spin Speed
    <input id="spinOmega" type="range" min="0" max="20" step="0.1" value="0">
    <span id="spinOmegaValue">0</span>
  </label>

  <label>
    Material
    <select id="material">
      <option value="metal">Metal</option>
      <option value="wood">Wood</option>
      <option value="rubber">Rubber</option>
    </select>
  </label>

  <label>
    Elasticity
    <input id="elasticity" type="range" min="0" max="1" step="0.01" value="1">
    <span id="elasticityValue">1.00</span>
  </label>
  
  <label>
    Mass
    <input id="mass" type="range" min="1" max="300" step="0.5" value="300">
    <span id="massValue">300.00</span>
  </label>

  <button id="start-btn" class="menu-btn">
    Start Simulation
  </button>

</div>
`;

container.appendChild(menuCard);

const style = document.createElement('style');
style.textContent = `
.menu-btn {
  width:100%;
  padding:16px 24px;
  font-size:18px;
  font-weight:600;
  color:#082f49;
  background:linear-gradient(135deg,#38bdf8,#818cf8);
  border:none;
  border-radius:9999px;
  cursor:pointer;
}

#express-menu label{
  display:flex;
  flex-direction:column;
  gap:8px;
  color:#e2e8f0;
  font-size:15px;
}

#express-menu input,
#express-menu select{
  width:100%;
}

/* Fade animation */
.fade-card{
  opacity:0;
  transform:translateY(12px) scale(0.98);
  transition:
    opacity 250ms ease,
    transform 250ms ease;
}

.fade-card.show{
  opacity:1;
  transform:translateY(0) scale(1);
}

.fade-card.hide{
  opacity:0;
  transform:translateY(-12px) scale(0.98);
}
`;

document.head.appendChild(style);
requestAnimationFrame(() => {
  menuCard.classList.add('show');
});

const numBalls = document.getElementById('numBalls');
const rope = document.getElementById('rope');
const spinOmega = document.getElementById('spinOmega');
const elasticity = document.getElementById('elasticity');
const mass = document.getElementById('mass');

numBalls.oninput = () =>
  document.getElementById('numBallsValue').textContent = numBalls.value;

rope.oninput = () =>
  document.getElementById('ropeValue').textContent =
  Number(rope.value).toFixed(2);

spinOmega.oninput = () =>
  document.getElementById('spinOmegaValue').textContent =
  Number(spinOmega.value).toFixed(1);

elasticity.oninput = () =>
  document.getElementById('elasticityValue').textContent =
  Number(elasticity.value).toFixed(2);
mass.oninput = () =>
  document.getElementById('massValue').textContent =
  Number(mass.value).toFixed(2);


document.getElementById('start-btn').addEventListener('click', async () => {

  simulationConfig.numberOfBalls =
    Number(document.getElementById('numBalls').value);

  simulationConfig.rope =
    Number(document.getElementById('rope').value);

  simulationConfig.spinOmega =
    Number(document.getElementById('spinOmega').value);

  simulationConfig.material =
    document.getElementById('material').value;

  simulationConfig.elasticity =
    Number(document.getElementById('elasticity').value);

  simulationConfig.mass =
    Number(document.getElementById('mass').value);

  menuCard.classList.remove('show');
  menuCard.classList.add('hide');

  await new Promise(resolve => setTimeout(resolve, 250));

  ambienceAudio.remove();

  container.remove();

  await import('../main.js');
});