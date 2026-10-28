import { vaporSongs } from '../audio/song'
import type { Theme } from './types'

// The original look, "Webcore": a pink Windows 98 from an alternate 1998.
// (The id stays 'vapor' so saved theme choices keep working.)
export const vapor: Theme = {
  id: 'vapor',
  name: 'Webcore',
  glyph: '🌴',
  subtitle: 'ようこそ ・ welcome ・ välkommen',
  startBanner: ['ｐａｖｅｌ', '９８'],
  apps: {},
  portrait: { bubble: 'hej hej ♪', tag: '★ webmaster ★' },
  songs: vaporSongs,
  scene3d: true,
  relic: 'helios',
}
