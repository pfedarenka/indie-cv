import type { Out } from './instruments'
import type { Cable, Fx, ModuleId, RackState } from './rack'
import { STEPS, tracks, type Pattern, type Song } from './song'

export type Settings = { bpm: number; rate: number }
export type Live = { song: Song; pattern: Pattern; settings: Settings }

// One patchable box in the FX rack: audio comes in at `input`, leaves at `output`.
type Module = { input?: AudioNode; output?: AudioNode }

const TICK_MS = 25
const SCHEDULE_AHEAD = 0.12 // seconds

function impulse(ctx: BaseAudioContext, seconds: number) {
  const length = ctx.sampleRate * seconds
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3
  }
  return buffer
}

// Bit-crusher transfer curve: rounds the waveform to 2^(bits-1) levels.
function crushCurve(bits: number) {
  const levels = 2 ** (bits - 1)
  const curve = new Float32Array(4096)
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1
    curve[i] = Math.round(x * levels) / levels
  }
  return curve
}

// A look-ahead step sequencer: a JS timer wakes up often and schedules every
// step that falls within the next SCHEDULE_AHEAD seconds on the audio clock.
// The pattern is read at schedule time, so edits are heard on the next pass.
// Given an OfflineAudioContext instead, the same graph renders to a file (see export.ts).
export class Engine {
  readonly ctx: BaseAudioContext
  readonly analyser: AnalyserNode
  private readonly out: Out
  private timer = 0
  private step = 0
  private nextTime = 0
  private queue: { step: number; time: number }[] = []
  private readonly modules: Record<ModuleId, Module>
  private readonly filter: BiquadFilterNode
  private readonly crusher: WaveShaperNode
  private readonly echoWet: GainNode
  private readonly feedback: GainNode
  private readonly spaceWet: GainNode
  private readonly wobbleDepth: GainNode
  private crushBits = 0

  constructor({ fx, cables }: RackState, ctx: BaseAudioContext = new AudioContext()) {
    this.ctx = ctx
    const bus = ctx.createGain() // everything the instruments play
    bus.gain.value = 0.8

    // TAPE: a short delay line whose length is swayed by a slow LFO = pitch wobble.
    const tape = ctx.createDelay(0.1)
    tape.delayTime.value = 0.012
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.35
    this.wobbleDepth = ctx.createGain()
    lfo.connect(this.wobbleDepth).connect(tape.delayTime)
    lfo.start()

    // FILTER: resonant low-pass.
    this.filter = ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.Q.value = 2

    // CRUSH: quantize the waveform to fewer bits.
    this.crusher = ctx.createWaveShaper()

    // ECHO: dry + a dotted delay with darkened feedback.
    const echoIn = ctx.createGain()
    const echoOut = ctx.createGain()
    const delay = ctx.createDelay(2)
    delay.delayTime.value = 0.55
    const delayTone = ctx.createBiquadFilter()
    delayTone.type = 'lowpass'
    delayTone.frequency.value = 1400
    this.feedback = ctx.createGain()
    this.echoWet = ctx.createGain()
    echoIn.connect(echoOut)
    echoIn.connect(delay).connect(delayTone).connect(this.feedback).connect(delay)
    delayTone.connect(this.echoWet).connect(echoOut)

    // SPACE: dry + a long convolution room.
    const spaceIn = ctx.createGain()
    const spaceOut = ctx.createGain()
    const reverb = ctx.createConvolver()
    reverb.buffer = impulse(ctx, 3)
    this.spaceWet = ctx.createGain()
    spaceIn.connect(spaceOut)
    spaceIn.connect(reverb).connect(this.spaceWet).connect(spaceOut)

    // SPEAKERS: the analyser feeds the oscilloscope on its way out.
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 1024
    this.analyser.connect(ctx.destination)

    this.modules = {
      seq: { output: bus },
      tape: { input: tape, output: tape },
      filter: { input: this.filter, output: this.filter },
      crush: { input: this.crusher, output: this.crusher },
      echo: { input: echoIn, output: echoOut },
      space: { input: spaceIn, output: spaceOut },
      out: { input: this.analyser },
    }

    this.out = { ctx, dest: bus }
    this.setFx(fx, true)
    this.setPatch(cables)
  }

  // Re-wires the rack: unplug every module output, then plug in each cable.
  setPatch(cables: Cable[]) {
    for (const m of Object.values(this.modules)) m.output?.disconnect()
    for (const { from, to } of cables) {
      const source = this.modules[from].output
      const target = this.modules[to].input
      if (source && target) source.connect(target)
    }
  }

  // Knobs glide to their new value (no zipper noise) unless `instant`.
  setFx({ filter, echo, space, wobble, crush }: Fx, instant = false) {
    const t = this.ctx.currentTime
    const set = (param: AudioParam, value: number) =>
      instant ? param.setValueAtTime(value, t) : param.setTargetAtTime(value, t, 0.05)
    set(this.filter.frequency, 200 * 2 ** (filter * 7)) // 200 Hz … 25.6 kHz
    set(this.echoWet.gain, echo * 0.6)
    set(this.feedback.gain, 0.15 + echo * 0.5)
    set(this.spaceWet.gain, space * 0.9)
    set(this.wobbleDepth.gain, wobble * 0.004) // up to ±4 ms of delay sway
    const bits = Math.round(16 - crush * 13) // 16 … 3 bits
    if (bits !== this.crushBits) {
      this.crushBits = bits
      this.crusher.curve = crushCurve(bits)
    }
  }

  // Browsers start live audio suspended until a user gesture.
  private wake() {
    if (this.ctx instanceof AudioContext) void this.ctx.resume()
  }

  play(read: () => Live) {
    this.wake()
    this.stop()
    this.step = 0
    this.nextTime = this.ctx.currentTime + 0.06
    this.timer = window.setInterval(() => this.schedule(read()), TICK_MS)
  }

  stop() {
    window.clearInterval(this.timer)
    this.timer = 0
    this.queue = []
  }

  // Plays one track right now; used to preview a cell when it is switched on.
  trigger(trackIndex: number, song: Song, settings: Settings, bar = 0) {
    this.wake()
    tracks[trackIndex].play(this.out, this.ctx.currentTime + 0.01, { song, bar, ...this.timing(settings) })
  }

  // The step currently audible (not the one being scheduled), for the UI.
  currentStep(): number | null {
    const now = this.ctx.currentTime
    while (this.queue.length > 1 && this.queue[1].time <= now) this.queue.shift()
    const head = this.queue[0]
    return head && head.time <= now ? head.step : null
  }

  dispose() {
    this.stop()
    if (this.ctx instanceof AudioContext) void this.ctx.close()
  }

  // Offline rendering: schedule every step from the start up to `seconds` at once.
  scheduleAll(live: Live, seconds: number) {
    this.step = 0
    this.nextTime = 0.05
    this.schedule(live, seconds)
  }

  private timing({ bpm, rate }: Settings) {
    return { rate, stepDur: 60 / (bpm * rate) / 4 }
  }

  private schedule({ song, pattern, settings }: Live, until = this.ctx.currentTime + SCHEDULE_AHEAD) {
    const timing = this.timing(settings)
    while (this.nextTime < until) {
      const col = this.step % STEPS
      const bar = Math.floor(this.step / STEPS) % song.chords.length
      tracks.forEach((track, i) => {
        if (pattern[i][col]) track.play(this.out, this.nextTime, { song, bar, ...timing })
      })
      this.queue.push({ step: this.step, time: this.nextTime })
      this.nextTime += timing.stepDur
      this.step++
    }
  }
}
