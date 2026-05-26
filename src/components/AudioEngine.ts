// Synthesized 8-bit Retro Sounds using Web Audio API
class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
  }

  getMute() {
    return this.isMuted;
  }

  // Play a simple 8-bit tone
  private playTone(freqStart: number, freqEnd: number, duration: number, type: OscillatorType = 'square', gainStart = 0.1) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
    }

    gainNode.gain.setValueAtTime(gainStart, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playPop() {
    // Bubble popup sound: high pitch sweep
    this.playTone(400, 1200, 0.08, 'sine', 0.15);
  }

  playPopPopped() {
    // Satisfying bubble explosion / pop
    this.playTone(850, 150, 0.15, 'triangle', 0.2);
  }

  playSelect() {
    // Classic 8-bit select select chirp
    this.playTone(150, 300, 0.08, 'square', 0.08);
  }

  playFlipCharge(percentage: number) {
    // A quick slide tone showing charging state
    const baseFreq = 200 + percentage * 400;
    this.playTone(baseFreq, baseFreq + 50, 0.05, 'triangle', 0.06);
  }

  playFlipLaunch() {
    // Noise launch block
    this.playTone(180, 480, 0.12, 'sawtooth', 0.1);
  }

  playFlipSuccess() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Sweet 16-bit arpeggio: C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = this.ctx.currentTime;
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      
      gainNode.gain.setValueAtTime(0.08, now + idx * 0.07);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.15);
    });
  }

  playFlipFail() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Buzzing low chord
    const notes = [150, 142];
    const now = this.ctx.currentTime;
    
    notes.forEach((freq) => {
      this.playTone(freq, freq - 20, 0.35, 'sawtooth', 0.12);
    });
  }

  playLevelUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Victory level excitation
    const notes = [440, 554.37, 659.25, 880];
    const now = this.ctx.currentTime;
    
    notes.forEach((freq, idx) => {
      this.playTone(freq, freq * 1.5, 0.25, 'square', 0.08);
    });
  }
}

export const sfx = new AudioEngine();
