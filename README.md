# CAA-Visual — The Black Ledger

An interactive, leather-bound syndicate dossier book for viewing **Custom Adversaries Association (CAA)** Front Door applications, operative stats, awards, disciplinary strikes, honor podiums, and referral lineage.

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

- **3D Leather Cover & Turning Folios**: Oxblood leather binding with gold-foil CAA crest, interactive wax seal clasp, marbled endpapers, and procedural Web Audio desk foley.
- **Live CAA Supabase Sync**: Paginated reads across `stats`, `applications`, and `strikes` tables with RPC fallback (`fetchstats`, `fetchapplication`, `get_user_invite_count`, `get_user_invitees`, `get_strikes`, `top_*`), plus real Roblox headshot resolution.
- **Six Ledger Chapters**:
  - **Index**: Association standing totals, filters, sort controls, and paginated Rolodex directory.
  - **Dossiers**: Paper-clipped portrait, Front Door application slip, double-entry 5-pillar performance ledger, grouped `(Nx)` awards, active strike history, custom rubber **Stamp Kit**, handwritten **Pencil Margin Notes** (`localStorage`), **Sit-Down** side-by-side comparison, and **Export Card** PNG generator.
  - **Front Door**: Chronological entry filings with 6-week intern promotion follow-up flags.
  - **Podium**: Mirrors `/podium` (Top 3 across all 5 pillars) and `/fieldrankings` (Top 10 by reports answered).
  - **Lineage**: Interactive SVG referral bloodline tree with sponsor selection and zoom.
  - **Vault**: Source switcher (`Live Supabase` / `Sample Archive` / `CSV Import`), direct Discord User ID RPC lookup, and CSV uploader.
- **Quick Search (`⌘K` / `/`)**: Instantaneous Rolodex search across aliases, Discord IDs, sponsors, intents, and awards.
