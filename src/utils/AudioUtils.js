//this file is used for audio such as ambience, ambience and quotes (does not include collision sounds)

let isAmbiencePlaying = false;
let isQuotePlaying = false;
let pendingAmbienceTimeout = null;

const AMBIENCE_NORMAL = 0.2;
const AMBIENCE_DUCKED = 0.1;
const QUOTE_NORMAL = 0.2;

const ambienceFiles = [
    // 'audio_4b34fcb07e.mp3',
    'audio_b371629a97.mp3',
];
// === QUOTE AUDIO ===
const quoteFiles = [
    'i-believe-we-did.wav',
    'if-science-teaches-us-anything.wav',
    'now-i-am-become-death.wav',
    'well-a-scientist-is-wrong.wav',
    'well-thanks-doc.wav',
    'science-is-impersonal.wav',
    'great-scientists.wav'
];

// Create the audio element for ambience
const ambienceAudio = document.createElement('audio');
ambienceAudio.volume = AMBIENCE_NORMAL;
ambienceAudio.autoplay = false;
ambienceAudio.loop = true;
document.body.appendChild(ambienceAudio);

const quoteAudio = document.createElement('audio');
quoteAudio.volume = QUOTE_NORMAL;
quoteAudio.autoplay = false;
quoteAudio.loop = false;
document.body.appendChild(quoteAudio);

quoteAudio.addEventListener('loadedmetadata', () => {

    const fadeDuration = 2000;

    if (quoteAudio.duration > 2) {

        setTimeout(() => {

            fadeAudioVolume(
                quoteAudio,
                0,
                fadeDuration
            );

        }, (quoteAudio.duration * 1000) - fadeDuration);

    }

});

function fadeAudioVolume(audio, targetVolume, duration = 1000) {
    const startVolume = audio.volume;
    const startTime = Date.now();
    const interval = 20; // ms
    if (audio._fadeTimer) {
        clearTimeout(audio._fadeTimer);
        audio._fadeTimer = null;
    }
    function step() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        audio.volume = startVolume + (targetVolume - startVolume) * progress;
        if (progress < 1) {
            audio._fadeTimer = setTimeout(step, interval);
        } else {
            audio.volume = targetVolume;
            if (audio._fadeTimer) {
                clearTimeout(audio._fadeTimer);
                audio._fadeTimer = null;
            }
        }
    }
    step();
}

function updateVolumes() {
    // Always clear fade timers before starting a new fade
    if (ambienceAudio._fadeTimer) {
        clearTimeout(ambienceAudio._fadeTimer);
        ambienceAudio._fadeTimer = null;
    }
    if (isQuotePlaying) {
        fadeAudioVolume(ambienceAudio, AMBIENCE_DUCKED);
        ambienceAudio.volume = AMBIENCE_DUCKED;
        quoteAudio.volume = QUOTE_NORMAL;
    } else if (isAmbiencePlaying) {
        fadeAudioVolume(ambienceAudio, AMBIENCE_NORMAL);
        quoteAudio.volume = QUOTE_NORMAL;
    } else {
        fadeAudioVolume(ambienceAudio, AMBIENCE_NORMAL);
        ambienceAudio.volume = AMBIENCE_NORMAL;
        quoteAudio.volume = QUOTE_NORMAL;
    }
}

export function playRandomAmbience() {

    const randomIndex = Math.floor(Math.random() * ambienceFiles.length);
    ambienceAudio.src = `/audio/ambiences/${ambienceFiles[randomIndex]}`;
    ambienceAudio.play();
}

ambienceAudio.addEventListener('play', () => {
    isAmbiencePlaying = true;
    updateVolumes();
});
ambienceAudio.addEventListener('ended', () => {
    isAmbiencePlaying = false;
    updateVolumes();
    // Safety: if neither ambience nor quote is playing, restore ambience
    setTimeout(() => {
        if (!isAmbiencePlaying && !isQuotePlaying) {
            fadeAudioVolume(ambienceAudio, AMBIENCE_NORMAL);
        }
    }, 100);
    scheduleNextAmbience();
});

let lastIndex = null;

// --- QUOTE LOGIC ---
export function playRandomQuote() {
    if (isQuotePlaying) return; // Don't overlap quotes
    isQuotePlaying = true;
    updateVolumes();
    let randomIndex = Math.floor(Math.random() * quoteFiles.length);

    //dont play the same quote twice in a row
    while (randomIndex === lastIndex)
        randomIndex = Math.floor(Math.random() * quoteFiles.length);

    quoteAudio.src = `/audio/quotes/${quoteFiles[randomIndex]}`;

    lastIndex = randomIndex;

    quoteAudio.volume = QUOTE_NORMAL;

    quoteAudio.play();
}

quoteAudio.addEventListener('play', () => {
    isQuotePlaying = true;
    updateVolumes();
});
quoteAudio.addEventListener('ended', () => {
    isQuotePlaying = false;
    updateVolumes();
    // if neither ambience nor quote is playing, restore ambience
    setTimeout(() => {
        if (!isAmbiencePlaying && !isQuotePlaying) {
            fadeAudioVolume(ambienceAudio, AMBIENCE_NORMAL);
        }
    }, 100);
    // If ambience was scheduled to play after quote, play it now (after 5s delay)
    if (pendingAmbienceTimeout) {
        clearTimeout(pendingAmbienceTimeout);
        pendingAmbienceTimeout = setTimeout(() => {
            playRandomAmbience();
            pendingAmbienceTimeout = null;
        }, 5000);
    }
});
