import { Download, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { CustomStamp, MemberDossier } from '../types'
import { formatNumber, groupAwards } from './EngravedIcons'

function drawWrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const words = text.split(/\s+/)
  let line = ''
  let lineCount = 0
  let curY = y

  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY)
      curY += lineHeight
      lineCount += 1
      line = word
      if (lineCount >= maxLines - 1) break
    } else {
      line = test
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, curY)
    curY += lineHeight
  }
  return curY
}

export function ExportDossierModal({
  open,
  member,
  customStamps,
  onClose,
}: {
  open: boolean
  member: MemberDossier | null
  customStamps: CustomStamp[]
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!open || !member || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 1200
    const H = 760
    canvas.width = W
    canvas.height = H

    // Parchment background
    ctx.fillStyle = '#f4ecdb'
    ctx.fillRect(0, 0, W, H)

    // Subtle ledger lines
    ctx.strokeStyle = 'rgba(52, 79, 104, 0.14)'
    ctx.lineWidth = 1
    for (let y = 110; y < H - 40; y += 28) {
      ctx.beginPath()
      ctx.moveTo(46, y)
      ctx.lineTo(W - 46, y)
      ctx.stroke()
    }

    // Outer oxblood & gold frame
    ctx.strokeStyle = '#2c1012'
    ctx.lineWidth = 10
    ctx.strokeRect(18, 18, W - 36, H - 36)
    ctx.strokeStyle = '#a68037'
    ctx.lineWidth = 2
    ctx.strokeRect(32, 32, W - 64, H - 64)

    // Header
    ctx.fillStyle = '#1a1512'
    ctx.font = 'bold 24px Georgia, serif'
    ctx.fillText('CUSTOM ADVERSARIES ASSOCIATION · DOSSIER', 58, 84)

    ctx.fillStyle = '#8f1d1d'
    ctx.font = 'bold 18px "Courier New", monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`ROLODEX ENTRY #${member.id}`, W - 58, 84)
    ctx.textAlign = 'left'

    // Divider
    ctx.strokeStyle = '#6b4e1c'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(58, 106)
    ctx.lineTo(W - 58, 106)
    ctx.stroke()

    // Left column: Identity + Front Door (strictly x <= 588)
    ctx.fillStyle = '#1a1512'
    ctx.font = 'bold 34px Georgia, serif'
    ctx.fillText(member.username, 58, 156, 520)

    ctx.fillStyle = '#4c3e31'
    ctx.font = 'bold 16px "Courier New", monospace'
    ctx.fillText(`POSITION: ${member.position.toUpperCase()}`, 58, 188, 520)
    ctx.fillText(`DISCORD ID: ${member.discordId}`, 58, 214, 520)
    ctx.fillText(`FILED: ${member.application.formattedDate}`, 58, 240, 520)
    ctx.fillText(
      `REFERRER: ${member.application.inviter || (member.application.inviterId ? `ID ${member.application.inviterId}` : 'N/A')}`,
      58,
      266,
      520,
    )

    // Front Door Statement box
    ctx.fillStyle = '#faf4e6'
    ctx.fillRect(58, 294, 530, 182)
    ctx.strokeStyle = '#75624a'
    ctx.lineWidth = 1.5
    ctx.strokeRect(58, 294, 530, 182)

    ctx.fillStyle = '#5c4e40'
    ctx.font = 'bold 15px "Courier New", monospace'
    ctx.fillText('FRONT DOOR STATED INTENT', 78, 324)

    ctx.fillStyle = '#1a1512'
    ctx.font = '17px "Courier New", monospace'
    const reason = member.application.isLegacyMigrated
      ? 'Legacy migration file (no Front Door application text).'
      : `"${member.application.reason}"`
    drawWrapText(ctx, reason, 78, 358, 490, 26, 4)

    // Awards box
    ctx.fillStyle = '#5c4e40'
    ctx.font = 'bold 15px "Courier New", monospace'
    ctx.fillText(`DECORATIONS & AWARDS (${member.stats.awards.length})`, 58, 514)

    ctx.fillStyle = '#1a1512'
    ctx.font = '16px "Courier New", monospace'
    const grouped = groupAwards(member.stats.awards)
      .map((a) => (a.count > 1 ? `${a.name} (${a.count}x)` : a.name))
      .join(' · ')
    drawWrapText(ctx, grouped || 'No citations recorded.', 58, 544, 530, 24, 4)

    // Right column: Performance Ledger
    ctx.fillStyle = '#faf4e6'
    ctx.fillRect(628, 140, 514, 370)
    ctx.strokeStyle = '#75624a'
    ctx.strokeRect(628, 140, 514, 370)

    ctx.fillStyle = '#1a1512'
    ctx.font = 'bold 20px Georgia, serif'
    ctx.fillText('PERFORMANCE & STANDING LEDGER', 654, 178)

    const metrics = [
      ['TEAMER REPORTS', formatNumber(member.stats.reports), `Rank #${member.ranks.reports || '-'}`],
      ['EVENT WINS', formatNumber(member.stats.eventWins), `Rank #${member.ranks.eventWins || '-'}`],
      ['REFERRALS CREDITED', formatNumber(member.stats.referrals), `Rank #${member.ranks.referrals || '-'}`],
      ['AWARDS & CITATIONS', formatNumber(member.stats.awardsCount), `Rank #${member.ranks.awardsCount || '-'}`],
    ]

    let rowY = 236
    for (const [label, val, rankTxt] of metrics) {
      ctx.fillStyle = '#4c3e31'
      ctx.font = 'bold 16px "Courier New", monospace'
      ctx.fillText(label, 654, rowY)

      ctx.fillStyle = '#6e5d4b'
      ctx.textAlign = 'right'
      ctx.fillText(rankTxt, 976, rowY)

      ctx.fillStyle = '#1a1512'
      ctx.font = 'bold 26px "Courier New", monospace'
      ctx.fillText(val, 1114, rowY)
      ctx.textAlign = 'left'

      ctx.strokeStyle = 'rgba(107, 78, 28, 0.25)'
      ctx.beginPath()
      ctx.moveTo(654, rowY + 18)
      ctx.lineTo(1114, rowY + 18)
      ctx.stroke()
      rowY += 68
    }

    // Disciplinary Status Banner
    const hasStrikes = member.totalActiveStrikes > 0
    ctx.fillStyle = hasStrikes ? 'rgba(143, 29, 29, 0.1)' : 'rgba(29, 77, 53, 0.1)'
    ctx.fillRect(628, 532, 514, 82)
    ctx.strokeStyle = hasStrikes ? '#8f1d1d' : '#1d4d35'
    ctx.lineWidth = 2
    ctx.strokeRect(628, 532, 514, 82)

    ctx.fillStyle = hasStrikes ? '#8f1d1d' : '#1d4d35'
    ctx.font = 'bold 18px "Courier New", monospace'
    ctx.fillText(
      hasStrikes
        ? `DISCIPLINARY NOTICE: ${member.totalActiveStrikes} ACTIVE STRIKE(S)`
        : 'DISCIPLINARY STANDING: CLEAN SHEET',
      654,
      570,
    )
    if (hasStrikes && member.strikes[0]) {
      ctx.fillStyle = '#1a1512'
      ctx.font = '14px "Courier New", monospace'
      drawWrapText(ctx, member.strikes[0].reason, 654, 596, 464, 18, 1)
    }

    // Optional Slammed Stamp placed cleanly in open lower-right endorsement margin
    const topStamp = customStamps[0]
    if (topStamp) {
      ctx.save()
      ctx.translate(1030, 666)
      ctx.rotate((-5 * Math.PI) / 180)
      ctx.strokeStyle = topStamp.ink === 'forest' ? '#1d4d35' : topStamp.ink === 'gold' ? '#8c6118' : '#8f1d1d'
      ctx.lineWidth = 3
      ctx.strokeRect(-92, -20, 184, 40)
      ctx.fillStyle = ctx.strokeStyle
      ctx.font = 'bold 19px "Courier New", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(topStamp.label, 0, 6)
      ctx.restore()
    }

    // Footer
    ctx.fillStyle = '#5c4e40'
    ctx.font = 'italic 14px Georgia, serif'
    ctx.fillText('C.A.A. — “How you dress is how you present yourself.”', 58, H - 56)
  }, [open, member, customStamps])

  if (!open || !member) return null

  const handleDownload = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `CAA-Dossier-${member.username}.png`
    a.click()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Export Dossier Card"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl border border-[#d7b262]/70 bg-[#1a100c] p-4 text-[#f4ecdb] shadow-[0_24px_64px_rgba(0,0,0,0.88)]"
      >
        <div
          className="mb-3 flex items-center justify-between border-b border-[#a68037]/40 pb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span className="text-xs font-bold tracking-wider text-[#d7b262] uppercase">
            Archival Dossier Card — {member.username}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="cursor-pointer text-[#cbb894] hover:text-[#f4ecdb]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-hidden border border-[#a68037]/50 bg-[#0d0907]">
          <canvas ref={canvasRef} className="block h-auto w-full" />
        </div>

        <div className="mt-3 flex items-center justify-end gap-2.5" style={{ fontFamily: 'var(--font-mono)' }}>
          <button
            type="button"
            onClick={onClose}
            className="brass-btn cursor-pointer border border-[#a68037]/45 bg-[#251713] px-3 py-1.5 text-xs text-[#dfca9f]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="brass-btn inline-flex cursor-pointer items-center gap-1.5 border border-[#d7b262] bg-[#691717] px-4 py-1.5 text-xs font-bold text-[#f4ecdb] hover:bg-[#821e1e]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PNG Card</span>
          </button>
        </div>
      </div>
    </div>
  )
}
