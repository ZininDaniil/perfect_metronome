let isPlaying = false;
let bpm = 100;
let intervalId;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const bpmSlider = document.getElementById("bpm");
const bpmValue = document.getElementById("bpmValue");
const toggleBtn = document.getElementById("toggle");

bpmSlider.addEventListener("input", () => {
    bpm = bpmSlider.value;
    bpmValue.textContent = bpm;
    if (isPlaying) startMetronome(); // обновляем интервал, если уже играет
});

toggleBtn.addEventListener("click", () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
        toggleBtn.textContent = "Stop";
        startMetronome();
    } else {
        toggleBtn.textContent = "Start";
        stopMetronome();
    }
});

function playClick() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function startMetronome() {
    stopMetronome(); // чтобы не наслаивались интервалы
    const interval = 60000 / bpm;
    playClick();
    intervalId = setInterval(playClick, interval);
}

function stopMetronome() {
    clearInterval(intervalId);
}
