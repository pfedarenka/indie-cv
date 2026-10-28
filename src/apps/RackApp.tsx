import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { DEFAULT_CABLES, DEFAULT_FX, MODULES, canPlug, plug, rack, useRack, type Cable, type ModuleId } from '../audio/rack'

type Point = { x: number; y: number }
type JackKey = `${ModuleId}:${'in' | 'out'}`

const CABLE_COLORS = ['#ff71ce', '#01cdfe', '#05ffa1', '#fffb96', '#b967ff', '#ff9e5e']

// Each cable keeps its color while it exists: pick it from the pair of modules it joins.
const cableColor = ({ from, to }: Cable) =>
  CABLE_COLORS[(MODULES.findIndex((m) => m.id === from) * 3 + MODULES.findIndex((m) => m.id === to)) % CABLE_COLORS.length]

// A drooping patch cable between two jacks.
function cablePath(a: Point, b: Point) {
  const sag = Math.min(90, 30 + Math.hypot(b.x - a.x, b.y - a.y) * 0.25)
  const dx = Math.max(30, Math.abs(b.x - a.x) * 0.35)
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y + sag}, ${b.x - dx} ${b.y + sag}, ${b.x} ${b.y}`
}

export function RackApp() {
  const { fx, cables } = useRack()
  const boardRef = useRef<HTMLDivElement>(null)
  const jackEls = useRef(new Map<JackKey, HTMLElement>())
  const [jacks, setJacks] = useState(new Map<JackKey, Point>())
  // The cable in hand: where it starts, where the pointer is, and the input under it.
  const [drag, setDrag] = useState<{ from: ModuleId; to: Point; over?: ModuleId } | null>(null)

  // Jack centers in board coordinates; re-measured whenever the board resizes
  // (the observer also fires once right away).
  useLayoutEffect(() => {
    const board = boardRef.current!
    const observer = new ResizeObserver(() => {
      const b = board.getBoundingClientRect()
      const next = new Map<JackKey, Point>()
      jackEls.current.forEach((el, key) => {
        const r = el.getBoundingClientRect()
        next.set(key, { x: r.left + r.width / 2 - b.left + board.scrollLeft, y: r.top + r.height / 2 - b.top + board.scrollTop })
      })
      setJacks(next)
    })
    observer.observe(board)
    return () => observer.disconnect()
  }, [])

  const jackRef = (key: JackKey) => (el: HTMLElement | null) => {
    if (el) jackEls.current.set(key, el)
    else jackEls.current.delete(key)
  }

  function toBoard(e: PointerEvent) {
    const board = boardRef.current!
    const b = board.getBoundingClientRect()
    return { x: e.clientX - b.left + board.scrollLeft, y: e.clientY - b.top + board.scrollTop }
  }

  // The input jack under the pointer, if any.
  function inputAt(e: PointerEvent) {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-jack-in]')
    return el?.dataset.jackIn as ModuleId | undefined
  }

  function startCable(e: PointerEvent, from: ModuleId) {
    e.preventDefault()
    try {
      boardRef.current!.setPointerCapture(e.pointerId)
    } catch {
      // pointer already gone (e.g. a quick tap): the drag still works while it is over the board
    }
    setDrag({ from, to: toBoard(e) })
  }

  // Grabbing a plugged input pulls its cable out and keeps it in hand to re-plug.
  function pullCable(e: PointerEvent, to: ModuleId) {
    const cable = cables.find((c) => c.to === to)
    if (!cable) return
    rack.set({ cables: cables.filter((c) => c !== cable) })
    startCable(e, cable.from)
  }

  function moveCable(e: PointerEvent) {
    if (drag) setDrag({ ...drag, to: toBoard(e), over: inputAt(e) })
  }

  function dropCable(e: PointerEvent) {
    if (!drag) return
    const to = inputAt(e)
    if (to && canPlug(cables, drag.from, to)) rack.set({ cables: plug(cables, drag.from, to) })
    setDrag(null)
  }

  // While a cable is in hand, inputs light up as possible targets or dim as blocked.
  const jackState = (id: ModuleId) => {
    if (!drag) return ''
    if (!canPlug(cables, drag.from, id)) return ' blocked'
    return drag.over === id ? ' target hover' : ' target'
  }
  const overValid = drag?.over !== undefined && canPlug(cables, drag.from, drag.over)

  const unplug = (cable: Cable) => rack.set({ cables: cables.filter((c) => c !== cable) })
  const plugged = (key: JackKey) => cables.some((c) => `${c.from}:out` === key || `${c.to}:in` === key)

  return (
    <div className="rack">
      <div
        ref={boardRef}
        className={`rack-board sunken${drag ? ' patching' : ''}`}
        onPointerMove={moveCable}
        onPointerUp={dropCable}
        onPointerCancel={() => setDrag(null)}
      >
        {MODULES.map((m) => (
          <div key={m.id} className={`rack-module rack-${m.id}`}>
            <b className="rack-module-title">{m.label}</b>
            <span className="rack-module-hint">{m.hint}</span>
            {m.knob && (
              <label className="rack-knob">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={fx[m.knob]}
                  aria-label={`${m.label} amount`}
                  onChange={(e) => rack.set({ fx: { ...fx, [m.knob!]: +e.target.value } })}
                />
                <span>{Math.round(fx[m.knob] * 100)}</span>
              </label>
            )}
            {m.hasIn && (
              <span
                ref={jackRef(`${m.id}:in`)}
                data-jack-in={m.id}
                className={`jack in${plugged(`${m.id}:in`) ? ' plugged' : ''}${jackState(m.id)}`}
                title={plugged(`${m.id}:in`) ? 'input: drag to pull the cable out' : 'input'}
                onPointerDown={(e) => pullCable(e, m.id)}
              />
            )}
            {m.hasOut && (
              <button
                type="button"
                ref={jackRef(`${m.id}:out`)}
                className={`jack out${plugged(`${m.id}:out`) ? ' plugged' : ''}`}
                aria-label={`${m.label} output: drag a cable to an input`}
                title="output: drag to an input"
                onPointerDown={(e) => startCable(e, m.id)}
              />
            )}
          </div>
        ))}

        <svg className="rack-cables" aria-hidden="true">
          {cables.map((c) => {
            const a = jacks.get(`${c.from}:out`)
            const b = jacks.get(`${c.to}:in`)
            if (!a || !b) return null
            const d = cablePath(a, b)
            return (
              <g key={`${c.from}-${c.to}`}>
                <path d={d} className="cable" stroke={cableColor(c)} />
                <path d={d} className="cable-hit" onClick={() => unplug(c)}>
                  <title>click to unplug</title>
                </path>
              </g>
            )
          })}
          {drag && jacks.get(`${drag.from}:out`) && (
            <path
              d={cablePath(jacks.get(`${drag.from}:out`)!, drag.to)}
              className="cable dragging"
              stroke={overValid ? '#05ffa1' : '#fff'}
            />
          )}
        </svg>
      </div>

      <div className="rack-footer">
        <span className="muted small">
          drag from an output ● to an input ○ · busy inputs get replaced · click a cable to unplug
        </span>
        <span>
          <button type="button" className="button" onClick={() => rack.set({ cables: [] })}>
            Unplug all
          </button>{' '}
          <button type="button" className="button" onClick={() => rack.set({ cables: DEFAULT_CABLES, fx: DEFAULT_FX })}>
            Default patch
          </button>
        </span>
      </div>
    </div>
  )
}
