import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchPodium, fetchRoster, fetchStatus } from './api'
import {
  loadAllNotes,
  loadAllStamps,
  loadBookmarkId,
  saveAllNotes,
  saveAllStamps,
  saveBookmarkId,
} from './archivistStore'
import { BookCover } from './components/BookCover'
import { DeskToolbar } from './components/DeskToolbar'
import { DossierLeftPage, DossierRightPage } from './components/DossierSpread'
import { ExportDossierModal } from './components/ExportDossierModal'
import {
  filterFrontDoorMembers,
  type FrontDoorFilter,
  FrontDoorSpreadPages,
} from './components/FrontDoorSpread'
import {
  filterAndSortMembers,
  INDEX_PAGE_SIZE,
  IndexLeftPage,
  IndexRightPage,
} from './components/IndexSpread'
import { LineageLeftPage, LineageRightPage } from './components/LineageSpread'
import { OpenBookShell, type TurnSnapshot } from './components/OpenBookShell'
import { PhotoGalleryModal } from './components/PhotoGalleryModal'
import { PodiumLeftPage, PodiumRightPage } from './components/PodiumSpread'
import { SearchPalette } from './components/SearchPalette'
import { SitDownLeftPage, SitDownRightPage } from './components/SitDownSpread'
import { StampKitPopover } from './components/StampKitPopover'
import { VaultLeftPage, VaultRightPage } from './components/VaultSpread'
import { isSoundMuted, playPageTurn, playStampSlam, setSoundMuted } from './sound'
import type {
  ChapterId,
  CustomStamp,
  DataSource,
  FilterMode,
  MemberDossier,
  PodiumResponse,
  RosterTotals,
  SortField,
  StampPreset,
  StatusResponse,
} from './types'

const EMPTY_TOTALS: RosterTotals = {
  totalMembers: 0,
  leadershipCount: 0,
  madeCount: 0,
  internCount: 0,
  combinedReports: 0,
  combinedEventWins: 0,
  combinedReferrals: 0,
  totalAwards: 0,
  flaggedMembers: 0,
  activeStrikesCount: 0,
  promoDueCount: 0,
}

export function App() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [members, setMembers] = useState<MemberDossier[]>([])
  const [totals, setTotals] = useState<RosterTotals>(EMPTY_TOTALS)
  const [activeSource, setActiveSource] = useState<DataSource>('archive')
  const [liveError, setLiveError] = useState<string | null>(null)
  const [podium, setPodium] = useState<PodiumResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const [bookOpen, setBookOpen] = useState(false)
  const [chapter, setChapter] = useState<ChapterId>('index')
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareRightId, setCompareRightId] = useState<string | null>(null)

  const [filter, setFilter] = useState<FilterMode>('all')
  const [sort, setSort] = useState<SortField>('id')
  const [indexQuery, setIndexQuery] = useState('')
  const [indexPage, setIndexPage] = useState(0)
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [frontDoorFilter, setFrontDoorFilter] = useState<FrontDoorFilter>('all')
  const [frontDoorPage, setFrontDoorPage] = useState(0)
  const [hoveredLineageId, setHoveredLineageId] = useState<string | null>(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [stampOpen, setStampOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [photoPlateIndex, setPhotoPlateIndex] = useState<number | null>(null)
  const [muted, setMuted] = useState(() => isSoundMuted())

  const [stampsByMember, setStampsByMember] = useState<Record<string, CustomStamp[]>>(() =>
    loadAllStamps(),
  )
  const [notesByMember, setNotesByMember] = useState<Record<string, string>>(() => loadAllNotes())
  const [bookmarkId, setBookmarkId] = useState<string | null>(() => loadBookmarkId())

  const [turnSnapshot, setTurnSnapshot] = useState<TurnSnapshot | null>(null)
  const turnTimerRef = useRef<number | null>(null)
  const turnKeyRef = useRef(0)
  const stampButtonRef = useRef<HTMLButtonElement | null>(null)

  const loadLedger = useCallback(async (requestedSource: DataSource | 'auto' = 'auto', refresh = false) => {
    setRefreshing(true)
    try {
      const rosterRes = await fetchRoster(requestedSource, { refresh })
      const [st, podRes] = await Promise.all([
        fetchStatus(),
        rosterRes.source === 'live' && rosterRes.liveError
          ? Promise.resolve(null)
          : fetchPodium(rosterRes.source),
      ])
      setStatus(st)
      setMembers(rosterRes.members)
      setTotals(rosterRes.totals)
      setActiveSource(rosterRes.source)
      setLiveError(rosterRes.liveError)
      setPodium(podRes)

      if (rosterRes.members.length > 0) {
        setSelectedMemberId((prev) =>
          prev && rosterRes.members.some((m) => m.discordId === prev)
            ? prev
            : rosterRes.members[0].discordId,
        )
        setCompareRightId((prev) =>
          prev && rosterRes.members.some((m) => m.discordId === prev)
            ? prev
            : (rosterRes.members[1] ?? rosterRes.members[0]).discordId,
        )
      }
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Unable to reach ledger server.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadLedger('auto')
  }, [loadLedger])

  const filteredIndexMembers = useMemo(
    () => filterAndSortMembers(members, filter, sort, indexQuery),
    [members, filter, sort, indexQuery],
  )

  const filteredFrontDoor = useMemo(
    () => filterFrontDoorMembers(members, frontDoorFilter),
    [members, frontDoorFilter],
  )

  useEffect(() => {
    setFrontDoorPage(0)
  }, [frontDoorFilter, activeSource])

  useEffect(() => {
    setIndexPage(0)
  }, [filter, sort, indexQuery, activeSource])

  const activeMemberIndex = useMemo(() => {
    if (!members.length) return -1
    const idx = members.findIndex((m) => m.discordId === selectedMemberId)
    return idx >= 0 ? idx : 0
  }, [members, selectedMemberId])

  const activeMember = activeMemberIndex >= 0 ? members[activeMemberIndex] : null
  const compareRightMember = useMemo(
    () => members.find((m) => m.discordId === compareRightId) ?? members[1] ?? members[0] ?? null,
    [members, compareRightId],
  )
  const bookmarkedMember = useMemo(
    () => (bookmarkId ? members.find((m) => m.discordId === bookmarkId) ?? null : null),
    [members, bookmarkId],
  )

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev
      setSoundMuted(next)
      return next
    })
  }, [])

  const runPageTurnEffect = useCallback(
    (direction: 'next' | 'prev', frontHtml: ReactNode, backHtml: ReactNode) => {
      playPageTurn()
      if (turnTimerRef.current !== null) {
        window.clearTimeout(turnTimerRef.current)
      }
      turnKeyRef.current += 1
      setTurnSnapshot({
        key: turnKeyRef.current,
        direction,
        frontHtml,
        backHtml,
      })
      turnTimerRef.current = window.setTimeout(() => {
        setTurnSnapshot(null)
        turnTimerRef.current = null
      }, 450)
    },
    [],
  )

  const buildSpreadForState = useCallback(
    (
      targetChapter: ChapterId,
      targetMemberId: string | null,
      targetFrontDoorPage: number,
      targetCompareMode: boolean,
    ): { left: ReactNode; right: ReactNode } => {
      const mIdx = Math.max(
        0,
        members.findIndex((m) => m.discordId === targetMemberId),
      )
      const targetMember = members[mIdx] ?? members[0] ?? null

      switch (targetChapter) {
        case 'index':
          return {
            left: (
              <IndexLeftPage
                totals={totals}
                filter={filter}
                sort={sort}
                query={indexQuery}
                filteredCount={filteredIndexMembers.length}
                totalCount={members.length}
                onChangeFilter={(value) => { setFilter(value); setIndexPage(0) }}
                onChangeSort={(value) => { setSort(value); setIndexPage(0) }}
                onChangeQuery={(value) => { setIndexQuery(value); setIndexPage(0) }}
                onOpenPhotoPlate={setPhotoPlateIndex}
              />
            ),
            right: (
              <IndexRightPage
                members={filteredIndexMembers}
                sort={sort}
                page={indexPage}
                onChangePage={setIndexPage}
                onSelectMember={(did) => openMemberDossier(did)}
              />
            ),
          }

        case 'dossiers':
          if (!targetMember) {
            return {
              left: <p className="py-10 text-center text-xs">No operatives loaded in this ledger.</p>,
              right: <p className="py-10 text-center text-xs">Open Data Vault to load records.</p>,
            }
          }
          if (targetCompareMode && compareRightMember) {
            return {
              left: (
                <SitDownLeftPage
                  leftMember={targetMember}
                  rightMember={compareRightMember}
                  allMembers={members}
                  onChangeLeft={(did) => setSelectedMemberId(did)}
                  onSwapSides={() => {
                    const leftId = targetMember.discordId
                    setSelectedMemberId(compareRightMember.discordId)
                    setCompareRightId(leftId)
                  }}
                  onOpenDossier={(did) => {
                    setCompareMode(false)
                    openMemberDossier(did)
                  }}
                />
              ),
              right: (
                <SitDownRightPage
                  leftMember={targetMember}
                  rightMember={compareRightMember}
                  allMembers={members}
                  onChangeRight={(did) => setCompareRightId(did)}
                  onOpenDossier={(did) => {
                    setCompareMode(false)
                    openMemberDossier(did)
                  }}
                />
              ),
            }
          }
          return {
            left: (
              <DossierLeftPage
                member={targetMember}
                folioIndex={mIdx}
                totalFolios={members.length}
                allMembers={members}
                onSelectMember={(did) => openMemberDossier(did)}
              />
            ),
            right: (
              <DossierRightPage
                member={targetMember}
                allMembers={members}
                customStamps={stampsByMember[targetMember.discordId] ?? []}
                marginNote={notesByMember[targetMember.discordId] ?? ''}
                onRemoveStamp={(stampId) => {
                  setStampsByMember((prev) => {
                    const nextList = (prev[targetMember.discordId] ?? []).filter(
                      (s) => s.id !== stampId,
                    )
                    const next = { ...prev, [targetMember.discordId]: nextList }
                    saveAllStamps(next)
                    return next
                  })
                }}
                onChangeMarginNote={(txt) => {
                  setNotesByMember((prev) => {
                    const next = { ...prev, [targetMember.discordId]: txt }
                    saveAllNotes(next)
                    return next
                  })
                }}
              />
            ),
          }

        case 'frontdoor':
          return FrontDoorSpreadPages({
            members: filteredFrontDoor,
            pageIndex: targetFrontDoorPage,
            filter: frontDoorFilter,
            onChangeFilter: setFrontDoorFilter,
            onSelectMember: (did) => openMemberDossier(did),
          })

        case 'podium':
          return {
            left: (
              <PodiumLeftPage
                podium={podium}
                allMembers={members}
                onSelectMember={(did) => openMemberDossier(did)}
                onOpenPhotoPlate={setPhotoPlateIndex}
              />
            ),
            right: (
              <PodiumRightPage
                podium={podium}
                allMembers={members}
                onSelectMember={(did) => openMemberDossier(did)}
              />
            ),
          }

        case 'lineage':
          return {
            left: (
              <LineageLeftPage
                members={members}
                selectedSponsorId={selectedSponsorId}
                onSelectSponsor={setSelectedSponsorId}
                hoveredId={hoveredLineageId}
                onHoverMember={setHoveredLineageId}
                onSelectMember={(did) => openMemberDossier(did)}
              />
            ),
            right: (
              <LineageRightPage
                members={members}
                selectedSponsorId={selectedSponsorId}
                hoveredId={hoveredLineageId}
                onHoverMember={setHoveredLineageId}
                onSelectMember={(did) => openMemberDossier(did)}
              />
            ),
          }

        case 'vault':
          return {
            left: (
              <VaultLeftPage
                status={status}
                activeSource={activeSource}
                liveError={liveError}
                onSelectSource={(src) => void loadLedger(src, true)}
                onConnected={() => void loadLedger('live')}
                onOpenFetchedMember={(member) => {
                  setMembers((prev) =>
                    prev.some((m) => m.discordId === member.discordId)
                      ? prev.map((m) => (m.discordId === member.discordId ? member : m))
                      : [...prev, member],
                  )
                  setCompareMode(false)
                  setSelectedMemberId(member.discordId)
                  setChapter('dossiers')
                  playPageTurn()
                }}
              />
            ),
            right: (
              <VaultRightPage
                onImported={() => void loadLedger('imported')}
                onClearedMarks={() => {
                  setStampsByMember({})
                  setNotesByMember({})
                  setBookmarkId(null)
                }}
                onOpenPhotoPlate={setPhotoPlateIndex}
              />
            ),
          }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      members,
      totals,
      filter,
      sort,
      indexQuery,
      indexPage,
      selectedSponsorId,
      filteredIndexMembers,
      indexPage,
      compareRightMember,
      stampsByMember,
      notesByMember,
      filteredFrontDoor,
      frontDoorFilter,
      podium,
      hoveredLineageId,
      selectedSponsorId,
      status,
      activeSource,
      liveError,
      loadLedger,
    ],
  )

  const openMemberDossier = (discordId: string) => {
    const currentIdx = members.findIndex((m) => m.discordId === selectedMemberId)
    const nextIdx = members.findIndex((m) => m.discordId === discordId)
    const dir: 'next' | 'prev' = chapter === 'dossiers' && nextIdx < currentIdx ? 'prev' : 'next'
    const currentSpread = buildSpreadForState(chapter, selectedMemberId, frontDoorPage, compareMode)
    const nextSpread = buildSpreadForState('dossiers', discordId, frontDoorPage, false)

    runPageTurnEffect(
      dir,
      dir === 'next' ? currentSpread.right : currentSpread.left,
      dir === 'next' ? nextSpread.left : nextSpread.right,
    )
    setCompareMode(false)
    setStampOpen(false)
    setSelectedMemberId(discordId)
    setChapter('dossiers')
  }

  const handleSelectChapter = (nextChapter: ChapterId) => {
    if (nextChapter === chapter) return
    const order: ChapterId[] = ['index', 'dossiers', 'frontdoor', 'podium', 'lineage', 'vault']
    const dir: 'next' | 'prev' = order.indexOf(nextChapter) >= order.indexOf(chapter) ? 'next' : 'prev'
    const currentSpread = buildSpreadForState(chapter, selectedMemberId, frontDoorPage, compareMode)
    const nextSpread = buildSpreadForState(nextChapter, selectedMemberId, frontDoorPage, false)
    runPageTurnEffect(
      dir,
      dir === 'next' ? currentSpread.right : currentSpread.left,
      dir === 'next' ? nextSpread.left : nextSpread.right,
    )
    setCompareMode(false)
    setStampOpen(false)
    setChapter(nextChapter)
  }

  const indexTotalPages = Math.max(1, Math.ceil(filteredIndexMembers.length / INDEX_PAGE_SIZE))
  const frontDoorTotalPages = Math.max(1, Math.ceil(filteredFrontDoor.length / 6))

  const canPrev =
    (chapter === 'index' && indexPage > 0) ||
    (chapter === 'dossiers' && !compareMode && activeMemberIndex > 0) ||
    (chapter === 'frontdoor' && frontDoorPage > 0) ||
    (chapter === 'dossiers' && !compareMode && activeMemberIndex === 0)

  const canNext =
    chapter === 'index' ||
    (chapter === 'dossiers' && !compareMode && activeMemberIndex < members.length - 1) ||
    (chapter === 'frontdoor' && frontDoorPage < frontDoorTotalPages - 1)

  const handlePrevPage = useCallback(() => {
    if (chapter === 'index' && indexPage > 0) {
      setIndexPage((p) => Math.max(0, p - 1))
      playPageTurn()
    } else if (chapter === 'dossiers' && !compareMode) {
      if (activeMemberIndex > 0) {
        const target = members[activeMemberIndex - 1]
        const curSpread = buildSpreadForState('dossiers', selectedMemberId, frontDoorPage, false)
        const nextSpread = buildSpreadForState('dossiers', target.discordId, frontDoorPage, false)
        runPageTurnEffect('prev', curSpread.left, nextSpread.right)
        setSelectedMemberId(target.discordId)
      } else {
        handleSelectChapter('index')
      }
    } else if (chapter === 'frontdoor' && frontDoorPage > 0) {
      const nextP = frontDoorPage - 1
      const curSpread = buildSpreadForState('frontdoor', selectedMemberId, frontDoorPage, false)
      const nextSpread = buildSpreadForState('frontdoor', selectedMemberId, nextP, false)
      runPageTurnEffect('prev', curSpread.left, nextSpread.right)
      setFrontDoorPage(nextP)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, indexPage, compareMode, activeMemberIndex, members, selectedMemberId, frontDoorPage, buildSpreadForState, runPageTurnEffect])

  const handleNextPage = useCallback(() => {
    if (chapter === 'index') {
      if (indexPage < indexTotalPages - 1) {
        setIndexPage((p) => Math.min(indexTotalPages - 1, p + 1))
        playPageTurn()
      } else {
        handleSelectChapter('dossiers')
      }
    } else if (chapter === 'dossiers' && !compareMode && activeMemberIndex < members.length - 1) {
      const target = members[activeMemberIndex + 1]
      const curSpread = buildSpreadForState('dossiers', selectedMemberId, frontDoorPage, false)
      const nextSpread = buildSpreadForState('dossiers', target.discordId, frontDoorPage, false)
      runPageTurnEffect('next', curSpread.right, nextSpread.left)
      setSelectedMemberId(target.discordId)
    } else if (chapter === 'frontdoor' && frontDoorPage < frontDoorTotalPages - 1) {
      const nextP = frontDoorPage + 1
      const curSpread = buildSpreadForState('frontdoor', selectedMemberId, frontDoorPage, false)
      const nextSpread = buildSpreadForState('frontdoor', selectedMemberId, nextP, false)
      runPageTurnEffect('next', curSpread.right, nextSpread.left)
      setFrontDoorPage(nextP)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, indexPage, indexTotalPages, compareMode, activeMemberIndex, members, selectedMemberId, frontDoorPage, frontDoorTotalPages, buildSpreadForState, runPageTurnEffect])

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (bookOpen) setSearchOpen((o) => !o)
        return
      }
      if (!isInput && e.key === '/' && bookOpen) {
        e.preventDefault()
        setSearchOpen(true)
        return
      }
      if (!bookOpen || searchOpen || exportOpen || isInput) return

      if (e.key === 'ArrowRight') {
        if (canNext) {
          e.preventDefault()
          handleNextPage()
        }
      } else if (e.key === 'ArrowLeft') {
        if (canPrev) {
          e.preventDefault()
          handlePrevPage()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [bookOpen, searchOpen, exportOpen, canNext, canPrev, handleNextPage, handlePrevPage])

  const currentSpread = buildSpreadForState(chapter, selectedMemberId, frontDoorPage, compareMode)

  const pageIndicator =
    chapter === 'index'
      ? `Directory Page ${indexPage + 1} of ${indexTotalPages}`
      : chapter === 'dossiers'
        ? compareMode
          ? 'Side-by-Side Comparison'
          : `Folio ${activeMemberIndex + 1} of ${Math.max(1, members.length)}`
        : chapter === 'frontdoor'
          ? `Log Folio ${frontDoorPage + 1} of ${frontDoorTotalPages}`
          : chapter === 'podium'
            ? 'Honor Roll · Top 3 & Top 10'
            : chapter === 'lineage'
              ? 'Organization Referral Chart'
              : 'Data Vault & CSV Importer'

  const progressRatio =
    chapter === 'index'
      ? 0.14
      : chapter === 'dossiers'
        ? 0.22 + ((activeMemberIndex + 1) / Math.max(1, members.length)) * 0.45
        : chapter === 'frontdoor'
          ? 0.68
          : chapter === 'podium'
            ? 0.78
            : chapter === 'lineage'
              ? 0.85
              : 0.92

  const handleToggleBookmark = () => {
    if (!activeMember) return
    const next = bookmarkId === activeMember.discordId ? null : activeMember.discordId
    setBookmarkId(next)
    saveBookmarkId(next)
  }

  const handleSlamStamp = (preset: StampPreset) => {
    if (!activeMember) return
    playStampSlam()
    const rotation = Math.round((Math.random() * 11 - 6) * 10) / 10
    const stamp: CustomStamp = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: preset.label,
      ink: preset.ink,
      rotation,
      stampedAt: new Date().toISOString(),
    }
    setStampsByMember((prev) => {
      const next = {
        ...prev,
        [activeMember.discordId]: [stamp, ...(prev[activeMember.discordId] ?? [])],
      }
      saveAllStamps(next)
      return next
    })
    setStampOpen(false)
  }

  if (!bookOpen) {
    return (
      <>
        <BookCover
          status={status}
          memberCount={loading ? 14 : members.length}
          muted={muted}
          onToggleMute={toggleMute}
          onOpenBook={() => setBookOpen(true)}
          onOpenPhotoPlate={(idx) => setPhotoPlateIndex(idx)}
        />
        <PhotoGalleryModal
          plateIndex={photoPlateIndex}
          onChangePlate={setPhotoPlateIndex}
          onClose={() => setPhotoPlateIndex(null)}
        />
      </>
    )
  }

  return (
    <div className="banker-desk flex min-h-[100dvh] flex-col">
      <DeskToolbar
        chapter={chapter}
        activeSource={activeSource}
        activeMember={activeMember}
        bookmarkedMember={bookmarkedMember}
        compareMode={compareMode}
        muted={muted}
        stampButtonRef={stampButtonRef}
        onCloseCover={() => setBookOpen(false)}
        onOpenSearch={() => setSearchOpen(true)}
        onToggleCompare={() => {
          setStampOpen(false)
          setCompareMode((c) => !c)
        }}
        onToggleStampPopover={() => setStampOpen((o) => !o)}
        onToggleBookmark={handleToggleBookmark}
        onJumpBookmark={() => {
          if (bookmarkedMember) openMemberDossier(bookmarkedMember.discordId)
        }}
        onOpenExport={() => setExportOpen(true)}
        onOpenVault={() => handleSelectChapter('vault')}
        onOpenPlates={() => setPhotoPlateIndex(0)}
        onToggleMute={toggleMute}
        onRefreshLive={() => void loadLedger('live', true)}
        refreshing={refreshing}
      />

      <OpenBookShell
        chapter={chapter}
        onSelectChapter={handleSelectChapter}
        leftPage={currentSpread.left}
        rightPage={currentSpread.right}
        pageIndicator={pageIndicator}
        canPrev={canPrev}
        canNext={canNext}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        progressRatio={progressRatio}
        isBookmarkedHere={Boolean(
          chapter === 'dossiers' && activeMember && bookmarkId === activeMember.discordId,
        )}
        onToggleBookmark={chapter === 'dossiers' && activeMember ? handleToggleBookmark : undefined}
        turnSnapshot={turnSnapshot}
      />

      <SearchPalette
        open={searchOpen}
        members={members}
        onClose={() => setSearchOpen(false)}
        onSelectMember={(did) => openMemberDossier(did)}
      />

      <StampKitPopover
        open={stampOpen}
        anchorRect={stampButtonRef.current?.getBoundingClientRect() ?? null}
        hasStamps={Boolean(activeMember && (stampsByMember[activeMember.discordId]?.length ?? 0) > 0)}
        onSlamStamp={handleSlamStamp}
        onClearMemberStamps={() => {
          if (!activeMember) return
          setStampsByMember((prev) => {
            const next = { ...prev, [activeMember.discordId]: [] }
            saveAllStamps(next)
            return next
          })
          setStampOpen(false)
        }}
        onClose={() => setStampOpen(false)}
      />

      <ExportDossierModal
        open={exportOpen}
        member={activeMember}
        customStamps={activeMember ? stampsByMember[activeMember.discordId] ?? [] : []}
        onClose={() => setExportOpen(false)}
      />

      <PhotoGalleryModal
        plateIndex={photoPlateIndex}
        onChangePlate={setPhotoPlateIndex}
        onClose={() => setPhotoPlateIndex(null)}
      />
    </div>
  )
}

export default App
