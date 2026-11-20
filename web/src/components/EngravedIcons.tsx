export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value || 0)
}

export function groupAwards(awards: string[]): Array<{ name: string; count: number }> {
  const map = new Map<string, number>()
  for (const item of awards || []) {
    const clean = item.trim()
    if (!clean) continue
    map.set(clean, (map.get(clean) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
}

export function CaaCrest({
  serverIcon: _serverIcon,
  size = 64,
}: {
  serverIcon?: string | null
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      aria-label="Custom Adversaries Association Crest"
      className="drop-shadow-[0_3px_10px_rgba(0,0,0,0.65)]"
    >
      <circle cx="40" cy="40" r="36" stroke="#d7b262" strokeWidth="1.6" strokeDasharray="3 2" />
      <circle cx="40" cy="40" r="31" fill="#180708" stroke="#a68037" strokeWidth="1.5" />
      <path
        d="M40 15L58 24V42C58 53 50 61 40 65C30 61 22 53 22 42V24L40 15Z"
        stroke="#d7b262"
        strokeWidth="1.6"
        fill="#240b0d"
      />
      <path
        d="M40 20L53 27V41C53 49 47 56 40 59.5C33 56 27 49 27 41V27L40 20Z"
        stroke="#a68037"
        strokeOpacity="0.55"
        strokeWidth="0.9"
        fill="none"
      />
      <text
        x="40"
        y="44"
        textAnchor="middle"
        fill="#d7b262"
        fontFamily="Cinzel, Georgia, serif"
        fontSize="11"
        fontWeight="700"
        letterSpacing="1.6"
      >
        C.A.A.
      </text>
    </svg>
  )
}

export function BrassCorner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const rotation =
    position === 'tl' ? 0 : position === 'tr' ? 90 : position === 'br' ? 180 : 270
  const posClass =
    position === 'tl'
      ? 'top-0 left-0'
      : position === 'tr'
        ? 'top-0 right-0'
        : position === 'br'
          ? 'bottom-0 right-0'
          : 'bottom-0 left-0'

  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 36 36"
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 ${posClass}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M1 1H32C26 4 21 8 15 15C8 21 4 26 1 32V1Z"
        fill="url(#brassGrad)"
        stroke="#4f3812"
        strokeWidth="1"
      />
      <circle cx="8" cy="8" r="1.6" fill="#4f3812" />
      <circle cx="20" cy="6" r="1.2" fill="#4f3812" />
      <circle cx="6" cy="20" r="1.2" fill="#4f3812" />
      <defs>
        <linearGradient id="brassGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e5c77e" />
          <stop offset="48%" stopColor="#a68037" />
          <stop offset="100%" stopColor="#654917" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function PaperclipSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      width="24"
      height="52"
      viewBox="0 0 24 52"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M16 14V37C16 42 12.5 45.5 8.5 45.5C4.5 45.5 2 42 2 37V11.5C2 5.5 6.5 1.5 11.5 1.5C16.5 1.5 20.5 5.5 20.5 11.5V35.5C20.5 39 18 41.5 14.5 41.5C11.5 41.5 9.5 39 9.5 35.5V15"
        stroke="#443c35"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M15.2 14V37C15.2 41.4 12.1 44.7 8.5 44.7C5 44.7 2.8 41.4 2.8 37V11.5C2.8 6 6.8 2.3 11.5 2.3C16.2 2.3 19.7 6 19.7 11.5V35.5"
        stroke="#c8c0b4"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MedallionSvg({ rank }: { rank: number }) {
  const palette =
    rank === 1
      ? { rim: '#9b711e', fill: '#e6c36e', text: '#3a2505' }
      : rank === 2
        ? { rim: '#6b727a', fill: '#cfd6dd', text: '#1f2429' }
        : { rim: '#7b4927', fill: '#cf8e5f', text: '#2e1607' }

  return (
    <svg width="26" height="26" viewBox="0 0 28 28" aria-label={`Rank ${rank}`}>
      <circle cx="14" cy="14" r="12" fill={palette.fill} stroke={palette.rim} strokeWidth="2" />
      <circle cx="14" cy="14" r="9" fill="none" stroke={palette.rim} strokeWidth="0.8" strokeDasharray="2 1.5" />
      <text
        x="14"
        y="17.8"
        textAnchor="middle"
        fill={palette.text}
        fontFamily="Cinzel, Georgia, serif"
        fontSize="11"
        fontWeight="700"
      >
        {rank}
      </text>
    </svg>
  )
}

export function WaxSealSvg({ size = 84 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="waxGlow" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#b92d2d" />
          <stop offset="52%" stopColor="#861818" />
          <stop offset="100%" stopColor="#4f0b0b" />
        </radialGradient>
      </defs>
      <path
        d="M50 4C60 4 68 9 76 11C84 13 91 21 92 31C93 39 97 46 95 56C93 65 89 72 85 80C80 88 70 92 61 94C52 96 42 96 34 92C25 89 17 84 12 75C7 66 5 57 6 47C7 38 10 29 15 21C21 13 30 9 39 6C43 5 46 4 50 4Z"
        fill="url(#waxGlow)"
        stroke="#3b0606"
        strokeWidth="2"
      />
      <circle cx="50" cy="50" r="30" fill="#741313" stroke="#b93e3e" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="25" fill="none" stroke="#450808" strokeWidth="1.2" />
      <text
        x="50"
        y="55"
        textAnchor="middle"
        fill="#f2d6c4"
        fontFamily="Cinzel, Georgia, serif"
        fontSize="17"
        fontWeight="700"
        letterSpacing="2.5"
      >
        CAA
      </text>
    </svg>
  )
}
