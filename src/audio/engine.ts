import type { Out } from './instruments'
import { STEPS, chords, tracks, type Pattern } from './song'

export type Settings = { bpm: number; rate: number }

// Effect knobs, each 0..1. The defaults reproduce the original lo-fi sound.
export type Fx = { filter: number; echo: number; space: number; wobble: number }
export const DEFAULT_FX: Fx = { filter: 0.57, echo: 0.42, space: 0.5, wobble: 0.3 }
export type Live = { pattern: Pattern; settings: Settings }

const TICK_MS = 25
const SCHEDULE_AHEAD = 0.12 // seconds

function impulse(ctx: AudioContext, seconds: number) {
  const length = ctx.sampleRate * seconds
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3
  }
  return buffer
}

// A look-ahead step sequencer: a JS timer wakes up often and schedules every
// step that falls within the next SCHEDULE_AHEAD seconds on the audio clock.
// The pattern is read at schedule time, so edits are heard on the next pass.
export class Engine {
  readonly ctx = new AudioContext()
  readonly analyser: AnalyserNode
  private readonly out: Out
  private timer = 0
  private step = 0
  private nextTime = 0
  private queue: { step: number; time: number }[] = []
  private readonly tone: BiquadFilterNode
  private readonly reverbSend: GainNode
  private readonly delaySend: GainNode
  private readonly feedback: GainNode
  private readonly depth: GainNode

  constructor(fx: Fx = DEFAULT_FX) {
    const { ctx } = this
    const bus = ctx.createGain()
    bus.gain.value = 0.8

    // Lo-fi master: dull the top end, then add a long room and a dotted echo.
    const tone = (this.tone = ctx.createBiquadFilter())
    tone.type = 'lowpass'
    tone.Q.value = 2

    const reverb = ctx.createConvolver()
    reverb.buffer = impulse(ctx, 3)
    const reverbSend = (this.reverbSend = ctx.createGain())

    const delay = ctx.createDelay(2)
    delay.delayTime.value = 0.55
    const feedback = (this.feedback = ctx.createGain())
    const delayTone = ctx.createBiquadFilter()
    delayTone.type = 'lowpass'
    delayTone.frequency.value = 1400
    const delaySend = (this.delaySend = ctx.createGain())

    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 1024

    bus.connect(tone)
    tone.connect(this.analyser)
    tone.connect(reverbSend).connect(reverb).connect(this.analyser)
    tone.connect(delaySend).connect(delay)
    delay.connect(delayTone).connect(feedback).connect(delay)
    delayTone.connect(this.analyser)
    this.analyser.connect(ctx.destination)

    // Shared "tape wobble": a slow LFO of a few cents on every oscillator.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.35
    const depth = (this.depth = ctx.createGain())
    lfo.connect(depth)
    lfo.start()

    this.out = { ctx, dest: bus, wobble: depth }
    this.setFx(fx, true)
  }

  // Knobs glide to their new value (no zipper noise) unless `instant`.
  setFx({ filter, echo, space, wobble }: Fx, instant = false) {
    const t = this.ctx.currentTime
    const set = (param: AudioParam, value: number) =>
      instant ? param.setValueAtTime(value, t) : param.setTargetAtTime(value, t, 0.05)
    set(this.tone.frequency, 200 * 2 ** (filter * 7)) // 200 Hz … 25.6 kHz
    set(this.delaySend.gain, echo * 0.6)
    set(this.feedback.gain, 0.15 + echo * 0.5)
    set(this.reverbSend.gain, space * 0.9)
    set(this.depth.gain, wobble * 30) // cents
  }

  play(read: () => Live) {
    void this.ctx.resume()
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
  trigger(trackIndex: number, settings: Settings, bar = 0) {
    void this.ctx.resume()
    tracks[trackIndex].play(this.out, this.ctx.currentTime + 0.01, { bar, ...this.timing(settings) })
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
    void this.ctx.close()
  }

  private timing({ bpm, rate }: Settings) {
    return { rate, stepDur: 60 / (bpm * rate) / 4 }
  }

  private schedule({ pattern, settings }: Live) {
    const timing = this.timing(settings)
    while (this.nextTime < this.ctx.currentTime + SCHEDULE_AHEAD) {
      const col = this.step % STEPS
      const bar = Math.floor(this.step / STEPS) % chords.length
      tracks.forEach((track, i) => {
        if (pattern[i][col]) track.play(this.out, this.nextTime, { bar, ...timing })
      })
      this.queue.push({ step: this.step, time: this.nextTime })
      this.nextTime += timing.stepDur
      this.step++
    }
  }
}
