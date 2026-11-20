import { GitBranch, RotateCcw, Search, ZoomIn, ZoomOut } from 'lucide-react'
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

function countDescendants(
  rootId: string,
  childrenMap: Map<string, MemberDossier[]>,
): number {
  const seen = new Set<string>([rootId])
  const queue = [...(childrenMap.get(rootId) ?? [])]
  while (queue.length > 0) {
    const cur = queue.shift()!
    if (!seen.has(cur.discordId)) {
      seen.add(cur.discordId)
      queue.push(...(childrenMap.get(cur.discordId) ?? []))
    }
  }
  return seen.size - 1
}

function analyzeLineage(members: MemberDossier[]) {
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

  const treeRoots = roots
    .filter((r) => (childrenMap.get(r.discordId)?.length ?? 0) > 0)
    .map((r) => ({
      member: r,
      networkSize: countDescendants(r.discordId, childrenMap),
    }))
    .sort((a, b) => b.networkSize - a.networkSize || a.member.id - b.member.id)

  const soloMembers = roots.filter((r) => (childrenMap.get(r.discordId)?.length ?? 0) === 0)
  const totalConnectedNodes = treeRoots.reduce((acc, r) => acc + 1 + r.networkSize, 0)

  return { byId, childrenMap, treeRoots, soloMembers, totalConnectedNodes }
}

function layoutTrees(
  rootMembers: MemberDossier[],
  childrenMap: Map<string, MemberDossier[]>,
) {
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

  const forest = rootMembers.map(buildNode)
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
    cursorX += 24
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

  return { allNodes, edges, width, height }
}

function getBranchSet(
  focusId: string | null,
  byId: Map<string, MemberDossier>,
  childrenMap: Map<string, MemberDossier[]>,
): Set<string> {
  const active = new Set<string>()
  if (!focusId) return active

  let cur: string | null = focusId
  const guard = new Set<string>()
  while (cur && !guard.has(cur)) {
    guard.add(cur)
    active.add(cur)
    const m = byId.get(cur)
    cur = m?.application.inviterId ?? null
  }

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

function resolveEffectiveSponsorId(
  selectedSponsorId: string | null,
  treeRoots: Array<{ member: MemberDossier; networkSize: number }>,
  totalConnectedNodes: number,
): string | null {
  if (selectedSponsorId && treeRoots.some((r) => r.member.discordId === selectedSponsorId)) {
    return selectedSponsorId
  }
  if (totalConnectedNodes > 24 && treeRoots.length > 0) {
    return treeRoots[0].member.discordId
  }
  return null
}

export function LineageLeftPage({
  members,
  hoveredId,
  selectedSponsorId,
  onSelectSponsor,
  onHoverMember,
  onSelectMember,
}: {
  members: MemberDossier[]
  hoveredId: string | null
  selectedSponsorId: string | null
  onSelectSponsor: (id: string | null) => void
  onHoverMember: (id: string | null) => void
  onSelectMember: (discordId: string) => void
}) {
  const [sponsorQuery, setSponsorQuery] = useState('')
  const { byId, childrenMap, treeRoots, soloMembers, totalConnectedNodes } = useMemo(
    () => analyzeLineage(members),
    [members],
  )

  const effectiveSponsorId = resolveEffectiveSponsorId(
    selectedSponsorId,
    treeRoots,
    totalConnectedNodes,
  )

  const focused =
    (hoveredId && byId.get(hoveredId)) ||
    (effectiveSponsorId && byId.get(effectiveSponsorId)) ||
    treeRoots[0]?.member ||
    members[0]

  const branchSummary = useMemo(() => {
    if (!focused) return { totalDescendants: 0, branchReports: 0 }
    const descendants = new Set<string>()
    const q = [...(childrenMap.get(focused.discordId) ?? [])]
    while (q.length > 0) {
      const next = q.shift()!
      if (!descendants.has(next.discordId)) {
        descendants.add(next.discordId)
        q.push(...(childrenMap.get(next.discordId) ?? []))
      }
    }
    let reports = focused.stats.reports
    for (const did of descendants) {
      reports += byId.get(did)?.stats.reports ?? 0
    }
    return { totalDescendants: descendants.size, branchReports: reports }
  }, [focused, childrenMap, byId])

  const filteredSponsors = useMemo(() => {
    const q = sponsorQuery.trim().toLowerCase()
    if (!q) return treeRoots
    return treeRoots.filter(
      (r) =>
        r.member.username.toLowerCase().includes(q) ||
        String(r.member.id) === q ||
        r.member.discordId.includes(q),
    )
  }, [treeRoots, sponsorQuery])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#5c4e40]/45 pb-2.5">
        <h2 className="text-xl font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
          Organization Vouch Tree
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
              <dt className="text-[10px] text-[#5c4e40] uppercase">Direct Vouches</dt>
              <dd className="tabular-nums font-bold text-[#1a1512]">{focused.stats.referrals}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-[#5c4e40] uppercase">Vouched Network</dt>
              <dd className="tabular-nums font-bold text-[#1a1512]">{branchSummary.totalDescendants}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-[#5c4e40] uppercase">Network Reports</dt>
              <dd className="tabular-nums font-bold text-[#1d4d35]">
                {formatNumber(branchSummary.branchReports)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Vouching Sponsors Picker */}
      <div className="flex flex-col gap-2">
        <div
          className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>Vouching Sponsors ({treeRoots.length} Active Trees)</span>
          {totalConnectedNodes <= 24 && (
            <button
              type="button"
              onClick={() => onSelectSponsor(null)}
              className={`cursor-pointer border px-1.5 py-0.5 text-[10px] ${
                effectiveSponsorId === null
                  ? 'border-[#1a1512] bg-[#1a1512] text-[#f4ecdb]'
                  : 'border-[#6b4e1c]/45 bg-[#efe4ce] text-[#3d3126]'
              }`}
            >
              All Trees
            </button>
          )}
        </div>

        {treeRoots.length > 8 && (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#5c4e40]" />
            <input
              type="text"
              value={sponsorQuery}
              onChange={(e) => setSponsorQuery(e.target.value)}
              placeholder="Filter sponsors..."
              className="w-full border border-[#6b4e1c]/45 bg-[#faf4e8] py-1.5 pr-3 pl-8 text-xs text-[#1a1512] placeholder-[#6e5d4b]"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        )}

        <div className="ledger-scroll flex max-h-[168px] flex-wrap gap-1.5 overflow-y-auto pr-1">
          {filteredSponsors.map((root) => {
            const active = effectiveSponsorId === root.member.discordId
            return (
              <button
                key={root.member.discordId}
                type="button"
                onMouseEnter={() => onHoverMember(root.member.discordId)}
                onMouseLeave={() => onHoverMember(null)}
                onClick={() => onSelectSponsor(root.member.discordId)}
                className={`brass-btn cursor-pointer border px-2.5 py-1 text-xs font-bold ${
                  active
                    ? 'border-[#8f1d1d] bg-[#8f1d1d] text-[#f4ecdb]'
                    : 'border-[#6b4e1c]/45 bg-[#efe4ce] text-[#1a1512] hover:border-[#8f1d1d]'
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {root.member.username} ({root.networkSize})
              </button>
            )
          })}
        </div>
      </div>

      {/* Unaffiliated / Direct Entry Summary */}
      <div className="mt-auto border-t border-[#6b4e1c]/35 pt-3">
        <div
          className="mb-1.5 text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase"
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
            {soloMembers.slice(0, 6).map((m) => (
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
            {soloMembers.length > 6 && (
              <li className="text-[11px] text-[#5c4e40]">
                + {soloMembers.length - 6} additional direct entries in Master Directory.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

export function LineageRightPage({
  members,
  hoveredId,
  selectedSponsorId,
  onHoverMember,
  onSelectMember,
}: {
  members: MemberDossier[]
  hoveredId: string | null
  selectedSponsorId: string | null
  onHoverMember: (id: string | null) => void
  onSelectMember: (discordId: string) => void
}) {
  const [zoom, setZoom] = useState(1)
  const { byId, childrenMap, treeRoots, totalConnectedNodes } = useMemo(
    () => analyzeLineage(members),
    [members],
  )

  const effectiveSponsorId = resolveEffectiveSponsorId(
    selectedSponsorId,
    treeRoots,
    totalConnectedNodes,
  )

  const rootsToDisplay = useMemo(() => {
    if (effectiveSponsorId) {
      const target = byId.get(effectiveSponsorId)
      return target ? [target] : treeRoots.slice(0, 1).map((r) => r.member)
    }
    return treeRoots.map((r) => r.member)
  }, [effectiveSponsorId, byId, treeRoots])

  const { allNodes, edges, width, height } = useMemo(
    () => layoutTrees(rootsToDisplay, childrenMap),
    [rootsToDisplay, childrenMap],
  )

  const activeBranch = useMemo(
    () => getBranchSet(hoveredId, byId, childrenMap),
    [hoveredId, byId, childrenMap],
  )

  const headerTitle =
    effectiveSponsorId && byId.get(effectiveSponsorId)
      ? `Vouch Network of ${byId.get(effectiveSponsorId)!.username}`
      : 'Organization Referral Chart'

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#5c4e40]/45 pb-2">
        <h3 className="text-lg font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
          {headerTitle}
        </h3>

        <div className="flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)' }}>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))))}
            aria-label="Zoom out referral tree"
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
            aria-label="Zoom in referral tree"
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
              width: width > 720 ? `${Math.round(width * 0.88 * zoom)}px` : `${Math.round(zoom * 100)}%`,
              height: 'auto',
              minWidth: zoom === 1 ? '100%' : `${Math.round(width * zoom * 0.72)}px`,
            }}
            className="block"
            role="img"
            aria-label="C.A.A. Organization Referral Tree"
          >
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
        Select any Sponsor on the left to inspect their vouch network; click any node to open that member’s dossier.
      </p>
    </div>
  )
}
