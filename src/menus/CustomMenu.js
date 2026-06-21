import { ambienceAudio } from '../MainMenu.js';
import { simulationConfig } from './ConfigStore.js';

const container = document.createElement('div');
container.id = 'custom-menu';
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

const style = document.createElement('style');
style.textContent = `
#custom-menu .menu-card{
  width:min(90vw,500px);
  padding:40px 30px;
  border-radius:24px;
  background:rgba(15,23,42,.85);
  border:1px solid rgba(148,163,184,.3);
  box-shadow:0 20px 50px rgba(0,0,0,.6);

  opacity:0;
  transform:translateY(12px) scale(0.98);

  transition:
    opacity .25s ease,
    transform .25s ease;
}

#custom-menu .menu-card.show{
  opacity: 1;
  transform: translateY(0) scale(1);
}

#custom-menu .menu-card.hide{
  opacity: 0;
  transform: translateY(-12px) scale(0.98);
}

#custom-menu .menu-btn{
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

#custom-menu label{
  display:flex;
  flex-direction:column;
  gap:8px;
  color:#e2e8f0;
  font-size:15px;
}

#custom-menu input,
#custom-menu select{
  width:100%;
}

#custom-menu .controls{
  display:flex;
  flex-direction:column;
  gap:18px;
}

#custom-menu h1{
  margin:0 0 30px 0;
  text-align:center;
  color:#e0f2fe;
}

#custom-menu .ball-indicator{
  text-align:center;
  margin-bottom:20px;
  color:#94a3b8;
}
`;

document.head.appendChild(style);

const ballConfigs = [];

showBallCountScreen();

function showBallCountScreen() {
  renderScreen(`
    <div class="menu-card">
      <h1>Custom Setup</h1>

      <div class="controls">
        <label>
          Number of Balls
          <input id="numBalls" type="range" min="1" max="10" value="5">
          <span id="numBallsValue">5</span>
        </label>

        <button id="next-btn" class="menu-btn">
          Configure Balls
        </button>
      </div>
    </div>
  `);

  const numBalls = document.getElementById('numBalls');

  numBalls.oninput = () => {
    document.getElementById('numBallsValue').textContent =
      numBalls.value;
  };

  document.getElementById('next-btn').addEventListener('click', () => {
    const count = Number(numBalls.value);

    ballConfigs.length = 0;

    for (let i = 0; i < count; i++) {
      ballConfigs.push({
        rope: 1,
        spinOmega: 0,
        material: 'metal',
        elasticity: 1,
        mass: 300
      });
    }

    transitionTo(() => showBallScreen(0));
  });
}

function showBallScreen(index) {
  const config = ballConfigs[index];

  renderScreen(`
    <div class="menu-card">

      <h1>Custom Setup</h1>

      <div class="ball-indicator">
        Ball ${index + 1} of ${ballConfigs.length}
      </div>

      <div class="controls">

        <label>
          Rope Length
          <input id="rope" type="range"
            min="0.5"
            max="2"
            step="0.01"
            value="${config.rope}">
          <span id="ropeValue">${config.rope.toFixed(2)}</span>
        </label>

        <label>
          Spin Speed
          <input id="spinOmega" type="range"
            min="0"
            max="20"
            step="0.1"
            value="${config.spinOmega}">
          <span id="spinOmegaValue">${config.spinOmega.toFixed(1)}</span>
        </label>

        <label>
          Material
          <select id="material">
            <option value="metal" ${config.material === 'metal' ? 'selected' : ''
    }>Metal</option>

            <option value="wood" ${config.material === 'wood' ? 'selected' : ''
    }>Wood</option>

            <option value="rubber" ${config.material === 'rubber' ? 'selected' : ''
    }>Rubber</option>
          </select>
        </label>

        <label>
          Elasticity
          <input id="elasticity" type="range"
            min="0"
            max="1"
            step="0.01"
            value="${config.elasticity}">
          <span id="elasticityValue">${config.elasticity.toFixed(2)}</span>
        </label>

        <label>
          Mass
          <input id="mass" type="range"
            min="20"
            max="300"
            step="0.5"
            value="${config.mass}">
          <span id="massValue">${config.mass.toFixed(2)}</span>
        </label>

        <button id="next-btn" class="menu-btn">
          ${index === ballConfigs.length - 1
      ? 'Start Simulation'
      : 'Next Ball'
    }
        </button>

      </div>
    </div>
  `);

  const rope = document.getElementById('rope');
  const spinOmega = document.getElementById('spinOmega');
  const elasticity = document.getElementById('elasticity');
  const mass = document.getElementById('mass');

  rope.oninput = () => {
    document.getElementById('ropeValue').textContent =
      Number(rope.value).toFixed(2);
  };

  spinOmega.oninput = () => {
    document.getElementById('spinOmegaValue').textContent =
      Number(spinOmega.value).toFixed(1);
  };

  elasticity.oninput = () => {
    document.getElementById('elasticityValue').textContent =
      Number(elasticity.value).toFixed(2);
  };

  mass.oninput = () => {
    document.getElementById('massValue').textContent =
      Number(mass.value).toFixed(2);
  };

  document.getElementById('next-btn').addEventListener('click', async () => {

    ballConfigs[index] = {
      rope: Number(rope.value),
      spinOmega: Number(spinOmega.value),
      material: document.getElementById('material').value,
      elasticity: Number(elasticity.value),
      mass: Number(mass.value)
    };

    if (index < ballConfigs.length - 1) {
      transitionTo(() => showBallScreen(index + 1));
      return;
    }

    simulationConfig.numberOfBalls = ballConfigs.length;
    simulationConfig.balls = ballConfigs;
    simulationConfig.custom = true;

    const card = container.querySelector('.menu-card');

    card.classList.remove('show');
    card.classList.add('hide');

    await new Promise(resolve => setTimeout(resolve, 250));
    
    ambienceAudio.remove();

    container.remove();

    await import('../main.js');
  });
}

function renderScreen(html) {
  container.innerHTML = html;

  const card = container.querySelector('.menu-card');

  requestAnimationFrame(() => {
    card.classList.add('show');
  });

  return card;
}

async function transitionTo(nextScreen) {
  const card = container.querySelector('.menu-card');

  if (card) {
    card.classList.remove('show');
    card.classList.add('hide');

    await new Promise(resolve => setTimeout(resolve, 250));
  }

  await nextScreen();
}