import { useRef, useState } from 'react'
import { apps, appById, type AppId } from './apps/registry'
import { Window, type WinState } from './components/Window'
import { DesktopIcon } from './components/DesktopIcon'
import { Taskbar } from './components/Taskbar'
import { Wallpaper } from './components/Wallpaper'
import { Portrait } from './components/Portrait'

type Windows = Partial<Record<AppId, WinState>>

const TASKBAR_H = 36
const TITLE_H = 170 // the big wallpaper title; centered windows start below it when there is room

// New windows cascade from the top-left, clamped to the screen.
function spawn(id: AppId, index: number, z: number, centered = false): WinState {
  const { width, height } = appById[id]
  const w = Math.min(width, window.innerWidth - 16)
  const h = Math.min(height, window.innerHeight - TASKBAR_H - 16)
  const left = centered ? (window.innerWidth - w) / 2 : 130 + index * 32
  const top = centered ? Math.max((window.innerHeight - TASKBAR_H - h) / 2, TITLE_H) : 24 + index * 32
  const x = Math.max(8, Math.min(window.innerWidth - w - 8, left))
  const y = Math.max(8, Math.min(window.innerHeight - TASKBAR_H - h - 8, top))
  return { x, y, w, h, z, minimized: false, maximized: false }
}

function App() {
  const zRef = useRef(2)
  // The sequencer is the "home page"; About opens from the portrait sticker or its icon.
  const [wins, setWins] = useState<Windows>(() => ({
    sequencer: spawn('sequencer', 0, 2, true),
  }))
  const [selectedIcon, setSelectedIcon] = useState<AppId | null>(null)
  const [shutDown, setShutDown] = useState(false)
  const openIds = Object.keys(wins) as AppId[]
  const visible = openIds.filter((id) => !wins[id]!.minimized)
  const activeId = visible.length
    ? visible.reduce((top, id) => (wins[id]!.z > wins[top]!.z ? id : top))
    : null

  function update(id: AppId, patch: Partial<WinState>) {
    setWins((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...patch } } : prev))
  }

  function open(id: AppId) {
    const z = ++zRef.current
    setWins((prev) => ({
      ...prev,
      [id]: prev[id] ? { ...prev[id], z, minimized: false } : spawn(id, Object.keys(prev).length, z),
    }))
  }

  function focus(id: AppId) {
    if (id !== activeId) update(id, { z: ++zRef.current })
  }

  function close(id: AppId) {
    setWins((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function onTaskClick(id: AppId) {
    if (id === activeId) update(id, { minimized: true })
    else open(id)
  }

  if (shutDown) {
    return (
      <button type="button" className="shutdown" onClick={() => setShutDown(false)}>
        It's now safe to turn off
        <br />
        your computer.
        <small>(click to turn it back on)</small>
      </button>
    )
  }

  return (
    <>
      <Wallpaper />
      <main className="desktop" onClick={() => setSelectedIcon(null)}>
        {(['left', 'right'] as const).map((side) => (
          <div key={side} className={`desktop-icons ${side}`}>
            {apps
              .filter((app) => app.side === side)
              .map((app) => (
                <DesktopIcon
                  key={app.id}
                  label={app.label}
                  icon={app.icon}
                  selected={selectedIcon === app.id}
                  onSelect={() => setSelectedIcon(app.id)}
                  onOpen={() => {
                    setSelectedIcon(app.id)
                    open(app.id)
                  }}
                />
              ))}
          </div>
        ))}

        <Portrait onOpen={() => open('about')} />

        {openIds.map((id) => {
          const { title, icon, Component } = appById[id]
          const state = wins[id]!
          return (
            <Window
              key={id}
              title={title}
              icon={icon}
              state={state}
              active={id === activeId}
              onFocus={() => focus(id)}
              onClose={() => close(id)}
              onMinimize={() => update(id, { minimized: true })}
              onToggleMax={() => update(id, { maximized: !state.maximized })}
              onMove={(x, y) => update(id, { x, y })}
            >
              <Component />
            </Window>
          )
        })}
      </main>
      <Taskbar
        openIds={openIds}
        activeId={activeId}
        onTaskClick={onTaskClick}
        onOpen={open}
        onShutdown={() => setShutDown(true)}
      />
      <div className="scanlines" aria-hidden="true" />
    </>
  )
}

export default App
