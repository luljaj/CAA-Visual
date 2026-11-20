import { useEffect, useState } from 'react'
import { fetchRobloxAvatar } from '../api'
import type { DataSource, RankTier } from '../types'
import { PaperclipSvg } from './EngravedIcons'

const sessionAvatarCache = new Map<string, string | null>()

function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function VintageOperativeIllustration({
  username,
  discordId,
  rankTier,
  sepia,
}: {
  username: string
  discordId: string
  rankTier: RankTier
  sepia: boolean
}) {
  const seed = hashString(`${username}:${discordId}`)
  const hasHat = rankTier === 'leadership' || seed % 3 !== 0
  const hasGlasses = seed % 4 === 1 || rankTier === 'leadership'
  const bgTone = sepia
    ? ['#cbb89d', '#9e886e', '#2a1f16']
    : ['#313a40', '#1d2429', '#111619']
  const coatColor =
    rankTier === 'leadership' ? '#191413' : rankTier === 'made' ? '#24201f' : '#35312c'
  const tieColor = rankTier === 'leadership' ? '#7a1919' : rankTier === 'made' ? '#8c6118' : '#3d4f43'
  const skinColor = sepia ? '#d4be9f' : '#d8c2a8'
  const initials = username
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase() || 'OP'

  return (
    <svg
      viewBox="0 0 160 176"
      className="h-full w-full select-none"
      role="img"
      aria-label={`Archival portrait of ${username}`}
    >
      <defs>
        <linearGradient id={`bg-${discordId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bgTone[0]} />
          <stop offset="100%" stopColor={bgTone[1]} />
        </linearGradient>
        <pattern id={`hatch-${discordId}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={bgTone[2]} strokeOpacity="0.16" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="160" height="176" fill={`url(#bg-${discordId})`} />
      <rect width="160" height="176" fill={`url(#hatch-${discordId})`} />

      {/* Mugshot / intake scale ticks on right edge */}
      {[32, 48, 64, 80, 96, 112, 128].map((y) => (
        <line
          key={y}
          x1="142"
          y1={y}
          x2={y % 32 === 0 ? 154 : 149}
          y2={y}
          stroke={sepia ? '#4a3827' : '#d9cfb8'}
          strokeOpacity="0.45"
          strokeWidth="1"
        />
      ))}

      {/* Suit & shoulders */}
      <path d="M18 176C22 136 44 122 80 122C116 122 138 136 142 176H18Z" fill={coatColor} />
      {/* Shirt collar V */}
      <polygon points="64,122 96,122 80,158" fill="#efe6d4" />
      {/* Tie */}
      <polygon points="75,126 85,126 88,162 80,170 72,162" fill={tieColor} />
      {/* Lapels */}
      <polygon points="52,124 66,122 76,162 56,148" fill="#120f0e" opacity="0.65" />
      <polygon points="108,124 94,122 84,162 104,148" fill="#120f0e" opacity="0.65" />

      {/* Neck & head */}
      <rect x="69" y="102" width="22" height="24" rx="8" fill={skinColor} />
      <ellipse cx="80" cy="80" rx="25" ry="30" fill={skinColor} stroke="#231a13" strokeWidth="1.4" />
      {/* Jaw shadow */}
      <path d="M56 82C58 98 68 109 80 109C92 109 102 98 104 82" fill="none" stroke="#3c2a1d" strokeOpacity="0.35" strokeWidth="2" />

      {/* Hair or Fedora */}
      {hasHat ? (
        <g>
          <path d="M53 60C55 40 65 32 80 32C95 32 105 40 107 60Z" fill="#1b1512" />
          <rect x="52" y="54" width="56" height="6" fill={tieColor} />
          <ellipse cx="80" cy="61" rx="42" ry="6.5" fill="#130f0d" stroke="#3c2e24" strokeWidth="0.9" />
        </g>
      ) : (
        <path
          d="M55 74C54 53 66 44 80 44C94 44 106 53 105 74C98 62 90 58 80 58C70 58 62 62 55 74Z"
          fill="#221914"
        />
      )}

      {/* Facial brow & features */}
      {hasGlasses ? (
        <g stroke="#1b1512" strokeWidth="1.8" fill="rgba(26,21,18,0.18)">
          <rect x="61" y="72" width="16" height="10" rx="2" />
          <rect x="83" y="72" width="16" height="10" rx="2" />
          <line x1="77" y1="76" x2="83" y2="76" />
        </g>
      ) : (
        <g fill="#231a13">
          <circle cx="70" cy="77" r="2.2" />
          <circle cx="90" cy="77" r="2.2" />
          <path d="M64 71L75 72.5" stroke="#231a13" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M96 71L85 72.5" stroke="#231a13" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
      <path d="M80 78V89L77 91" stroke="#3c2b1e" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M72 97C76 99 84 99 88 97" stroke="#2f2117" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Bottom dossier tag */}
      <rect x="0" y="152" width="160" height="24" fill="rgba(18, 13, 10, 0.84)" />
      <text
        x="80"
        y="168"
        textAnchor="middle"
        fill="#e7d9bf"
        fontFamily="Courier Prime, monospace"
        fontSize="11"
        fontWeight="700"
        letterSpacing="1.6"
      >
        CAA · {initials}
      </text>
    </svg>
  )
}

export function PortraitFrame({
  username,
  discordId,
  rankTier,
  source,
  initialUrl,
  size = 'md',
}: {
  username: string
  discordId: string
  rankTier: RankTier
  source: DataSource
  initialUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(initialUrl ?? null)
  const [imgFailed, setImgFailed] = useState(false)
  const [sepia, setSepia] = useState(true)

  useEffect(() => {
    setImgFailed(false)
    if (initialUrl) {
      setResolvedUrl(initialUrl)
      return
    }
    if (source === 'archive') {
      setResolvedUrl(null)
      return
    }
    const cacheKey = username.toLowerCase()
    if (sessionAvatarCache.has(cacheKey)) {
      setResolvedUrl(sessionAvatarCache.get(cacheKey) ?? null)
      return
    }
    let cancelled = false
    void fetchRobloxAvatar(username).then((url) => {
      sessionAvatarCache.set(cacheKey, url)
      if (!cancelled) setResolvedUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [username, source, initialUrl])

  if (size === 'sm') {
    return (
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-[2px] border border-[#6b4e1c]/45 bg-[#dfd0b1]">
        {resolvedUrl && !imgFailed ? (
          <img
            src={resolvedUrl}
            alt={username}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover sepia-[0.3] contrast-110"
          />
        ) : (
          <VintageOperativeIllustration
            username={username}
            discordId={discordId}
            rankTier={rankTier}
            sepia
          />
        )}
      </div>
    )
  }

  const dimClass = size === 'lg' ? 'w-[132px]' : 'w-[120px]'
  const imgHeight = size === 'lg' ? 'h-[138px]' : 'h-[122px]'

  return (
    <div className={`relative shrink-0 ${dimClass}`}>
      <PaperclipSvg className="pointer-events-none absolute -top-5 right-2 z-20 rotate-[11deg] drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]" />
      <div className="portrait-card-hover -rotate-[1.8deg] border border-[#b4a186] bg-[#faf3e5] p-1.5 pb-2 shadow-[0_5px_14px_rgba(26,21,18,0.28)]">
        <div className={`relative w-full overflow-hidden border border-[#8e7b62]/55 bg-[#d9cbb3] ${imgHeight}`}>
          {resolvedUrl && !imgFailed ? (
            <img
              src={resolvedUrl}
              alt={`${username} avatar`}
              onError={() => setImgFailed(true)}
              className={`h-full w-full object-cover transition-[filter] duration-200 ${
                sepia ? 'sepia-[0.55] contrast-110 brightness-95' : ''
              }`}
            />
          ) : (
            <VintageOperativeIllustration
              username={username}
              discordId={discordId}
              rankTier={rankTier}
              sepia={sepia}
            />
          )}
          <button
            type="button"
            onClick={() => setSepia((s) => !s)}
            title="Toggle sepia / natural color print"
            className="absolute top-1 left-1 z-10 cursor-pointer border border-[#8e7b62]/65 bg-[#faf3e5]/90 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-[#3d3126] hover:bg-[#e5d6b8]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {sepia ? 'CLR' : 'SEP'}
          </button>
        </div>
        <div className="mt-1.5 px-0.5 text-center">
          <span
            className="block truncate text-[10.5px] font-bold tracking-wide text-[#3d3126]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {username}
          </span>
        </div>
      </div>
    </div>
  )
}
