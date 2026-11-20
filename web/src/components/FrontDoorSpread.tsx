import { Sparkles, UserCheck } from 'lucide-react'
import type { MemberDossier } from '../types'

export type FrontDoorFilter = 'all' | 'interns' | 'promodue' | 'referred'

export function filterFrontDoorMembers(
  members: MemberDossier[],
  filter: FrontDoorFilter,
): MemberDossier[] {
  const sorted = [...members].sort((a, b) => {
    const ta = a.application.createdAt ? Date.parse(a.application.createdAt) : 0
    const tb = b.application.createdAt ? Date.parse(b.application.createdAt) : 0
    return tb - ta || b.id - a.id
  })

  return sorted.filter((m) => {
    if (filter === 'interns') return m.rankTier === 'intern'
    if (filter === 'promodue') return m.application.promotionReviewDue
    if (filter === 'referred') return Boolean(m.application.inviter || m.application.inviterId)
    return true
  })
}

function FrontDoorTicket({
  member,
  onSelectMember,
}: {
  member: MemberDossier
  onSelectMember: (discordId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelectMember(member.discordId)}
      className="group flex w-full cursor-pointer flex-col gap-2 border border-[#75624a]/50 bg-[#faf3e4]/90 p-3.5 text-left transition-colors hover:border-[#8f1d1d] hover:bg-[#fffaf0]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dotted border-[#8b765a]/45 pb-1.5">
        <div className="flex items-center gap-2">
          <span
            className="tabular-nums text-[11px] font-bold text-[#6e5d4b]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            #{member.id}
          </span>
          <span className="text-sm font-bold text-[#1a1512] group-hover:text-[#8f1d1d]">
            {member.username}
          </span>
          <span
            className="border border-[#6b4e1c]/40 bg-[#efe4ce] px-1.5 py-0.2 text-[10px] font-bold text-[#4c3e31]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {member.position}
          </span>
        </div>

        {member.application.promotionReviewDue ? (
          <span
            className="inline-flex items-center gap-1 border border-[#8c6118]/70 bg-[#e7ce8e]/55 px-1.5 py-0.5 text-[10px] font-bold text-[#543707]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <Sparkles className="h-3 w-3" />
            6+ WKS INTERN ALERT
          </span>
        ) : (
          <span
            className="tabular-nums text-[10px] text-[#5c4e40]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {member.application.formattedDate}
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-[#2c241d]" style={{ fontFamily: 'var(--font-mono)' }}>
        {member.application.isLegacyMigrated
          ? 'Legacy migrated dossier — no Front Door statement recorded.'
          : `“${member.application.reason}”`}
      </p>

      <div
        className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5c4e40]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span className="inline-flex items-center gap-1">
          <UserCheck className="h-3 w-3 text-[#4c3e31]" />
          Referrer:{' '}
          <strong className="text-[#1a1512]">
            {member.application.inviter ||
              (member.application.inviterId ? `ID ${member.application.inviterId}` : 'N/A')}
          </strong>
        </span>
        {member.application.weeksSinceApplication !== null && (
          <span className="tabular-nums">{member.application.weeksSinceApplication} weeks ago</span>
        )}
      </div>
    </button>
  )
}

export function FrontDoorSpreadPages({
  members,
  pageIndex,
  filter,
  onChangeFilter,
  onSelectMember,
}: {
  members: MemberDossier[]
  pageIndex: number
  filter: FrontDoorFilter
  onChangeFilter: (f: FrontDoorFilter) => void
  onSelectMember: (discordId: string) => void
}) {
  const perSide = 3
  const sliceStart = pageIndex * perSide * 2
  const leftItems = members.slice(sliceStart, sliceStart + perSide)
  const rightItems = members.slice(sliceStart + perSide, sliceStart + perSide * 2)

  const filterButtons: Array<{ id: FrontDoorFilter; label: string }> = [
    { id: 'all', label: 'All Filings' },
    { id: 'interns', label: 'Interns' },
    { id: 'promodue', label: '6-Wk Review Due' },
    { id: 'referred', label: 'With Referrer' },
  ]

  const left = (
    <div className="flex flex-col gap-4">
      <div className="border-b border-[#5c4e40]/45 pb-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
            Front Door Entry Log
          </h2>
          <span className="text-[10px] font-bold text-[#5c4e40] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            Strict Invite / Vouch Only
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => onChangeFilter(btn.id)}
              className={`brass-btn cursor-pointer border px-2 py-0.5 text-[10px] font-bold ${
                filter === btn.id
                  ? 'border-[#1a1512] bg-[#1a1512] text-[#f4ecdb]'
                  : 'border-[#6b4e1c]/45 bg-[#efe4ce] text-[#3d3126] hover:border-[#8f1d1d]'
              }`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {leftItems.length === 0 ? (
        <p className="py-8 text-center text-xs italic text-[#5c4e40]" style={{ fontFamily: 'var(--font-mono)' }}>
          No Front Door entries match this filter.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {leftItems.map((m) => (
            <FrontDoorTicket key={m.discordId} member={m} onSelectMember={onSelectMember} />
          ))}
        </div>
      )}
    </div>
  )

  const right = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#5c4e40]/45 pb-2.5">
        <h3 className="text-lg font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
          Continued Filings
        </h3>
        <span className="tabular-nums text-[11px] text-[#5c4e40]" style={{ fontFamily: 'var(--font-mono)' }}>
          {members.length} Entry Record{members.length === 1 ? '' : 's'}
        </span>
      </div>

      {rightItems.length === 0 ? (
        <div
          className="my-8 border border-dashed border-[#6b4e1c]/45 bg-[#efe5d0]/55 p-5 text-center text-xs text-[#5c4e40]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          End of Front Door register for this folio.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rightItems.map((m) => (
            <FrontDoorTicket key={m.discordId} member={m} onSelectMember={onSelectMember} />
          ))}
        </div>
      )}
    </div>
  )

  return { left, right }
}
