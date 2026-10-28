import { useId } from 'react'

// A "pig-faced" bascinet seen three-quarters from the left, snout pointing right,
// in tomb-engraving line art: pointed skull, conical visor with an eye slit and
// breathing holes, a hinge rivet, a mail aventail and hatching for shadow.
// 240×240 box; colours come from CSS (fill / stroke on the svg).
export function Helmet({ className }: { className?: string }) {
  const id = useId()
  const mail = `${id}-mail`
  const skullClip = `${id}-skull`

  const skull = 'M46 178 C30 112 56 40 112 12 C150 28 178 64 184 104 L182 150 Q130 176 46 178 Z'
  const holes: [number, number][] = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5 - row; col++) holes.push([150 + col * 11 + row * 6, 150 + row * 11])
  }

  return (
    <svg className={className} viewBox="0 0 240 240" aria-hidden="true">
      <defs>
        {/* little overlapping rings for the mail */}
        <pattern id={mail} width="9" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 7 Q4.5 -1 9 7" fill="none" />
        </pattern>
        <clipPath id={skullClip}>
          <path d={skull} />
        </clipPath>
      </defs>

      {/* mail aventail hanging from the skull */}
      <path d="M50 168 Q44 206 36 232 L170 232 Q160 204 166 176 Q110 186 50 168 Z" />
      <path d="M50 168 Q44 206 36 232 L170 232 Q160 204 166 176 Q110 186 50 168 Z" fill={`url(#${mail})`} />

      {/* skull */}
      <path d={skull} />
      {/* hatching on the shadowed back of the skull */}
      <g className="hatch" clipPath={`url(#${skullClip})`}>
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={40 + i * 7} y1={30 + i * 3} x2={30 + i * 7} y2={190} />
        ))}
      </g>
      {/* the keel running over the top */}
      <path d="M112 12 Q96 70 92 172" fill="none" />

      {/* conical visor (the "snout") */}
      <path d="M118 92 Q176 88 232 134 Q235 141 228 146 Q182 184 124 198 Q104 150 118 92 Z" />
      {/* a highlight ridge along the snout */}
      <path d="M126 104 Q182 108 226 138" fill="none" className="ridge" />
      {/* eye slit following the curve of the visor */}
      <path d="M132 112 Q172 110 208 126 L205 133 Q170 120 133 121 Z" className="slit" />
      {/* breathing holes */}
      {holes.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={2.6} className="slit" />
      ))}

      {/* hinge rivet on the temple, where the visor pivots */}
      <circle cx="112" cy="128" r="8" />
      <circle cx="112" cy="128" r="2.6" className="slit" />
      {/* rivets along the brow */}
      {[70, 86, 156, 172].map((x) => (
        <circle key={x} cx={x} cy={x < 100 ? 168 : 100 + (x - 156) * 0.4} r={2} />
      ))}
    </svg>
  )
}
