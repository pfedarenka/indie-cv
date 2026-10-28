import type { MouseEvent } from 'react'
import pavel from '../assets/pavel.webp'

// The cut-out photo chilling on the desktop, sticker-style. Clicking it opens About Me.
export function Portrait({ onOpen }: { onOpen: () => void }) {
  function handleClick(e: MouseEvent) {
    e.stopPropagation()
    onOpen()
  }

  return (
    <button type="button" className="portrait" onClick={handleClick} aria-label="About me">
      <span className="portrait-bubble">hej hej ♪</span>
      <img src={pavel} alt="" draggable={false} />
      <span className="portrait-tag">★ webmaster ★</span>
    </button>
  )
}
