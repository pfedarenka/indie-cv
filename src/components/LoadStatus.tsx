import { useEffect, useState } from 'react'
import pavelUrl from '../assets/pavel.webp'
import heliosUrl from '../assets/helios.bin?url'
import { useTheme } from '../themes'

// Real work behind the progress bar. The 3D bits are skipped on phones and in themes without 3D.
const tasks: { label: string; is3d: boolean; run: () => Promise<unknown> }[] = [
  { label: 'loading 3D drivers', is3d: true, run: () => import('../three/scene') },
  { label: 'loading helios.obj', is3d: true, run: () => fetch(heliosUrl).then((r) => r.arrayBuffer()) },
  {
    label: 'loading pavel.webp',
    is3d: false,
    run: () =>
      new Promise((resolve) => {
        const img = new Image()
        img.onload = img.onerror = resolve
        img.src = pavelUrl
      }),
  },
]

const BLOCKS = 12
const SHOW_READY_MS = 2500

// A Win98-style progress readout in the taskbar tray; it fades out once everything is in.
export function LoadStatus() {
  const { scene3d } = useTheme()
  const [active] = useState(() => tasks.filter((t) => !t.is3d || (scene3d && window.innerWidth >= 640)))
  const [done, setDone] = useState<boolean[]>(() => active.map(() => false))
  const [shown, setShown] = useState(0) // blocks drawn; creeps toward the real progress
  const [phase, setPhase] = useState<'loading' | 'ready' | 'fading' | 'gone'>('loading')

  useEffect(() => {
    active.forEach((task, i) => {
      void task.run().finally(() => setDone((d) => d.map((v, j) => (j === i ? true : v))))
    })
  }, [active])

  const finished = done.filter(Boolean).length
  const target = Math.round((finished / active.length) * BLOCKS)

  // Fill one block at a time, so even an instant load reads as progress.
  useEffect(() => {
    if (shown >= target) return
    const tick = setTimeout(() => setShown((s) => s + 1), 70)
    return () => clearTimeout(tick)
  }, [shown, target])

  useEffect(() => {
    if (shown < BLOCKS) return
    const timers = [
      setTimeout(() => setPhase('ready'), 200),
      setTimeout(() => setPhase('fading'), SHOW_READY_MS),
      setTimeout(() => setPhase('gone'), SHOW_READY_MS + 600),
    ]
    return () => timers.forEach(clearTimeout)
  }, [shown])

  if (phase === 'gone') return null

  // The label follows the drawn blocks, so each step gets its moment even on an instant load.
  const current = active[Math.min(active.length - 1, Math.floor((shown / BLOCKS) * active.length))]
  const text = phase === 'loading' ? `${current.label}...` : 'ready ✓'

  return (
    <div className={`load-status${phase !== 'loading' ? ' ready' : ''}${phase === 'fading' ? ' fading' : ''}`} role="status">
      <div className="load-bar" aria-hidden="true">
        {Array.from({ length: BLOCKS }, (_, i) => (
          <span key={i} className={i < shown ? '' : 'empty'} />
        ))}
      </div>
      <span className="load-status-text">{text}</span>
    </div>
  )
}
