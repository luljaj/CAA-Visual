import { Check, Copy, ExternalLink, RotateCcw, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import type { CustomStamp, MemberDossier } from '../types'
import { formatNumber, groupAwards } from './EngravedIcons'
import { PortraitFrame } from './PortraitFrame'

function stampColorClasses(ink: CustomStamp['ink']): string {
  switch (ink) {
    case 'crimson':
      return 'border-[#8f1d1d] text-[#8f1d1d] bg-[#8f1d1d]/[0.06]'
    case 'forest':
      return 'border-[#1d4d35] text-[#1d4d35] bg-[#1d4d35]/[0.06]'
    case 'gold':
      return 'border-[#8c6118] text-[#7a5210] bg-[#8c6118]/[0.08]'
    case 'ink':
    default:
      return 'border-[#1a1512] text-[#1a1512] bg-[#1a1512]/[0.05]'
  }
}

export function DossierLeftPage({
  member,
  folioIndex,
  totalFolios,
  allMembers,
  onSelectMember,
}: {
  member: MemberDossier
  folioIndex: number
  totalFolios: number
  allMembers: MemberDossier[]
  onSelectMember: (discordId: string) => void
}) {
  const [copiedId, setCopiedId] = useState(false)

  const copyId = () => {
    void navigator.clipboard?.writeText(member.discordId)
    setCopiedId(true)
    window.setTimeout(() => setCopiedId(false), 1400)
  }

  const referrerMember = member.application.inviterId
    ? allMembers.find((m) => m.discordId === member.application.inviterId)
    : allMembers.find(
        (m) =>
          member.application.inviter &&
          m.username.toLowerCase() === member.application.inviter.toLowerCase(),
      )

  const standingStamp =
    member.totalActiveStrikes > 0
      ? { text: 'UNDER SCRUTINY', color: 'border-[#8f1d1d] text-[#8f1d1d]' }
      : member.application.promotionReviewDue
        ? { text: 'PROMO REVIEW DUE', color: 'border-[#8c6118] text-[#7a5210]' }
        : member.rankTier === 'intern'
          ? { text: 'INTERN · PROBATION', color: 'border-[#4c3e31] text-[#4c3e31]' }
          : { text: 'MADE MEMBER', color: 'border-[#1d4d35] text-[#1d4d35]' }

  return (
    <div className="flex flex-col gap-4">
      {/* Running Document Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b border-[#5c4e40]/45 pb-2 text-[11px] text-[#4c3e31]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span className="font-bold tracking-wider">ROLODEX ENTRY #{member.id}</span>
        <span className="tabular-nums">
          FOLIO {folioIndex + 1} OF {totalFolios}
        </span>
      </div>

      {/* Portrait + Identity + Status Stamp */}
      <div className="relative flex flex-col gap-4 pt-2 sm:flex-row sm:items-start">
        <PortraitFrame
          username={member.username}
          discordId={member.discordId}
          rankTier={member.rankTier}
          source={member.source}
          initialUrl={member.avatarUrl}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2
                className="text-2xl font-bold leading-tight text-[#1a1512]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {member.username}
              </h2>
              {member.displayName && member.displayName !== member.username && (
                <p className="text-xs italic text-[#4c3e31]">{member.displayName}</p>
              )}
            </div>

            <div
              className={`shrink-0 -rotate-[4deg] border-2 px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] uppercase ${standingStamp.color}`}
              style={{ fontFamily: 'var(--font-stamp)' }}
            >
              {standingStamp.text}
            </div>
          </div>

          <dl
            className="mt-3 grid grid-cols-1 gap-1.5 text-xs"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <div className="flex items-center justify-between border-b border-dotted border-[#8b765a]/45 pb-1">
              <dt className="text-[#5c4e40] uppercase">Position</dt>
              <dd className="font-bold text-[#1a1512]">{member.position}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-dotted border-[#8b765a]/45 pb-1">
              <dt className="text-[#5c4e40] uppercase">Discord ID</dt>
              <dd className="flex items-center gap-1.5">
                <span className="tabular-nums text-[11px] font-bold text-[#1a1512]">
                  {member.discordId}
                </span>
                <button
                  type="button"
                  onClick={copyId}
                  title="Copy Discord User ID"
                  className="cursor-pointer border border-[#6b4e1c]/40 bg-[#efe4ce] p-0.5 text-[#4c3e31] hover:border-[#8f1d1d]"
                >
                  {copiedId ? <Check className="h-3 w-3 text-[#1d4d35]" /> : <Copy className="h-3 w-3" />}
                </button>
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-dotted border-[#8b765a]/45 pb-1">
              <dt className="text-[#5c4e40] uppercase">Entry Origin</dt>
              <dd className="font-bold text-[#4c3e31]">
                {member.application.isLegacyMigrated ? 'Legacy Server Migration' : 'Front Door Filing'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Typed Front Door Application Carbon Slip */}
      <div className="relative border border-[#75624a]/60 bg-[#faf3e4] p-4 shadow-[0_2px_8px_rgba(26,21,18,0.08)]">
        <div className="mb-2.5 flex items-center justify-between border-b border-[#75624a]/35 pb-1.5">
          <h3
            className="text-xs font-bold tracking-[0.14em] text-[#1a1512] uppercase"
            style={{ fontFamily: 'var(--font-stamp)' }}
          >
            Front Door Entry Request
          </h3>
          <span
            className="tabular-nums text-[10px] text-[#5c4e40]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {member.application.formattedDate}
          </span>
        </div>

        <div className="space-y-2.5 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
          <div>
            <span className="block text-[10px] font-bold tracking-wider text-[#5c4e40] uppercase">
              Roblox Alias Submitted
            </span>
            <span className="font-bold text-[#1a1512]">
              {member.application.robloxUsername || member.username}
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-bold tracking-wider text-[#5c4e40] uppercase">
              Stated Intent
            </span>
            <p className="mt-0.5 whitespace-pre-wrap leading-relaxed text-[#1a1512]">
              {member.application.isLegacyMigrated
                ? 'Unknown (Imported during historical server migration)'
                : `“${member.application.reason}”`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dotted border-[#8b765a]/45 pt-2">
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-[#5c4e40] uppercase">
                Referrer / Sponsor
              </span>
              {referrerMember ? (
                <button
                  type="button"
                  onClick={() => onSelectMember(referrerMember.discordId)}
                  className="inline-flex cursor-pointer items-center gap-1 font-bold text-[#8f1d1d] underline decoration-[#8f1d1d]/40 underline-offset-2 hover:text-[#5c0d0d]"
                >
                  <span>
                    {referrerMember.username} (Entry #{referrerMember.id})
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              ) : (
                <span className="font-bold text-[#1a1512]">
                  {member.application.inviter ||
                    (member.application.inviterId ? `ID ${member.application.inviterId}` : 'Direct / N/A')}
                </span>
              )}
            </div>

            {member.application.weeksSinceApplication !== null && (
              <div className="text-right">
                <span className="block text-[10px] font-bold tracking-wider text-[#5c4e40] uppercase">
                  Tenure
                </span>
                <span
                  className={`tabular-nums font-bold ${
                    member.application.promotionReviewDue ? 'text-[#8c6118]' : 'text-[#4c3e31]'
                  }`}
                >
                  {member.application.weeksSinceApplication} wks on file
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recruitment Lineage */}
      <div className="border-t border-[#6b4e1c]/35 pt-3">
        <div
          className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>Recruited Operatives ({member.stats.referrals})</span>
          {member.invitees.length > 0 && <span className="text-[10px] text-[#5c4e40]">Click to flip</span>}
        </div>

        {member.invitees.length === 0 ? (
          <p className="text-xs italic text-[#5c4e40]" style={{ fontFamily: 'var(--font-mono)' }}>
            No Front Door recruits attributed on file.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {member.invitees.map((inv) => {
              const target = allMembers.find((m) => m.discordId === inv.discordId)
              return (
                <button
                  key={inv.discordId}
                  type="button"
                  disabled={!target}
                  onClick={() => target && onSelectMember(target.discordId)}
                  className="brass-btn inline-flex cursor-pointer items-center gap-1 border border-[#6b4e1c]/45 bg-[#efe4ce] px-2 py-1 text-[11px] font-bold text-[#1a1512] hover:border-[#8f1d1d] hover:text-[#8f1d1d] disabled:cursor-default disabled:opacity-70"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <span>{inv.robloxUsername}</span>
                  {inv.entryId && <span className="text-[#5c4e40]">#{inv.entryId}</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function DossierRightPage({
  member,
  allMembers,
  customStamps,
  marginNote,
  onRemoveStamp,
  onChangeMarginNote,
}: {
  member: MemberDossier
  allMembers: MemberDossier[]
  customStamps: CustomStamp[]
  marginNote: string
  onRemoveStamp: (stampId: string) => void
  onChangeMarginNote: (note: string) => void
}) {
  const maxStat = (key: keyof MemberDossier['stats']) => {
    let max = 1
    for (const m of allMembers) {
      const val = Number(m.stats[key] ?? 0)
      if (val > max) max = val
    }
    return max
  }

  const metrics: Array<{
    key: 'points' | 'income' | 'eventWins' | 'reports' | 'referrals'
    label: string
    value: number
    rank: number
    max: number
  }> = [
    {
      key: 'points',
      label: 'Syndicate Points',
      value: member.stats.points,
      rank: member.ranks.points,
      max: maxStat('points'),
    },
    {
      key: 'income',
      label: 'Donations / Income',
      value: member.stats.income,
      rank: member.ranks.income,
      max: maxStat('income'),
    },
    {
      key: 'reports',
      label: 'Teamer Reports',
      value: member.stats.reports,
      rank: member.ranks.reports,
      max: maxStat('reports'),
    },
    {
      key: 'eventWins',
      label: 'Event Wins',
      value: member.stats.eventWins,
      rank: member.ranks.eventWins,
      max: maxStat('eventWins'),
    },
    {
      key: 'referrals',
      label: 'Referrals Credited',
      value: member.stats.referrals,
      rank: member.ranks.referrals,
      max: maxStat('referrals'),
    },
  ]

  const groupedAwards = groupAwards(member.stats.awards)

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Top Header + Custom Slammed Stamps */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#5c4e40]/45 pb-2">
        <div>
          <h3
            className="text-lg font-bold tracking-wide text-[#1a1512]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Performance &amp; Standing Ledger
          </h3>
        </div>

        <span
          className="text-[10px] font-bold tracking-[0.18em] text-[#8f1d1d] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          CONFIDENTIAL
        </span>
      </div>

      {/* Slammed Custom Rubber Stamps (if any) */}
      {customStamps.length > 0 && (
        <div className="flex flex-wrap gap-2 py-0.5">
          {customStamps.map((stamp) => (
            <button
              key={stamp.id}
              type="button"
              onClick={() => onRemoveStamp(stamp.id)}
              title="Click to lift stamp"
              style={
                {
                  fontFamily: 'var(--font-stamp)',
                  '--stamp-rot': `${stamp.rotation}deg`,
                  transform: `rotate(${stamp.rotation}deg)`,
                } as React.CSSProperties
              }
              className={`stamp-slam group relative inline-flex cursor-pointer items-center gap-1.5 border-2 px-2.5 py-0.5 text-xs font-bold tracking-[0.16em] uppercase ${stampColorClasses(
                stamp.ink,
              )}`}
            >
              <span>{stamp.label}</span>
              <X className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      {/* Double-Entry 5-Pillar Performance Ledger */}
      <div className="border border-[#6b4e1c]/40 bg-[#faf3e4]/80 p-3.5">
        <div className="space-y-2.5">
          {metrics.map((row) => {
            const pct = Math.max(4, Math.min(100, Math.round((row.value / row.max) * 100)))
            const isTopThree = row.rank > 0 && row.rank <= 3
            return (
              <div key={row.key} className="space-y-1">
                <div
                  className="flex items-baseline justify-between text-xs"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <span className="font-bold text-[#3d3126]">{row.label}</span>
                  <div className="flex items-baseline gap-2.5">
                    {row.rank > 0 && (
                      <span
                        className={`tabular-nums px-1.5 py-0.2 text-[10px] font-bold ${
                          isTopThree
                            ? 'border border-[#8c6118]/65 bg-[#e8cf90]/60 text-[#543707]'
                            : 'text-[#6e5d4b]'
                        }`}
                      >
                        Rank #{row.rank}
                      </span>
                    )}
                    <span className="tabular-nums min-w-[54px] text-right text-sm font-bold text-[#1a1512]">
                      {formatNumber(row.value)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden bg-[#dfd0b1]">
                  <div
                    className="h-full transition-[width] duration-300"
                    style={{
                      width: `${row.value === 0 ? 0 : pct}%`,
                      backgroundColor: isTopThree ? '#8c6118' : '#3e3328',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Decorations & Awards */}
      <div className="border-t border-[#6b4e1c]/35 pt-3">
        <div
          className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>Awards &amp; Citations ({member.stats.awards.length})</span>
        </div>

        {groupedAwards.length === 0 ? (
          <p className="text-xs italic text-[#5c4e40]" style={{ fontFamily: 'var(--font-mono)' }}>
            No formal citations recorded.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {groupedAwards.map((aw) => (
              <span
                key={aw.name}
                className="inline-flex items-center gap-1 border border-[#9f7224]/60 bg-[#f6ebd3] px-2 py-0.5 text-[11px] font-bold text-[#4a320a]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <span>{aw.name}</span>
                {aw.count > 1 && <span className="tabular-nums text-[#8c6118]">({aw.count}x)</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Disciplinary Sheet (Strikes) */}
      <div className="border-t border-[#6b4e1c]/35 pt-3">
        <div
          className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>Disciplinary Record</span>
          <span
            className={`tabular-nums font-bold ${
              member.totalActiveStrikes > 0 ? 'text-[#8f1d1d]' : 'text-[#1d4d35]'
            }`}
          >
            {member.totalActiveStrikes} Active Strike{member.totalActiveStrikes === 1 ? '' : 's'}
          </span>
        </div>

        {member.strikes.length === 0 ? (
          <div
            className="flex items-center gap-2 border border-[#1d4d35]/45 bg-[#1d4d35]/[0.07] px-3 py-2 text-xs font-bold text-[#1d4d35]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>CLEAN SHEET — NO ACTIVE INFRACTIONS ON FILE</span>
          </div>
        ) : (
          <ul className="space-y-2">
            {member.strikes.map((st, idx) => (
              <li
                key={`${st.createdAt ?? idx}-${idx}`}
                className="border border-[#8f1d1d]/45 bg-[#8f1d1d]/[0.05] px-3 py-2 text-xs"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <div className="flex items-center justify-between font-bold text-[#8f1d1d]">
                  <span className="inline-flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Strike · Issued {st.formattedIssued} · ×{st.count}
                  </span>
                  <span className="tabular-nums text-[11px]">
                    {st.daysRemaining !== null ? `${st.daysRemaining}d left` : st.formattedExpires}
                  </span>
                </div>
                <p className="mt-1 text-[#1a1512]">{st.reason}</p>
                <p className="mt-0.5 text-[10px] text-[#5c4e40]">
                  Issued by: {st.issuedByName ?? (st.issuedBy ? `ID ${st.issuedBy}` : 'Command')} · Expires{' '}
                  {st.formattedExpires}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Handwritten Pencil Margin Notes */}
      <div className="mt-auto border-t border-dotted border-[#6b4e1c]/45 pt-2.5">
        <div className="mb-1 flex items-center justify-between">
          <label
            htmlFor={`note-${member.discordId}`}
            className="text-[11px] font-bold tracking-wider text-[#5c4e40] uppercase"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Archivist Pencil Margin Notes
          </label>
          {marginNote && (
            <button
              type="button"
              onClick={() => onChangeMarginNote('')}
              title="Erase margin note"
              className="inline-flex cursor-pointer items-center gap-1 text-[10px] text-[#6e5d4b] hover:text-[#8f1d1d]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <RotateCcw className="h-2.5 w-2.5" />
              <span>Erase</span>
            </button>
          )}
        </div>
        <textarea
          id={`note-${member.discordId}`}
          rows={2}
          value={marginNote}
          onChange={(e) => onChangeMarginNote(e.target.value)}
          placeholder="Jot private commission remarks in pencil..."
          className="w-full resize-none border border-[#8b765a]/40 bg-[#f8f0dc]/70 px-2.5 py-1.5 text-lg leading-snug text-[#2f2924] placeholder-[#7d6c58] focus:border-[#8f1d1d] focus:outline-none"
          style={{ fontFamily: 'var(--font-hand)' }}
        />
      </div>
    </div>
  )
}
