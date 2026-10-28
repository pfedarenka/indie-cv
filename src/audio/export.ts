import { Engine, type Live } from './engine'
import type { RackState } from './rack'
import { STEPS } from './song'

const SAMPLE_RATE = 44100
const TAIL = 3 // seconds after the last loop for the reverb and echo to ring out

// Renders whole passes of the song (all its bars) adding up to about `target`
// seconds, through the same FX rack, faster than real time.
export async function renderLoop(live: Live, rack: RackState, target = 60) {
  const stepDur = 60 / (live.settings.bpm * live.settings.rate) / 4
  const pass = STEPS * live.song.chords.length * stepDur
  const seconds = Math.max(1, Math.round(target / pass)) * pass
  const ctx = new OfflineAudioContext(2, Math.ceil(SAMPLE_RATE * (seconds + TAIL)), SAMPLE_RATE)
  new Engine(rack, ctx).scheduleAll(live, seconds)
  const buffer = await ctx.startRendering()
  fadeOut(buffer, seconds, TAIL)
  normalize(buffer, 0.94) // ≈ −0.5 dBFS: no clipping, and every track exports equally loud
  return buffer
}

function normalize(buffer: AudioBuffer, target: number) {
  let peak = 0
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    for (const s of buffer.getChannelData(ch)) peak = Math.max(peak, Math.abs(s))
  }
  if (!peak) return
  const gain = target / peak
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < data.length; i++) data[i] *= gain
  }
}

// Fade the tail to silence so the file doesn't end with a click.
function fadeOut(buffer: AudioBuffer, from: number, length: number) {
  const start = Math.floor(from * buffer.sampleRate)
  const n = buffer.length - start
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < n; i++) data[start + i] *= 1 - i / (length * buffer.sampleRate)
  }
}

function toInt16(data: Float32Array) {
  const out = new Int16Array(data.length)
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

// 16-bit stereo PCM WAV.
export function toWav(buffer: AudioBuffer) {
  const left = toInt16(buffer.getChannelData(0))
  const right = toInt16(buffer.getChannelData(1))
  const bytes = left.length * 4
  const view = new DataView(new ArrayBuffer(44 + bytes))
  const text = (offset: number, s: string) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + bytes, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 2, true) // channels
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * 4, true) // byte rate
  view.setUint16(32, 4, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  text(36, 'data')
  view.setUint32(40, bytes, true)
  for (let i = 0; i < left.length; i++) {
    view.setInt16(44 + i * 4, left[i], true)
    view.setInt16(46 + i * 4, right[i], true)
  }
  return new Blob([view], { type: 'audio/wav' })
}

// 192 kbps stereo MP3; the encoder (pure JS LAME, LGPL) is loaded only when needed.
export async function toMp3(buffer: AudioBuffer) {
  const { Mp3Encoder } = await import('@breezystack/lamejs')
  const encoder = new Mp3Encoder(2, buffer.sampleRate, 192)
  const left = toInt16(buffer.getChannelData(0))
  const right = toInt16(buffer.getChannelData(1))
  const chunks: Uint8Array[] = []
  const block = 1152 * 20
  for (let i = 0; i < left.length; i += block) {
    chunks.push(encoder.encodeBuffer(left.subarray(i, i + block), right.subarray(i, i + block)))
  }
  chunks.push(encoder.flush())
  return new Blob(chunks as BlobPart[], { type: 'audio/mpeg' })
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
