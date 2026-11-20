export type RankTier = 'leadership' | 'made' | 'intern'
export type DataSource = 'archive' | 'live' | 'imported'
export type ChapterId = 'index' | 'dossiers' | 'frontdoor' | 'podium' | 'lineage' | 'vault'

export interface ApplicationInfo {
  robloxUsername: string
  reason: string
  inviter: string | null
  inviterId: string | null
  createdAt: string | null
  formattedDate: string
  isLegacyMigrated: boolean
  weeksSinceApplication: number | null
  promotionReviewDue: boolean
}

export interface OperativeStats {
  eventWins: number
  reports: number
  referrals: number
  awards: string[]
  awardsCount: number
}

export interface OperativeRanks {
  eventWins: number
  reports: number
  referrals: number
  awardsCount: number
}

export interface InviteeRef {
  discordId: string
  robloxUsername: string
  position: string | null
  entryId: number | null
}

export interface StrikeRecord {
  reason: string
  count: number
  issuedBy: string | null
  issuedByName: string | null
  createdAt: string | null
  expiresAt: string | null
  formattedIssued: string
  formattedExpires: string
  daysRemaining: number | null
}

export interface MemberDossier {
  id: number
  discordId: string
  username: string
  displayName: string
  position: string
  rankTier: RankTier
  source: DataSource
  avatarUrl: string | null
  application: ApplicationInfo
  stats: OperativeStats
  ranks: OperativeRanks
  invitees: InviteeRef[]
  strikes: StrikeRecord[]
  totalActiveStrikes: number
}

export interface RosterTotals {
  totalMembers: number
  leadershipCount: number
  madeCount: number
  internCount: number
  combinedReports: number
  combinedEventWins: number
  combinedReferrals: number
  totalAwards: number
  flaggedMembers: number
  activeStrikesCount: number
  promoDueCount: number
}

export interface StatusResponse {
  liveConfigured: boolean
  liveConnected: boolean
  liveError: string | null
  hasImported: boolean
  importedCount: number
  archiveCount: number
  serverIcon: string
  defaultSource: DataSource
}

export interface RosterResponse {
  source: DataSource
  liveError: string | null
  totals: RosterTotals
  members: MemberDossier[]
}

export type PodiumCategoryKey = 'reports' | 'eventwins' | 'referrals' | 'awards'

export interface PodiumEntry {
  rank: number
  entryId: number | null
  discordId: string | null
  username: string
  position: string | null
  value: number
}

export interface PodiumResponse {
  source: DataSource
  categories: Record<PodiumCategoryKey, PodiumEntry[]>
  fieldRankings: PodiumEntry[]
}

export type StampInk = 'crimson' | 'forest' | 'gold' | 'ink'

export interface CustomStamp {
  id: string
  label: string
  ink: StampInk
  rotation: number
  stampedAt: string
}

export interface StampPreset {
  label: string
  subtext: string
  ink: StampInk
}

export type FilterMode =
  | 'all'
  | 'leadership'
  | 'made'
  | 'intern'
  | 'flagged'
  | 'awarded'
  | 'promodue'

export type SortField = 'id' | 'reports' | 'eventWins' | 'referrals' | 'awards' | 'recent'
