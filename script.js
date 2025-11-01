let audioContext;
let accentBuffer, beatBuffer;
let currentBeat = 0;
let isPlaying = false;
let bpm = 120;
let beats = 4;
let noteValue = 4;

// Таймер планировщика
let timerId;
const scheduleAheadTime = 0.1; // секунды
const lookahead = 25.0;        // миллисекунды
let nextNoteTime = 0.0;

const bpmInput = document.getElementById("bpm");
const beatsInput = document.getElementById("beats");
const noteValueInput = document.getElementById("noteValue");
const startStopBtn = document.getElementById("startStopBtn");
const statusText = document.getElementById("statusText");
const ballsContainer = document.getElementById("ballsContainer");

// ---------------- Status и шарики ----------------
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

// ---------------- Звуки ----------------
async function loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
}

async function initSounds() {
    if (!audioContext)
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    accentBuffer = await loadSound("accent-sound.wav");
    beatBuffer = await loadSound("beat-sound.ogg");
}

// ---------------- Планировщик ----------------
function scheduleClick(time) {
    const buffer = (currentBeat === 0) ? accentBuffer : beatBuffer;
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(time);

    highlightBall(currentBeat);
    currentBeat = (currentBeat + 1) % beats;
}

function scheduler() {
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        scheduleClick(nextNoteTime);
        nextNoteTime += 60.0 / bpm;
    }
    timerId = setTimeout(scheduler, lookahead);
}

// ---------------- Метроном ----------------
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

    nextNoteTime = audioContext.currentTime + 0.05; // небольшая пауза перед стартом
    isPlaying = true;
    startStopBtn.textContent = "Stop";
    updateStatus();

    scheduler();
}

function stopMetronome() {
    clearTimeout(timerId);
    isPlaying = false;
    startStopBtn.textContent = "Start";
    highlightBall(-1);
    updateStatus();
}

// ---------------- Toggle ----------------
startStopBtn.addEventListener("click", async () => {
    if (!audioContext) await initSounds();
    if (isPlaying) stopMetronome();
    else startMetronome();
});

// ---------------- Input handlers ----------------
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

        renderBalls();
        updateStatus();
        if (isPlaying) {
            // перезапускаем планировщик с новым BPM / Time Signature
            nextNoteTime = audioContext.currentTime + 0.05;
        }
    });
});

// ---------------- Инициализация ----------------
renderBalls();
updateStatus();
