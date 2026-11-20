import { Camera, Database, KeyRound, Search, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { connectSupabase, fetchMemberById, importCsvLedger } from '../api'
import { clearAllArchivistMarks } from '../archivistStore'
import type { DataSource, MemberDossier, StatusResponse } from '../types'

export function VaultLeftPage({
  status,
  activeSource,
  liveError,
  onSelectSource,
  onConnected,
  onOpenFetchedMember,
}: {
  status: StatusResponse | null
  activeSource: DataSource
  liveError: string | null
  onSelectSource: (source: DataSource) => void
  onConnected: () => void
  onOpenFetchedMember: (member: MemberDossier) => void
}) {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectMessage, setConnectMessage] = useState<string | null>(null)
  const [connectErr, setConnectErr] = useState<string | null>(null)

  const [lookupId, setLookupId] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    setConnectErr(null)
    setConnectMessage(null)
    try {
      const res = await connectSupabase(url, key)
      if (res.connected) {
        setConnectMessage('Connected to Supabase in memory for this session.')
        onConnected()
      } else {
        setConnectErr(res.error || 'Connection failed.')
      }
    } catch (err) {
      setConnectErr(err instanceof Error ? err.message : 'Unable to connect.')
    } finally {
      setConnecting(false)
    }
  }

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookupId.trim()) return
    setLookingUp(true)
    setLookupError(null)
    try {
      const member = await fetchMemberById(lookupId.trim())
      onOpenFetchedMember(member)
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'No dossier found for that Discord ID.')
    } finally {
      setLookingUp(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#5c4e40]/45 pb-2.5">
        <h2 className="text-xl font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
          Data Vault &amp; Live Link
        </h2>
        <Database className="h-4 w-4 text-[#8f1d1d]" />
      </div>

      {/* Active Source Switcher */}
      <div className="border border-[#6b4e1c]/45 bg-[#faf3e4]/85 p-3.5">
        <div
          className="mb-2 text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Ledger Source
        </div>
        <div className="flex flex-wrap gap-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
          <button
            type="button"
            onClick={() => onSelectSource('archive')}
            className={`brass-btn cursor-pointer border px-2.5 py-1.5 text-xs font-bold ${
              activeSource === 'archive'
                ? 'border-[#1a1512] bg-[#1a1512] text-[#f4ecdb]'
                : 'border-[#6b4e1c]/45 bg-[#efe4ce] text-[#3d3126] hover:border-[#8f1d1d]'
            }`}
          >
            Sample Archive ({status?.archiveCount ?? 14})
          </button>

          <button
            type="button"
            disabled={!status?.liveConfigured && !status?.liveConnected}
            onClick={() => onSelectSource('live')}
            className={`brass-btn cursor-pointer border px-2.5 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-45 ${
              activeSource === 'live'
                ? 'border-[#1d4d35] bg-[#1d4d35] text-[#f4ecdb]'
                : 'border-[#6b4e1c]/45 bg-[#efe4ce] text-[#3d3126] hover:border-[#1d4d35]'
            }`}
          >
            Live Supabase
          </button>

          <button
            type="button"
            disabled={!status?.hasImported}
            onClick={() => onSelectSource('imported')}
            className={`brass-btn cursor-pointer border px-2.5 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-45 ${
              activeSource === 'imported'
                ? 'border-[#2c3547] bg-[#2c3547] text-[#f4ecdb]'
                : 'border-[#6b4e1c]/45 bg-[#efe4ce] text-[#3d3126] hover:border-[#2c3547]'
            }`}
          >
            Imported CSV ({status?.importedCount ?? 0})
          </button>
        </div>

        {liveError && (
          <p className="mt-2 text-[11px] text-[#8f1d1d]" style={{ fontFamily: 'var(--font-mono)' }}>
            Live note: {liveError}
          </p>
        )}
      </div>

      {/* Live Supabase In-Memory Connect */}
      <form
        onSubmit={handleConnect}
        className="flex flex-col gap-2.5 border border-[#6b4e1c]/45 bg-[#faf3e4]/85 p-3.5"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase">
          <KeyRound className="h-3.5 w-3.5 text-[#8c6118]" />
          <span>Connect Live CAA Supabase (Session Memory Only)</span>
        </div>

        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-project.supabase.co"
          className="w-full border border-[#6b4e1c]/45 bg-[#fffdf8] px-2.5 py-1.5 text-xs text-[#1a1512] placeholder-[#6e5d4b]"
        />
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="SUPABASE_KEY (anon or service key)"
          className="w-full border border-[#6b4e1c]/45 bg-[#fffdf8] px-2.5 py-1.5 text-xs text-[#1a1512] placeholder-[#6e5d4b]"
        />

        <div className="flex items-center justify-between gap-2">
          <button
            type="submit"
            disabled={connecting}
            className="brass-btn cursor-pointer border border-[#1a1512] bg-[#1a1512] px-3 py-1.5 text-xs font-bold text-[#f4ecdb] hover:bg-[#3a2c22] disabled:opacity-50"
          >
            {connecting ? 'Verifying RPCs...' : 'Link Live Database'}
          </button>
          <span className="text-[10px] text-[#5c4e40]">Or configure .env for auto-link</span>
        </div>

        {connectMessage && <p className="text-[11px] font-bold text-[#1d4d35]">{connectMessage}</p>}
        {connectErr && <p className="text-[11px] font-bold text-[#8f1d1d]">{connectErr}</p>}
      </form>

      {/* Single Discord ID Lookup */}
      <form
        onSubmit={handleLookup}
        className="flex flex-col gap-2 border border-[#6b4e1c]/45 bg-[#faf3e4]/85 p-3.5"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#4c3e31] uppercase">
          <Search className="h-3.5 w-3.5 text-[#8f1d1d]" />
          <span>Direct Discord User ID Lookup</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="e.g. 270202464861421568"
            className="min-w-0 flex-1 border border-[#6b4e1c]/45 bg-[#fffdf8] px-2.5 py-1.5 text-xs text-[#1a1512] placeholder-[#6e5d4b]"
          />
          <button
            type="submit"
            disabled={lookingUp || !lookupId.trim()}
            className="brass-btn shrink-0 cursor-pointer border border-[#8f1d1d] bg-[#8f1d1d] px-3 py-1.5 text-xs font-bold text-[#f4ecdb] hover:bg-[#6d1212] disabled:opacity-50"
          >
            {lookingUp ? 'Pulling...' : 'Pull File'}
          </button>
        </div>
        {lookupError && <p className="text-[11px] font-bold text-[#8f1d1d]">{lookupError}</p>}
      </form>
    </div>
  )
}

export function VaultRightPage({
  onImported,
  onClearedMarks,
  onOpenPhotoPlate,
}: {
  onImported: () => void
  onClearedMarks: () => void
  onOpenPhotoPlate: (plateIndex: number) => void
}) {
  const [statsFileName, setStatsFileName] = useState<string | null>(null)
  const [appsFileName, setAppsFileName] = useState<string | null>(null)
  const [statsCsv, setStatsCsv] = useState<string | null>(null)
  const [appsCsv, setAppsCsv] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [importErr, setImportErr] = useState<string | null>(null)
  const [marksClearedMsg, setMarksClearedMsg] = useState<string | null>(null)

  const readFileText = (file: File, setter: (txt: string) => void, nameSetter: (n: string) => void) => {
    nameSetter(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setter(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!statsCsv && !appsCsv) {
      setImportErr('Attach stats.csv, applications.csv, or both before importing.')
      return
    }
    setImporting(true)
    setImportErr(null)
    setImportMsg(null)
    try {
      const res = await importCsvLedger(statsCsv, appsCsv)
      setImportMsg(`Imported ${res.count} dossier records into the active ledger.`)
      onImported()
    } catch (err) {
      setImportErr(err instanceof Error ? err.message : 'CSV import failed.')
    } finally {
      setImporting(false)
    }
  }

  const handleResetMarks = () => {
    clearAllArchivistMarks()
    onClearedMarks()
    setMarksClearedMsg('Cleared all local rubber stamps, pencil margin notes, and crimson ribbon.')
    window.setTimeout(() => setMarksClearedMsg(null), 3000)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#5c4e40]/45 pb-2.5">
        <h3 className="text-lg font-bold text-[#1a1512]" style={{ fontFamily: 'var(--font-display)' }}>
          CSV Ledger Importer &amp; Controls
        </h3>
        <Upload className="h-4 w-4 text-[#4c3e31]" />
      </div>

      {/* CSV Upload Card */}
      <div
        className="flex flex-col gap-3 border border-[#6b4e1c]/45 bg-[#faf3e4]/85 p-4 text-xs"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <p className="leading-relaxed text-[#3d3126]">
          Load exported CAA tables matching the bot schema (<code className="font-bold">stats.csv</code> and/or{' '}
          <code className="font-bold">applications.csv</code>) to inspect real historical records inside the book.
        </p>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <label className="flex cursor-pointer flex-col gap-1 border border-dashed border-[#6b4e1c]/65 bg-[#f3ead8] p-3 hover:border-[#8f1d1d]">
            <span className="font-bold text-[#1a1512]">1. stats.csv</span>
            <span className="truncate text-[11px] text-[#5c4e40]">
              {statsFileName ?? 'Click to select stats export...'}
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) readFileText(f, setStatsCsv, setStatsFileName)
              }}
            />
          </label>

          <label className="flex cursor-pointer flex-col gap-1 border border-dashed border-[#6b4e1c]/65 bg-[#f3ead8] p-3 hover:border-[#8f1d1d]">
            <span className="font-bold text-[#1a1512]">2. applications.csv</span>
            <span className="truncate text-[11px] text-[#5c4e40]">
              {appsFileName ?? 'Click to select apps export...'}
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) readFileText(f, setAppsCsv, setAppsFileName)
              }}
            />
          </label>
        </div>

        <button
          type="button"
          disabled={importing || (!statsCsv && !appsCsv)}
          onClick={handleImport}
          className="brass-btn w-fit cursor-pointer border border-[#1a1512] bg-[#1a1512] px-4 py-1.5 text-xs font-bold text-[#f4ecdb] hover:bg-[#3a2c22] disabled:opacity-45"
        >
          {importing ? 'Binding Ledger...' : 'Bind CSV Records Into Ledger'}
        </button>

        {importMsg && <p className="font-bold text-[#1d4d35]">{importMsg}</p>}
        {importErr && <p className="font-bold text-[#8f1d1d]">{importErr}</p>}
      </div>

      {/* Headquarters Archival Photo Plate III */}
      <button
        type="button"
        onClick={() => onOpenPhotoPlate(2)}
        className="group cursor-pointer border border-[#75624a]/60 bg-[#faf3e4] p-1.5 text-left transition-colors hover:border-[#8f1d1d]"
      >
        <div className="relative overflow-hidden border border-[#5c4e40]/45 bg-[#12100e]">
          <img
            src="/photos/caa-lounge-autumn.jpg"
            alt="C.A.A. Headquarters Lounge"
            className="h-24 w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span
            className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 border border-[#d7b262]/65 bg-[#120d0a]/85 px-1.5 py-0.5 text-[9px] font-bold text-[#e7cf93] uppercase"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <Camera className="h-2.5 w-2.5" />
            <span>Plate III</span>
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between px-0.5 text-[10.5px] text-[#4c3e31]">
          <span style={{ fontFamily: 'var(--font-mono)' }}>C.A.A. Headquarters Lounge</span>
          <span className="font-bold text-[#8f1d1d]" style={{ fontFamily: 'var(--font-mono)' }}>
            Inspect →
          </span>
        </div>
      </button>

      {/* Local Archivist Storage Management */}
      <div
        className="mt-auto flex flex-col gap-2.5 border border-[#6b4e1c]/40 bg-[#efe5d0]/70 p-3.5 text-xs"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <div className="font-bold text-[#4c3e31] uppercase">Local Archivist Marginalia</div>
        <p className="text-[11px] leading-relaxed text-[#4c3e31]">
          Custom rubber stamps, pencil margin notes, and your crimson bookmark ribbon persist locally in this browser.
        </p>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleResetMarks}
            className="brass-btn inline-flex cursor-pointer items-center gap-1.5 border border-[#8f1d1d]/70 bg-[#faf3e4] px-3 py-1 text-[11px] font-bold text-[#8f1d1d] hover:bg-[#8f1d1d] hover:text-[#f4ecdb]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Wipe Local Stamps &amp; Notes</span>
          </button>
        </div>
        {marksClearedMsg && <p className="text-[11px] font-bold text-[#1d4d35]">{marksClearedMsg}</p>}
      </div>
    </div>
  )
}
