import { Camera, Search, ShieldAlert } from 'lucide-react'
import type { FilterMode, MemberDossier, RosterTotals, SortField } from '../types'
import { formatNumber } from './EngravedIcons'
import { PortraitFrame } from './PortraitFrame'

const FILTER_OPTIONS: Array<{ id: FilterMode; label: string }> = [
  { id: 'all', label: 'All Personnel' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'made', label: 'Employees' },
  { id: 'intern', label: 'Interns' },
  { id: 'flagged', label: 'Flagged Strikes' },
  { id: 'awarded', label: 'Award Holders' },
]

const SORT_OPTIONS: Array<{ id: SortField; label: string }> = [
  { id: 'id', label: 'Rolodex #' },
  { id: 'reports', label: 'Field Reports' },
  { id: 'eventWins', label: 'Event Wins' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'awards', label: 'Awards Held' },
  { id: 'recent', label: 'Recent Front Door' },
]

export const INDEX_PAGE_SIZE = 25

export function filterAndSortMembers(
  members: MemberDossier[],
  filter: FilterMode,
  sort: SortField,
  query: string,
): MemberDossier[] {
  const q = query.trim().toLowerCase()
  const filtered = members.filter((m) => {
    if (filter === 'leadership' && m.rankTier !== 'leadership') return false
    if (filter === 'made' && m.rankTier !== 'made') return false
    if (filter === 'intern' && m.rankTier !== 'intern') return false
    if (filter === 'flagged' && m.totalActiveStrikes === 0) return false
    if (filter === 'awarded' && m.stats.awards.length === 0) return false

    if (!q) return true
    const haystack = [
      m.username,
      m.displayName,
      m.discordId,
      String(m.id),
      m.position,
      m.application.inviter ?? '',
      m.application.reason,
      ...m.stats.awards,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })

  return [...filtered].sort((a, b) => {
    switch (sort) {
      case 'reports':
        return b.stats.reports - a.stats.reports || a.id - b.id
      case 'eventWins':
        return b.stats.eventWins - a.stats.eventWins || a.id - b.id
      case 'referrals':
        return b.stats.referrals - a.stats.referrals || a.id - b.id
      case 'awards':
        return b.stats.awardsCount - a.stats.awardsCount || a.id - b.id
      case 'recent': {
        const ta = a.application.createdAt ? Date.parse(a.application.createdAt) : 0
        const tb = b.application.createdAt ? Date.parse(b.application.createdAt) : 0
        return tb - ta || a.id - b.id
      }
      case 'id':
      default:
        return a.id - b.id
    }
  })
}

export function IndexLeftPage({
  totals,
  filter,
  sort,
  query,
  filteredCount,
  totalCount,
  onChangeFilter,
  onChangeSort,
  onChangeQuery,
  onOpenPhotoPlate,
}: {
  totals: RosterTotals
  filter: FilterMode
  sort: SortField
  query: string
  filteredCount: number
  totalCount: number
  onChangeFilter: (f: FilterMode) => void
  onChangeSort: (s: SortField) => void
  onChangeQuery: (q: string) => void
  onOpenPhotoPlate: (plateIndex: number) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-[#5c4e40]/45 pb-2.5">
        <div
          className="flex flex-wrap items-center justify-between gap-1 text-[10.5px] text-[#5c4e40]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>C.A.A. · FOUNDED SUMMER 2022</span>
          <span>STRICT INVITE / VOUCH ONLY</span>
        </div>
        <h2
          className="mt-1 text-2xl font-bold tracking-wide text-[#1a1512]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Association Personnel Directory
        </h2>
      </div>

      {/* Panoramic B&W Night Lineup Frontispiece Photo Plate */}
      <button
        type="button"
        onClick={() => onOpenPhotoPlate(0)}
        title="Inspect full archival photograph"
        className="group relative cursor-pointer border border-[#75624a]/65 bg-[#faf3e4] p-1.5 text-left shadow-[0_3px_10px_rgba(26,21,18,0.16)] transition-colors hover:border-[#8f1d1d]"
      >
        <div className="relative overflow-hidden border border-[#5c4e40]/45 bg-[#12100e]">
          <img
            src="/photos/caa-lineup-bw.jpg"
            alt="C.A.A. Night Lineup"
            className="h-24 w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span
            className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 border border-[#d7b262]/65 bg-[#120d0a]/85 px-1.5 py-0.5 text-[9px] font-bold text-[#e7cf93] uppercase"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <Camera className="h-2.5 w-2.5" />
            <span>Plate I</span>
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between px-0.5 text-[10.5px] text-[#4c3e31]">
          <span className="italic" style={{ fontFamily: 'var(--font-serif)' }}>
            “How you dress is how you present yourself.”
          </span>
          <span className="font-bold text-[#8f1d1d]" style={{ fontFamily: 'var(--font-mono)' }}>
            Inspect →
          </span>
        </div>
      </button>

      {/* Archival Ledger Totals Table (Zero Points / Zero Income) */}
      <div className="border border-[#6b4e1c]/40 bg-[#efe5d0]/75 p-3">
        <div
          className="mb-2 flex items-center justify-between border-b border-[#6b4e1c]/30 pb-1 text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>Association Standing Summary</span>
          <span className="tabular-nums">{formatNumber(totals.totalMembers)} Files</span>
        </div>

        <dl
          className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <div className="border-b border-dotted border-[#8b765a]/40 pb-1">
            <dt className="text-[10px] text-[#5c4e40] uppercase">
              {totals.totalReportsCalled !== null ? 'Reports Called' : 'Field Responders'}
            </dt>
            <dd className="tabular-nums text-base font-bold text-[#1a1512]">
              {totals.totalReportsCalled !== null
                ? formatNumber(totals.totalReportsCalled)
                : formatNumber(totals.activeResponders)}
            </dd>
          </div>
          <div className="border-b border-dotted border-[#8b765a]/40 pb-1">
            <dt className="text-[10px] text-[#5c4e40] uppercase">Personnel Dispatched</dt>
            <dd className="tabular-nums text-base font-bold text-[#1a1512]">
              {formatNumber(totals.combinedReports)}
            </dd>
          </div>
          <div className="border-b border-dotted border-[#8b765a]/40 pb-1">
            <dt className="text-[10px] text-[#5c4e40] uppercase">Event Wins</dt>
            <dd className="tabular-nums text-base font-bold text-[#1a1512]">
              {formatNumber(totals.combinedEventWins)}
            </dd>
          </div>
          <div className="border-b border-dotted border-[#8b765a]/40 pb-1">
            <dt className="text-[10px] text-[#5c4e40] uppercase">Awards Held</dt>
            <dd className="tabular-nums text-base font-bold text-[#1a1512]">
              {formatNumber(totals.totalAwards)}
            </dd>
          </div>
          <div className="border-b border-dotted border-[#8b765a]/40 pb-1">
            <dt className="text-[10px] text-[#5c4e40] uppercase">Linked Referrals</dt>
            <dd className="tabular-nums text-base font-bold text-[#1a1512]">
              {formatNumber(totals.combinedReferrals)}
            </dd>
          </div>
          <div className="border-b border-dotted border-[#8b765a]/40 pb-1">
            <dt className="text-[10px] text-[#5c4e40] uppercase">Active Strikes</dt>
            <dd
              className={`tabular-nums text-base font-bold ${
                totals.activeStrikesCount > 0 ? 'text-[#8f1d1d]' : 'text-[#1d4d35]'
              }`}
            >
              {totals.activeStrikesCount} ({totals.flaggedMembers} files)
            </dd>
          </div>
        </dl>
      </div>

      {/* Inline Rolodex Filter Controls */}
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#5c4e40]" />
          <input
            type="text"
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Filter by alias, Discord ID, sponsor, award, or intent..."
            className="w-full border border-[#6b4e1c]/45 bg-[#faf4e8] py-1.5 pr-3 pl-8 text-xs text-[#1a1512] placeholder-[#6e5d4b] focus:border-[#8f1d1d] focus:outline-none"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeFilter(opt.id)}
                className={`brass-btn cursor-pointer border px-2 py-0.5 text-[11px] transition-colors ${
                  active
                    ? 'border-[#1a1512] bg-[#1a1512] text-[#f4ecdb]'
                    : 'border-[#6b4e1c]/45 bg-[#efe4ce] text-[#3d3126] hover:border-[#8f1d1d]'
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#8b765a]/30 pt-2">
          <label
            className="flex items-center gap-2 text-xs text-[#4c3e31]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span className="font-bold uppercase">Order By:</span>
            <select
              value={sort}
              onChange={(e) => onChangeSort(e.target.value as SortField)}
              className="cursor-pointer border border-[#6b4e1c]/45 bg-[#faf4e8] px-2 py-1 text-xs text-[#1a1512]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <span
            className="tabular-nums text-[11px] text-[#5c4e40]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Showing {formatNumber(filteredCount)} of {formatNumber(totalCount)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function IndexRightPage({
  members,
  sort,
  page,
  onChangePage,
  onSelectMember,
}: {
  members: MemberDossier[]
  sort: SortField
  page: number
  onChangePage: (page: number) => void
  onSelectMember: (discordId: string) => void
}) {
  const totalPages = Math.max(1, Math.ceil(members.length / INDEX_PAGE_SIZE))
  const safePage = Math.min(Math.max(0, page), totalPages - 1)
  const startIdx = safePage * INDEX_PAGE_SIZE
  const pageMembers = members.slice(startIdx, startIdx + INDEX_PAGE_SIZE)

  const metricHeader =
    sort === 'eventWins'
      ? 'WINS'
      : sort === 'referrals'
        ? 'RECRUITS'
        : sort === 'awards'
          ? 'AWARDS'
          : 'REPORTS'

  const getMetricValue = (m: MemberDossier): number => {
    if (sort === 'eventWins') return m.stats.eventWins
    if (sort === 'referrals') return m.stats.referrals
    if (sort === 'awards') return m.stats.awardsCount
    return m.stats.reports
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[#5c4e40]/45 pb-2.5">
        <h3
          className="text-lg font-bold tracking-wide text-[#1a1512]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Rolodex Registry
        </h3>
        <span
          className="text-[11px] font-bold tracking-wider text-[#5c4e40]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {metricHeader}
        </span>
      </div>

      {members.length === 0 ? (
        <div
          className="my-8 border border-dashed border-[#6b4e1c]/50 bg-[#efe5d0]/60 p-6 text-center text-xs text-[#4c3e31]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          No personnel files match the active filter. Clear the filter or query to restore the registry.
        </div>
      ) : (
        <>
          <ul className="divide-y divide-[#6b4e1c]/25">
            {pageMembers.map((m) => (
              <li key={m.discordId}>
                <button
                  type="button"
                  onClick={() => onSelectMember(m.discordId)}
                  className="group flex w-full cursor-pointer items-center justify-between gap-2.5 px-2 py-2 text-left transition-colors hover:bg-[#dfcfaf]/70"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="tabular-nums w-10 shrink-0 text-[11px] font-bold text-[#6e5d4b]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      #{m.id}
                    </span>
                    <PortraitFrame
                      username={m.username}
                      discordId={m.discordId}
                      rankTier={m.rankTier}
                      source={m.source}
                      initialUrl={m.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-[#1a1512] group-hover:text-[#8f1d1d]">
                          {m.username}
                        </span>
                        {m.totalActiveStrikes > 0 && (
                          <span
                            title={`${m.totalActiveStrikes} active strike(s)`}
                            className="inline-flex items-center gap-0.5 border border-[#8f1d1d]/60 bg-[#8f1d1d]/10 px-1 py-0.2 text-[9px] font-bold text-[#8f1d1d]"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            <ShieldAlert className="h-2.5 w-2.5" />
                            {m.totalActiveStrikes}
                          </span>
                        )}
                      </div>
                      <div
                        className="truncate text-[11px] text-[#5c4e40]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {m.position} · ID {m.discordId}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <span
                      className="tabular-nums text-xs font-bold text-[#1a1512]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {formatNumber(getMetricValue(m))}
                    </span>
                    <span
                      className="hidden sm:inline text-[10px] text-[#6e5d4b] group-hover:text-[#8f1d1d]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      →
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div
              className="mt-auto flex items-center justify-between border-t border-[#6b4e1c]/35 pt-2.5 text-[11px] text-[#4c3e31]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => onChangePage(safePage - 1)}
                className="brass-btn cursor-pointer border border-[#6b4e1c]/45 bg-[#efe4ce] px-2.5 py-1 font-bold hover:border-[#8f1d1d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Prev {INDEX_PAGE_SIZE}
              </button>
              <span className="tabular-nums font-bold">
                Directory Page {safePage + 1} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages - 1}
                onClick={() => onChangePage(safePage + 1)}
                className="brass-btn cursor-pointer border border-[#6b4e1c]/45 bg-[#efe4ce] px-2.5 py-1 font-bold hover:border-[#8f1d1d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next {INDEX_PAGE_SIZE} →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
