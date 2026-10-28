import * as THREE from 'three'
import heliosUrl from '../assets/helios.bin?url'
import {
  COLUMN_HEIGHT,
  bust,
  checkerPyramid,
  column,
  dolphin,
  heliosGeometry,
  knot,
  knotGeometry,
  knotShapes,
  marble,
  wireGlobe,
} from './models'

const HORIZON = -0.2 // NDC y of the wallpaper horizon (the floor starts 60% down)
const GLOBE_COLORS = [0xff71ce, 0x01cdfe, 0x05ffa1, 0xfffb96, 0xb967ff]

// Objects are laid out in normalized screen coords (-1..1) so they stay clear of
// the desktop icons, the title and the centered sequencer at any window size.
type Spinner = {
  obj: THREE.Object3D
  x: number
  y: number
  size: number
  spin: [number, number] // base rad/s around x and y
  boost: number // extra spin from clicks, decays over time
  bounce: number // 1 right after a click, decays to 0
  hover: number // eased 0..1
  mirrorOf?: string // CSS selector of a DOM element to mirror across the center line
  onClick?: () => void
}

type Dolphin = {
  obj: THREE.Object3D
  side: 1 | -1 // right or left half of the screen
  roll: number // barrel-roll progress 0..1 (on hover), -1 when idle
  flip: number // backflip progress 0..1 (on click), -1 when idle
}

type Options = {
  // Whether a pointer event hit bare wallpaper (not a window, icon or taskbar).
  isBackground: (target: EventTarget | null) => boolean
  // Element whose cursor shows that an object is clickable.
  cursorHost: HTMLElement
}

let audio: AudioContext | null = null

// A quick dolphin-ish squeak: two fast upward sine chirps.
function squeak() {
  audio ??= new AudioContext()
  void audio.resume()
  for (const delay of [0, 0.14]) {
    const t = audio.currentTime + delay
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.setValueAtTime(1300, t)
    osc.frequency.exponentialRampToValueAtTime(3400, t + 0.07)
    osc.frequency.exponentialRampToValueAtTime(2000, t + 0.13)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14)
    osc.connect(gain).connect(audio.destination)
    osc.start(t)
    osc.stop(t + 0.16)
  }
}

const ease = (p: number) => 0.5 - Math.cos(Math.PI * p) / 2

export function startScene(canvas: HTMLCanvasElement, { isBackground, cursorHost }: Options) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
  camera.position.z = 10
  const halfH = Math.tan(THREE.MathUtils.degToRad(20)) * camera.position.z
  let halfW = halfH

  const spinner = (obj: THREE.Object3D, x: number, y: number, size: number, spin: [number, number]): Spinner => ({
    obj,
    x,
    y,
    size,
    spin,
    boost: 0,
    bounce: 0,
    hover: 0,
  })

  const knotMesh = knot()
  const globe = wireGlobe()
  let knotIndex = 0
  let globeColor = 0

  // Mirrored around the vertical center line: knot ↔ globe, and a row of five pyramids
  // on the floor, biggest in the middle, spinning in opposite directions on each side.
  const spinners: Spinner[] = [
    spinner(knotMesh, -0.68, 0.52, 0.12, [0.4, 0.7]),
    spinner(globe, 0.68, 0.52, 0.12, [0.25, 0.5]),
    spinner(checkerPyramid(), 0, -0.81, 0.11, [0, 0.6]),
    ...([-1, 1] as const).flatMap((side) => [
      spinner(checkerPyramid(), 0.19 * side, -0.83, 0.085, [0, 0.8 * side]),
      spinner(checkerPyramid(), 0.35 * side, -0.85, 0.065, [0, 1.0 * side]),
    ]),
  ]
  spinners[0].onClick = () => {
    knotIndex = (knotIndex + 1) % knotShapes.length
    knotMesh.geometry.dispose()
    knotMesh.geometry = knotGeometry(knotShapes[knotIndex])
  }
  spinners[1].onClick = () => {
    globeColor = (globeColor + 1) % GLOBE_COLORS.length
    ;(globe.material as THREE.LineBasicMaterial).color.setHex(GLOBE_COLORS[globeColor])
  }
  for (const s of spinners) scene.add(s.obj)

  // Neon rim lights for the marble bust (the other models ignore lighting).
  scene.add(new THREE.AmbientLight(0x6a4c93, 1.2))
  const pink = new THREE.DirectionalLight(0xff4fd8, 2.6)
  pink.position.set(-6, 2, 4)
  const cyan = new THREE.DirectionalLight(0x22e0ff, 2.4)
  cyan.position.set(6, 1, 3)
  scene.add(pink, cyan)

  // A pair of marble columns framing the screen, set back a little so the dolphins pass in front.
  const COLUMN_Z = -1.5
  const columns = ([-1, 1] as const).map((side) => {
    const obj = column()
    scene.add(obj)
    return { obj, side }
  })

  // The Helios bust loads in the background; clicking it cycles marble → iridescent → wireframe.
  let disposed = false
  const bustLooks = [
    () => marble(),
    () => new THREE.MeshNormalMaterial(),
    () => new THREE.MeshBasicMaterial({ color: 0x05ffa1, wireframe: true }),
  ]
  void heliosGeometry(heliosUrl).then((geometry) => {
    if (disposed) return geometry.dispose()
    const mesh = bust(geometry)
    let look = 0
    const s = spinner(mesh, 0.625, -0.48, 0.4, [0, 0.35])
    s.mirrorOf = '.portrait'
    s.onClick = () => {
      look = (look + 1) % bustLooks.length
      mesh.material.dispose()
      mesh.material = bustLooks[look]()
    }
    spinners.push(s)
    scene.add(mesh)
    layout()
  })

  // Two dolphins leaping in sync, mirrored: each one jumps from the center out to its side.
  const dolphins: Dolphin[] = ([1, -1] as const).map((side) => {
    const obj = dolphin()
    scene.add(obj)
    return { obj, side, roll: -1, flip: -1 }
  })

  function layout() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    halfW = halfH * camera.aspect

    // Columns stand on the taskbar line and reach just under the top edge, centered on
    // the screen edges (so about half of each is visible).
    const depth = (camera.position.z - COLUMN_Z) / camera.position.z
    const taskbar = (36 / h) * 2
    const columnScale = ((2 - taskbar - 0.03) * halfH * depth) / COLUMN_HEIGHT
    for (const c of columns) {
      c.obj.scale.setScalar(columnScale)
      c.obj.position.set(c.side * halfW * depth, (-1 + taskbar) * halfH * depth, COLUMN_Z)
    }

    for (const s of spinners) {
      // Mirror an HTML element (the portrait sticker) so both sides stay balanced at any size.
      const rect = s.mirrorOf ? document.querySelector(s.mirrorOf)?.getBoundingClientRect() : undefined
      if (rect && rect.width) {
        // A bit shorter than the portrait, so the head stays below the dolphins' arc.
        const height = (rect.height / h) * 2 * 0.78
        s.size = height / 2
        s.x = -(((rect.left + rect.width / 2) / w) * 2 - 1)
        s.y = -((rect.bottom / h) * 2 - 1) + s.size
      }
      s.obj.position.set(s.x * halfW, s.y * halfH, 0)
    }
  }

  const observer = new ResizeObserver(layout)
  observer.observe(canvas)
  layout()

  // ── pointer picking ──
  const raycaster = new THREE.Raycaster()
  raycaster.params.Line = { threshold: 0.08 }
  const pointer = new THREE.Vector2()
  let hovered: THREE.Object3D | null = null

  function pick(e: PointerEvent | MouseEvent): THREE.Object3D | null {
    if (!isBackground(e.target)) return null
    const rect = canvas.getBoundingClientRect()
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    const roots = [...spinners.map((s) => s.obj), ...dolphins.map((d) => d.obj)]
    const hit = raycaster.intersectObjects(roots, true)[0]
    let obj: THREE.Object3D | null = hit?.object ?? null
    while (obj && !roots.includes(obj)) obj = obj.parent
    return obj
  }

  function onMove(e: PointerEvent) {
    const next = pick(e)
    if (next !== hovered) {
      const d = dolphins.find((x) => x.obj === next)
      if (d && d.roll < 0) d.roll = 0
    }
    hovered = next
    cursorHost.style.cursor = hovered ? 'pointer' : ''
  }

  function onClick(e: MouseEvent) {
    const target = pick(e)
    if (!target) return
    const d = dolphins.find((x) => x.obj === target)
    if (d) {
      if (d.flip < 0) d.flip = 0
      squeak()
      return
    }
    const s = spinners.find((x) => x.obj === target)
    if (s) {
      s.boost += 9
      s.bounce = 1
      s.onClick?.()
    }
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('click', onClick)

  // ── animation ──
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const clock = new THREE.Clock()
  let t = 2 // auto-motion time; frozen when the user prefers reduced motion
  let frame = 0

  function render() {
    const dt = Math.min(clock.getDelta(), 0.1)
    if (!still) t += dt

    for (const s of spinners) {
      const speed = still ? 0 : 1
      // Models that only turn around y (pyramid, bust) stay upright when clicked.
      if (s.spin[0]) s.obj.rotation.x += dt * (s.spin[0] * speed + s.boost * 0.4)
      s.obj.rotation.y += dt * (s.spin[1] * speed + s.boost)
      s.boost *= Math.exp(-dt * 1.5)
      s.bounce = Math.max(0, s.bounce - dt * 2.5)
      s.hover += ((s.obj === hovered ? 1 : 0) - s.hover) * Math.min(1, dt * 10)
      const pop = Math.sin(s.bounce * Math.PI) * 0.35
      s.obj.scale.setScalar(s.size * halfH * (1 + s.hover * 0.15 + pop))
    }

    // Each dolphin arcs from the center out to its edge, above the bust / portrait and
    // below the knot / globe, nose along the path.
    const period = 5
    const [x0, x1, jump] = [0.42, 1.0, 0.24]
    for (const d of dolphins) {
      const p = (t / period) % 1
      const x = (x0 + (x1 - x0) * p) * halfW * d.side
      const y = (HORIZON + 0.08 + jump * Math.sin(Math.PI * p)) * halfH
      const slope = (jump * Math.PI * Math.cos(Math.PI * p) * halfH) / ((x1 - x0) * halfW)

      if (d.roll >= 0) d.roll = d.roll + dt / 0.7 >= 1 ? -1 : d.roll + dt / 0.7
      if (d.flip >= 0) d.flip = d.flip + dt / 0.9 >= 1 ? -1 : d.flip + dt / 0.9
      const roll = d.roll >= 0 ? ease(d.roll) * Math.PI * 2 : 0
      const flip = d.flip >= 0 ? ease(d.flip) * Math.PI * 2 : 0

      d.obj.position.set(x, y + (d.flip >= 0 ? Math.sin(d.flip * Math.PI) * 0.15 * halfH : 0), 0)
      // rotation.y = π turns the left dolphin around, so the same pitch mirrors its path.
      d.obj.rotation.set(Math.sin(t * 1.3) * 0.35 + roll, d.side < 0 ? Math.PI : 0, Math.atan(slope) + flip)
      // Grow in and shrink out at the ends of the jump, like diving in and out.
      const fade = Math.min(1, Math.sin(Math.PI * p) * 3)
      const big = d.obj === hovered ? 1.15 : 1
      d.obj.scale.setScalar(0.13 * halfH * fade * big)
    }

    renderer.render(scene, camera)
    frame = requestAnimationFrame(render)
  }
  render()

  return () => {
    disposed = true
    cancelAnimationFrame(frame)
    observer.disconnect()
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('click', onClick)
    cursorHost.style.cursor = ''
    renderer.dispose()
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
        obj.geometry.dispose()
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        materials.forEach((m: THREE.Material) => m.dispose())
      }
    })
  }
}
