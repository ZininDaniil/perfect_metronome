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

// Загрузка звуков
async function loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
}

// Инициализация звуков
async function initSounds() {
    if (!audioContext)
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Для iOS: разблокировка контекста
    if (audioContext.state === 'suspended') await audioContext.resume();

    accentBuffer = await loadSound("accent-sound.wav");
    beatBuffer = await loadSound("beat-sound.ogg");

    // Короткий silent buffer, чтобы гарантировать звук на встроенных динамиках iOS
    const silentBuffer = audioContext.createBuffer(1, 1, 22050);
    const silentSource = audioContext.createBufferSource();
    silentSource.buffer = silentBuffer;
    silentSource.connect(audioContext.destination);
    silentSource.start();
}

// Воспроизведение звука
function playSound(buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
}

// Метрономный клик
function playClick() {
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

// Переключение старт/стоп
startStopBtn.addEventListener("click", async () => {
    if (!audioContext) await initSounds();
    if (isPlaying) stopMetronome();
    else startMetronome();
});

// Динамическое обновление при вводе значений
[bpmInput, beatsInput, noteValueInput].forEach((input) => {
    input.addEventListener("input", () => {
        // Если поле пустое, не меняем звук
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

// Первоначальный рендер
renderBalls();
updateStatus();
