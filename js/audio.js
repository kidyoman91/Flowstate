/**
 * FLOWSTATE - Audio Engine (Procedural Ambient Sound & Synthesizer)
 * Built with the native Web Audio API (100% offline, zero external dependencies)
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.isPlaying = false;

    // Channels state: volume from 0 to 1
    this.channels = {
      rain: { name: 'Pluie douce', icon: '🌧️', volume: 0, node: null, gainNode: null },
      fire: { name: 'Cheminée cosy', icon: '🪵', volume: 0, node: null, gainNode: null },
      drone: { name: 'Ondes Thêta (432Hz)', icon: '🪐', volume: 0, node: null, gainNode: null },
      wind: { name: 'Brise apaisante', icon: '🍃', volume: 0, node: null, gainNode: null }
    };

    this.masterGain = null;
    this.masterVolume = 0.7;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API non supporté:', e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Rain Generator (Filtered Pink Noise with modulation) ---
  createRainGenerator() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.channels.rain.volume, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    return { source: noise, gainNode: gain };
  }

  // --- Fireplace Generator (Crackles + warm low rumble) ---
  createFireGenerator() {
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // sparse crackles
      const crackle = Math.random() < 0.002 ? (Math.random() * 2 - 1) * 0.9 : 0;
      const rumble = (Math.random() * 2 - 1) * 0.08;
      data[i] = crackle + rumble;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.channels.fire.volume, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    return { source: noise, gainNode: gain };
  }

  // --- Binaural Theta Drone (432Hz / 6Hz Binaural Beat) ---
  createDroneGenerator() {
    const baseFreq = 216; // 432 / 2
    const beatFreq = 6;   // 6Hz theta frequency for deep concentration

    const oscLeft = this.ctx.createOscillator();
    const oscRight = this.ctx.createOscillator();
    oscLeft.type = 'sine';
    oscRight.type = 'sine';
    oscLeft.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    oscRight.frequency.setValueAtTime(baseFreq + beatFreq, this.ctx.currentTime);

    // Warm sub harmonic
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(108, this.ctx.currentTime);

    const merger = this.ctx.createChannelMerger(2);
    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    subOsc.connect(subGain);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.channels.drone.volume * 0.25, this.ctx.currentTime);

    merger.connect(gain);
    subGain.connect(gain);
    gain.connect(this.masterGain);

    oscLeft.start();
    oscRight.start();
    subOsc.start();

    return { source: [oscLeft, oscRight, subOsc], gainNode: gain };
  }

  // --- Wind Generator (Low sweep) ---
  createWindGenerator() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, this.ctx.currentTime);

    // Slow modulation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.channels.wind.volume * 0.2, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    lfo.start();

    return { source: [noise, lfo], gainNode: gain };
  }

  setChannelVolume(channelKey, val) {
    this.ensureContext();
    const volume = Math.max(0, Math.min(1, parseFloat(val)));
    const ch = this.channels[channelKey];
    if (!ch) return;
    ch.volume = volume;

    if (volume > 0 && !ch.node) {
      if (channelKey === 'rain') ch.node = this.createRainGenerator();
      else if (channelKey === 'fire') ch.node = this.createFireGenerator();
      else if (channelKey === 'drone') ch.node = this.createDroneGenerator();
      else if (channelKey === 'wind') ch.node = this.createWindGenerator();
    }

    if (ch.node && ch.node.gainNode) {
      const mult = channelKey === 'drone' ? 0.25 : (channelKey === 'wind' ? 0.2 : 1.0);
      ch.node.gainNode.gain.setTargetAtTime(volume * mult, this.ctx.currentTime, 0.05);
    }

    this.checkPlayingState();
  }

  checkPlayingState() {
    const hasActive = Object.values(this.channels).some(ch => ch.volume > 0);
    this.isPlaying = hasActive;
    const widget = document.getElementById('audioQuickWidget');
    if (widget) {
      if (this.isPlaying) widget.classList.add('playing');
      else widget.classList.remove('playing');
    }
  }

  setMasterVolume(val) {
    this.ensureContext();
    this.masterVolume = Math.max(0, Math.min(1, parseFloat(val)));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  muteAll() {
    Object.keys(this.channels).forEach(k => {
      this.setChannelVolume(k, 0);
      const slider = document.getElementById(`slider-${k}`);
      if (slider) slider.value = 0;
    });
  }

  // --- Zen Tibetan Singing Bowl chime (for session end) ---
  playZenBowl() {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const harmonics = [
      { freq: 440, gain: 0.5, decay: 4.5 },
      { freq: 880, gain: 0.25, decay: 3.5 },
      { freq: 1320, gain: 0.15, decay: 2.5 },
      { freq: 2640, gain: 0.05, decay: 1.5 }
    ];

    harmonics.forEach(h => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(h.freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(h.gain * 0.4, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + h.decay + 0.1);
    });
  }

  // --- Subtle Task Completion Pop ---
  playTaskCompletion() {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}

window.audioEngine = new AudioEngine();
