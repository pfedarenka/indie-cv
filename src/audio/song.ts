import { bass, hat, keys, kick, lead, snare, type Out } from './instruments'

export const STEPS = 16

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

// Original four-bar progression; the chord changes every bar.
export const chords = [
  { name: 'Fmaj7', notes: [53, 57, 60, 64], root: 41 },
  { name: 'Em7', notes: [52, 55, 59, 62], root: 40 },
  { name: 'Dm9', notes: [50, 53, 57, 60, 64], root: 38 },
  { name: 'Cmaj9', notes: [48, 52, 55, 59, 62], root: 36 },
]

export type PlayContext = {
  bar: number
  rate: number // "slowed" factor: scales both tempo and pitch, like a slowed-down record (0.72 ≈ -6 semitones)
  stepDur: number
}

export type Track = {
  id: string
  label: string
  group: 'melody' | 'harmony' | 'drums'
  play: (o: Out, t: number, p: PlayContext) => void
}

// C major pentatonic fits every chord above, so any melody you draw sounds fine.
const melodyNotes: [string, number][] = [
  ['A5', 81],
  ['G5', 79],
  ['E5', 76],
  ['D5', 74],
  ['C5', 72],
  ['A4', 69],
  ['G4', 67],
]

export const tracks: Track[] = [
  ...melodyNotes.map(
    ([label, note]): Track => ({
      id: label,
      label,
      group: 'melody',
      play: (o, t, p) => lead(o, t, hz(note) * p.rate, p.stepDur * 4),
    }),
  ),
  {
    id: 'chords',
    label: 'chords',
    group: 'harmony',
    play: (o, t, p) => keys(o, t, chords[p.bar].notes.map((n) => hz(n) * p.rate), p.stepDur * 9),
  },
  {
    id: 'bass',
    label: 'bass',
    group: 'harmony',
    play: (o, t, p) => bass(o, t, hz(chords[p.bar].root) * p.rate, p.stepDur * 2.5),
  },
  { id: 'kick', label: 'kick', group: 'drums', play: (o, t, p) => kick(o, t, p.rate) },
  { id: 'snare', label: 'snare', group: 'drums', play: (o, t, p) => snare(o, t, p.rate) },
  { id: 'hat', label: 'hat', group: 'drums', play: (o, t, p) => hat(o, t, p.rate) },
]

export type Pattern = boolean[][]

const row = (steps: string) => [...steps].map((c) => c === 'x')

// One row per track, in the same order as `tracks`.
export const defaultPattern: Pattern = [
  row('......x.........'), // A5
  row('...x......x.....'), // G5
  row('x...........x...'), // E5
  row('..............x.'), // D5
  row('................'), // C5
  row('................'), // A4
  row('................'), // G4
  row('x.........x.....'), // chords
  row('x..x....x.x.....'), // bass
  row('x.........x.....'), // kick
  row('....x.......x...'), // snare
  row('..x...x...x...x.'), // hat
]

export const emptyPattern = (): Pattern => tracks.map(() => Array<boolean>(STEPS).fill(false))
