import { useEffect, useRef, useState } from 'react'
import { setTheme, themes, useTheme } from '../themes'

// The corner switch: shows the current theme's glyph, opens a list of all themes.
export function ThemePicker() {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <div className="theme-picker" ref={ref}>
      <button
        type="button"
        className={`theme-button${open ? ' pressed' : ''}`}
        aria-label={`Theme: ${theme.name}. Change theme`}
        aria-expanded={open}
        title="Change theme"
        onClick={() => setOpen((o) => !o)}
      >
        {theme.glyph}
      </button>
      {open && (
        <ul className="theme-menu" role="menu">
          {themes.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={t.id === theme.id}
                onClick={() => {
                  setTheme(t.id)
                  setOpen(false)
                }}
              >
                <span aria-hidden="true">{t.glyph}</span>
                {t.name}
                {t.id === theme.id && <span className="theme-check">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
