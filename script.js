let audioContext = null;
let accentBuffer = null;
let beatBuffer = null;

let currentBeat = 0;
let isPlaying = false;
let timer;
let bpm = 120;
let beats = 4;
let noteValue = 4;

// HTML элементы
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

// Отрисовка шариков
function renderBalls() {
    ballsContainer.innerHTML = "";
    for (let i = 0; i < beats; i++) {
        const ball = document.createElement("div");
        ball.classList.add("ball");
        ballsContainer.appendChild(ball);
    }
}

// Подсветка текущего шара
function highlightBall(index) {
    document.querySelectorAll(".ball").forEach((b, i) => {
        b.classList.toggle("active", i === index);
    });
}

// Загрузка звуков в AudioBuffer
async function loadSound(url) {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
}

// Инициализация звуков
async function initSounds() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    accentBuffer = await loadSound("accent-sound.wav");
    beatBuffer = await loadSound("beat-sound.ogg");
}

// Воспроизведение звука через AudioBufferSourceNode
function playSound(buffer) {
    if (!buffer || !audioContext) return;
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
}

// Один клик метронома
function playClick() {
    if (currentBeat === 0) playSound(accentBuffer);
    else playSound(beatBuffer);

    highlightBall(currentBeat);
    currentBeat = (currentBeat + 1) % beats;
}

// Запуск метронома
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

    if (currentBeat >= beats) currentBeat = 0;

    renderBalls();
    highlightBall(currentBeat);

    const interval = (60 / bpm) * 1000;
    timer = setInterval(playClick, interval);

    isPlaying = true;
    startStopBtn.textContent = "Stop";
    updateStatus();
}

// Остановка метронома
function stopMetronome() {
    clearInterval(timer);
    isPlaying = false;
    startStopBtn.textContent = "Start";
    highlightBall(-1);
    updateStatus();
}

// Кнопка старт/стоп с гарантией iOS Web Audio
startStopBtn.addEventListener("click", async () => {
    if (!audioContext) await initSounds();
    if (isPlaying) stopMetronome();
    else startMetronome();
});

// Динамическое изменение значений
[bpmInput, beatsInput, noteValueInput].forEach((input) => {
    input.addEventListener("input", () => {
        if (!input.value) return; // пустое поле — не менять
        let val = parseInt(input.value);
        if (isNaN(val)) return;

        const min = parseInt(input.min);
        const max = parseInt(input.max);
        if (val < min) val = min;
        if (val > max) val = max;
        input.value = val;

        const oldBpm = bpm;
        const oldBeats = beats;

        bpm = parseInt(bpmInput.value) || bpm;
        beats = parseInt(beatsInput.value) || beats;
        noteValue = parseInt(noteValueInput.value) || noteValue;

        updateStatus();

        // если поменялось количество долей — перерисовать шарики
        if (beats !== oldBeats) {
            renderBalls();
            if (currentBeat >= beats) currentBeat = 0;
            highlightBall(currentBeat);
        }

        // если BPM изменился — перезапустить интервал без обнуления currentBeat
        if (isPlaying && bpm !== oldBpm) {
            clearInterval(timer);
            const interval = (60 / bpm) * 1000;
            timer = setInterval(playClick, interval);
        }
    });
});

// Начальная отрисовка
renderBalls();
updateStatus();
