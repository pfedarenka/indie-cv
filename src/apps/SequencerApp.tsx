import { Fragment, useEffect, useRef, useState } from 'react'
import { Engine, type Live } from '../audio/engine'
import { download, renderLoop, toMp3, toWav } from '../audio/export'
import { rack } from '../audio/rack'
import { STEPS, emptyPattern, tracks, type Song } from '../audio/song'
import { useTheme } from '../themes'
import { openApp } from './openApp'

const columns = Array.from({ length: STEPS }, (_, i) => i)

// The track list comes from the current theme; switching themes remounts this app
// (see App.tsx), so it starts fresh with the new theme's first track.
export function SequencerApp() {
  const { songs } = useTheme()
  const [song, setSong] = useState(songs[0])
  const [pattern, setPattern] = useState(song.pattern)
  const [bpm, setBpm] = useState(song.bpm)
  const [rate, setRate] = useState(song.rate)
  const [playing, setPlaying] = useState(false)
  const [exporting, setExporting] = useState<'mp3' | 'wav' | null>(null)
  const [position, setPosition] = useState<number | null>(null)
  const engineRef = useRef<Engine | null>(null)
  const scopeRef = useRef<HTMLCanvasElement>(null)
  // The scheduler reads this on every tick, so edits apply without restarting.
  const live = useRef<Live>({ song, pattern, settings: { bpm, rate } })

  useEffect(() => {
    live.current = { song, pattern, settings: { bpm, rate } }
  }, [song, pattern, bpm, rate])

  // Picking a song (or Reset) loads its notes, starting pattern and tempo.
  function load(next: Song) {
    setSong(next)
    setPattern(next.pattern)
    setBpm(next.bpm)
    setRate(next.rate)
  }

  // Knob turns and re-patched cables in the FX rack window reach the engine live.
  useEffect(() => {
    let cables = rack.get().cables
    return rack.subscribe(() => {
      const engine = engineRef.current
      const state = rack.get()
      if (engine) {
        engine.setFx(state.fx)
        if (state.cables !== cables) engine.setPatch(state.cables)
      }
      cables = state.cables
    })
  }, [])

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
    engineRef.current ??= new Engine(rack.get())
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
  const bar = position === null ? 0 : Math.floor(position / STEPS) % song.chords.length

  // Renders about a minute of the current loop (with the FX rack) and downloads it.
  async function exportLoop(format: 'mp3' | 'wav') {
    setExporting(format)
    try {
      const buffer = await renderLoop(live.current, rack.get())
      const blob = format === 'mp3' ? await toMp3(buffer) : toWav(buffer)
      download(blob, `${song.title.replace(/[^\w\- ]+/g, '').trim() || 'loop'}.${format}`)
    } finally {
      setExporting(null)
    }
  }

  function toggleCell(trackIndex: number, step: number) {
    const on = !pattern[trackIndex][step]
    setPattern(pattern.map((r, i) => (i === trackIndex ? r.map((v, j) => (j === step ? on : v)) : r)))
    if (on && !playing) engine().trigger(trackIndex, song, { bpm, rate }, bar)
  }

  return (
    <div className="seq">
      <label className="seq-song">
        <span>♫ track</span>
        <select
          className="sunken"
          value={song.id}
          onChange={(e) => load(songs.find((s) => s.id === e.target.value)!)}
        >
          {songs.map((s, i) => (
            <option key={s.id} value={s.id}>
              {i + 1}. {s.title}
            </option>
          ))}
        </select>
      </label>

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
            {song.chords.map((chord, i) => (
              <span key={i} title={chord.name} className={playing && i === bar ? 'lit' : ''} />
            ))}
          </div>
          <b>{song.chords[bar].name}</b>
        </div>
        <canvas ref={scopeRef} className="seq-scope sunken" width={160} height={44} />
      </div>

      <div className="seq-grid sunken">
        {tracks.map((track, i) => (
          <Fragment key={track.id}>
            {i > 0 && track.group !== tracks[i - 1].group && <div className="seq-gap" />}
            <span className="seq-label">{track.label(song)}</span>
            {columns.map((step) => (
              <button
                key={step}
                type="button"
                aria-label={`${track.label(song)} step ${step + 1}`}
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

      <div className="seq-footer">
        <span className="muted small">click the blocks — changes play on the next loop ♪</span>
        <span className="seq-export" aria-live="polite">
          {exporting ? (
            <span className="small">rendering {exporting}…</span>
          ) : (
            <>
              <button type="button" className="button" onClick={() => exportLoop('mp3')} title="Download ~1 min as MP3">
                ⬇ mp3
              </button>{' '}
              <button type="button" className="button" onClick={() => exportLoop('wav')} title="Download ~1 min as WAV">
                ⬇ wav
              </button>
            </>
          )}
        </span>
        <span>
          <button type="button" className="button" onClick={() => openApp('rack')}>
            ⚡ FX Rack
          </button>{' '}
          <button type="button" className="button" onClick={() => setPattern(emptyPattern())}>
            Clear
          </button>{' '}
          <button
            type="button"
            className="button"
            onClick={() => load(song)}
          >
            Reset
          </button>
        </span>
      </div>
    </div>
  )
}
