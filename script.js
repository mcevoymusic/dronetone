const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const oscillators = {};

const baseFrequencies = {
    'Bb': 58.27, 'B': 61.74, 'C': 65.41, 'C#': 69.30, 'D': 73.42, 'Eb': 77.78, 'E': 82.41,
    'F': 87.31, 'F#': 92.50, 'G': 98.00, 'G#': 103.83, 'A': 110.00,
    'Bb2': 116.54, 'B2': 123.47, 'C2': 130.81, 'C#2': 138.59, 'D2': 146.83,
    'Eb2': 155.56, 'E2': 164.81, 'F2': 174.61, 'F#2': 185.00, 'G2': 196.00,
    'G#2': 207.65, 'A2': 220.00, 'Bb3': 233.08
};

document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('mousedown', () => {
        const note = key.getAttribute('data-note');
        if (oscillators[note]) {
            stopTone(note);
        } else {
            playTone(note);
        }
        updateActiveTones();
    });
});

document.getElementById('reset-button').addEventListener('click', () => {
    Object.keys(oscillators).forEach(note => stopTone(note));
    updateActiveTones();
});

function playTone(note) {
    const frequency = baseFrequencies[note];
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const biquadFilter = audioContext.createBiquadFilter();
    const convolver = audioContext.createConvolver();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    const attack = 0.1;  // Faster attack for quicker fade-in
    const decay = 0.5;
    const sustain = 0.7;
    const release = 1.0;

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + attack);
    gainNode.gain.linearRampToValueAtTime(sustain, audioContext.currentTime + attack + decay);

    biquadFilter.type = "lowpass";
    biquadFilter.frequency.setValueAtTime(2000, audioContext.currentTime); // Adjust to shape tone

    // Create a reverb effect
    const reverbBuffer = createReverbBuffer();
    convolver.buffer = reverbBuffer;

    oscillator.connect(biquadFilter);
    biquadFilter.connect(gainNode);
    gainNode.connect(convolver);
    convolver.connect(audioContext.destination);

    oscillator.start();
    oscillators[note] = { oscillator, gainNode, convolver, stopTime: null };
}

function stopTone(note) {
    const { oscillator, gainNode } = oscillators[note];
    const release = 1.0;
    const currentTime = audioContext.currentTime;

    gainNode.gain.cancelScheduledValues(currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + release);

    if (oscillators[note].stopTime === null) {
        oscillators[note].stopTime = currentTime + release;
        oscillator.stop(oscillators[note].stopTime);
    }

    setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
        oscillators[note].convolver.disconnect();
        delete oscillators[note];
        updateActiveTones();
    }, (release + 0.1) * 1000);
}

function updateActiveTones() {
    const activeTones = Object.keys(oscillators).join(', ') || 'None';
    document.getElementById('active-tones').innerText = `Active Tones: ${activeTones}`;
}

function createReverbBuffer() {
    const length = audioContext.sampleRate * 3;
    const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
    for (let i = 0; i < length; i++) {
        impulse.getChannelData(0)[i] = (Math.random() * 2 - 1) * (1 - i / length);
        impulse.getChannelData(1)[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    return impulse;
}
