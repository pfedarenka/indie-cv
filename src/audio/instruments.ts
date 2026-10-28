// Tiny synth voices built from raw Web Audio nodes. Every voice is created per
// note, scheduled at `t` (AudioContext time) and cleans itself up when it stops.

export type Out = {
  ctx: BaseAudioContext // live AudioContext, or an OfflineAudioContext when exporting
  dest: AudioNode
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()

function noise(ctx: BaseAudioContext) {
  let buffer = noiseBuffers.get(ctx)
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    noiseBuffers.set(ctx, buffer)
  }
  return buffer
}

function envelope(ctx: BaseAudioContext, t: number, peak: number, attack: number, decay: number) {
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
  node.start(t)
  node.stop(end)
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

// ── dungeon-synth voices ──

// Reedy church organ: detuned saws plus a square an octave down, slow swell.
export function organ(o: Out, t: number, freqs: number[], dur: number) {
  const { ctx } = o
  const low = ctx.createBiquadFilter()
  low.type = 'lowpass'
  low.frequency.value = 1100
  const amp = ctx.createGain()
  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.exponentialRampToValueAtTime(0.045, t + 0.4)
  amp.gain.setValueAtTime(0.045, t + dur * 0.75)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  low.connect(amp).connect(o.dest)
  for (const f of freqs) {
    osc(o, 'sawtooth', f, t, t + dur + 0.05, -5).connect(low)
    osc(o, 'sawtooth', f, t, t + dur + 0.05, 5).connect(low)
  }
  osc(o, 'square', freqs[0] / 2, t, t + dur + 0.05).connect(low)
}

// Breathy flute: sine with slow vibrato and a puff of filtered noise.
export function flute(o: Out, t: number, freq: number, dur: number) {
  const { ctx } = o
  const tone = osc(o, 'sine', freq, t, t + dur + 0.1)
  const vibrato = osc(o, 'sine', 5, t, t + dur + 0.1)
  const depth = ctx.createGain()
  depth.gain.setValueAtTime(0, t)
  depth.gain.linearRampToValueAtTime(9, t + dur * 0.5) // cents, creeping in like a real player
  vibrato.connect(depth).connect(tone.detune)
  tone.connect(envelope(ctx, t, 0.12, 0.08, dur)).connect(o.dest)

  const breath = ctx.createBufferSource()
  breath.buffer = noise(ctx)
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = freq * 2
  band.Q.value = 3
  breath.connect(band).connect(envelope(ctx, t, 0.02, 0.05, 0.25)).connect(o.dest)
  breath.start(t)
  breath.stop(t + 0.4)
}

// Low drone: root plus fifth, dark and slow.
export function drone(o: Out, t: number, freq: number, dur: number) {
  const { ctx } = o
  const low = ctx.createBiquadFilter()
  low.type = 'lowpass'
  low.frequency.value = 380
  const amp = ctx.createGain()
  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.exponentialRampToValueAtTime(0.16, t + 0.6)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc(o, 'sawtooth', freq, t, t + dur + 0.05).connect(low)
  osc(o, 'sawtooth', freq * 1.5, t, t + dur + 0.05, 3).connect(low)
  low.connect(amp).connect(o.dest)
}

export function timpani(o: Out, t: number, rate: number) {
  const { ctx } = o
  const node = ctx.createOscillator()
  node.frequency.setValueAtTime(98 * rate, t)
  node.frequency.exponentialRampToValueAtTime(62 * rate, t + 0.5)
  node.connect(envelope(ctx, t, 0.7, 0.01, 1.3)).connect(o.dest)
  node.start(t)
  node.stop(t + 1.5)

  const skin = ctx.createBufferSource()
  skin.buffer = noise(ctx)
  const low = ctx.createBiquadFilter()
  low.type = 'lowpass'
  low.frequency.value = 300
  skin.connect(low).connect(envelope(ctx, t, 0.3, 0.003, 0.15)).connect(o.dest)
  skin.start(t)
  skin.stop(t + 0.25)
}

export function frameDrum(o: Out, t: number, rate: number) {
  const { ctx } = o
  const src = ctx.createBufferSource()
  src.buffer = noise(ctx)
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 420 * rate
  band.Q.value = 1.2
  src.connect(band).connect(envelope(ctx, t, 0.35, 0.002, 0.2)).connect(o.dest)
  src.start(t)
  src.stop(t + 0.3)
  osc(o, 'sine', 140 * rate, t, t + 0.2).connect(envelope(ctx, t, 0.25, 0.002, 0.14)).connect(o.dest)
}

// Church bell: inharmonic partials with long, staggered decays.
export function bell(o: Out, t: number, freq: number) {
  const { ctx } = o
  const partials: [number, number, number][] = [
    [1, 0.1, 3],
    [2.76, 0.05, 2],
    [5.4, 0.03, 1.2],
    [8.93, 0.015, 0.7],
  ]
  for (const [ratio, peak, decay] of partials) {
    osc(o, 'sine', freq * ratio, t, t + decay + 0.1).connect(envelope(ctx, t, peak, 0.004, decay)).connect(o.dest)
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
