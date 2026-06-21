import { ambienceAudio } from "../MainMenu";

const container = document.createElement('div');
container.id = 'selection-menu';
container.style.position = 'fixed';
container.style.inset = '0';
container.style.display = 'grid';
container.style.placeItems = 'center';
container.style.background = 'linear-gradient(135deg, #141517 0%, rgb(20, 22, 26) 45%, #1c1d21 100%)';
container.style.color = '#eff6ff';
container.style.fontFamily = 'Segoe UI, Arial, sans-serif';
container.style.zIndex = '10';

document.body.appendChild(container);

const menuCard = document.createElement('div');
menuCard.style.width = 'min(90vw, 420px)';
menuCard.style.padding = '40px 30px';
menuCard.style.borderRadius = '24px';
menuCard.style.background = 'rgba(15, 23, 42, 0.85)';
menuCard.style.border = '1px solid rgba(148, 163, 184, 0.3)';
menuCard.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.6)';
menuCard.style.textAlign = 'center';

menuCard.innerHTML = `
  <h1 style="margin: 0 0 40px 0; font-size: 28px; color: #e0f2fe;">Choose Simulation</h1>
  
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <button class="menu-btn" data-target="../main.js">Default Settings</button>
    <button class="menu-btn" data-target="../menus/ExpressMenu.js">Express Setup</button>
    <button class="menu-btn" data-target="../menus/CustomMenu.js">Custom Setup</button>
    <button class="menu-btn" data-target="/mainPayload">Load payload.json</button>
  </div>
`;

container.appendChild(menuCard);

menuCard.classList.add('menu-card');

container.appendChild(menuCard);

menuCard.getBoundingClientRect();

menuCard.classList.add('show');

const style = document.createElement('style');
style.textContent = `
  .menu-btn {
    width: 100%;
    padding: 16px 24px;
    font-size: 18px;
    font-weight: 600;
    color: #082f49;
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 8px 20px rgba(56, 189, 248, 0.3);
  }
  .menu-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(56, 189, 248, 0.4);
  }
  .menu-card {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
    transition: opacity 300ms ease, transform 300ms ease;
  }
  .menu-card.show {
    opacity: 1;
    transform: translateY(12px) scale(1);
  }
  .menu-card.hide {
    opacity: 0;
    transform:
      translateY(10px)
      scale(1, 0.2);
  }
  .menu-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(56, 189, 248, 0.4);
  }
`;
document.head.appendChild(style);

export let setting = null;

menuCard.addEventListener('click', async (e) => {
  const button = e.target.closest('.menu-btn');
  if (!button) return;

  let targetFile = button.dataset.target;

  if (targetFile === '../menus/CustomMenu.js')
    setting = 'custom';
  else if (targetFile === '../menus/ExpressMenu.js')
    setting = 'express';
  else if (targetFile === '/mainPayload') {   //placeholder, since it's the same targetFile
    setting = 'load';
    targetFile = '../main.js'
  } else {
    setting = 'default';
  }

  menuCard.classList.remove('show');
  menuCard.classList.add('hide');

  await new Promise(resolve => setTimeout(resolve, 300));

  if(setting === 'load' || setting === 'default')
    ambienceAudio.remove();

  container.remove();

  try {
    console.log(`Loading: ${targetFile}`);

    await import(targetFile);

    console.log(`Successfully loaded: ${targetFile}`);
  } catch (error) {
    console.error(`Failed to load ${targetFile}`, error);
  }
});