import { useState } from 'react'
import { LockOpen, Volume2, VolumeX } from 'lucide-react'
import { playBrassClick, playSealCrack } from '../sound'
import type { StatusResponse } from '../types'
import { BrassCorner, CaaCrest, WaxSealSvg } from './EngravedIcons'

export function BookCover({
  status,
  memberCount,
  muted,
  onToggleMute,
  onOpenBook,
  onOpenPhotoPlate,
}: {
  status: StatusResponse | null
  memberCount: number
  muted: boolean
  onToggleMute: () => void
  onOpenBook: () => void
  onOpenPhotoPlate: (plateIndex: number) => void
}) {
  const [unsealing, setUnsealing] = useState(false)

  const triggerOpen = () => {
    if (unsealing) return
    playSealCrack()
    setUnsealing(true)
    window.setTimeout(() => {
      onOpenBook()
    }, 520)
  }

  const formattedCount = new Intl.NumberFormat('en-US').format(memberCount)
  const sourceLabel = status?.liveConnected
    ? `Live Supabase · ${formattedCount} Files`
    : status?.hasImported
      ? `Imported CSV · ${formattedCount} Files`
      : `Sample Archive · ${formattedCount} Files`

  return (
    <div className="banker-desk dark-selection flex min-h-[100dvh] flex-col items-center justify-center px-4 py-6">
      {/* Subtle sound toggle in desk top-right */}
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute ledger audio' : 'Mute ledger audio'}
        className="brass-btn absolute top-4 right-5 z-20 flex cursor-pointer items-center gap-1.5 rounded border border-[#a68037]/45 bg-[#16100d]/85 px-3 py-1.5 text-xs text-[#d7b262] hover:border-[#d7b262]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        <span>{muted ? 'Audio Muted' : 'Desk Foley'}</span>
      </button>

      <div className="cover-stage relative flex flex-col items-center">
        {/* Peeking archival C.A.A. photographs on the desk behind the ledger cover (desktop) */}
        <button
          type="button"
          onClick={() => {
            playBrassClick()
            onOpenPhotoPlate(1)
          }}
          title="Inspect C.A.A. Assembly Photograph"
          className="hidden lg:block group absolute -top-4 -left-36 z-0 w-44 -rotate-[9deg] cursor-pointer border border-[#cbb99a] bg-[#f4ecdb] p-1.5 pb-4 text-left shadow-[0_14px_30px_rgba(0,0,0,0.65)] transition-transform duration-200 hover:-translate-y-1 hover:-rotate-[6deg]"
        >
          <img
            src="/photos/caa-bridge-gathering.jpg"
            alt="C.A.A. Bridge Assembly"
            className="h-28 w-full object-cover contrast-105"
          />
          <span
            className="mt-1.5 block text-center text-[9.5px] font-bold tracking-wider text-[#3d3126]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            PLATE II · ASSEMBLY
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            playBrassClick()
            onOpenPhotoPlate(2)
          }}
          title="Inspect C.A.A. Headquarters Photograph"
          className="hidden lg:block group absolute bottom-16 -right-36 z-0 w-44 rotate-[8deg] cursor-pointer border border-[#cbb99a] bg-[#f4ecdb] p-1.5 pb-4 text-left shadow-[0_14px_30px_rgba(0,0,0,0.65)] transition-transform duration-200 hover:-translate-y-1 hover:rotate-[5deg]"
        >
          <img
            src="/photos/caa-lounge-autumn.jpg"
            alt="C.A.A. Headquarters Lounge"
            className="h-28 w-full object-cover contrast-105"
          />
          <span
            className="mt-1.5 block text-center text-[9.5px] font-bold tracking-wider text-[#3d3126]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            PLATE III · HEADQUARTERS
          </span>
        </button>

        {/* Leather-bound physical book cover */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Open The Black Ledger"
          onClick={triggerOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              triggerOpen()
            }
          }}
          className={`book-cover-enter leather-binding group relative z-10 w-[min(90vw,460px)] cursor-pointer select-none rounded-r-md rounded-l-[4px] border border-[#4e2224]/70 ${
            unsealing ? 'cover-unsealing' : ''
          }`}
          style={{ aspectRatio: '3 / 4.08' }}
        >
          {/* Leather grain overlay */}
          <div className="leather-grain pointer-events-none absolute inset-0 rounded-r-md" />

          {/* Spine ribs on left edge */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-9 rounded-l-[4px] border-r border-[#120405] bg-gradient-to-r from-[#140506] via-[#341215] to-[#1a0709]"
          >
            {[16, 33, 50, 67, 84].map((topPct) => (
              <div
                key={topPct}
                className="absolute inset-x-0 h-2.5 border-y border-[#d7b262]/25 bg-gradient-to-b from-[#491b1f] via-[#260b0d] to-[#0f0304] shadow-[0_3px_6px_rgba(0,0,0,0.6)]"
                style={{ top: `${topPct}%` }}
              />
            ))}
          </div>

          {/* Brass corners */}
          <BrassCorner position="tr" />
          <BrassCorner position="br" />

          {/* Crimson silk ribbon tail peeking out bottom */}
          <div
            aria-hidden="true"
            className="absolute -bottom-6 right-14 z-10 h-10 w-4 bg-gradient-to-b from-[#7a1616] to-[#4f0b0b] shadow-[0_6px_10px_rgba(0,0,0,0.65)]"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)' }}
          />

          {/* Inner stitched gold perimeter frame */}
          <div className="relative ml-10 mr-5 my-5 flex h-[calc(100%-2.5rem)] flex-col items-center justify-between border border-[#d7b262]/45 p-6 text-center shadow-[inset_0_0_24px_rgba(0,0,0,0.55)]">
            <div className="pointer-events-none absolute inset-1.5 border border-dashed border-[#a68037]/35" />

            {/* Top Crest & Organization */}
            <div className="relative z-10 flex flex-col items-center pt-2">
              <CaaCrest serverIcon={status?.serverIcon} size={74} />
              <p
                className="mt-4 text-[11px] tracking-[0.26em] text-[#d7b262]/90 uppercase"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                C.A.A. · Custom Adversaries
              </p>
            </div>

            {/* Debossed Gold Title & Slogan */}
            <div className="relative z-10 my-auto px-2">
              <div className="mx-auto mb-3 h-px w-24 bg-[#d7b262]/50" />
              <h1
                className="text-[clamp(1.75rem,3.8vw,2.45rem)] font-bold leading-[1.08] tracking-[0.12em] text-[#e1c074] uppercase drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                The Black Ledger
              </h1>
              <div className="mx-auto mt-3 h-px w-24 bg-[#d7b262]/50" />
              <p
                className="mt-4 text-sm italic leading-relaxed text-[#e8d5ad]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                “How you dress is how you present yourself.”
              </p>
              <p
                className="mt-2.5 text-[10px] tracking-[0.18em] text-[#bcae93] uppercase"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Strict Invite / Vouch Only
              </p>
            </div>

            {/* Bottom Volume Stamp */}
            <div className="relative z-10 pb-1">
              <p
                className="text-[11px] tracking-[0.2em] text-[#a68037] uppercase"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Founded Summer of 2022
              </p>
            </div>
          </div>

          {/* Interactive Wax Seal Clasp on right edge */}
          <div className="absolute top-1/2 -right-5 z-30 -translate-y-1/2 transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
            <div className="relative flex items-center">
              <div className="h-5 w-8 rounded-l border border-[#d7b262]/45 bg-[#361114] shadow-md" />
              <div className="-ml-3 drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]">
                <WaxSealSvg size={78} />
              </div>
            </div>
          </div>
        </div>

        {/* Desk Nameplate & Prompt */}
        <div className="relative z-10 mt-8 flex flex-col items-center gap-2.5 text-center">
          <div
            className="inline-flex items-center gap-2 rounded border border-[#a68037]/50 bg-[#140e0b]/90 px-4 py-1.5 text-xs tracking-wider text-[#d7b262] shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                status?.liveConnected ? 'bg-[#45a86b]' : 'bg-[#d7b262]'
              }`}
            />
            <span>{sourceLabel}</span>
          </div>

          <button
            type="button"
            onClick={triggerOpen}
            className="brass-btn inline-flex cursor-pointer items-center gap-2 px-3 py-1 text-xs tracking-[0.14em] text-[#cbb894] uppercase hover:text-[#e7cf93]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <LockOpen className="h-3.5 w-3.5" />
            <span>Break Wax Seal or Press Enter to Unseal</span>
          </button>
        </div>
      </div>
    </div>
  )
}
