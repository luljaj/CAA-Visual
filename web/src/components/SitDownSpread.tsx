import { ArrowLeftRight, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { MemberDossier } from '../types'
import { formatNumber } from './EngravedIcons'
import { PortraitFrame } from './PortraitFrame'

function SitDownColumn({
  sideLabel,
  member,
  opponent,
  allMembers,
  onChangeMember,
  onOpenDossier,
}: {
  sideLabel: string
  member: MemberDossier
  opponent: MemberDossier
  allMembers: MemberDossier[]
  onChangeMember: (discordId: string) => void
  onOpenDossier: (discordId: string) => void
}) {
  const rows: Array<{ label: string; mine: number; theirs: number; lowerIsBetter?: boolean }> = [
    { label: 'Field Reports', mine: member.stats.reports, theirs: opponent.stats.reports },
    { label: 'Event Wins', mine: member.stats.eventWins, theirs: opponent.stats.eventWins },
    { label: 'Referrals', mine: member.stats.referrals, theirs: opponent.stats.referrals },
    { label: 'Awards Held', mine: member.stats.awardsCount, theirs: opponent.stats.awardsCount },
    {
      label: 'Active Strikes',
      mine: member.totalActiveStrikes,
      theirs: opponent.totalActiveStrikes,
      lowerIsBetter: true,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex items-center justify-between gap-2 border-b border-[#5c4e40]/45 pb-2"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span className="text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase">
          {sideLabel}
        </span>
        <select
          aria-label={`Select operative for ${sideLabel}`}
          value={member.discordId}
          onChange={(e) => onChangeMember(e.target.value)}
          className="cursor-pointer border border-[#6b4e1c]/45 bg-[#faf4e8] px-2 py-1 text-xs font-bold text-[#1a1512]"
        >
          {allMembers.map((m) => (
            <option key={m.discordId} value={m.discordId}>
              #{m.id} · {m.username} ({m.position})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start gap-4">
        <PortraitFrame
          username={member.username}
          discordId={member.discordId}
          rankTier={member.rankTier}
          source={member.source}
          initialUrl={member.avatarUrl}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpenDossier(member.discordId)}
            className="cursor-pointer text-left text-xl font-bold text-[#1a1512] underline decoration-[#8f1d1d]/30 underline-offset-4 hover:text-[#8f1d1d]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {member.username}
          </button>
          <p className="mt-0.5 text-xs font-bold text-[#4c3e31]" style={{ fontFamily: 'var(--font-mono)' }}>
            {member.position} · Entry #{member.id}
          </p>
          <p className="mt-1 text-[11px] text-[#5c4e40]" style={{ fontFamily: 'var(--font-mono)' }}>
            Filed: {member.application.formattedDate}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
            {member.totalActiveStrikes === 0 ? (
              <span className="inline-flex items-center gap-1 text-[#1d4d35]">
                <ShieldCheck className="h-3.5 w-3.5" /> Clean Sheet
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#8f1d1d]">
                <ShieldAlert className="h-3.5 w-3.5" /> {member.totalActiveStrikes} Active Strike(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Synchronized Comparison Table */}
      <div className="border border-[#6b4e1c]/40 bg-[#faf3e4]/85 p-3.5">
        <div className="divide-y divide-[#6b4e1c]/25" style={{ fontFamily: 'var(--font-mono)' }}>
          {rows.map((r) => {
            const wins = r.lowerIsBetter ? r.mine < r.theirs : r.mine > r.theirs
            const tied = r.mine === r.theirs
            return (
              <div key={r.label} className="flex items-center justify-between py-2 text-xs">
                <span className="text-[#4c3e31]">{r.label}</span>
                <div className="flex items-center gap-2">
                  {wins && (
                    <span className="border border-[#8c6118]/65 bg-[#e7ce8e]/70 px-1.5 py-0.2 text-[9px] font-bold text-[#543707] uppercase">
                      Leads
                    </span>
                  )}
                  {tied && (
                    <span className="text-[10px] text-[#6e5d4b]">Even</span>
                  )}
                  <span
                    className={`tabular-nums min-w-[60px] text-right text-sm font-bold ${
                      wins ? 'text-[#1d4d35]' : 'text-[#1a1512]'
                    }`}
                  >
                    {formatNumber(r.mine)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-dotted border-[#6b4e1c]/45 pt-2.5 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
        <span className="block text-[10px] font-bold text-[#5c4e40] uppercase">Stated Intent</span>
        <p className="mt-1 italic text-[#3d3126]">
          {member.application.isLegacyMigrated ? 'Legacy Migration Record' : `“${member.application.reason}”`}
        </p>
      </div>
    </div>
  )
}

export function SitDownLeftPage({
  leftMember,
  rightMember,
  allMembers,
  onChangeLeft,
  onSwapSides,
  onOpenDossier,
}: {
  leftMember: MemberDossier
  rightMember: MemberDossier
  allMembers: MemberDossier[]
  onChangeLeft: (discordId: string) => void
  onSwapSides: () => void
  onOpenDossier: (discordId: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
          Side-by-Side Comparison
        </h2>
        <button
          type="button"
          onClick={onSwapSides}
          className="brass-btn inline-flex cursor-pointer items-center gap-1 border border-[#6b4e1c]/45 bg-[#efe4ce] px-2 py-1 text-[11px] font-bold text-[#3d3126] hover:border-[#8f1d1d]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <ArrowLeftRight className="h-3 w-3" />
          <span>Swap Sides</span>
        </button>
      </div>

      <SitDownColumn
        sideLabel="Employee A"
        member={leftMember}
        opponent={rightMember}
        allMembers={allMembers}
        onChangeMember={onChangeLeft}
        onOpenDossier={onOpenDossier}
      />
    </div>
  )
}

export function SitDownRightPage({
  leftMember,
  rightMember,
  allMembers,
  onChangeRight,
  onOpenDossier,
}: {
  leftMember: MemberDossier
  rightMember: MemberDossier
  allMembers: MemberDossier[]
  onChangeRight: (discordId: string) => void
  onOpenDossier: (discordId: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
          Opposite Ledger
        </h2>
      </div>

      <SitDownColumn
        sideLabel="Employee B"
        member={rightMember}
        opponent={leftMember}
        allMembers={allMembers}
        onChangeMember={onChangeRight}
        onOpenDossier={onOpenDossier}
      />
    </div>
  )
}
