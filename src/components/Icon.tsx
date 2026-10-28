import type { ReactNode } from 'react'

export type IconName = 'computer' | 'document' | 'globe' | 'guestbook' | 'trash' | 'logo' | 'music' | 'column'

// 32x32 pixel-ish icons, drawn with crisp edges so they look like old system icons.
const icons: Record<IconName, ReactNode> = {
  computer: (
    <>
      <rect x="4.5" y="3.5" width="23" height="18" fill="#c0c0c0" stroke="#000" />
      <rect x="7.5" y="6.5" width="17" height="12" fill="#ff71ce" stroke="#404040" />
      <rect x="11" y="9" width="2" height="2" fill="#000" />
      <rect x="19" y="9" width="2" height="2" fill="#000" />
      <rect x="11" y="14" width="1" height="1" fill="#000" />
      <rect x="12" y="15" width="8" height="1" fill="#000" />
      <rect x="20" y="14" width="1" height="1" fill="#000" />
      <rect x="12.5" y="21.5" width="7" height="3" fill="#a0a0a0" stroke="#000" />
      <rect x="5.5" y="24.5" width="21" height="4" fill="#c0c0c0" stroke="#000" />
      <rect x="20" y="26" width="4" height="1" fill="#05ffa1" />
    </>
  ),
  column: (
    <>
      <rect x="5.5" y="3.5" width="21" height="3" fill="#f4eef2" stroke="#000" />
      <rect x="7.5" y="6.5" width="17" height="2" fill="#dcd2e0" stroke="#000" />
      <rect x="9.5" y="8.5" width="13" height="16" fill="#f4eef2" stroke="#000" />
      <path d="M13 9v15M16 9v15M19 9v15" stroke="#b9a7c9" />
      <rect x="7.5" y="24.5" width="17" height="2" fill="#dcd2e0" stroke="#000" />
      <rect x="5.5" y="26.5" width="21" height="3" fill="#ff71ce" stroke="#000" />
    </>
  ),
  document: (
    <>
      <path d="M7.5 3.5h13l5 5v20h-18z" fill="#fff" stroke="#000" />
      <path d="M20.5 3.5v5h5" fill="#dfdfdf" stroke="#000" />
      <rect x="10" y="12" width="12" height="2" fill="#01cdfe" />
      <rect x="10" y="16" width="12" height="2" fill="#ff71ce" />
      <rect x="10" y="20" width="9" height="2" fill="#b967ff" />
    </>
  ),
  globe: (
    <>
      <circle cx="16" cy="16" r="12.5" fill="#01cdfe" stroke="#000" />
      <path d="M9 9h5v3h3v4h-4v5h-3v-4H8z" fill="#05ffa1" />
      <path d="M19 19h5v3h-3v3h-3z" fill="#05ffa1" />
      <ellipse cx="16" cy="16" rx="5.5" ry="12.5" fill="none" stroke="#004a5c" />
      <path d="M3.5 16h25" stroke="#004a5c" />
    </>
  ),
  guestbook: (
    <>
      <rect x="6.5" y="3.5" width="20" height="25" fill="#b967ff" stroke="#000" />
      <rect x="7" y="4" width="4" height="24" fill="#7a2fd0" />
      <rect x="13.5" y="8.5" width="10" height="6" fill="#fffb96" stroke="#000" />
      <rect x="15" y="10" width="7" height="1" fill="#000" />
      <rect x="15" y="12" width="5" height="1" fill="#000" />
    </>
  ),
  trash: (
    <>
      <rect x="13.5" y="3.5" width="5" height="2" fill="#c0c0c0" stroke="#000" />
      <rect x="6.5" y="5.5" width="19" height="3" fill="#dfdfdf" stroke="#000" />
      <path d="M8.5 8.5h15l-1.5 20h-12z" fill="#c0c0c0" stroke="#000" />
      <path d="M12.5 11v15M16 11v15M19.5 11v15" stroke="#808080" />
    </>
  ),
  music: (
    <>
      <rect x="2.5" y="2.5" width="27" height="27" fill="#1a0636" stroke="#000" />
      <rect x="11" y="6" width="14" height="3" fill="#ff71ce" />
      <rect x="11" y="6" width="2" height="16" fill="#ff71ce" />
      <rect x="23" y="6" width="2" height="13" fill="#ff71ce" />
      <rect x="6" y="20" width="7" height="5" fill="#01cdfe" />
      <rect x="18" y="17" width="7" height="5" fill="#01cdfe" />
    </>
  ),
  logo: (
    <>
      <rect x="4" y="5" width="11" height="10" fill="#ff71ce" />
      <rect x="17" y="5" width="11" height="10" fill="#05ffa1" />
      <rect x="4" y="17" width="11" height="10" fill="#01cdfe" />
      <rect x="17" y="17" width="11" height="10" fill="#fffb96" />
    </>
  ),
}

export function Icon({ name, size = 32 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}
