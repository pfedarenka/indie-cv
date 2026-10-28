import { dungeonSongs } from '../audio/dungeonSongs'
import type { Theme } from './types'

// Dark-fantasy / dungeon-synth: near-empty black, bone-white type and a little blood red.
export const dungeon: Theme = {
  id: 'dungeon',
  name: 'Dungeon',
  glyph: '🗡',
  subtitle: 'hail, wanderer ・ välkommen ・ enter at thy peril',
  startBanner: ['ＤＵＮＧＥＯＮ', ''],
  apps: {
    sequencer: { label: "Bard's Grimoire", title: "Bard's Grimoire" },
    rack: { label: 'Alchemy Table', title: 'Alchemy Table' },
    about: { label: 'Character Sheet', title: 'Character Sheet' },
    links: { label: 'Sending Stone', title: 'Sending Stone' },
    guestbook: { label: 'Tavern Board', title: 'Tavern Board' },
    helios: { label: 'Great Helm', title: 'Relic: Great Helm', icon: 'helmet' },
    trash: { label: 'Crypt', title: 'Crypt' },
  },
  portrait: { bubble: 'hail, traveller', tag: '☩ dungeon master ☩' },
  songs: dungeonSongs,
  scene3d: false, // dark and minimal: just the title, thin bone lines, fog and grain
  sides: 'swords', // instead of the marble columns
  relic: 'helmet', // instead of the Helios bust
}
