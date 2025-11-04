let audioContext;
let accentBuffer, beatBuffer;
let currentBeat = 0;
let schedulerInterval;
let nextNoteTime = 0;
let bpm = 120;
let beats = 4;
let noteValue = 4;
let tripletMode = false;

const lookahead = 25.0; // ms
const scheduleAheadTime = 0.1; // sec

const bpmInput = document.getElementById("bpm");
const beatsInput = document.getElementById("beats");
const startStopBtn = document.getElementById("startStopBtn");
const statusText = document.getElementById("statusText");
const ballsContainer = document.getElementById("ballsContainer");
const noteButtons = document.querySelectorAll(".note-btn");
const tripletBtn = document.getElementById("tripletBtn");

function updateStatus() {
    statusText.textContent = isPlaying
        ? `Playing ${beats}/${noteValue} at ${bpm} BPM ${tripletMode ? "(Triplets)" : ""}`
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
    if (!accentBuffer) accentBuffer = await loadSound("accent-sound2.mp3");
    if (!beatBuffer) beatBuffer = await loadSound("beat-sound2.wav");
}

function playSound(buffer, time) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(time);
}

function scheduleNote() {
    if (!audioContext) return;

    let secondsPerBeat = (60 / bpm) * (4 / noteValue);

    if (tripletMode) {
        const tripletTime = secondsPerBeat / 3;
        for (let i = 0; i < 3; i++) {
            const buffer = (i === 0 && currentBeat === 0) ? accentBuffer : beatBuffer;
            playSound(buffer, nextNoteTime + i * tripletTime);
        }
        nextNoteTime += secondsPerBeat;
        highlightBall(currentBeat);
        currentBeat = (currentBeat + 1) % beats;
    } else {
        if (currentBeat === 0) playSound(accentBuffer, nextNoteTime);
        else playSound(beatBuffer, nextNoteTime);

        highlightBall(currentBeat);
        currentBeat = (currentBeat + 1) % beats;
        nextNoteTime += secondsPerBeat;
    }
}

function scheduler() {
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        scheduleNote();
    }
}

let isPlaying = false;

async function startMetronome() {
    await initSounds();
    stopMetronome();

    bpm = parseInt(bpmInput.value) || 120;
    beats = parseInt(beatsInput.value) || 4;

    bpm = Math.min(Math.max(bpm, 1), 1000);
    beats = Math.min(Math.max(beats, 1), 32);

    bpmInput.value = bpm;
    beatsInput.value = beats;

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

// Note Value buttons
noteButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        noteButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        noteValue = parseInt(btn.dataset.value);
        updateStatus();
    });
});

// Increment/Decrement buttons
document.querySelectorAll(".inc, .dec").forEach(btn => {
    btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.target);
        const step = parseInt(btn.dataset.step);
        let val = parseInt(target.value) || 0;
        val += btn.classList.contains("inc") ? step : -step;

        const min = parseInt(target.min);
        const max = parseInt(target.max);
        if (val < min) val = min;
        if (val > max) val = max;

        target.value = val;

        if (target.id === "bpm") bpm = val;
        if (target.id === "beats") beats = val;

        renderBalls();
        updateStatus();

        currentBeat = 0;
        nextNoteTime = audioContext.currentTime + 0.05;
    });
});

// Triplet toggle
tripletBtn.addEventListener("click", () => {
    tripletMode = !tripletMode;
    tripletBtn.classList.toggle("active", tripletMode);
    tripletBtn.textContent = tripletMode ? "On" : "Off";
    updateStatus();
});

renderBalls();
updateStatus();
