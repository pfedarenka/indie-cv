import { bass, bell, drone, flute, frameDrum, hat, keys, kick, lead, organ, snare, timpani, type Out } from './instruments'

export const STEPS = 16

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

export type Chord = { name: string; notes: number[]; root: number }
export type Pattern = boolean[][]

// A song is a preset for the sequencer: a four-bar progression (one chord per bar),
// the seven notes on the melody rows, a starting pattern and a tempo.
export type Song = {
  id: string
  title: string
  style: 'vapor' | 'dungeon' // which instrument set plays the rows
  bpm: number
  rate: number // "slowed" factor: scales both tempo and pitch, like a slowed-down record (0.72 ≈ -6 semitones)
  chords: Chord[]
  melody: [string, number][] // top row first; a pentatonic that fits every chord, so any melody sounds fine
  pattern: Pattern
}

export type PlayContext = {
  song: Song
  bar: number
  rate: number
  stepDur: number
}

export type Track = {
  id: string
  label: (song: Song) => string
  group: 'melody' | 'harmony' | 'drums'
  play: (o: Out, t: number, p: PlayContext) => void
}

const MELODY_ROWS = 7
const dungeon = (p: PlayContext) => p.song.style === 'dungeon'
const chordHz = (p: PlayContext) => p.song.chords[p.bar].notes.map((n) => hz(n) * p.rate)
const rootHz = (p: PlayContext, octaves = 0) => hz(p.song.chords[p.bar].root + 12 * octaves) * p.rate

// The same twelve rows for every song; the song's style picks the instrument on each row.
export const tracks: Track[] = [
  ...Array.from(
    { length: MELODY_ROWS },
    (_, i): Track => ({
      id: `melody-${i}`,
      label: (song) => song.melody[i][0],
      group: 'melody',
      play: (o, t, p) => {
        const freq = hz(p.song.melody[i][1]) * p.rate
        if (dungeon(p)) flute(o, t, freq, p.stepDur * 5)
        else lead(o, t, freq, p.stepDur * 4)
      },
    }),
  ),
  {
    id: 'chords',
    label: (song) => (song.style === 'dungeon' ? 'organ' : 'chords'),
    group: 'harmony',
    play: (o, t, p) => (dungeon(p) ? organ(o, t, chordHz(p), p.stepDur * 15) : keys(o, t, chordHz(p), p.stepDur * 9)),
  },
  {
    id: 'bass',
    label: (song) => (song.style === 'dungeon' ? 'drone' : 'bass'),
    group: 'harmony',
    play: (o, t, p) => (dungeon(p) ? drone(o, t, rootHz(p), p.stepDur * 15) : bass(o, t, rootHz(p), p.stepDur * 2.5)),
  },
  {
    id: 'kick',
    label: (song) => (song.style === 'dungeon' ? 'timpani' : 'kick'),
    group: 'drums',
    play: (o, t, p) => (dungeon(p) ? timpani(o, t, p.rate) : kick(o, t, p.rate)),
  },
  {
    id: 'snare',
    label: (song) => (song.style === 'dungeon' ? 'drum' : 'snare'),
    group: 'drums',
    play: (o, t, p) => (dungeon(p) ? frameDrum(o, t, p.rate) : snare(o, t, p.rate)),
  },
  {
    id: 'hat',
    label: (song) => (song.style === 'dungeon' ? 'bell' : 'hat'),
    group: 'drums',
    play: (o, t, p) => (dungeon(p) ? bell(o, t, rootHz(p, 3)) : hat(o, t, p.rate)),
  },
]

export const row = (steps: string) => [...steps].map((c) => c === 'x')

// Patterns list one row per track, in the same order as `tracks`.
export const vaporSongs: Song[] = [
  {
    id: 'night-stockholm',
    title: 'Stockholm.exe Has Stopped Responding',
    style: 'vapor',
    bpm: 72,
    rate: 0.72,
    chords: [
      { name: 'Fmaj7', notes: [53, 57, 60, 64], root: 41 },
      { name: 'Em7', notes: [52, 55, 59, 62], root: 40 },
      { name: 'Dm9', notes: [50, 53, 57, 60, 64], root: 38 },
      { name: 'Cmaj9', notes: [48, 52, 55, 59, 62], root: 36 },
    ],
    // C major pentatonic
    melody: [['A5', 81], ['G5', 79], ['E5', 76], ['D5', 74], ['C5', 72], ['A4', 69], ['G4', 67]],
    pattern: [
      row('......x.........'),
      row('...x......x.....'),
      row('x...........x...'),
      row('..............x.'),
      row('................'),
      row('................'),
      row('................'),
      row('x.........x.....'), // chords
      row('x..x....x.x.....'), // bass
      row('x.........x.....'), // kick
      row('....x.......x...'), // snare
      row('..x...x...x...x.'), // hat
    ],
  },
  {
    id: 'evening-solna',
    title: 'Solna Mall Escalator Muzak',
    style: 'vapor',
    bpm: 80,
    rate: 0.78,
    chords: [
      { name: 'Abmaj7', notes: [56, 60, 63, 67], root: 44 },
      { name: 'Gm7', notes: [55, 58, 62, 65], root: 43 },
      { name: 'Cm9', notes: [48, 51, 55, 58, 62], root: 36 },
      { name: 'Fm9', notes: [53, 56, 60, 63, 67], root: 41 },
    ],
    // Eb major pentatonic
    melody: [['Bb5', 82], ['G5', 79], ['F5', 77], ['Eb5', 75], ['C5', 72], ['Bb4', 70], ['G4', 67]],
    pattern: [
      row('..........x.....'),
      row('....x.......x...'),
      row('..x.............'),
      row('x.......x.......'),
      row('..............x.'),
      row('................'),
      row('................'),
      row('x.....x...x.....'), // chords
      row('x.....x...x..x..'), // bass
      row('x.....x...x.....'), // kick
      row('....x.......x...'), // snare
      row('x.x.x.x.x.x.x.x.'), // hat
    ],
  },
  {
    id: 'sleepy-kista',
    title: 'Kista Dial-Up Lullaby',
    style: 'vapor',
    bpm: 64,
    rate: 0.68,
    chords: [
      { name: 'Am9', notes: [57, 60, 64, 67, 71], root: 45 },
      { name: 'Fmaj7', notes: [53, 57, 60, 64], root: 41 },
      { name: 'Dm9', notes: [50, 53, 57, 60, 64], root: 38 },
      { name: 'Esus4', notes: [52, 57, 59, 64], root: 40 },
    ],
    // A minor pentatonic
    melody: [['A5', 81], ['G5', 79], ['E5', 76], ['D5', 74], ['C5', 72], ['A4', 69], ['G4', 67]],
    pattern: [
      row('........x.......'),
      row('................'),
      row('x...........x...'),
      row('......x.........'),
      row('...x............'),
      row('..............x.'),
      row('................'),
      row('x.......x.......'), // chords
      row('x.......x.......'), // bass
      row('x...............'), // kick
      row('........x.......'), // snare
      row('....x.......x...'), // hat
    ],
  },
]

export const emptyPattern = (): Pattern => tracks.map(() => Array<boolean>(STEPS).fill(false))
