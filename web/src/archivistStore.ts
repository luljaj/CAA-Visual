import type { CustomStamp, StampPreset } from './types'

const STAMPS_KEY = 'caa_ledger_stamps_v1'
const NOTES_KEY = 'caa_ledger_notes_v1'
const BOOKMARK_KEY = 'caa_ledger_bookmark_v1'

export const STAMP_PRESETS: StampPreset[] = [
  { label: 'APPROVED', subtext: 'Cleared by Management', ink: 'forest' },
  { label: 'VERIFIED', subtext: 'Alias & Service Confirmed', ink: 'ink' },
  { label: 'PROMOTE', subtext: 'Recommend Elevation', ink: 'gold' },
  { label: 'WATCHLIST', subtext: 'Hold Under Review', ink: 'crimson' },
  { label: 'VOUCHED', subtext: 'Official Vouch Stamp', ink: 'forest' },
]

export function loadAllStamps(): Record<string, CustomStamp[]> {
  try {
    const raw = localStorage.getItem(STAMPS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CustomStamp[]>) : {}
  } catch {
    return {}
  }
}

export function saveAllStamps(map: Record<string, CustomStamp[]>): void {
  try {
    localStorage.setItem(STAMPS_KEY, JSON.stringify(map))
  } catch {
    // ignore storage errors
  }
}

export function loadAllNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function saveAllNotes(map: Record<string, string>): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(map))
  } catch {
    // ignore storage errors
  }
}

export function loadBookmarkId(): string | null {
  try {
    return localStorage.getItem(BOOKMARK_KEY)
  } catch {
    return null
  }
}

export function saveBookmarkId(discordId: string | null): void {
  try {
    if (discordId) {
      localStorage.setItem(BOOKMARK_KEY, discordId)
    } else {
      localStorage.removeItem(BOOKMARK_KEY)
    }
  } catch {
    // ignore storage errors
  }
}

export function clearAllArchivistMarks(): void {
  try {
    localStorage.removeItem(STAMPS_KEY)
    localStorage.removeItem(NOTES_KEY)
    localStorage.removeItem(BOOKMARK_KEY)
  } catch {
    // ignore storage errors
  }
}
