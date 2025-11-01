let audioContext;
let accentBuffer, beatBuffer;
let currentBeat = 0;
let isPlaying = false;
let timer;
let bpm = 120;
let beats = 4;
let noteValue = 4;

const bpmInput = document.getElementById("bpm");
const beatsInput = document.getElementById("beats");
const noteValueInput = document.getElementById("noteValue");
const startStopBtn = document.getElementById("startStopBtn");
const statusText = document.getElementById("statusText");
const ballsContainer = document.getElementById("ballsContainer");

function updateStatus() {
    statusText.textContent = isPlaying
        ? `Playing ${beats}/${noteValue} at ${bpm} BPM`
        : "Stopped";
}

function renderBalls() {
    ballsContainer.innerHTML = "";
    for (let i = 0; i < beats; i++) {
        const ball = document.createElement("div");
        ball.classList.add("ball");
        ballsContainer.appendChild(ball);
    }
}

function highlightBall(index) {
    document.querySelectorAll(".ball").forEach((b, i) => {
        b.classList.toggle("active", i === index);
    });
}

async function loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
}

// ⚡ Инициализация звука только при клике пользователя
async function initSounds() {
    if (!audioContext)
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    accentBuffer = await loadSound("accent-sound.wav");
    beatBuffer = await loadSound("beat-sound.ogg");
}

function playSound(buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function playClick() {
    if (currentBeat === 0) playSound(accentBuffer);
    else playSound(beatBuffer);
    highlightBall(currentBeat);
    currentBeat = (currentBeat + 1) % beats;
}

function startMetronome() {
    stopMetronome();
    bpm = parseInt(bpmInput.value) || 120;
    beats = parseInt(beatsInput.value) || 4;
    noteValue = parseInt(noteValueInput.value) || 4;

    bpm = Math.min(Math.max(bpm, 1), 1000);
    beats = Math.min(Math.max(beats, 1), 12);
    noteValue = Math.min(Math.max(noteValue, 1), 12);

    bpmInput.value = bpm;
    beatsInput.value = beats;
    noteValueInput.value = noteValue;

    currentBeat = 0;
    renderBalls();
    highlightBall(currentBeat);

    const interval = (60 / bpm) * 1000;
    timer = setInterval(playClick, interval);
    isPlaying = true;
    startStopBtn.textContent = "Stop";
    updateStatus();
}

function stopMetronome() {
    clearInterval(timer);
    isPlaying = false;
    startStopBtn.textContent = "Start";
    highlightBall(-1);
    updateStatus();
}

// ⚡ Важное изменение для iOS: создаём AudioContext внутри события клика
startStopBtn.addEventListener("click", async () => {
    if (!audioContext) await initSounds();
    if (isPlaying) stopMetronome();
    else startMetronome();
});

[bpmInput, beatsInput, noteValueInput].forEach((input) => {
    input.addEventListener("input", () => {
        if (!input.value) return;
        let val = parseInt(input.value);
        if (isNaN(val)) return;

        const min = parseInt(input.min);
        const max = parseInt(input.max);
        if (val < min) val = min;
        if (val > max) val = max;
        input.value = val;

        bpm = parseInt(bpmInput.value) || bpm;
        beats = parseInt(beatsInput.value) || beats;
        noteValue = parseInt(noteValueInput.value) || noteValue;

        updateStatus();
        if (isPlaying) startMetronome();
        else renderBalls();
    });
});

renderBalls();
updateStatus();
