// One-shot sound effects for clickable decorations (separate from the sequencer).
// Recorded metal from Kenney's CC0 packs ("RPG Audio" and "Impact Sounds",
// kenney.nl), converted to small mono MP3s in src/assets/sfx. Each click picks
// a random take and nudges its pitch, so repeated clicks don't sound looped;
// everything is pitched down a little to sound heavier and more ominous.

const urls = import.meta.glob('../assets/sfx/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<
  string,
  string
>
const takes = (prefix: string) =>
  Object.entries(urls)
    .filter(([path]) => path.includes(`/${prefix}`))
    .map(([, url]) => url)

const SOUNDS = {
  draw: takes('drawKnife'),
  bell: takes('impactBell_heavy'),
  plate: takes('impactPlate_heavy'),
  metal: takes('impactMetal_heavy'),
}

let ctx: AudioContext | null = null
const buffers = new Map<string, Promise<AudioBuffer>>()

function audio() {
  ctx ??= new AudioContext()
  void ctx.resume()
  return ctx
}

function load(url: string) {
  let buffer = buffers.get(url)
  if (!buffer) {
    buffer = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((data) => audio().decodeAudioData(data))
    buffers.set(url, buffer)
  }
  return buffer
}

// Fetch and decode everything up front so the first click isn't late.
export function preloadSfx() {
  Object.values(SOUNDS).flat().forEach((url) => void load(url))
}

const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)]
const between = (a: number, b: number) => a + Math.random() * (b - a)

async function play(list: string[], { delay = 0, rate = 1, gain = 1 } = {}) {
  if (!list.length) return
  const c = audio()
  const buffer = await load(pick(list))
  const src = c.createBufferSource()
  src.buffer = buffer
  src.playbackRate.value = rate
  const level = c.createGain()
  level.gain.value = gain
  src.connect(level).connect(c.destination)
  src.start(c.currentTime + delay)
}

// A low thump under the helmet hit, for weight.
function thump(gain: number) {
  const c = audio()
  const t = c.currentTime
  const osc = c.createOscillator()
  osc.frequency.setValueAtTime(110, t)
  osc.frequency.exponentialRampToValueAtTime(48, t + 0.18)
  const level = c.createGain()
  level.gain.setValueAtTime(gain, t)
  level.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
  osc.connect(level).connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.35)
}

// Steel leaving the scabbard, then a long, dark ring.
export function swordRing() {
  void play(SOUNDS.draw, { rate: between(0.85, 0.95), gain: 0.9 })
  void play(SOUNDS.bell, { delay: 0.12, rate: between(0.7, 0.8), gain: 0.75 })
}

// A heavy blow on a helmet: armour plate and raw metal together, plus a thump.
export function helmetClang() {
  void play(SOUNDS.plate, { rate: between(0.78, 0.9), gain: 1 })
  void play(SOUNDS.metal, { rate: between(0.7, 0.8), gain: 0.6 })
  thump(0.5)
}
