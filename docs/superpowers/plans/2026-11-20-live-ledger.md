# Live Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task.

**Goal:** Make normal ledger startup use the actual CAA Supabase dataset and render genuine Roblox mug portraits reliably.

**Architecture:** Retain aiohttp and LedgerDataProvider, existing server-only ignored credentials, and React/Vite UI. Fix current connection/status/refresh and portrait request behavior without new DB schema or UI libraries.

**Tech Stack:** Python, aiohttp, supabase-py, React 19, TypeScript, Vite.

**Spec:** docs/superpowers/plans/2026-11-20-live-ledger-spec.md

## Global Constraints
- Preserve pre-existing edits, existing book design, server-only credentials, default loopback binding, and database access boundaries.
- No database/schema/RLS mutations, no exposed service keys, no external publishing.
- Real source uses actual CAA tables/RPCs and official Roblox username/headshot endpoints; do not replace real failures with mock success.
- No Rare UI or other UI packages needed; retain current component setup.
- Defer inferred rank/Discord role changes.

## Review Focus
- Configured-but-unreachable database reports live failure without fake connectivity/sample success.
- Startup and refresh read the full dataset above 1,000 rows without duplicate concurrent roster loads.
- Portrait identity changes clear old photos immediately; compact portraits use real images too.
- Concurrent duplicate avatar requests and transient failures do not overload Roblox or poison the session forever.
- Secret values never enter client assets, responses, tests, reports, or committed files.

### Task 1: Finish the existing live data and portrait integration

**Files:**
- Modify `data_provider.py`, `server.py` only if needed for status/refresh/avatar reliability.
- Modify `web/src/api.ts`, `web/src/App.tsx`, `web/src/components/PortraitFrame.tsx`, `web/src/components/VaultSpread.tsx` only as needed for source load/refresh and real photo reliability.
- Add focused Python regression tests under `tests/`; frontend behavior validation may use browser rather than introducing a test framework.
- Update `README.md` with honest setup/verification and refresh semantics if changed; rebuild tracked `web/dist` assets using existing build command.

**Interfaces:**
- Keep `/api/status`, `/api/roster?source=auto|live|archive|imported&refresh=1`, `/api/podium`, `/api/avatar/{username}` response contracts compatible.
- `get_roster(source, refresh=False)` returns source, members, totals, liveError. `get_podium` returns categories and fieldRankings. `resolve_roblox_avatar(username)` returns a URL or None.
- Normal startup uses local `.env`/existing server env, no browser key entry needed. Worktree has copied ignored .env at mode 600.

- [ ] Inspect baseline and discovery report `/tmp/caa-ledger-coordination/discovery.md`; confirm current source data is live. Existing source edits deliberately turned off `size === 'sm'` lookup: override this specific guard because user requests genuine mugs, preserving unrelated component changes.
- [ ] Add meaningful isolated tests for configured startup connection state versus successful/failed read, explicit live failure, paginated roster >1000, avatar success/miss TTL and concurrent lookup sharing, thumbnail state if handled. Use stdlib unittest/mock if sufficient. Keep live network calls out of regression suite.
- [ ] Confirm and document the CAA-Bot Supabase config/read RPC and Roblox lookup hooks used as source of truth; do not modify bot files.
- [ ] Repair optimistic connection state so it is marked connected after a successful actual read. Ensure initial UI load does not request status before verification then keep stale status; sequence roster then status/podium or otherwise share/reconcile state. Ensure manual refresh propagates refresh through frontend/server without duplicate roster reads. Preserve explicit archive/import choices. Allow retry selection of configured live sources in Vault even after a failed read.
- [ ] Make both compact and full portrait frames resolve real URLs. Reset photo state on identity changes; share pending/cache work; cache success for 30 minutes and misses no longer than 15 seconds. A remount or bounded retry can recover a temporary failure. Never use another member's picture. Retain illustration fallback when no photo available and for sample archive.
- [ ] Bound backend avatar network concurrency to 4, share concurrent same-name resolution, accept completed valid HTTPS thumbnail URLs only, and avoid caching transient misses for 30 minutes. Add modest bounded retry for pending/429 only if necessary; no unbounded loop or extensive new subsystem.
- [ ] Run focused tests, all newly added tests, Python compile, frontend build (`npm ci` first in web if needed). Read-only live check confirms full roster, refresh and representative official headshots. Do not expose raw dossier data/secrets in output.
- [ ] Self-review scope/security, commit task changes, and write report with commands/results, changed files, known limits. Include browser rendering verification if tooling available; otherwise coordinator handles that final verification.
