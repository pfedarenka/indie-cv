import { owner } from '../content'
import { Floaters } from './Floaters'

export function Wallpaper() {
  return (
    <div className="wallpaper" aria-hidden="true">
      <div className="stars" />
      <div className="sun" />
      <div className="floor">
        <div className="grid" />
      </div>
      <Floaters />
      <div className="wall-title">
        <span className="wall-title-main">{owner.title}</span>
        <span className="wall-title-sub">ようこそ ・ welcome ・ välkommen</span>      </div>
    </div>
  )
}
