import type { DataSource, MemberDossier, PodiumResponse, RosterResponse, StatusResponse } from './types'

async function readJson<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (payload as { error?: string }).error || `Request failed (${res.status})`
    throw new Error(message)
  }
  return payload as T
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch('/api/status')
  return readJson<StatusResponse>(res)
}

export async function fetchRoster(
  source: DataSource | 'auto' = 'auto',
  options?: { refresh?: boolean },
): Promise<RosterResponse> {
  const qs = new URLSearchParams({ source })
  if (options?.refresh) qs.set('refresh', '1')
  const res = await fetch(`/api/roster?${qs.toString()}`)
  return readJson<RosterResponse>(res)
}

export async function fetchMemberById(discordId: string): Promise<MemberDossier> {
  const res = await fetch(`/api/member/${encodeURIComponent(discordId.trim())}`)
  const data = await readJson<{ member: MemberDossier }>(res)
  return data.member
}

export async function fetchPodium(
  source: DataSource | 'auto' = 'auto',
  options?: { refresh?: boolean },
): Promise<PodiumResponse> {
  const qs = new URLSearchParams({ source })
  if (options?.refresh) qs.set('refresh', '1')
  const res = await fetch(`/api/podium?${qs.toString()}`)
  return readJson<PodiumResponse>(res)
}

export interface RobloxAvatarBundle {
  headshotUrl: string | null
  fullBodyUrl: string | null
}

export async function fetchRobloxAvatar(username: string): Promise<RobloxAvatarBundle> {
  try {
    const res = await fetch(`/api/avatar/${encodeURIComponent(username)}`)
    if (!res.ok) return { headshotUrl: null, fullBodyUrl: null }
    const data = (await res.json()) as {
      url?: string | null
      headshotUrl?: string | null
      fullBodyUrl?: string | null
    }
    return {
      headshotUrl: data.headshotUrl ?? data.url ?? null,
      fullBodyUrl: data.fullBodyUrl ?? null,
    }
  } catch {
    return { headshotUrl: null, fullBodyUrl: null }
  }
}

export async function connectSupabase(
  url: string,
  key: string,
): Promise<{ connected: boolean; error: string | null; status: StatusResponse }> {
  const res = await fetch('/api/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, key }),
  })
  return readJson<{ connected: boolean; error: string | null; status: StatusResponse }>(res)
}

export async function importCsvLedger(
  statsCsv: string | null,
  applicationsCsv: string | null,
): Promise<{ count: number; members: MemberDossier[]; status: StatusResponse }> {
  const res = await fetch('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statsCsv, applicationsCsv }),
  })
  return readJson<{ count: number; members: MemberDossier[]; status: StatusResponse }>(res)
}
