import { Fragment, useEffect, useRef, useState } from 'react'
import { DEFAULT_FX, Engine, type Fx, type Live } from '../audio/engine'
import { STEPS, chords, defaultPattern, emptyPattern, tracks } from '../audio/song'

const columns = Array.from({ length: STEPS }, (_, i) => i)
const DEFAULT_BPM = 72
const DEFAULT_RATE = 0.72
const FX_KNOBS: { key: keyof Fx; label: string }[] = [
  { key: 'filter', label: 'filter' },
  { key: 'echo', label: 'echo' },
  { key: 'space', label: 'space' },
  { key: 'wobble', label: 'wobble' },
]

export function SequencerApp() {
  const [pattern, setPattern] = useState(defaultPattern)
  const [bpm, setBpm] = useState(DEFAULT_BPM)
  const [rate, setRate] = useState(DEFAULT_RATE)
  const [fx, setFx] = useState(DEFAULT_FX)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState<number | null>(null)
  const engineRef = useRef<Engine | null>(null)
  const scopeRef = useRef<HTMLCanvasElement>(null)
  // The scheduler reads this on every tick, so edits apply without restarting.
  const live = useRef<Live>({ pattern, settings: { bpm, rate } })

  useEffect(() => {
    live.current = { pattern, settings: { bpm, rate } }
  }, [pattern, bpm, rate])

  useEffect(() => {
    engineRef.current?.setFx(fx)
  }, [fx])

  // Closing the window unmounts the app: stop the music and free the audio device.
  useEffect(() => () => engineRef.current?.dispose(), [])

  useEffect(() => {
    if (!playing) return
    const engine = engineRef.current!
    const canvas = scopeRef.current
    const g = canvas?.getContext('2d')
    const wave = new Uint8Array(engine.analyser.fftSize)
    let frame = 0
    const draw = () => {
      setPosition(engine.currentStep())
      if (canvas && g) {
        engine.analyser.getByteTimeDomainData(wave)
        g.clearRect(0, 0, canvas.width, canvas.height)
        g.strokeStyle = '#05ffa1'
        g.lineWidth = 2
        g.beginPath()
        wave.forEach((v, i) => {
          const x = (i / wave.length) * canvas.width
          const y = (v / 255) * canvas.height
          if (i) g.lineTo(x, y)
          else g.moveTo(x, y)
        })
        g.stroke()
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  function engine() {
    engineRef.current ??= new Engine(fx)
    return engineRef.current
  }

  function togglePlay() {
    if (playing) {
      engine().stop()
      setPosition(null)
    } else {
      engine().play(() => live.current)
    }
    setPlaying(!playing)
  }

  const col = position === null ? null : position % STEPS
  const bar = position === null ? 0 : Math.floor(position / STEPS) % chords.length

  function toggleCell(trackIndex: number, step: number) {
    const on = !pattern[trackIndex][step]
    setPattern(pattern.map((r, i) => (i === trackIndex ? r.map((v, j) => (j === step ? on : v)) : r)))
    if (on && !playing) engine().trigger(trackIndex, { bpm, rate }, bar)
  }

  return (
    <div className="seq">
      <div className="seq-transport">
        <button type="button" className={`button seq-play${playing ? ' pressed' : ''}`} onClick={togglePlay}>
          {playing ? '■ Stop' : '▶ Play'}
        </button>
        <label className="seq-knob">
          <span>tempo {bpm}</span>
          <input type="range" min={60} max={120} value={bpm} onChange={(e) => setBpm(+e.target.value)} />
        </label>
        <label className="seq-knob">
          <span>slowed ×{rate.toFixed(2)}</span>
          <input
            type="range"
            min={0.5}
            max={1}
            step={0.01}
            value={rate}
            onChange={(e) => setRate(+e.target.value)}
          />
        </label>
        <div className="seq-lcd sunken">
          <div className="seq-bars">
            {chords.map((chord, i) => (
              <span key={chord.name} className={playing && i === bar ? 'lit' : ''} />
            ))}
          </div>
          <b>{chords[bar].name}</b>
        </div>
        <canvas ref={scopeRef} className="seq-scope sunken" width={160} height={44} />
      </div>

      <div className="seq-grid sunken">
        {tracks.map((track, i) => (
          <Fragment key={track.id}>
            {i > 0 && track.group !== tracks[i - 1].group && <div className="seq-gap" />}
            <span className="seq-label">{track.label}</span>
            {columns.map((step) => (
              <button
                key={step}
                type="button"
                aria-label={`${track.label} step ${step + 1}`}
                aria-pressed={pattern[i][step]}
                className={[
                  'seq-cell',
                  track.group,
                  pattern[i][step] && 'on',
                  step % 4 === 0 && 'beat',
                  step === col && 'head',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => toggleCell(i, step)}
              />
            ))}
          </Fragment>
        ))}
      </div>

      <fieldset className="group seq-fx">
        <legend>FX</legend>
        {FX_KNOBS.map(({ key, label }) => (
          <label key={key} className="seq-knob">
            <span>
              {label} {Math.round(fx[key] * 100)}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={fx[key]}
              onChange={(e) => setFx({ ...fx, [key]: +e.target.value })}
            />
          </label>
        ))}
      </fieldset>

      <div className="seq-footer">
        <span className="muted small">click the blocks — changes play on the next loop ♪</span>
        <span>
          <button type="button" className="button" onClick={() => setPattern(emptyPattern())}>
            Clear
          </button>{' '}
          <button
            type="button"
            className="button"
            onClick={() => {
              setPattern(defaultPattern)
              setBpm(DEFAULT_BPM)
              setRate(DEFAULT_RATE)
              setFx(DEFAULT_FX)
            }}
          >
            Reset
          </button>
        </span>
      </div>
    </div>
  )
}
