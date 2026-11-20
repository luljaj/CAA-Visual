import {
  BookMarked,
  BookOpen,
  Camera,
  Columns2,
  Database,
  Download,
  RefreshCw,
  Search,
  Stamp,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { playBrassClick } from '../sound'
import type { ChapterId, DataSource, MemberDossier } from '../types'

const CHAPTER_LABELS: Record<ChapterId, string> = {
  index: 'Chapter I · Personnel Directory',
  dossiers: 'Chapter II · Employee Dossier',
  frontdoor: 'Chapter III · Front Door Log',
  podium: 'Chapter IV · Honor Podium & Field Rankings',
  lineage: 'Chapter V · Vouch & Referral Tree',
  vault: 'Chapter VI · Data Vault & Importer',
}

export function DeskToolbar({
  chapter,
  activeSource,
  activeMember,
  bookmarkedMember,
  compareMode,
  muted,
  onCloseCover,
  onOpenSearch,
  onToggleCompare,
  onToggleStampPopover,
  onToggleBookmark,
  onJumpBookmark,
  onOpenExport,
  onOpenVault,
  onOpenPlates,
  onRefreshLive,
  refreshing,
  onToggleMute,
  stampButtonRef,
}: {
  chapter: ChapterId
  activeSource: DataSource
  activeMember: MemberDossier | null
  bookmarkedMember: MemberDossier | null
  compareMode: boolean
  muted: boolean
  onCloseCover: () => void
  onOpenSearch: () => void
  onToggleCompare: () => void
  onToggleStampPopover: () => void
  onToggleBookmark: () => void
  onJumpBookmark: () => void
  onOpenExport: () => void
  onOpenVault: () => void
  onOpenPlates: () => void
  onRefreshLive: () => void
  refreshing: boolean
  onToggleMute: () => void
  stampButtonRef: React.RefObject<HTMLButtonElement | null>
}) {
  const isDossier = chapter === 'dossiers' && activeMember !== null
  const isBookmarkedHere = Boolean(
    activeMember && bookmarkedMember && activeMember.discordId === bookmarkedMember.discordId,
  )

  const sourceBadge =
    activeSource === 'live'
      ? { label: 'LIVE SUPABASE', dot: 'bg-[#45a86b]' }
      : activeSource === 'imported'
        ? { label: 'IMPORTED CSV', dot: 'bg-[#69a6d1]' }
        : { label: 'SAMPLE ARCHIVE', dot: 'bg-[#d7b262]' }

  return (
    <header
      className="desk-surface relative z-30 mx-auto flex w-full max-w-[1340px] flex-wrap items-center justify-between gap-2 px-3 pt-2.5 pb-2 text-xs"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {/* Left group: Close Book + Source pill */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            playBrassClick()
            onCloseCover()
          }}
          className="brass-btn inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#a68037]/50 bg-[#19110d]/90 px-2.5 py-1.5 text-[#e2cba0] hover:border-[#d7b262] hover:text-[#f6e8c8]"
        >
          <BookOpen className="h-3.5 w-3.5 text-[#d7b262]" />
          <span className="hidden sm:inline">Close Ledger</span>
          <span className="sm:hidden">Cover</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playBrassClick()
            onOpenVault()
          }}
          title="Open Data Vault"
          className="brass-btn inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#a68037]/40 bg-[#131b16]/90 px-2.5 py-1.5 text-[#d7c6a3] hover:border-[#d7b262]"
        >
          <span className={`h-2 w-2 rounded-full ${sourceBadge.dot}`} />
          <Database className="h-3 w-3 text-[#a68037]" />
          <span className="tracking-wider">{sourceBadge.label}</span>
        </button>

        {activeSource === 'live' && (
          <button
            type="button"
            disabled={refreshing}
            onClick={() => {
              playBrassClick()
              onRefreshLive()
            }}
            title="Refresh live Supabase records"
            className="brass-btn inline-flex cursor-pointer items-center justify-center rounded border border-[#a68037]/40 bg-[#131b16]/90 p-1.5 text-[#d7b262] hover:border-[#d7b262] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Center group: Chapter readout & Quick Search */}
      <div className="flex items-center gap-2.5">
        <span className="hidden lg:inline tracking-wider text-[#b6a68d]">
          {CHAPTER_LABELS[chapter]}
        </span>
        <button
          type="button"
          onClick={onOpenSearch}
          className="brass-btn inline-flex cursor-pointer items-center gap-2 rounded border border-[#a68037]/55 bg-[#17120e]/95 px-3 py-1.5 text-[#e8d9ba] hover:border-[#d7b262]"
        >
          <Search className="h-3.5 w-3.5 text-[#d7b262]" />
          <span>Search Rolodex</span>
          <kbd className="hidden md:inline rounded border border-[#a68037]/40 bg-[#0d0907] px-1.5 py-0.5 text-[10px] text-[#c7b494]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right group: Dossier Actions, Bookmark Jump, Sound */}
      <div className="flex flex-wrap items-center gap-1.5">
        {isDossier && (
          <>
            <button
              type="button"
              onClick={() => {
                playBrassClick()
                onToggleCompare()
              }}
              className={`brass-btn inline-flex cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1.5 ${
                compareMode
                  ? 'border-[#d7b262] bg-[#5c1616] text-[#f4ecdb]'
                  : 'border-[#a68037]/45 bg-[#19110d]/90 text-[#dfca9f] hover:border-[#d7b262]'
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span>{compareMode ? 'Exit Compare' : 'Compare'}</span>
            </button>

            {!compareMode && (
              <>
                <button
                  ref={stampButtonRef}
                  type="button"
                  onClick={() => {
                    playBrassClick()
                    onToggleStampPopover()
                  }}
                  className="brass-btn inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#a68037]/45 bg-[#19110d]/90 px-2.5 py-1.5 text-[#dfca9f] hover:border-[#d7b262]"
                >
                  <Stamp className="h-3.5 w-3.5 text-[#c96262]" />
                  <span>Stamp Kit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playBrassClick()
                    onToggleBookmark()
                  }}
                  title={isBookmarkedHere ? 'Remove bookmark' : 'Bookmark this dossier'}
                  className={`brass-btn inline-flex cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1.5 ${
                    isBookmarkedHere
                      ? 'border-[#d7b262] bg-[#691717] text-[#f4ecdb]'
                      : 'border-[#a68037]/45 bg-[#19110d]/90 text-[#dfca9f] hover:border-[#d7b262]'
                  }`}
                >
                  <BookMarked className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">{isBookmarkedHere ? 'Ribbon Set' : 'Bookmark'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playBrassClick()
                    onOpenExport()
                  }}
                  className="brass-btn inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#a68037]/45 bg-[#19110d]/90 px-2.5 py-1.5 text-[#dfca9f] hover:border-[#d7b262]"
                >
                  <Download className="h-3.5 w-3.5 text-[#d7b262]" />
                  <span className="hidden md:inline">Export Card</span>
                </button>
              </>
            )}
          </>
        )}

        {bookmarkedMember && (!isDossier || !isBookmarkedHere) && (
          <button
            type="button"
            onClick={() => {
              playBrassClick()
              onJumpBookmark()
            }}
            className="brass-btn inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#8f1d1d]/80 bg-[#4b1212] px-2.5 py-1.5 text-[#f4ecdb] hover:border-[#d7b262]"
          >
            <BookMarked className="h-3.5 w-3.5 text-[#e4c078]" />
            <span>Ribbon: {bookmarkedMember.username}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            playBrassClick()
            onOpenPlates()
          }}
          title="Inspect C.A.A. archival photo plates"
          className="brass-btn inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#a68037]/45 bg-[#19110d]/90 px-2.5 py-1.5 text-[#dfca9f] hover:border-[#d7b262]"
        >
          <Camera className="h-3.5 w-3.5 text-[#d7b262]" />
          <span className="hidden xl:inline">Plates</span>
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          className="brass-btn inline-flex cursor-pointer items-center justify-center rounded border border-[#a68037]/45 bg-[#19110d]/90 p-1.5 text-[#d7b262] hover:border-[#d7b262]"
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </header>
  )
}
