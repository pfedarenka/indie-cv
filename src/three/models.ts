import * as THREE from 'three'

// Procedural low-poly models, so the site ships no model files.

const iridescent = () => new THREE.MeshNormalMaterial({ flatShading: true })

function withEdges(mesh: THREE.Mesh, color: number, opacity = 0.7) {
  const lines = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 20),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  )
  mesh.add(lines)
  return mesh
}

function flatShape(points: [number, number][], depth = 0.05) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
  geometry.translate(0, 0, -depth / 2)
  return geometry
}

// A dolphin about 4 units long, nose pointing to +X, centered at the origin.
export function dolphin() {
  const group = new THREE.Group()
  const material = iridescent()

  // Body: a lathe profile (radius along the spine, tail at y=0, nose at y=4).
  const profile: [number, number][] = [
    [0.02, 0], [0.12, 0.3], [0.26, 0.8], [0.45, 1.5], [0.55, 2.2], [0.5, 2.8],
    [0.38, 3.2], [0.3, 3.45], [0.14, 3.58], [0.08, 3.9], [0, 4],
  ]
  const body = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    9,
  )
  body.rotateZ(-Math.PI / 2)
  body.translate(-2, 0, 0)
  body.scale(1, 1, 0.8)
  group.add(withEdges(new THREE.Mesh(body, material), 0x01cdfe))

  const dorsal = new THREE.Mesh(flatShape([[-0.45, 0], [0.4, 0], [-0.35, 0.6]]), material)
  dorsal.position.set(0.1, 0.48, 0)
  group.add(withEdges(dorsal, 0x01cdfe))

  const flukes = new THREE.Mesh(
    flatShape([[0, 0], [-0.55, 0.65], [-0.38, 0], [-0.55, -0.65]]),
    material,
  )
  flukes.rotation.x = Math.PI / 2
  flukes.position.set(-1.9, 0, 0)
  group.add(withEdges(flukes, 0x01cdfe))

  for (const side of [1, -1]) {
    const fin = new THREE.Mesh(flatShape([[0, 0], [-0.5, -0.1], [-0.35, -0.45]]), material)
    fin.position.set(1.05, -0.25, 0.38 * side)
    fin.rotation.x = 0.6 * side
    group.add(withEdges(fin, 0x01cdfe))
  }

  return group
}

// Bust of Alexander the Great as Helios: a 3D scan of plaster cast KAS283 from
// SMK – National Gallery of Denmark (public domain), simplified to 30k triangles
// and stored as [u32 vertexCount][u32 indexCount][f32 min xyz][f32 max xyz][u16 xyz…][u16 indices…].
export async function heliosGeometry(url: string) {
  const data = await fetch(url).then((r) => r.arrayBuffer())
  const view = new DataView(data)
  const vertexCount = view.getUint32(0, true)
  const indexCount = view.getUint32(4, true)
  const min = [0, 1, 2].map((i) => view.getFloat32(8 + i * 4, true))
  const max = [0, 1, 2].map((i) => view.getFloat32(20 + i * 4, true))
  const quantized = new Uint16Array(data, 32, vertexCount * 3)
  const positions = new Float32Array(vertexCount * 3)
  for (let i = 0; i < positions.length; i++) {
    const axis = i % 3
    positions[i] = min[axis] + (quantized[i] / 65535) * (max[axis] - min[axis])
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(data, 32 + vertexCount * 6, indexCount), 1))
  geometry.rotateX(-Math.PI / 2) // the scan is Z-up
  geometry.center()
  geometry.computeBoundingBox()
  const height = geometry.boundingBox!.max.y - geometry.boundingBox!.min.y
  geometry.scale(2 / height, 2 / height, 2 / height) // 2 units tall, like the other models
  geometry.computeVertexNormals()
  return geometry
}

export const marble = () => new THREE.MeshStandardMaterial({ color: 0xf4eef2, roughness: 0.6, metalness: 0.05 })

export function bust(geometry: THREE.BufferGeometry) {
  return new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(geometry, marble())
}

// A classical column: Attic base, fluted shaft with entasis, Doric capital.
// Shaft radius 1 at the bottom; total height COLUMN_HEIGHT, standing on y = 0.
export const COLUMN_HEIGHT = 20

export function column() {
  const group = new THREE.Group()
  const material = marble()
  const add = (geometry: THREE.BufferGeometry, y: number) => {
    geometry.translate(0, y, 0)
    group.add(new THREE.Mesh(geometry, material))
  }

  // Base: square plinth, then lower torus, scotia (the hollow) and upper torus.
  add(new THREE.BoxGeometry(2.9, 0.5, 2.9), 0.25)
  add(
    new THREE.LatheGeometry(
      [
        [1.4, 0], [1.42, 0.2], [1.38, 0.38], [1.2, 0.45], [1.12, 0.6], [1.16, 0.75],
        [1.2, 0.85], [1.16, 0.97], [1.02, 1.0],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      48,
    ),
    0.5,
  )

  // Shaft: 20 concave flutes meeting at sharp arrises, gently tapering (entasis).
  const shaftH = 16.5
  const shaft = new THREE.CylinderGeometry(1, 1, shaftH, 160, 24, true)
  const p = shaft.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const t = y / shaftH + 0.5 // 0 at the bottom, 1 at the top
    const taper = 1 - 0.18 * t ** 1.6 + 0.02 * Math.sin(Math.PI * t)
    const angle = Math.atan2(z, x)
    const frac = (((angle / (Math.PI * 2)) * 20) % 1 + 1) % 1
    const r = taper * (1 - 0.07 * Math.sin(Math.PI * frac))
    p.setXYZ(i, Math.cos(angle) * r, y, Math.sin(angle) * r)
  }
  shaft.computeVertexNormals()
  add(shaft, 1.5 + shaftH / 2)

  // Capital: necking ring, flaring echinus and a square abacus slab.
  const top = 1.5 + shaftH
  add(
    new THREE.LatheGeometry(
      [[0.84, 0], [0.9, 0.08], [0.86, 0.16], [0.9, 0.3], [1.15, 0.6], [1.34, 0.85], [1.38, 1.0]].map(
        ([r, y]) => new THREE.Vector2(r, y),
      ),
      48,
    ),
    top,
  )
  add(new THREE.BoxGeometry(2.9, 0.6, 2.9), top + 1.0 + 0.3)

  return group
}

// (p, q) winding pairs; clicking the knot cycles through them.
export const knotShapes: [number, number][] = [
  [2, 3],
  [3, 4],
  [2, 5],
  [3, 5],
  [1, 4],
  [4, 5],
]

export const knotGeometry = ([p, q]: [number, number]) => new THREE.TorusKnotGeometry(1, 0.3, 128, 10, p, q)

export function knot() {
  return new THREE.Mesh(knotGeometry(knotShapes[0]), iridescent())
}

export function wireGlobe() {
  const outer = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1, 1)),
    new THREE.LineBasicMaterial({ color: 0xff71ce }),
  )
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), iridescent())
  outer.add(core)
  return outer
}

export function checkerPyramid() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')!
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      g.fillStyle = (x + y) % 2 ? '#ffffff' : '#111111'
      g.fillRect(x * 8, y * 8, 8, 8)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace
  const pyramid = new THREE.Mesh(
    new THREE.ConeGeometry(1, 1.4, 4),
    new THREE.MeshBasicMaterial({ map: texture }),
  )
  return withEdges(pyramid, 0xff71ce, 1)
}
