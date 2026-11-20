import { type ReactNode, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { playBrassClick } from '../sound'
import type { ChapterId } from '../types'

interface ForeEdgeTab {
  id: ChapterId
  label: string
  shortLabel: string
  cloth: string
}

const CHAPTER_TABS: ForeEdgeTab[] = [
  { id: 'index', label: 'INDEX', shortLabel: 'INDEX', cloth: '#641717' },
  { id: 'dossiers', label: 'DOSSIERS', shortLabel: 'FILE', cloth: '#1f4432' },
  { id: 'frontdoor', label: 'FRONT DOOR', shortLabel: 'GATE', cloth: '#6e4e18' },
  { id: 'podium', label: 'PODIUM', shortLabel: 'HONOR', cloth: '#2c3547' },
  { id: 'lineage', label: 'LINEAGE', shortLabel: 'TREE', cloth: '#4d2b3b' },
  { id: 'vault', label: 'VAULT', shortLabel: 'VAULT', cloth: '#2f2924' },
]

export interface TurnSnapshot {
  key: number
  direction: 'next' | 'prev'
  frontHtml: ReactNode
  backHtml: ReactNode
}

export function OpenBookShell({
  chapter,
  onSelectChapter,
  leftPage,
  rightPage,
  pageIndicator,
  canPrev,
  canNext,
  onPrevPage,
  onNextPage,
  progressRatio = 0.35,
  isBookmarkedHere = false,
  onToggleBookmark,
  turnSnapshot,
}: {
  chapter: ChapterId
  onSelectChapter: (chapter: ChapterId) => void
  leftPage: ReactNode
  rightPage: ReactNode
  pageIndicator: string
  canPrev: boolean
  canNext: boolean
  onPrevPage: () => void
  onNextPage: () => void
  progressRatio?: number
  isBookmarkedHere?: boolean
  onToggleBookmark?: () => void
  turnSnapshot: TurnSnapshot | null
}) {
  const [mobileSide, setMobileSide] = useState<'left' | 'right'>('left')

  // Reset mobile page to left when changing chapter
  useEffect(() => {
    setMobileSide('left')
  }, [chapter])

  const clamped = Math.max(0.12, Math.min(0.88, progressRatio))
  const leftStackWidth = Math.round(6 + clamped * 12)
  const rightStackWidth = Math.round(6 + (1 - clamped) * 12)

  return (
    <div className="relative mx-auto flex w-full max-w-[1360px] flex-1 flex-col items-center justify-center px-2 pb-3 sm:px-4 md:px-6">
      {/* Mobile-only Chapter Selector & Left/Right Folio Toggle */}
      <div className="mb-2 flex w-full flex-col gap-1.5 lg:hidden">
        <div className="flex flex-wrap justify-center gap-1">
          {CHAPTER_TABS.map((t) => {
            const active = chapter === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  playBrassClick()
                  onSelectChapter(t.id)
                }}
                className={`brass-btn cursor-pointer rounded border px-2 py-1 text-[10px] font-bold tracking-wider ${
                  active
                    ? 'border-[#d7b262] bg-[#5e1515] text-[#f4ecdb]'
                    : 'border-[#a68037]/40 bg-[#19110d]/90 text-[#d4c09e]'
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setMobileSide('left')}
            className={`cursor-pointer rounded border px-3 py-1 text-xs ${
              mobileSide === 'left'
                ? 'border-[#d7b262] bg-[#2a1012] text-[#f4ecdb]'
                : 'border-[#a68037]/35 bg-[#140e0b] text-[#bcae97]'
            }`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Left Folio
          </button>
          <button
            type="button"
            onClick={() => setMobileSide('right')}
            className={`cursor-pointer rounded border px-3 py-1 text-xs ${
              mobileSide === 'right'
                ? 'border-[#d7b262] bg-[#2a1012] text-[#f4ecdb]'
                : 'border-[#a68037]/35 bg-[#140e0b] text-[#bcae97]'
            }`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Right Folio
          </button>
        </div>
      </div>

      {/* Physical Hardcover Book Frame */}
      <div className="relative flex w-full items-stretch justify-center">
        <div className="leather-binding relative flex w-full max-w-[1250px] flex-col rounded-md border border-[#4e2224]/75 p-2.5 sm:p-3.5 md:h-[min(calc(100dvh-106px),780px)] md:min-h-[600px]">
          {/* Marbled inner cover border */}
          <div className="marbled-endpaper relative flex h-full w-full flex-1 items-stretch rounded-[3px] border border-[#a68037]/35 p-1 sm:p-1.5 shadow-[inset_0_0_20px_rgba(0,0,0,0.65)]">
            {/* Left stacked gilded paper edges (desktop) */}
            <div
              aria-hidden="true"
              className="hidden lg:block shrink-0 rounded-l-[2px] border-y border-l border-[#8f7958]/70 bg-[repeating-linear-gradient(to_right,#cbb894_0px,#e6d9bf_1px,#b79f78_2.5px)] shadow-[inset_-4px_0_8px_rgba(26,21,18,0.3)]"
              style={{ width: `${leftStackWidth}px` }}
            />

            {/* Two-page spread stage */}
            <div className="book-spread-perspective relative flex flex-1 flex-col overflow-hidden rounded-[2px] bg-[#dfd0b1] shadow-[0_6px_22px_rgba(0,0,0,0.45)] lg:grid lg:grid-cols-2">
              {/* Clickable Crimson Silk Bookmark Ribbon hanging down spine */}
              {onToggleBookmark && (
                <button
                  type="button"
                  onClick={() => {
                    playBrassClick()
                    onToggleBookmark()
                  }}
                  title={isBookmarkedHere ? 'Ribbon placed here (click to remove)' : 'Place crimson ribbon bookmark here'}
                  className="hidden lg:block group absolute -top-1 left-1/2 z-30 -translate-x-1/2 cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-4 transition-all duration-200 shadow-[0_3px_8px_rgba(0,0,0,0.45)] ${
                      isBookmarkedHere
                        ? 'h-16 bg-gradient-to-b from-[#a01f1f] via-[#7c1313] to-[#560a0a]'
                        : 'h-9 bg-gradient-to-b from-[#692222]/75 to-[#441111]/80 group-hover:h-12'
                    }`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)' }}
                  />
                </button>
              )}

              {/* LEFT FOLIO */}
              <section
                aria-label="Left Ledger Folio"
                className={`rag-paper-left relative flex h-full min-h-[540px] flex-col overflow-hidden border-b border-[#b9a68a] text-[#1a1512] lg:min-h-0 lg:border-b-0 lg:border-r lg:border-[#5e4733]/35 ${
                  mobileSide === 'left' ? 'flex' : 'hidden lg:flex'
                }`}
              >
                <div className="paper-fiber-overlay pointer-events-none absolute inset-0" />
                {/* Red vertical archival margin rule */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-9 hidden w-px bg-[var(--rule-crimson)] sm:block"
                />

                <div className="ledger-scroll relative z-10 flex-1 overflow-y-auto px-5 py-5 sm:pl-12 sm:pr-7">
                  {leftPage}
                </div>

                {/* Bottom-Left Folio Footer & Dog-Ear Turn Previous */}
                <div className="relative z-10 flex items-center justify-between border-t border-[#9a8366]/30 bg-[#eadcc2]/65 px-5 py-2 text-[11px] text-[#5c4e40]" style={{ fontFamily: 'var(--font-mono)' }}>
                  <button
                    type="button"
                    disabled={!canPrev}
                    onClick={onPrevPage}
                    className="brass-btn inline-flex cursor-pointer items-center gap-1 font-bold uppercase tracking-wider text-[#4c3e31] disabled:cursor-not-allowed disabled:opacity-35 hover:text-[#8f1d1d]"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev Folio</span>
                  </button>
                  <span className="tabular-nums tracking-wider">{pageIndicator}</span>
                </div>

                {canPrev && (
                  <button
                    type="button"
                    aria-label="Turn to previous folio"
                    onClick={onPrevPage}
                    className="dog-ear-corner absolute bottom-0 left-0 z-20 hidden h-6 w-6 cursor-pointer lg:block"
                    style={{
                      background:
                        'linear-gradient(45deg, #d8c6a6 45%, #f6eedf 50%, #cab590 54%, transparent 56%)',
                    }}
                  />
                )}
              </section>

              {/* RIGHT FOLIO */}
              <section
                aria-label="Right Ledger Folio"
                className={`rag-paper-right relative flex h-full min-h-[540px] flex-col overflow-hidden text-[#1a1512] lg:min-h-0 ${
                  mobileSide === 'right' ? 'flex' : 'hidden lg:flex'
                }`}
              >
                <div className="paper-fiber-overlay pointer-events-none absolute inset-0" />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-8 hidden w-px bg-[var(--rule-crimson)] sm:block"
                />

                <div className="ledger-scroll relative z-10 flex-1 overflow-y-auto px-5 py-5 sm:pl-7 sm:pr-11">
                  {rightPage}
                </div>

                {/* Bottom-Right Folio Footer & Dog-Ear Turn Next */}
                <div className="relative z-10 flex items-center justify-between border-t border-[#9a8366]/30 bg-[#eadcc2]/65 px-5 py-2 text-[11px] text-[#5c4e40]" style={{ fontFamily: 'var(--font-mono)' }}>
                  <span className="tracking-wider uppercase">Custom Adversaries Assoc.</span>
                  <button
                    type="button"
                    disabled={!canNext}
                    onClick={onNextPage}
                    className="brass-btn inline-flex cursor-pointer items-center gap-1 font-bold uppercase tracking-wider text-[#4c3e31] disabled:cursor-not-allowed disabled:opacity-35 hover:text-[#8f1d1d]"
                  >
                    <span>Next Folio</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {canNext && (
                  <button
                    type="button"
                    aria-label="Turn to next folio"
                    onClick={onNextPage}
                    className="dog-ear-corner absolute right-0 bottom-0 z-20 hidden h-6 w-6 cursor-pointer lg:block"
                    style={{
                      background:
                        'linear-gradient(315deg, #d8c6a6 45%, #f6eedf 50%, #cab590 54%, transparent 56%)',
                    }}
                  />
                )}
              </section>

              {/* Center spine stitching shadow (desktop) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-8 -translate-x-1/2 lg:block"
                style={{
                  background:
                    'linear-gradient(to right, transparent 0%, rgba(28,16,8,0.16) 44%, rgba(16,8,4,0.34) 50%, rgba(28,16,8,0.16) 56%, transparent 100%)',
                }}
              />

              {/* 3D Animated Turning Leaf Overlay (desktop) */}
              {turnSnapshot && (
                <div
                  key={turnSnapshot.key}
                  aria-hidden="true"
                  className={`hidden lg:block ${
                    turnSnapshot.direction === 'next' ? 'turning-leaf-next' : 'turning-leaf-prev'
                  }`}
                >
                  <div className="leaf-face rag-paper-right border-l border-[#5e4733]/35 p-6 text-[#1a1512]">
                    <div className="paper-fiber-overlay pointer-events-none absolute inset-0" />
                    <div className="relative z-10 h-full overflow-hidden opacity-95">
                      {turnSnapshot.frontHtml}
                    </div>
                  </div>
                  <div className="leaf-face leaf-face-back rag-paper-left border-r border-[#5e4733]/35 p-6 text-[#1a1512]">
                    <div className="paper-fiber-overlay pointer-events-none absolute inset-0" />
                    <div className="relative z-10 h-full overflow-hidden opacity-95">
                      {turnSnapshot.backHtml}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right stacked gilded paper edges (desktop) */}
            <div
              aria-hidden="true"
              className="hidden lg:block shrink-0 rounded-r-[2px] border-y border-r border-[#8f7958]/70 bg-[repeating-linear-gradient(to_right,#b79f78_0px,#e6d9bf_1px,#cbb894_2.5px)] shadow-[inset_4px_0_8px_rgba(26,21,18,0.3)]"
              style={{ width: `${rightStackWidth}px` }}
            />
          </div>

          {/* Projecting Fore-Edge Chapter Index Tabs on Desktop */}
          <nav
            aria-label="Ledger Chapters"
            className="hidden lg:flex absolute top-8 -right-[38px] z-20 flex-col gap-2"
          >
            {CHAPTER_TABS.map((tab) => {
              const active = chapter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playBrassClick()
                    onSelectChapter(tab.id)
                  }}
                  title={tab.label}
                  className={`brass-btn flex h-[78px] cursor-pointer items-center justify-center rounded-r border border-l-0 transition-transform duration-150 ${
                    active
                      ? 'w-[42px] translate-x-1 border-[#d7b262] text-[#f6ecd7] shadow-[4px_4px_12px_rgba(0,0,0,0.65)]'
                      : 'w-[34px] border-[#a68037]/50 text-[#dec9a2] opacity-90 hover:translate-x-0.5 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: tab.cloth,
                    fontFamily: 'var(--font-mono)',
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                  }}
                >
                  <span className="text-[10px] font-bold tracking-[0.16em]">{tab.shortLabel}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
