let audioCtx = null;
let mp3Audio = null;
let mp3Loaded = false;

export function initAudio() {
  // 预加载 MP3 音效
  mp3Audio = new Audio();
  mp3Audio.src = '../assets/click.mp3';
  mp3Audio.preload = 'auto';
  mp3Audio.addEventListener('canplaythrough', () => {
    mp3Loaded = true;
  }, { once: true });
  mp3Audio.addEventListener('error', () => {
    mp3Loaded = false;
  }, { once: true });
  mp3Audio.load();
}

export function playClickSound() {
  // 优先使用 MP3 音效
  if (mp3Loaded && mp3Audio) {
    mp3Audio.currentTime = 0;
    mp3Audio.play().catch(() => {});
    return;
  }

  // 回退：合成短促电子音
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.value = 800;
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.1);
}
