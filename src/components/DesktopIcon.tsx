import type { MouseEvent } from 'react'
import { Icon, type IconName } from './Icon'

type Props = {
  label: string
  icon: IconName
  selected: boolean
  onSelect: () => void
  onOpen: () => void
}

const isTouch = () => window.matchMedia('(pointer: coarse)').matches

// Like real Win98: a click selects, a double-click opens. Keyboard and touch open right away.
export function DesktopIcon({ label, icon, selected, onSelect, onOpen }: Props) {
  function handleClick(e: MouseEvent) {
    e.stopPropagation()
    // detail === 0 means the click came from the keyboard (Enter/Space).
    if (e.detail === 0 || isTouch()) onOpen()
    else onSelect()
  }

  return (
    <button
      type="button"
      className={`desktop-icon${selected ? ' selected' : ''}`}
      onClick={handleClick}
      onDoubleClick={onOpen}
    >
      <Icon name={icon} />
      <span className="desktop-icon-label">{label}</span>
    </button>
  )
}
