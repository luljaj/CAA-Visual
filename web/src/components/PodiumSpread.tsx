import { Trophy } from 'lucide-react'
import { useState } from 'react'
import type { MemberDossier, PodiumCategoryKey, PodiumEntry, PodiumResponse } from '../types'
import { formatNumber, MedallionSvg } from './EngravedIcons'
import { PortraitFrame } from './PortraitFrame'

const PODIUM_TABS: Array<{ key: PodiumCategoryKey; label: string; unit: string }> = [
  { key: 'points', label: 'Points', unit: 'PTS' },
  { key: 'income', label: 'Income', unit: 'DONATIONS' },
  { key: 'referrals', label: 'Referrals', unit: 'RECRUITS' },
  { key: 'eventwins', label: 'Event Wins', unit: 'WINS' },
  { key: 'reports', label: 'Reports', unit: 'REPORTS' },
]

export function PodiumLeftPage({
  podium,
  allMembers,
  onSelectMember,
}: {
  podium: PodiumResponse | null
  allMembers: MemberDossier[]
  onSelectMember: (discordId: string) => void
}) {
  const [category, setCategory] = useState<PodiumCategoryKey>('points')
  const activeTab = PODIUM_TABS.find((t) => t.key === category) ?? PODIUM_TABS[0]
  const entries: PodiumEntry[] = podium?.categories?.[category] ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-[#5c4e40]/45 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
            Honor Podium
          </h2>
          <Trophy className="h-4 w-4 text-[#8c6118]" />
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {PODIUM_TABS.map((tab) => {
            const active = category === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategory(tab.key)}
                className={`brass-btn cursor-pointer border px-2.5 py-1 text-[11px] font-bold ${
                  active
                    ? 'border-[#1a1512] bg-[#1a1512] text-[#f4ecdb]'
                    : 'border-[#6b4e1c]/45 bg-[#efe4ce] text-[#3d3126] hover:border-[#8f1d1d]'
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {entries.length === 0 ? (
        <div
          className="my-6 border border-dashed border-[#6b4e1c]/50 bg-[#efe5d0]/60 p-5 text-center text-xs text-[#4c3e31]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          No ranking entries available for {activeTab.label}.
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {entries.map((entry) => {
            const match = entry.discordId
              ? allMembers.find((m) => m.discordId === entry.discordId)
              : undefined
            const clickable = Boolean(match)
            const rankTint =
              entry.rank === 1
                ? 'border-[#9b711e] bg-[#f8edd0]'
                : entry.rank === 2
                  ? 'border-[#7c838a] bg-[#f2ede2]'
                  : 'border-[#8f5c38] bg-[#f3e6d3]'

            return (
              <li key={`${category}-${entry.rank}-${entry.username}`}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => match && onSelectMember(match.discordId)}
                  className={`flex w-full items-center justify-between gap-3 border p-3 text-left transition-colors ${rankTint} ${
                    clickable ? 'cursor-pointer hover:border-[#8f1d1d]' : 'cursor-default'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <MedallionSvg rank={entry.rank} />
                    {match && (
                      <div className="hidden min-[430px]:block shrink-0">
                        <PortraitFrame
                          username={match.username}
                          discordId={match.discordId}
                          rankTier={match.rankTier}
                          source={match.source}
                          initialUrl={match.avatarUrl}
                          size="sm"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-[#1a1512]">{entry.username}</div>
                      <div
                        className="text-[11px] leading-tight text-[#5c4e40]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {entry.position || match?.position || 'Operative'}
                        {entry.entryId ? ` · Entry #${entry.entryId}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                    <div className="tabular-nums text-lg font-bold text-[#1a1512]">
                      {formatNumber(entry.value)}
                    </div>
                    <div className="text-[10px] tracking-wider text-[#5c4e40]">{activeTab.unit}</div>
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <p
        className="mt-auto border-t border-dotted border-[#6b4e1c]/45 pt-3 text-[11px] text-[#4c3e31]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Mirrors the five Association pillars from <span className="font-bold">/podium</span>. Click any ranked operative on file to inspect their dossier.
      </p>
    </div>
  )
}

export function PodiumRightPage({
  podium,
  allMembers,
  onSelectMember,
}: {
  podium: PodiumResponse | null
  allMembers: MemberDossier[]
  onSelectMember: (discordId: string) => void
}) {
  const rankings = podium?.fieldRankings ?? []

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between border-b border-[#5c4e40]/45 pb-2.5">
        <h3 className="text-lg font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
          Field Rankings · Top 10
        </h3>
        <span className="text-[11px] font-bold text-[#5c4e40]" style={{ fontFamily: 'var(--font-mono)' }}>
          REPORTS ANSWERED
        </span>
      </div>

      {rankings.length === 0 ? (
        <p className="py-8 text-center text-xs italic text-[#5c4e40]" style={{ fontFamily: 'var(--font-mono)' }}>
          No field ranking data available.
        </p>
      ) : (
        <ol className="divide-y divide-[#6b4e1c]/25">
          {rankings.map((entry) => {
            const match = entry.discordId
              ? allMembers.find((m) => m.discordId === entry.discordId)
              : undefined
            const topThree = entry.rank <= 3
            return (
              <li key={`field-${entry.rank}-${entry.username}`}>
                <button
                  type="button"
                  disabled={!match}
                  onClick={() => match && onSelectMember(match.discordId)}
                  className={`flex w-full items-center justify-between gap-3 px-2 py-2 text-left transition-colors ${
                    match ? 'cursor-pointer hover:bg-[#dfcfaf]/70' : 'cursor-default'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex w-7 shrink-0 items-center justify-center">
                      {topThree ? (
                        <MedallionSvg rank={entry.rank} />
                      ) : (
                        <span
                          className="tabular-nums text-xs font-bold text-[#5c4e40]"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span
                        className={`block truncate text-sm ${
                          topThree ? 'font-bold text-[#1a1512]' : 'font-semibold text-[#2e251e]'
                        }`}
                      >
                        {entry.username}
                      </span>
                      <span
                        className="block truncate text-[10px] text-[#5c4e40]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {entry.position || match?.position || 'Operative'}
                      </span>
                    </div>
                  </div>

                  <span
                    className="tabular-nums shrink-0 text-sm font-bold text-[#1a1512]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {formatNumber(entry.value)}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
