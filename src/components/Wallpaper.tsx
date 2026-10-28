import { owner } from '../content'
import { useTheme } from '../themes'
import { Floaters } from './Floaters'
import { Helmet } from './Helmet'
import { Sword } from './Sword'

// The layers are the same for every theme; each theme's CSS decides which show and how.
export function Wallpaper() {
  const theme = useTheme()
  return (
    <div className="wallpaper" aria-hidden="true">
      <div className="stars" />
      <div className="sun" />
      <div className="floor">
        <div className="grid" />
      </div>
      {theme.scene3d && <Floaters />}
      {theme.sides === 'swords' && (
        <>
          <Sword side="left" />
          <Sword side="right" />
        </>
      )}
      {/* mirrors the portrait sticker; the 3D Helios bust does this in themes with 3D */}
      {theme.relic === 'helmet' && <Helmet className="wall-helmet" />}
      <div className="wall-title">
        <span className="wall-title-main">{theme.title ?? owner.title}</span>
        <span className="wall-title-sub">{theme.subtitle}</span>
      </div>
    </div>
  )
}
