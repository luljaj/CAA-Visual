import { GitBranch, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { MemberDossier } from '../types'
import { formatNumber } from './EngravedIcons'

interface TreeNode {
  member: MemberDossier
  children: TreeNode[]
  x: number
  y: number
}

interface TreeEdge {
  from: TreeNode
  to: TreeNode
}

function buildLineageForest(members: MemberDossier[]) {
  const byId = new Map<string, MemberDossier>()
  for (const m of members) byId.set(m.discordId, m)

  const childrenMap = new Map<string, MemberDossier[]>()
  const roots: MemberDossier[] = []

  for (const m of members) {
    const invId = m.application.inviterId
    if (invId && invId !== m.discordId && byId.has(invId)) {
      const list = childrenMap.get(invId) ?? []
      list.push(m)
      childrenMap.set(invId, list)
    } else {
      roots.push(m)
    }
  }

  // Separate connected lineage roots (have >=1 child) from solo direct entries
  const treeRoots = roots.filter((r) => (childrenMap.get(r.discordId)?.length ?? 0) > 0)
  const soloMembers = roots.filter((r) => (childrenMap.get(r.discordId)?.length ?? 0) === 0)

  const visited = new Set<string>()
  const buildNode = (member: MemberDossier): TreeNode => {
    visited.add(member.discordId)
    const kids = (childrenMap.get(member.discordId) ?? []).filter((k) => !visited.has(k.discordId))
    return {
      member,
      children: kids.map(buildNode),
      x: 0,
      y: 0,
    }
  }

  const forest = treeRoots.map(buildNode)

  // Assign hierarchical layout coordinates (top-down leaves spaced horizontally)
  const nodeW = 152
  const gapX = 16
  const levelH = 92
  let cursorX = 24

  const assignPositions = (node: TreeNode, depth: number): [number, number] => {
    node.y = 40 + depth * levelH
    if (node.children.length === 0) {
      node.x = cursorX
      cursorX += nodeW + gapX
      return [node.x, node.x]
    }
    let minC = Infinity
    let maxC = -Infinity
    for (const child of node.children) {
      const [cMin, cMax] = assignPositions(child, depth + 1)
      minC = Math.min(minC, cMin)
      maxC = Math.max(maxC, cMax)
    }
    node.x = (minC + maxC) / 2
    return [minC, maxC]
  }

  for (const root of forest) {
    assignPositions(root, 0)
    cursorX += 28
  }

  const allNodes: TreeNode[] = []
  const edges: TreeEdge[] = []
  let maxY = 180

  const collect = (node: TreeNode) => {
    allNodes.push(node)
    maxY = Math.max(maxY, node.y + 70)
    for (const child of node.children) {
      edges.push({ from: node, to: child })
      collect(child)
    }
  }
  for (const root of forest) collect(root)

  const width = Math.max(540, cursorX + 24)
  const height = Math.max(360, maxY + 30)

  return { forest, allNodes, edges, soloMembers, childrenMap, byId, width, height }
}

function getBranchSet(
  focusId: string | null,
  byId: Map<string, MemberDossier>,
  childrenMap: Map<string, MemberDossier[]>,
): Set<string> {
  const active = new Set<string>()
  if (!focusId) return active

  // Walk upstream sponsors
  let cur: string | null = focusId
  const guard = new Set<string>()
  while (cur && !guard.has(cur)) {
    guard.add(cur)
    active.add(cur)
    const m = byId.get(cur)
    cur = m?.application.inviterId ?? null
  }

  // Walk downstream recruits
  const queue = [focusId]
  while (queue.length > 0) {
    const id = queue.shift()!
    active.add(id)
    for (const child of childrenMap.get(id) ?? []) {
      if (!active.has(child.discordId)) {
        queue.push(child.discordId)
      }
    }
  }
  return active
}

export function LineageLeftPage({
  members,
  hoveredId,
  onHoverMember,
  onSelectMember,
}: {
  members: MemberDossier[]
  hoveredId: string | null
  onHoverMember: (id: string | null) => void
  onSelectMember: (discordId: string) => void
}) {
  const { forest, soloMembers, childrenMap, byId } = useMemo(() => buildLineageForest(members), [members])
  const focused = hoveredId ? byId.get(hoveredId) ?? members[0] : members[0]

  const branchSummary = useMemo(() => {
    if (!focused) return { totalDescendants: 0, branchIncome: 0 }
    const descendants = new Set<string>()
    const q = [...(childrenMap.get(focused.discordId) ?? [])]
    while (q.length > 0) {
      const next = q.shift()!
      if (!descendants.has(next.discordId)) {
        descendants.add(next.discordId)
        q.push(...(childrenMap.get(next.discordId) ?? []))
      }
    }
    let income = focused.stats.income
    for (const did of descendants) {
      income += byId.get(did)?.stats.income ?? 0
    }
    return { totalDescendants: descendants.size, branchIncome: income }
  }, [focused, childrenMap, byId])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#5c4e40]/45 pb-2.5">
        <h2 className="text-xl font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
          Syndicate Referral Lineage
        </h2>
        <GitBranch className="h-4 w-4 text-[#8f1d1d]" />
      </div>

      {/* Selected / Hovered Branch Inspector */}
      {focused && (
        <div className="border border-[#6b4e1c]/45 bg-[#faf3e4]/85 p-3.5">
          <div className="flex items-start justify-between gap-2 border-b border-dotted border-[#8b765a]/45 pb-2">
            <div>
              <div className="text-base font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
                {focused.username}
              </div>
              <div className="text-[11px] text-[#5c4e40]" style={{ fontFamily: 'var(--font-mono)' }}>
                {focused.position} · Entry #{focused.id}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectMember(focused.discordId)}
              className="brass-btn cursor-pointer border border-[#8f1d1d] bg-[#8f1d1d] px-2.5 py-1 text-[10px] font-bold text-[#f4ecdb] uppercase hover:bg-[#6d1212]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Open Dossier
            </button>
          </div>

          <dl className="mt-2.5 grid grid-cols-3 gap-2 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
            <div>
              <dt className="text-[10px] text-[#5c4e40] uppercase">Direct Recruits</dt>
              <dd className="tabular-nums font-bold text-[#1a1512]">{focused.stats.referrals}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-[#5c4e40] uppercase">Downstream Crew</dt>
              <dd className="tabular-nums font-bold text-[#1a1512]">{branchSummary.totalDescendants}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-[#5c4e40] uppercase">Branch Income</dt>
              <dd className="tabular-nums font-bold text-[#1d4d35]">
                {formatNumber(branchSummary.branchIncome)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Top Bloodline Heads */}
      <div>
        <div
          className="mb-2 text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Founding Sponsors ({forest.length} Active Trees)
        </div>
        <div className="flex flex-wrap gap-1.5">
          {forest.map((root) => (
            <button
              key={root.member.discordId}
              type="button"
              onMouseEnter={() => onHoverMember(root.member.discordId)}
              onClick={() => onSelectMember(root.member.discordId)}
              className="brass-btn cursor-pointer border border-[#6b4e1c]/45 bg-[#efe4ce] px-2.5 py-1 text-xs font-bold text-[#1a1512] hover:border-[#8f1d1d]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {root.member.username} ({root.member.stats.referrals})
            </button>
          ))}
        </div>
      </div>

      {/* Unaffiliated / Direct Entry Records */}
      <div className="border-t border-[#6b4e1c]/35 pt-3">
        <div
          className="mb-2 text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Direct / Unlinked Filings ({soloMembers.length})
        </div>
        {soloMembers.length === 0 ? (
          <p className="text-xs italic text-[#5c4e40]" style={{ fontFamily: 'var(--font-mono)' }}>
            All operatives on file are linked inside active sponsorship trees.
          </p>
        ) : (
          <ul className="space-y-1 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
            {soloMembers.map((m) => (
              <li key={m.discordId}>
                <button
                  type="button"
                  onClick={() => onSelectMember(m.discordId)}
                  className="cursor-pointer text-[#3d3126] underline decoration-[#8b765a]/40 underline-offset-2 hover:text-[#8f1d1d]"
                >
                  #{m.id} {m.username} — {m.application.inviter || 'No Sponsor Listed'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function LineageRightPage({
  members,
  hoveredId,
  onHoverMember,
  onSelectMember,
}: {
  members: MemberDossier[]
  hoveredId: string | null
  onHoverMember: (id: string | null) => void
  onSelectMember: (discordId: string) => void
}) {
  const [zoom, setZoom] = useState(1)
  const { allNodes, edges, childrenMap, byId, width, height } = useMemo(
    () => buildLineageForest(members),
    [members],
  )
  const activeBranch = useMemo(
    () => getBranchSet(hoveredId, byId, childrenMap),
    [hoveredId, byId, childrenMap],
  )

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#5c4e40]/45 pb-2">
        <h3 className="text-lg font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
          Commission Family Chart
        </h3>

        <div className="flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)' }}>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))))}
            aria-label="Zoom out family tree"
            className="brass-btn cursor-pointer border border-[#6b4e1c]/45 bg-[#efe4ce] p-1 text-[#3d3126] hover:border-[#8f1d1d]"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="tabular-nums px-1.5 text-[11px] font-bold text-[#4c3e31]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
            aria-label="Zoom in family tree"
            className="brass-btn cursor-pointer border border-[#6b4e1c]/45 bg-[#efe4ce] p-1 text-[#3d3126] hover:border-[#8f1d1d]"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            aria-label="Reset zoom"
            className="brass-btn cursor-pointer border border-[#6b4e1c]/45 bg-[#efe4ce] p-1 text-[#3d3126] hover:border-[#8f1d1d]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="ledger-scroll relative flex-1 overflow-auto border border-[#6b4e1c]/45 bg-[#f7efdd]/85 p-2">
        {allNodes.length === 0 ? (
          <div
            className="flex h-full items-center justify-center p-6 text-center text-xs text-[#5c4e40]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            No linked sponsor-to-recruit chains exist in the current ledger dataset.
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{
              width: zoom === 1 ? '100%' : `${Math.round(zoom * 100)}%`,
              height: 'auto',
              minWidth: zoom === 1 ? '100%' : `${Math.round(width * zoom * 0.72)}px`,
            }}
            className="block"
            role="img"
            aria-label="CAA Syndicate Referral Family Tree"
          >
            {/* Connecting Ink Curves */}
            {edges.map(({ from, to }) => {
              const highlighted =
                hoveredId !== null &&
                activeBranch.has(from.member.discordId) &&
                activeBranch.has(to.member.discordId)
              const x1 = from.x + 74
              const y1 = from.y + 46
              const x2 = to.x + 74
              const y2 = to.y
              const midY = (y1 + y2) / 2
              return (
                <path
                  key={`${from.member.discordId}->${to.member.discordId}`}
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  fill="none"
                  stroke={highlighted ? '#8f1d1d' : '#6b4e1c'}
                  strokeWidth={highlighted ? 2.4 : 1.4}
                  strokeOpacity={hoveredId && !highlighted ? 0.28 : 0.8}
                />
              )
            })}

            {/* Operative Nodes */}
            {allNodes.map((node) => {
              const isFocused = hoveredId === node.member.discordId
              const inBranch = hoveredId === null || activeBranch.has(node.member.discordId)
              const borderCol =
                node.member.rankTier === 'leadership'
                  ? '#8f1d1d'
                  : node.member.rankTier === 'intern'
                    ? '#8c6118'
                    : '#3d3126'

              return (
                <g
                  key={node.member.discordId}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: 'pointer', opacity: inBranch ? 1 : 0.35 }}
                  onMouseEnter={() => onHoverMember(node.member.discordId)}
                  onMouseLeave={() => onHoverMember(null)}
                  onClick={() => onSelectMember(node.member.discordId)}
                >
                  <rect
                    width="148"
                    height="46"
                    rx="2"
                    fill={isFocused ? '#f9e9c5' : '#faf4e6'}
                    stroke={isFocused ? '#8f1d1d' : borderCol}
                    strokeWidth={isFocused ? 2.2 : 1.3}
                  />
                  <text
                    x="8"
                    y="18"
                    fill="#1a1512"
                    fontFamily="Libre Baskerville, Georgia, serif"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {node.member.username.slice(0, 17)}
                  </text>
                  <text
                    x="8"
                    y="35"
                    fill="#5c4e40"
                    fontFamily="Courier Prime, monospace"
                    fontSize="9.5"
                  >
                    #{node.member.id} · {node.member.position.slice(0, 16)}
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>

      <p className="text-[11px] text-[#5c4e40]" style={{ fontFamily: 'var(--font-mono)' }}>
        Hover a card to trace upstream sponsors and downstream recruits; click any node to flip to that operative’s folio.
      </p>
    </div>
  )
}
