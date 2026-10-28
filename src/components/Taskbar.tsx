import { useEffect, useRef, useState } from 'react'
import { apps, appById, type AppId } from '../apps/registry'
import { appIcon, appLabel, appTitle, useTheme } from '../themes'
import { Icon } from './Icon'
import { LoadStatus } from './LoadStatus'
import { ThemePicker } from './ThemePicker'

type Props = {
  openIds: AppId[]
  activeId: AppId | null
  onTaskClick: (id: AppId) => void
  onOpen: (id: AppId) => void
  onShutdown: () => void
}

export function Taskbar({ openIds, activeId, onTaskClick, onOpen, onShutdown }: Props) {
  const theme = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const startRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: PointerEvent) => {
      if (!startRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [menuOpen])

  function launch(id: AppId) {
    setMenuOpen(false)
    onOpen(id)
  }

  return (
    <footer className="taskbar">
      <div className="start" ref={startRef}>
        <button
          type="button"
          className={`start-button${menuOpen ? ' pressed' : ''}`}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name="logo" size={16} />
          Start
        </button>
        {menuOpen && (
          <nav className="start-menu">
            <div className="start-menu-banner">
              {theme.startBanner[0]}
              <b>{theme.startBanner[1]}</b>
            </div>
            <ul>
              {apps.map((app) => (
                <li key={app.id}>
                  <button type="button" onClick={() => launch(app.id)}>
                    <Icon name={appIcon(app, theme)} size={24} />
                    {appLabel(app, theme)}
                  </button>
                </li>
              ))}
              <li className="start-menu-separator" role="separator" />
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onShutdown()
                  }}
                >
                  <Icon name="computer" size={24} />
                  Shut Down...
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>

      <div className="tasks">
        {openIds.map((id) => (
          <button
            key={id}
            type="button"
            className={`task${id === activeId ? ' pressed' : ''}`}
            onClick={() => onTaskClick(id)}
          >
            <Icon name={appIcon(appById[id], theme)} size={16} />
            <span>{appTitle(appById[id], theme)}</span>
          </button>
        ))}
      </div>

      <LoadStatus />
      <ThemePicker />
      <div className="tray">
        <time dateTime={now.toISOString()}>
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
      </div>
    </footer>
  )
}
