import { row, type Song } from './song'

// Dungeon synth: minor and modal progressions, organ swells, a drone in the bass,
// a lonely flute on top, timpani and a bell. Not slowed down: these are slow already.
export const dungeonSongs: Song[] = [
  {
    id: 'catacombs-gamla-stan',
    title: 'Catacombs Beneath Gamla Stan',
    style: 'dungeon',
    bpm: 66,
    rate: 1,
    chords: [
      { name: 'Dm', notes: [50, 53, 57, 62], root: 38 },
      { name: 'Bb', notes: [46, 50, 53, 58], root: 34 },
      { name: 'C', notes: [48, 52, 55, 60], root: 36 },
      { name: 'Am', notes: [45, 48, 52, 57], root: 33 },
    ],
    // D minor pentatonic
    melody: [['A5', 81], ['G5', 79], ['F5', 77], ['D5', 74], ['C5', 72], ['A4', 69], ['F4', 65]],
    pattern: [
      row('........x.......'),
      row('..........x.....'),
      row('....x.......x...'),
      row('x...............'),
      row('..............x.'),
      row('................'),
      row('................'),
      row('x...............'), // organ
      row('x...............'), // drone
      row('x.......x.......'), // timpani
      row('......x.......x.'), // drum
      row('............x...'), // bell
    ],
  },
  {
    id: 'lich-of-solna',
    title: 'The Lich of Solna',
    style: 'dungeon',
    bpm: 58,
    rate: 1,
    chords: [
      { name: 'Em', notes: [52, 55, 59, 64], root: 40 },
      { name: 'F', notes: [53, 57, 60, 65], root: 41 },
      { name: 'Em', notes: [52, 55, 59, 64], root: 40 },
      { name: 'D', notes: [50, 54, 57, 62], root: 38 },
    ],
    // E minor (phrygian against the F chord)
    melody: [['B5', 83], ['A5', 81], ['G5', 79], ['E5', 76], ['D5', 74], ['B4', 71], ['A4', 69]],
    pattern: [
      row('................'),
      row('......x.........'),
      row('....x.......x...'),
      row('x.........x.....'),
      row('..............x.'),
      row('..x.............'),
      row('................'),
      row('x.......x.......'), // organ
      row('x...............'), // drone
      row('x...........x...'), // timpani
      row('................'), // drum
      row('x...............'), // bell
    ],
  },
  {
    id: 'kista-necromancy',
    title: 'Kista Necromancy Cluster',
    style: 'dungeon',
    bpm: 72,
    rate: 0.95,
    chords: [
      { name: 'Cm', notes: [48, 51, 55, 60], root: 36 },
      { name: 'Ab', notes: [44, 48, 51, 56], root: 32 },
      { name: 'Eb', notes: [51, 55, 58, 63], root: 39 },
      { name: 'G', notes: [43, 47, 50, 55], root: 31 },
    ],
    // C minor pentatonic
    melody: [['C6', 84], ['Bb5', 82], ['G5', 79], ['F5', 77], ['Eb5', 75], ['C5', 72], ['Bb4', 70]],
    pattern: [
      row('................'),
      row('..........x.....'),
      row('..x.....x.......'),
      row('................'),
      row('x...x...........'),
      row('............x.x.'),
      row('................'),
      row('x.......x.......'), // organ
      row('x.......x.......'), // drone
      row('x.....x.x.......'), // timpani
      row('....x.......x...'), // drum
      row('..............x.'), // bell
    ],
  },
]
