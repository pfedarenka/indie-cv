// A tall line-art longsword, point down, like the swords carved on old tomb slabs.
// Drawn in a 60×600 box and stretched to the screen height by CSS.
export function Sword({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {/* pommel */}
      <circle cx="30" cy="16" r="10" />
      <circle cx="30" cy="16" r="3.5" />
      {/* grip, wrapped */}
      <rect x="25" y="26" width="10" height="78" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1="25" y1={32 + i * 8} x2="35" y2={36 + i * 8} />
      ))}
      {/* crossguard with drooping quillons */}
      <path d="M2 116 Q8 104 18 108 L42 108 Q52 104 58 116 Q50 114 42 118 L18 118 Q10 114 2 116 Z" />
      <circle cx="30" cy="113" r="4" />
      {/* blade with a fuller down the middle */}
      <path d="M21 118 L39 118 L37 520 L30 592 L23 520 Z" />
      <line x1="30" y1="126" x2="30" y2="500" />
      {/* a glint that runs down the blade when the sword rings (animated in CSS) */}
      <rect className="glint" x="22" y="118" width="16" height="60" />
    </svg>
  )
}
