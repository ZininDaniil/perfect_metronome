let audioContext;
let accentBuffer, beatBuffer;
let currentBeat = 0;
let isPlaying = false;
let schedulerInterval;
let nextNoteTime = 0;
let bpm = 120;
let beats = 4;
let noteValue = 4;

const lookahead = 25.0; // ms
const scheduleAheadTime = 0.1; // sec

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

async function initSounds() {
    if (!audioContext)
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (!accentBuffer) accentBuffer = await loadSound("accent-sound.wav");
    if (!beatBuffer) beatBuffer = await loadSound("beat-sound.ogg");
}

function playSound(buffer, time) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(time);
}

function scheduleNote() {
    const secondsPerBeat = 60 / bpm;
    if (!audioContext) return;
    if (currentBeat % beats === 0) playSound(accentBuffer, nextNoteTime);
    else playSound(beatBuffer, nextNoteTime);

    highlightBall(currentBeat);
    currentBeat = (currentBeat + 1) % beats;
    nextNoteTime += secondsPerBeat;
}

function scheduler() {
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        scheduleNote();
    }
}

async function startMetronome() {
    await initSounds();
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

    nextNoteTime = audioContext.currentTime + 0.05;
    schedulerInterval = setInterval(scheduler, lookahead);
    isPlaying = true;
    startStopBtn.textContent = "Stop";
    updateStatus();
}

function stopMetronome() {
    clearInterval(schedulerInterval);
    isPlaying = false;
    startStopBtn.textContent = "Start";
    highlightBall(-1);
    updateStatus();
}

startStopBtn.addEventListener("click", async () => {
    if (!audioContext || !accentBuffer || !beatBuffer) await initSounds();
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

        renderBalls();
        updateStatus();
    });
});

renderBalls();
updateStatus();
