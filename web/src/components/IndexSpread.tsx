import { Search, ShieldAlert, Sparkles } from 'lucide-react'
import type { FilterMode, MemberDossier, RosterTotals, SortField } from '../types'
import { formatNumber } from './EngravedIcons'
import { PortraitFrame } from './PortraitFrame'

const FILTER_OPTIONS: Array<{ id: FilterMode; label: string }> = [
  { id: 'all', label: 'All Operatives' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'made', label: 'Made / Employee' },
  { id: 'intern', label: 'Interns' },
  { id: 'flagged', label: 'Flagged Strikes' },
  { id: 'awarded', label: 'Award Holders' },
  { id: 'promodue', label: 'Promo Review Due' },
]

const SORT_OPTIONS: Array<{ id: SortField; label: string }> = [
  { id: 'id', label: 'Rolodex #' },
  { id: 'points', label: 'Points' },
  { id: 'income', label: 'Income' },
  { id: 'reports', label: 'Field Reports' },
  { id: 'eventWins', label: 'Event Wins' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'recent', label: 'Recent Front Door' },
]

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
    if (filter === 'promodue' && !m.application.promotionReviewDue) return false

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
      case 'points':
        return b.stats.points - a.stats.points || a.id - b.id
      case 'income':
        return b.stats.income - a.stats.income || a.id - b.id
      case 'reports':
        return b.stats.reports - a.stats.reports || a.id - b.id
      case 'eventWins':
        return b.stats.eventWins - a.stats.eventWins || a.id - b.id
      case 'referrals':
        return b.stats.referrals - a.stats.referrals || a.id - b.id
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
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="border-b border-[#5c4e40]/45 pb-3">
        <div
          className="flex items-center justify-between text-[11px] text-[#5c4e40]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>CUSTOM ADVERSARIES ASSOCIATION</span>
          <span>FOLIO I · INDEX</span>
        </div>
        <h2
          className="mt-1.5 text-2xl font-bold tracking-wide text-[#1a1512]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Syndicate Master Directory
        </h2>
      </div>

      {/* Archival Ledger Totals Table */}
      <div className="border border-[#6b4e1c]/40 bg-[#efe5d0]/75 p-3.5">
        <div
          className="mb-2 flex items-center justify-between border-b border-[#6b4e1c]/30 pb-1.5 text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>Association Standing Summary</span>
          <span className="tabular-nums">{totals.totalMembers} Files on Record</span>
        </div>

        <dl
          className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <div className="border-b border-dotted border-[#8b765a]/40 pb-1">
            <dt className="text-[10px] text-[#5c4e40] uppercase">Combined Income</dt>
            <dd className="tabular-nums text-base font-bold text-[#1a1512]">
              {formatNumber(totals.combinedIncome)}
            </dd>
          </div>
          <div className="border-b border-dotted border-[#8b765a]/40 pb-1">
            <dt className="text-[10px] text-[#5c4e40] uppercase">Reports Answered</dt>
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
            <dt className="text-[10px] text-[#5c4e40] uppercase">Total Points</dt>
            <dd className="tabular-nums text-base font-bold text-[#1a1512]">
              {formatNumber(totals.combinedPoints)}
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
          <div className="border-b border-dotted border-[#8b765a]/40 pb-1">
            <dt className="text-[10px] text-[#5c4e40] uppercase">6-Wk Promo Alerts</dt>
            <dd
              className={`tabular-nums text-base font-bold ${
                totals.promoDueCount > 0 ? 'text-[#8c6118]' : 'text-[#1d4d35]'
              }`}
            >
              {totals.promoDueCount} Intern{totals.promoDueCount === 1 ? '' : 's'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Inline Rolodex Filter Controls */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#5c4e40]" />
          <input
            type="text"
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Filter by alias, Discord ID, sponsor, award, or intent..."
            className="w-full border border-[#6b4e1c]/45 bg-[#faf4e8] py-2 pr-3 pl-8 text-xs text-[#1a1512] placeholder-[#6e5d4b] focus:border-[#8f1d1d] focus:outline-none"
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
                className={`brass-btn cursor-pointer border px-2.5 py-1 text-[11px] transition-colors ${
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

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#8b765a]/30 pt-2.5">
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
            Showing {filteredCount} of {totalCount}
          </span>
        </div>
      </div>

      {/* Archivist Legend */}
      <div
        className="mt-auto border-t border-dotted border-[#6b4e1c]/45 pt-3 text-[11px] leading-relaxed text-[#4c3e31]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Click any entry in the Rolodex index opposite to turn straight to their personnel dossier, or press{' '}
        <span className="font-bold text-[#1a1512]">⌘K</span> from anywhere on the desk.
      </div>
    </div>
  )
}

export function IndexRightPage({
  members,
  sort,
  onSelectMember,
}: {
  members: MemberDossier[]
  sort: SortField
  onSelectMember: (discordId: string) => void
}) {
  const metricHeader =
    sort === 'income'
      ? 'INCOME'
      : sort === 'reports'
        ? 'REPORTS'
        : sort === 'eventWins'
          ? 'WINS'
          : sort === 'referrals'
            ? 'RECRUITS'
            : 'POINTS'

  const getMetricValue = (m: MemberDossier): number => {
    if (sort === 'income') return m.stats.income
    if (sort === 'reports') return m.stats.reports
    if (sort === 'eventWins') return m.stats.eventWins
    if (sort === 'referrals') return m.stats.referrals
    return m.stats.points
  }

  return (
    <div className="flex flex-col gap-3">
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
        <ul className="divide-y divide-[#6b4e1c]/25">
          {members.map((m) => (
            <li key={m.discordId}>
              <button
                type="button"
                onClick={() => onSelectMember(m.discordId)}
                className="group flex w-full cursor-pointer items-center justify-between gap-2.5 px-2 py-2 text-left transition-colors hover:bg-[#dfcfaf]/70"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="tabular-nums w-7 shrink-0 text-[11px] font-bold text-[#6e5d4b]"
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
                      {m.application.promotionReviewDue && (
                        <span
                          title="6-week Intern Promotion Follow-Up Due"
                          className="inline-flex items-center gap-0.5 border border-[#8c6118]/60 bg-[#8c6118]/12 px-1 py-0.2 text-[9px] font-bold text-[#6d490d]"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          PROMO DUE
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
      )}
    </div>
  )
}
