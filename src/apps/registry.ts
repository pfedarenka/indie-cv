import type { ComponentType } from 'react'
import type { IconName } from '../components/Icon'
import { AboutApp } from './AboutApp'
import { LinksApp } from './LinksApp'
import { GuestbookApp } from './GuestbookApp'
import { TrashApp } from './TrashApp'
import { SequencerApp } from './SequencerApp'
import { HeliosApp } from './HeliosApp'
import { RackApp } from './RackApp'

export type AppId = 'sequencer' | 'rack' | 'about' | 'links' | 'guestbook' | 'helios' | 'trash'

export type AppDef = {
  id: AppId
  label: string // desktop icon / start menu
  title: string // window title bar
  icon: IconName
  side?: 'left' | 'right' // desktop icon column (the layout is mirrored); none = Start menu only
  width: number
  height: number
  Component: ComponentType
}

export const apps: AppDef[] = [
  { id: 'sequencer', label: 'Sequencer.exe', title: 'Sequencer.exe', icon: 'music', side: 'left', width: 660, height: 500, Component: SequencerApp },
  { id: 'rack', label: 'FX_Rack.exe', title: 'FX_Rack.exe', icon: 'rack', width: 640, height: 400, Component: RackApp },
  { id: 'about', label: 'About Me', title: 'About Me', icon: 'computer', side: 'left', width: 460, height: 440, Component: AboutApp },
  { id: 'links', label: 'Links', title: 'Links - Internet Explorer', icon: 'globe', side: 'left', width: 480, height: 420, Component: LinksApp },
  { id: 'guestbook', label: 'Guestbook', title: 'Guestbook', icon: 'guestbook', side: 'right', width: 420, height: 460, Component: GuestbookApp },
  { id: 'helios', label: 'Helios.obj', title: 'Helios.obj - Properties', icon: 'column', side: 'right', width: 380, height: 330, Component: HeliosApp },
  { id: 'trash', label: 'Recycle Bin', title: 'Recycle Bin', icon: 'trash', side: 'right', width: 380, height: 320, Component: TrashApp },
]

export const appById = Object.fromEntries(apps.map((app) => [app.id, app])) as Record<AppId, AppDef>
