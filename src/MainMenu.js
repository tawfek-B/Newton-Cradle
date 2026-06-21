import { SoundManager } from './audio/SoundManager.js';
import { initializePlanets } from './utils/PlanetTextures.js';
import { load } from './utils/TextureLoader.js';

const slides = [
    {
        text: "At the dawn of the twentieth century, humanity believed the great book of physics was finally finished and closed.",
        quote: "\"All that remains is more and more precise measurement.\"- Lord Kelvin"
    },
    {
        text: "We convinced ourselves that science had reached its ultimate threshold-that every fundamental law of nature had been mapped.",
        quote: "\"It seems probable that most of the grand underlying principles have been firmly established.\"- Albert A. Michelson"
    },
    {
        text: "But that fragile certainty shattered in 1900, when Max Planck exposed the depth of our collective ignorance and vanity.",
        quote: "\"Science cannot solve the ultimate mystery of nature.\"- Max Planck"
    },
    {
        text: "For now, we step back into the light of that comforting illusion... to study what we once thought we completely understood.",
        showButton: true
    }
];

const container = document.createElement('div');
container.id = 'main-menu';
container.style.position = 'fixed';
container.style.inset = '0';
container.style.display = 'grid';
container.style.placeItems = 'center';
container.style.background = 'linear-gradient(135deg, #141517 0%, rgb(20, 22, 26) 45%, #1c1d21 100%)';
container.style.color = '#eff6ff';
container.style.fontFamily = 'Segoe UI, Arial, sans-serif';
container.style.zIndex = '10';

const style = document.createElement('style');
style.textContent = `
  #main-menu * { box-sizing: border-box; }
  #main-menu .menu-card {
    width: min(92vw, 550px);
    min-height: 330px;
    padding: 24px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 24px;
    background: rgba(0, 0, 0, 0.82);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(10px);
    overflow: hidden;
    position: relative;
  }
  #main-menu .screen {
    position: absolute;
    inset: 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 900ms ease, transform 900ms ease;
    pointer-events: none;
  }
  #main-menu .screen.active {
    opacity: 1;
    pointer-events: auto;
  }
  #main-menu .menu-card.fade-out {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
    transition: opacity 400ms ease, transform 400ms ease;
  }
  #main-menu .screen.fade-out {
    opacity: 0;
    transform: translateY(0px);
    transition: opacity 400ms ease, transform 400ms ease;
  }
  #main-menu p {
    margin: 0 0 18px;
    color: #dbeafe;
    line-height: 1.45;
    font-size: 24px;
  }
  #main-menu .quote {
    margin: 0;
    color: #cbd5e1;
    font-style: italic;
    line-height: 1.45;
    font-size: 18px;
  }
  #main-menu .start-button {
    width: 35%;
    border: none;
    border-radius: 999px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    color: #303030;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(56, 189, 248, 0.35);
    margin-top: 15px;
  }
`;

style.setAttribute('data-menu-style', 'true');
document.head.appendChild(style);


// Add ambience audio playback
const AMBIENCE_NORMAL = 0.2;

export const ambienceAudio = document.createElement('audio');
ambienceAudio.src = '/audio/mainAmbience/ambience.mp3';
ambienceAudio.loop = true;
ambienceAudio.volume = AMBIENCE_NORMAL;
ambienceAudio.autoplay = true;
document.body.appendChild(ambienceAudio);

container.innerHTML = `
    ${slides.map((slide, index) => `
      <article class="screen ${index === 0 ? 'active' : ''}" data-index="${index}">
        <p>${slide.text}</p>
        <p class="quote">${slide.quote || ""}</p>
        ${slide.showButton ? '<button id="start-game-button" class="start-button" type="button">Start Simulation</button>' : ''}
      </article>
    `).join('')}

`;

document.body.appendChild(container);

const screens = [...container.querySelectorAll('.screen')];
let currentIndex = 0;

function showScreen(index, interval = 1600) {
    load();
    initializePlanets();
    
    const currentScreen = screens[currentIndex];

    // Fade out current screen
    currentScreen.classList.remove('active');

    setTimeout(() => {
        screens.forEach(screen => screen.classList.remove('active'));

        setTimeout(() => {
            screens[index].classList.add('active');
            currentIndex = index;
        }, interval);

    }, interval * 0.75);
}

const cycleInterval = window.setInterval(() => {
    currentIndex += 1;

    if (currentIndex >= screens.length) {
        window.clearInterval(cycleInterval);
        return;
    }

    showScreen(currentIndex);
}, 8000);

const spaceEvent = window.addEventListener('keydown', (event) => {
    if ((event.key === ' ' || event.code === 'Space') && currentIndex !== 4) {
        console.log(currentIndex)
        showScreen(3, 0)
    }
});

function initAudio() {
    SoundManager.getInstance().initialize();

    window.removeEventListener('click', initAudio);
    window.removeEventListener('keydown', initAudio);
    window.removeEventListener('touchstart', initAudio);
}

window.addEventListener(
    'pointerdown',
    async () => {
        await SoundManager.getInstance().initialize();
    },
    { once: true }
);
window.addEventListener('click', initAudio);
window.addEventListener('keydown', initAudio);
window.addEventListener('touchstart', initAudio);

const startButton = document.getElementById('start-game-button');

if (startButton) {
    startButton.addEventListener('click', async () => {
        const activeScreen = container.querySelector('.screen.active');

        if (!activeScreen) {
            container.remove();
            return;
        }

        activeScreen.classList.add('fade-out');

        await new Promise(resolve => setTimeout(resolve, 400));

        window.removeEventListener('keydown', spaceEvent)

        container.remove();

        try {
            const selectionModule = await import('./menus/SelectionMenu.js');

            if (typeof selectionModule.initialize === 'function') {
                await selectionModule.initialize();
            }

            cleanupMainMenu();

        } catch (error) {
            console.error('Failed to start the simulation.', error);
        }
    });
}

function cleanupMainMenu() {
    const menu = document.getElementById('main-menu');
    if (menu) {
        menu.remove();
    }

    const styleTag = document.querySelector('style[data-menu-style]');
    if (styleTag) styleTag.remove();
}