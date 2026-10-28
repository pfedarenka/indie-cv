import type { MouseEvent } from 'react'
import pavel from '../assets/pavel.webp'
import { useTheme } from '../themes'

// The cut-out photo chilling on the desktop, sticker-style. Clicking it opens About Me.
export function Portrait({ onOpen }: { onOpen: () => void }) {
  const { portrait } = useTheme()
  function handleClick(e: MouseEvent) {
    e.stopPropagation()
    onOpen()
  }

  return (
    <button type="button" className="portrait" onClick={handleClick} aria-label="About me">
      <span className="portrait-bubble">{portrait.bubble}</span>
      <img src={pavel} alt="" draggable={false} />
      <span className="portrait-tag">{portrait.tag}</span>
    </button>
  )
}
