#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -x "$DIR/.venv/bin/python" ]]; then
  PYTHON="$DIR/.venv/bin/python"
elif [[ -x "/Users/lukauljaj/Projects/CAA-Bot/venv/bin/python" ]]; then
  PYTHON="/Users/lukauljaj/Projects/CAA-Bot/venv/bin/python"
else
  PYTHON="python3"
fi

exec "$PYTHON" "$DIR/server.py" "$@"
