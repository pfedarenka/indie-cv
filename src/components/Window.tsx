import { useRef, type PointerEvent, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export type WinState = {
  x: number
  y: number
  w: number
  h: number
  z: number
  minimized: boolean
  maximized: boolean
}

type Props = {
  title: string
  icon: IconName
  state: WinState
  active: boolean
  onFocus: () => void
  onClose: () => void
  onMinimize: () => void
  onToggleMax: () => void
  onMove: (x: number, y: number) => void
  children: ReactNode
}

// On narrow screens windows are always full-size (see CSS), so dragging is off.
const canDrag = () => window.innerWidth >= 640

export function Window({
  title,
  icon,
  state,
  active,
  onFocus,
  onClose,
  onMinimize,
  onToggleMax,
  onMove,
  children,
}: Props) {
  const drag = useRef<{ dx: number; dy: number } | null>(null)

  function startDrag(e: PointerEvent<HTMLElement>) {
    if (state.maximized || !canDrag() || e.button !== 0) return
    if ((e.target as HTMLElement).closest('button')) return
    drag.current = { dx: e.clientX - state.x, dy: e.clientY - state.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function moveDrag(e: PointerEvent<HTMLElement>) {
    if (!drag.current) return
    // Keep at least part of the title bar on screen so the window can't get lost.
    const x = Math.min(Math.max(e.clientX - drag.current.dx, 80 - state.w), window.innerWidth - 80)
    const y = Math.min(Math.max(e.clientY - drag.current.dy, 0), window.innerHeight - 80)
    onMove(x, y)
  }

  const style = state.maximized
    ? { zIndex: state.z }
    : { left: state.x, top: state.y, width: state.w, height: state.h, zIndex: state.z }

  return (
    <section
      className={`window${active ? ' active' : ''}${state.maximized ? ' maximized' : ''}`}
      style={style}
      hidden={state.minimized}
      onPointerDown={onFocus}
      aria-label={title}
    >
      <header
        className="titlebar"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onDoubleClick={onToggleMax}
      >
        <Icon name={icon} size={16} />
        <span className="titlebar-text">{title}</span>
        <div className="titlebar-buttons">
          <button type="button" aria-label="Minimize" onClick={onMinimize}>
            <span className="glyph-min" />
          </button>
          <button type="button" aria-label={state.maximized ? 'Restore' : 'Maximize'} onClick={onToggleMax}>
            <span className={state.maximized ? 'glyph-restore' : 'glyph-max'} />
          </button>
          <button type="button" aria-label="Close" onClick={onClose}>
            <span className="glyph-close">×</span>
          </button>
        </div>
      </header>
      <div className="window-body">{children}</div>
    </section>
  )
}
