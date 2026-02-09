
export async function decodeAudio(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  // Gemini 2.5 TTS returns 16-bit PCM Mono at 24000Hz
  // We need to ensure we don't have alignment issues with the DataView
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const numSamples = data.byteLength / 2; // 2 bytes per 16-bit sample
  const buffer = ctx.createBuffer(1, numSamples, 24000);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    // Read 16-bit signed integer (little-endian)
    const sample = dataView.getInt16(i * 2, true);
    // Normalize to [-1.0, 1.0]
    channelData[i] = sample / 32768.0;
  }
  
  return buffer;
}

export class CinematicSoundEngine {
  private ctx: AudioContext;
  private drone: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private noise: AudioBufferSourceNode | null = null;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  setAmbience(profile: string, weight: string) {
    this.stopAmbience();
    const t = this.ctx.currentTime;
    
    this.drone = this.ctx.createOscillator();
    this.droneGain = this.ctx.createGain();
    
    let freq = 110;
    if (weight === 'climax' || weight === 'high') freq = 55;
    if (weight === 'low') freq = 220;

    this.drone.type = weight === 'climax' ? 'sawtooth' : 'sine';
    this.drone.frequency.setValueAtTime(freq, t);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    this.droneGain.gain.setValueAtTime(0, t);
    this.droneGain.gain.linearRampToValueAtTime(0.04, t + 1);

    this.drone.connect(filter);
    filter.connect(this.droneGain);
    this.droneGain.connect(this.ctx.destination);
    this.drone.start();

    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    this.noise = this.ctx.createBufferSource();
    this.noise.buffer = noiseBuffer;
    this.noise.loop = true;
    const nGain = this.ctx.createGain();
    nGain.gain.value = 0.01;
    this.noise.connect(nGain);
    nGain.connect(this.ctx.destination);
    this.noise.start();
  }

  stopAmbience() {
    try { this.drone?.stop(); } catch(e) {}
    try { this.noise?.stop(); } catch(e) {}
  }
}
