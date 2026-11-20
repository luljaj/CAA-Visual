import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MemberDossier } from '../types'
import { PortraitFrame } from './PortraitFrame'

export function SearchPalette({
  open,
  members,
  onClose,
  onSelectMember,
}: {
  open: boolean
  members: MemberDossier[]
  onClose: () => void
  onSelectMember: (discordId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      inputRef.current?.focus()
    }
  }, [open])

  const { results, totalMatches } = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return { results: members.slice(0, 12), totalMatches: members.length }
    }

    const scored: Array<{ member: MemberDossier; score: number }> = []
    for (const m of members) {
      const uname = m.username.toLowerCase()
      const dname = m.displayName.toLowerCase()
      const idStr = String(m.id)
      const qClean = q.startsWith('#') ? q.slice(1) : q

      let score = 0
      if (idStr === qClean || m.discordId === q) score = 100
      else if (uname === q || dname === q) score = 95
      else if (uname.startsWith(q) || dname.startsWith(q)) score = 80
      else if (uname.includes(q) || dname.includes(q)) score = 60
      else {
        const hay = [
          m.discordId,
          idStr,
          m.position,
          m.application.inviter ?? '',
          m.application.reason,
          ...m.stats.awards,
        ]
          .join(' ')
          .toLowerCase()
        if (hay.includes(q)) score = 30
      }

      if (score > 0) {
        scored.push({ member: m, score })
      }
    }

    scored.sort((a, b) => b.score - a.score || a.member.id - b.member.id)
    return {
      results: scored.slice(0, 12).map((s) => s.member),
      totalMatches: scored.length,
    }
  }, [members, query])

  useEffect(() => {
    setCursor(0)
  }, [results.length, query])

  if (!open) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => (results.length ? (c + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => (results.length ? (c - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter' && results[cursor]) {
      e.preventDefault()
      onSelectMember(results[cursor].discordId)
      onClose()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Rolodex"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[12vh]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl border border-[#d7b262]/65 bg-[#f4ecdb] text-[#1a1512] shadow-[0_24px_60px_rgba(0,0,0,0.85)]"
      >
        <div className="flex items-center gap-2.5 border-b border-[#6b4e1c]/40 bg-[#eadcc2] px-4 py-3">
          <Search className="h-4 w-4 text-[#8f1d1d]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find operative by alias, Discord ID, Rolodex #, sponsor, or award..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[#1a1512] placeholder-[#6e5d4b] focus:outline-none"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="cursor-pointer p-1 text-[#4c3e31] hover:text-[#8f1d1d]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="ledger-scroll max-h-[360px] divide-y divide-[#6b4e1c]/20 overflow-y-auto">
          {results.length === 0 ? (
            <li
              className="px-4 py-8 text-center text-xs text-[#5c4e40]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              No matching Rolodex entries found.
            </li>
          ) : (
            results.map((m, idx) => {
              const selected = idx === cursor
              return (
                <li key={m.discordId}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => {
                      onSelectMember(m.discordId)
                      onClose()
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left ${
                      selected ? 'bg-[#e3d2b0]' : 'hover:bg-[#ede0c6]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <PortraitFrame
                        username={m.username}
                        discordId={m.discordId}
                        rankTier={m.rankTier}
                        source={m.source}
                        initialUrl={m.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-[#1a1512]">
                          #{m.id} · {m.username}
                        </div>
                        <div
                          className="truncate text-[11px] text-[#5c4e40]"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {m.position} · ID {m.discordId}
                          {m.application.inviter ? ` · Ref: ${m.application.inviter}` : ''}
                        </div>
                      </div>
                    </div>
                    <span
                      className="shrink-0 text-[11px] font-bold text-[#8f1d1d]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      Open →
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>

        <div
          className="flex items-center justify-between border-t border-[#6b4e1c]/30 bg-[#eadcc2]/75 px-4 py-1.5 text-[10px] text-[#5c4e40]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>
            {totalMatches > results.length
              ? `Showing top ${results.length} of ${totalMatches} matches`
              : `${totalMatches} match${totalMatches === 1 ? '' : 'es'}`}
          </span>
          <span>↑↓ Navigate · Enter to Flip · Esc</span>
        </div>
      </div>
    </div>
  )
}
