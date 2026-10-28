import type { AppId } from '../apps/registry'
import type { Song } from '../audio/song'
import type { IconName } from '../components/Icon'

// A theme ("aesthetic") is everything that changes when you switch:
// CSS (via <html data-theme="…">), names and texts, music and the 3D wallpaper.
// To add one: write a file next to this one, register it in ./index.ts and add
// its CSS overrides under :root[data-theme="<id>"] (see ./dungeon.css).
export type Theme = {
  id: string
  name: string // shown in the theme picker
  glyph: string // picker button / menu icon
  title?: string // big wallpaper title; defaults to owner.title from content.ts
  subtitle: string
  startBanner: [string, string] // vertical Start-menu banner: text + bold tail
  apps: Partial<Record<AppId, { label?: string; title?: string; icon?: IconName }>> // renamed windows/icons
  portrait: { bubble: string; tag: string }
  songs: Song[] // sequencer tracks; the first one loads when the theme is picked
  scene3d: boolean // the three.js wallpaper scene (dolphins, bust, columns…)
  sides?: 'swords' // flat decoration framing the screen edges (for themes without 3D columns)
  // The artifact mirroring the portrait on the right, also shown in the relic window:
  // the 3D Helios bust, or a flat engraved helmet for themes without 3D.
  relic: 'helios' | 'helmet'
}
