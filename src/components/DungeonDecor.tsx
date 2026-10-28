import { useEffect, useState, type MouseEvent } from 'react'
import { helmetClang, preloadSfx, swordRing } from '../audio/sfx'
import { useTheme } from '../themes'
import { Helmet } from './Helmet'
import { Sword } from './Sword'

// Flat, clickable decorations for themes without the 3D scene: swords framing the
// screen (they ring) and a helmet mirroring the portrait (it takes hits).
// They sit in the desktop layer, under the windows, so they can be clicked.
export function DungeonDecor() {
  const theme = useTheme()
  const hasDecor = theme.sides === 'swords' || theme.relic === 'helmet'

  // Load the metal sounds as soon as there is something to click.
  useEffect(() => {
    if (hasDecor) preloadSfx()
  }, [hasDecor])

  return (
    <>
      {theme.sides === 'swords' && (
        <>
          <RingingSword side="left" />
          <RingingSword side="right" />
        </>
      )}
      {theme.relic === 'helmet' && <StruckHelmet />}
    </>
  )
}

function RingingSword({ side }: { side: 'left' | 'right' }) {
  const [rings, setRings] = useState(0)

  function ring(e: MouseEvent) {
    e.stopPropagation()
    swordRing()
    setRings((n) => n + 1)
  }

  return (
    <button type="button" className={`wall-sword ${side}`} onClick={ring} aria-label="Ring the sword">
      {/* keyed by the ring count so the vibrate + glint animation restarts on every click */}
      <Sword key={rings} className={rings ? 'ringing' : undefined} />
    </button>
  )
}

type Spark = { id: number; x: number; y: number }

function StruckHelmet() {
  const [hits, setHits] = useState(0)
  const [sparks, setSparks] = useState<Spark[]>([])

  function strike(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    helmetClang()
    const rect = e.currentTarget.getBoundingClientRect()
    // keyboard "clicks" have no position: aim at the middle of the helmet
    const x = e.detail ? e.clientX - rect.left : rect.width / 2
    const y = e.detail ? e.clientY - rect.top : rect.height / 2
    const spark = { id: Date.now() + Math.random(), x, y }
    setSparks((s) => [...s, spark])
    setTimeout(() => setSparks((s) => s.filter((p) => p !== spark)), 600)
    setHits((n) => n + 1)
  }

  return (
    <button type="button" className="wall-helmet" onClick={strike} aria-label="Strike the helmet">
      <Helmet key={hits} className={hits ? 'struck' : undefined} />
      {sparks.map((s) => (
        <span key={s.id} className="spark" style={{ left: s.x, top: s.y }} aria-hidden="true">
          ✦
        </span>
      ))}
      {hits > 0 && <span className="dents">dents: {hits}</span>}
    </button>
  )
}
