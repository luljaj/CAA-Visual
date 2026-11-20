import { Eraser, Stamp, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { STAMP_PRESETS } from '../archivistStore'
import type { StampInk, StampPreset } from '../types'

export function StampKitPopover({
  open,
  anchorRect,
  hasStamps,
  onSlamStamp,
  onClearMemberStamps,
  onClose,
}: {
  open: boolean
  anchorRect: DOMRect | null
  hasStamps: boolean
  onSlamStamp: (preset: StampPreset) => void
  onClearMemberStamps: () => void
  onClose: () => void
}) {
  const [customLabel, setCustomLabel] = useState('')
  const [customInk, setCustomInk] = useState<StampInk>('crimson')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onEsc)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onEsc)
    }
  }, [open, onClose])

  if (!open) return null

  const top = anchorRect ? anchorRect.bottom + 8 : 56
  const right = anchorRect ? Math.max(12, window.innerWidth - anchorRect.right) : 24

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = customLabel.trim().toUpperCase()
    if (!clean) return
    onSlamStamp({ label: clean.slice(0, 18), subtext: 'Custom Management Stamp', ink: customInk })
    setCustomLabel('')
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Rubber Stamp Kit"
      className="popover-enter fixed z-50 w-72 border border-[#d7b262]/70 bg-[#1a100c] p-3.5 text-[#f4ecdb] shadow-[0_18px_42px_rgba(0,0,0,0.82)]"
      style={{
        top: `${top}px`,
        right: `${right}px`,
        ['--transform-origin' as string]: 'top right',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <div className="mb-2.5 flex items-center justify-between border-b border-[#a68037]/40 pb-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#d7b262] uppercase">
          <Stamp className="h-3.5 w-3.5" />
          Management Stamp Kit
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close stamp kit"
          className="cursor-pointer text-[#cbb894] hover:text-[#f4ecdb]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {STAMP_PRESETS.map((preset) => {
          const borderAccent =
            preset.ink === 'crimson'
              ? 'border-[#b93e3e]/70 text-[#f1a8a8]'
              : preset.ink === 'forest'
                ? 'border-[#3d8b63]/70 text-[#a5dec0]'
                : preset.ink === 'gold'
                  ? 'border-[#d7b262]/70 text-[#ecd18d]'
                  : 'border-[#c8b99f]/65 text-[#ede2cc]'
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSlamStamp(preset)}
              className="brass-btn flex w-full cursor-pointer items-center justify-between border border-[#a68037]/30 bg-[#251713] px-2.5 py-1.5 text-left hover:border-[#d7b262]"
            >
              <div>
                <div
                  className={`inline-block border px-1.5 py-0.2 text-[10px] font-bold tracking-[0.14em] ${borderAccent}`}
                  style={{ fontFamily: 'var(--font-stamp)' }}
                >
                  {preset.label}
                </div>
                <div className="mt-0.5 text-[10px] text-[#baa88a]">{preset.subtext}</div>
              </div>
              <span className="text-[10px] text-[#d7b262]">Slam</span>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleCustomSubmit} className="mt-3 border-t border-[#a68037]/30 pt-2.5">
        <div className="mb-1.5 text-[10px] tracking-wider text-[#c7b494] uppercase">Custom Stamp</div>
        <div className="flex gap-1.5">
          <input
            type="text"
            maxLength={18}
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="e.g. RESPECTED"
            className="min-w-0 flex-1 border border-[#a68037]/45 bg-[#120b09] px-2 py-1 text-xs text-[#f4ecdb] placeholder-[#9b896f]"
          />
          <select
            aria-label="Stamp ink color"
            value={customInk}
            onChange={(e) => setCustomInk(e.target.value as StampInk)}
            className="cursor-pointer border border-[#a68037]/45 bg-[#120b09] px-1.5 py-1 text-[11px] text-[#f4ecdb]"
          >
            <option value="crimson">Red</option>
            <option value="forest">Green</option>
            <option value="gold">Gold</option>
            <option value="ink">Black</option>
          </select>
          <button
            type="submit"
            className="brass-btn cursor-pointer border border-[#d7b262] bg-[#5c1616] px-2 py-1 text-[11px] font-bold text-[#f4ecdb]"
          >
            Go
          </button>
        </div>
      </form>

      {hasStamps && (
        <button
          type="button"
          onClick={onClearMemberStamps}
          className="brass-btn mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 border border-[#8f1d1d]/70 bg-[#2a1212] py-1 text-[11px] text-[#f2b5b5] hover:bg-[#5c1616]"
        >
          <Eraser className="h-3 w-3" />
          <span>Lift All Stamps on This Folio</span>
        </button>
      )}
    </div>
  )
}
