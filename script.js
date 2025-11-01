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

// Обновление текста статуса
function updateStatus() {
    statusText.textContent = isPlaying
        ? `Playing ${beats}/${noteValue} at ${bpm} BPM`
        : "Stopped";
}

// Рендер шариков
function renderBalls() {
    ballsContainer.innerHTML = "";
    for (let i = 0; i < beats; i++) {
        const ball = document.createElement("div");
        ball.classList.add("ball");
        ballsContainer.appendChild(ball);
    }
}

// Подсветка текущего удара
function highlightBall(index) {
    document.querySelectorAll(".ball").forEach((b, i) => {
        b.classList.toggle("active", i === index);
    });
}

// Загрузка звука
async function loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
}

// Инициализация звуков и AudioContext при первом клике
async function initSounds() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!accentBuffer) accentBuffer = await loadSound("accent-sound.wav");
    if (!beatBuffer) beatBuffer = await loadSound("beat-sound.ogg");
}

// Воспроизведение одного удара
function playSound(buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
}

// Один клик метронома
function playClick() {
    if (!audioContext) return;
    if (currentBeat === 0) playSound(accentBuffer);
    else playSound(beatBuffer);
    highlightBall(currentBeat);
    currentBeat = (currentBeat + 1) % beats;
}

// Старт метронома
function startMetronome() {
    stopMetronome();

    bpm = parseInt(bpmInput.value) || bpm;
    beats = parseInt(beatsInput.value) || beats;
    noteValue = parseInt(noteValueInput.value) || noteValue;

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

// Стоп метронома
function stopMetronome() {
    clearInterval(timer);
    isPlaying = false;
    startStopBtn.textContent = "Start";
    highlightBall(-1);
    updateStatus();
}

// Toggle кнопка
startStopBtn.addEventListener("click", async () => {
    if (!audioContext || !accentBuffer || !beatBuffer) {
        await initSounds(); // гарантируем разрешение звука на iOS
    }
    if (isPlaying) stopMetronome();
    else startMetronome();
});

// Обработчики для динамического изменения значений
[bpmInput, beatsInput, noteValueInput].forEach((input) => {
    input.addEventListener("input", () => {
        let val = parseInt(input.value);
        const min = parseInt(input.min);
        const max = parseInt(input.max);

        if (!input.value) return; // пустое значение не меняет звук
        if (isNaN(val)) return;

        if (val < min) val = min;
        if (val > max) val = max;
        input.value = val;

        bpm = parseInt(bpmInput.value) || bpm;
        beats = parseInt(beatsInput.value) || beats;
        noteValue = parseInt(noteValueInput.value) || noteValue;

        renderBalls(); // обновляем шарики сразу
        updateStatus();

        if (isPlaying) startMetronome(); // пересчитываем интервал
    });
});

renderBalls();
updateStatus();
