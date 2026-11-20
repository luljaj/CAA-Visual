import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect } from 'react'

export interface ArchivalPlate {
  id: string
  src: string
  title: string
  caption: string
  plateNumber: string
}

export const CAA_ARCHIVAL_PLATES: ArchivalPlate[] = [
  {
    id: 'lineup',
    src: '/photos/caa-lineup-bw.jpg',
    plateNumber: 'PLATE I',
    title: 'C.A.A. Night Lineup — Street Roll Call',
    caption: 'C.A.A. members assembled in formal dress at midnight roll call.',
  },
  {
    id: 'bridge',
    src: '/photos/caa-bridge-gathering.jpg',
    plateNumber: 'PLATE II',
    title: 'The Crossing — Organization Bridge Assembly',
    caption: 'Full-dress formation behind the estate lamps · Founded Summer 2022.',
  },
  {
    id: 'lounge',
    src: '/photos/caa-lounge-autumn.jpg',
    plateNumber: 'PLATE III',
    title: 'C.A.A. Headquarters Lounge — Autumn Gathering',
    caption: 'Members off-clock inside the range and briefing room.',
  },
]

export function PhotoGalleryModal({
  plateIndex,
  onChangePlate,
  onClose,
}: {
  plateIndex: number | null
  onChangePlate: (idx: number) => void
  onClose: () => void
}) {
  const open = plateIndex !== null
  const safeIdx =
    plateIndex === null
      ? 0
      : ((plateIndex % CAA_ARCHIVAL_PLATES.length) + CAA_ARCHIVAL_PLATES.length) %
        CAA_ARCHIVAL_PLATES.length
  const plate = CAA_ARCHIVAL_PLATES[safeIdx]

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onChangePlate((safeIdx + 1) % CAA_ARCHIVAL_PLATES.length)
      if (e.key === 'ArrowLeft')
        onChangePlate((safeIdx - 1 + CAA_ARCHIVAL_PLATES.length) % CAA_ARCHIVAL_PLATES.length)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, safeIdx, onChangePlate, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="C.A.A. Archival Photo Plates"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl border border-[#d7b262]/70 bg-[#17100c] p-4 text-[#f4ecdb] shadow-[0_28px_72px_rgba(0,0,0,0.9)]"
      >
        <div
          className="mb-3 flex items-center justify-between border-b border-[#a68037]/40 pb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-[#d7b262] uppercase">
            <Camera className="h-3.5 w-3.5" />
            <span>
              {plate.plateNumber} · {plate.title}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo plate viewer"
            className="cursor-pointer p-1 text-[#cbb894] hover:text-[#f4ecdb]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative overflow-hidden border border-[#a68037]/50 bg-[#0b0806]">
          <img
            src={plate.src}
            alt={plate.title}
            className="mx-auto max-h-[58vh] w-full object-contain"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#e5d8be]" style={{ fontFamily: 'var(--font-mono)' }}>
              {plate.caption}
            </p>
            <p
              className="mt-0.5 text-sm italic text-[#d7b262]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              “How you dress is how you present yourself.” · Strict Invite / Vouch Only
            </p>
          </div>

          <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)' }}>
            {CAA_ARCHIVAL_PLATES.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChangePlate(idx)}
                className={`brass-btn cursor-pointer border px-2.5 py-1 text-[11px] font-bold ${
                  idx === safeIdx
                    ? 'border-[#d7b262] bg-[#691717] text-[#f4ecdb]'
                    : 'border-[#a68037]/45 bg-[#251713] text-[#cbb894] hover:border-[#d7b262]'
                }`}
              >
                {p.plateNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                onChangePlate((safeIdx - 1 + CAA_ARCHIVAL_PLATES.length) % CAA_ARCHIVAL_PLATES.length)
              }
              aria-label="Previous plate"
              className="brass-btn cursor-pointer border border-[#a68037]/45 bg-[#251713] p-1.5 text-[#d7b262] hover:border-[#d7b262]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangePlate((safeIdx + 1) % CAA_ARCHIVAL_PLATES.length)}
              aria-label="Next plate"
              className="brass-btn cursor-pointer border border-[#a68037]/45 bg-[#251713] p-1.5 text-[#d7b262] hover:border-[#d7b262]"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
