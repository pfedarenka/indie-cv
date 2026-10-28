import { owner } from '../content'
import { useTheme } from '../themes'
import { Floaters } from './Floaters'

// The layers are the same for every theme; each theme's CSS decides which show and how.
// (Clickable flat decorations live in the desktop layer: see DungeonDecor.)
export function Wallpaper() {
  const theme = useTheme()
  return (
    <div className="wallpaper" aria-hidden="true">
      <div className="engraving" />
      <div className="stars" />
      <div className="sun" />
      <div className="floor">
        <div className="grid" />
      </div>
      {theme.scene3d && <Floaters />}
      <div className="wall-title">
        <span className="wall-title-main">{theme.title ?? owner.title}</span>
        <span className="wall-title-sub">{theme.subtitle}</span>
      </div>
    </div>
  )
}
