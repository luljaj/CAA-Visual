# CAA-Visual — The Black Ledger

> **C.A.A.** · Founded in the Summer of 2022 · Strict Invite/Vouch only · We are not responsible for Interns · *“How you dress is how you present yourself.”*

An interactive, leather-bound archival dossier book for viewing **Custom Adversaries Association (C.A.A.)** Front Door applications, employee records, awards, disciplinary strikes, honor podiums, and vouch referral trees.

## Setup

1. Configure your Supabase credentials (matching `CAA-Bot`):
   ```bash
   cp .env.example .env
   # Fill in SUPABASE_DB_URL and SUPABASE_KEY
   ```
2. Install Python dependencies (or reuse `../CAA-Bot/venv` automatically via `./start.sh`):
   ```bash
   python3 -m venv .venv
   ./.venv/bin/pip install -r requirements.txt
   ```
3. Launch the ledger server:
   ```bash
   ./start.sh
   ```
   Then open **http://127.0.0.1:8765**.

If you modify frontend files under `web/`:
```bash
cd web && npm install && npm run build
```

## Features

- **3D Leather Cover & Turning Folios**: Oxblood leather binding with gold-foil `C.A.A.` crest, interactive wax seal clasp, marbled endpapers, official C.A.A. archival photo plates, and procedural Web Audio desk foley.
- **Live CAA Supabase Sync**: Paginated reads across `stats`, `applications`, and `strikes` tables with RPC fallback (`fetchstats`, `fetchapplication`, `get_user_invite_count`, `get_user_invitees`, `get_strikes`, `top_*`), plus live Roblox headshot & full-suit attire inspection.
- **Six Ledger Chapters**:
  - **Index**: Organization standing summary, filters, sort controls, and paginated 25-row Personnel Directory.
  - **Dossiers**: Paper-clipped portrait with `SUIT`/`MUG` attire inspection, Front Door application slip, Intern responsibility notice, 4-pillar performance ledger (`Reports`, `Event Wins`, `Referrals`, `Awards`), grouped `(Nx)` awards, active strike history, custom **Management Stamp Kit**, handwritten **Pencil Margin Notes** (`localStorage`), **Side-by-Side Compare**, and **Export Card** PNG generator.
  - **Front Door**: Chronological entry filings and stated intent archive.
  - **Podium**: Mirrors `/podium` (Top 3 across `Reports`, `Event Wins`, `Referrals`, `Awards`) and `/fieldrankings` (Top 10 by reports answered).
  - **Lineage**: Interactive SVG vouch & referral tree with sponsor filter, network metrics, and zoom.
  - **Vault**: Source switcher (`Live Supabase` / `Sample Archive` / `CSV Import`), direct Discord User ID RPC lookup, and CSV uploader.
- **Quick Search (`⌘K` / `/`)**: Instantaneous Rolodex search across aliases, Discord IDs, sponsors, intents, and awards.
