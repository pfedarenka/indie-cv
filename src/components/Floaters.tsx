import { useEffect, useRef } from 'react'

// Spinning 3D bits over the wallpaper. three.js is loaded lazily in its own chunk
// so the desktop shows up first; on phones the windows cover everything anyway.
export function Floaters() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.innerWidth < 640) return
    let stop: (() => void) | undefined
    let cancelled = false
    import('../three/scene').then(({ startScene }) => {
      const desktop = document.querySelector<HTMLElement>('.desktop')
      if (cancelled || !canvasRef.current || !desktop) return
      // The canvas sits under the desktop layer, so clicks are picked up from the
      // desktop itself, but only where they land on bare wallpaper.
      stop = startScene(canvasRef.current, {
        cursorHost: desktop,
        isBackground: (target) =>
          target instanceof Element && !target.closest('.window, .desktop-icon, .portrait, .taskbar'),
      })
    })
    return () => {
      cancelled = true
      stop?.()
    }
  }, [])

  return <canvas ref={canvasRef} className="floaters" aria-hidden="true" />
}
