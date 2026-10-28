// Tiny synth voices built from raw Web Audio nodes. Every voice is created per
// note, scheduled at `t` (AudioContext time) and cleans itself up when it stops.

export type Out = {
  ctx: AudioContext
  dest: AudioNode
  wobble: AudioNode // slow LFO in cents, connected to oscillator detune for the "tape" feel
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()

function noise(ctx: AudioContext) {
  let buffer = noiseBuffers.get(ctx)
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    noiseBuffers.set(ctx, buffer)
  }
  return buffer
}

function envelope(ctx: AudioContext, t: number, peak: number, attack: number, decay: number) {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(peak, t + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  return gain
}

function osc(o: Out, type: OscillatorType, freq: number, t: number, end: number, detune = 0) {
  const node = o.ctx.createOscillator()
  node.type = type
  node.frequency.setValueAtTime(freq, t)
  node.detune.value = detune
  o.wobble.connect(node.detune)
  node.start(t)
  node.stop(end)
  node.onended = () => o.wobble.disconnect(node.detune)
  return node
}

export function kick(o: Out, t: number, rate: number) {
  const { ctx } = o
  const node = ctx.createOscillator()
  node.frequency.setValueAtTime(130 * rate, t)
  node.frequency.exponentialRampToValueAtTime(38 * rate, t + 0.3)
  const amp = envelope(ctx, t, 0.9, 0.003, 0.5)
  node.connect(amp).connect(o.dest)
  node.start(t)
  node.stop(t + 0.6)
}

export function snare(o: Out, t: number, rate: number) {
  const { ctx } = o
  const src = ctx.createBufferSource()
  src.buffer = noise(ctx)
  src.playbackRate.value = rate
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 1700 * rate
  band.Q.value = 0.7
  src.connect(band).connect(envelope(ctx, t, 0.45, 0.002, 0.28)).connect(o.dest)
  src.start(t)
  src.stop(t + 0.35)

  const body = osc(o, 'triangle', 185 * rate, t, t + 0.15)
  body.connect(envelope(ctx, t, 0.25, 0.002, 0.1)).connect(o.dest)
}

export function hat(o: Out, t: number, rate: number) {
  const { ctx } = o
  const src = ctx.createBufferSource()
  src.buffer = noise(ctx)
  const high = ctx.createBiquadFilter()
  high.type = 'highpass'
  high.frequency.value = 6500 * rate
  src.connect(high).connect(envelope(ctx, t, 0.12, 0.001, 0.06)).connect(o.dest)
  src.start(t)
  src.stop(t + 0.1)
}

export function bass(o: Out, t: number, freq: number, dur: number) {
  const { ctx } = o
  const low = ctx.createBiquadFilter()
  low.type = 'lowpass'
  low.frequency.setValueAtTime(900, t)
  low.frequency.exponentialRampToValueAtTime(220, t + dur)
  low.Q.value = 5
  const amp = envelope(ctx, t, 0.32, 0.01, dur)
  osc(o, 'sawtooth', freq, t, t + dur + 0.05).connect(low)
  osc(o, 'sine', freq / 2, t, t + dur + 0.05).connect(amp)
  low.connect(amp).connect(o.dest)
}

// Soft electric-piano-ish chord: detuned triangle + sine pair per note.
export function keys(o: Out, t: number, freqs: number[], dur: number) {
  const { ctx } = o
  const low = ctx.createBiquadFilter()
  low.type = 'lowpass'
  low.frequency.value = 1600
  const amp = envelope(ctx, t, 0.07, 0.03, dur)
  low.connect(amp).connect(o.dest)
  for (const f of freqs) {
    osc(o, 'triangle', f, t, t + dur + 0.1, -7).connect(low)
    osc(o, 'sine', f, t, t + dur + 0.1, 7).connect(low)
  }
}

export function lead(o: Out, t: number, freq: number, dur: number) {
  const { ctx } = o
  const amp = envelope(ctx, t, 0.1, 0.02, dur)
  osc(o, 'triangle', freq, t, t + dur + 0.05).connect(amp)
  const air = envelope(ctx, t, 0.03, 0.02, dur * 0.7)
  osc(o, 'sine', freq * 2, t, t + dur + 0.05).connect(air).connect(o.dest)
  amp.connect(o.dest)
}
