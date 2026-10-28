// A crusader's great helm in the same tomb-engraving line art as the swords:
// barrel shape, two eye slits split by a nasal band, a cross of breathing holes
// and hatching for shadow. 200×220 box; colours come from CSS (fill / stroke).
export function Helmet({ className }: { className?: string }) {
  const holes: [number, number][] = []
  // a cross of breathing holes on each cheek
  for (const cx of [62, 138]) {
    for (const dy of [-12, 0, 12]) holes.push([cx, 160 + dy])
    for (const dx of [-12, 12]) holes.push([cx + dx, 160])
  }

  return (
    <svg className={className} viewBox="0 0 200 220" aria-hidden="true">
      {/* shell */}
      <path d="M30 204 L30 84 Q30 18 100 16 Q170 18 170 84 L170 204 Q100 218 30 204 Z" />
      {/* hatching on the shadow side */}
      <g className="hatch">
        {Array.from({ length: 6 }, (_, i) => (
          <line key={i} x1={38 + i * 5} y1={120} x2={38 + i * 5} y2={198} />
        ))}
      </g>
      {/* brow band */}
      <path d="M30 88 Q100 78 170 88 L170 100 Q100 90 30 100 Z" />
      {/* eye slits */}
      <path d="M38 106 L90 104 L90 114 L38 116 Z" className="slit" />
      <path d="M110 104 L162 106 L162 116 L110 114 Z" className="slit" />
      {/* nasal band, running from the crown to the chin */}
      <path d="M93 18 L107 18 L107 214 L93 214 Z" />
      {/* rivets */}
      {[40, 60, 140, 160].map((x) => (
        <circle key={x} cx={x} cy={94} r={2.2} />
      ))}
      {[40, 70, 130, 160].map((y) => (
        <circle key={y} cx={100} cy={y < 100 ? y : y + 40} r={2.2} />
      ))}
      {holes.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={3} className="slit" />
      ))}
    </svg>
  )
}
