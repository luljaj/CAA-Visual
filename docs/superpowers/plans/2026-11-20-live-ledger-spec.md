# Live Ledger integration spec

Connect the existing new Black Ledger to CAA-Bot's real Supabase data and show actual Roblox headshots in its mug portraits. Actual project is CAA-Visual, not the missing CAA-Black-Ledger directory. Research confirmed the configured database is correct and already responds. Improve the existing integration, retaining the book design and local data access boundaries.

## Acceptance
- Normal startup with existing ignored server credentials loads real dossiers and truthful live status. Explicit live failures remain errors, never disguised samples. With no configured database, the existing sample archive remains usable and labeled.
- The real table set exceeds 1,000 records; preserve pagination and current user changes. Manual refresh actually refreshes live data.
- All portrait sizes for live/imported members attempt real Roblox headshots; archive illustrations remain samples. A new member never temporarily displays the previous member's headshot. Duplicate avatar requests share work; transient misses can recover without restarting the app.
- Existing service credentials stay on the Python server and out of browser build, API output, source control, and reports. No database/schema/RLS mutation or external publication.
- Preserve concurrent source changes. Complete in isolated worktree and then integrate only the scoped patch into actual CAA-Visual if conflict-free; otherwise report exact reviewable state.
- Defer inferred rank/Discord role changes; acknowledge current inference limitation in report only.
- Verify regression behavior, frontend build, live roster count, representative valid headshots, and normal local UI rendering.
