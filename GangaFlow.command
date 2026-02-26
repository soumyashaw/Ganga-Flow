#!/bin/bash
# ── GangaFlow Launcher ────────────────────────────────────────────────────────
# Double-click this file in Finder to start GangaFlow.
# Requires: .venv already set up (pip install -r requirements.txt)
#           frontend already built (cd frontend && npm run build)

# Always run from the project root regardless of where the script lives
cd "$(dirname "$0")"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GangaFlow"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Kill anything already on port 8000 ───────────────────────────────────────
lsof -ti :8000 | xargs kill -9 2>/dev/null

# ── Build the React frontend (skipped if dist is up to date) ─────────────────
echo "▶ Building frontend..."
cd frontend && npm run build
if [ $? -ne 0 ]; then
  echo "✖ Frontend build failed. Aborting."
  read -p "Press Enter to close..."
  exit 1
fi
cd ..
echo "✔ Frontend ready."

# ── Start Django/Daphne ──────────────────────────────────────────────────────
echo "▶ Starting backend on http://localhost:8000 ..."
source .venv/bin/activate
.venv/bin/daphne -p 8000 ganga_backend.asgi:application &
DAPHNE_PID=$!

# ── Wait for the server to be ready, then open the browser ───────────────────
sleep 2
echo "✔ Server started (PID $DAPHNE_PID)."
echo "▶ Opening http://localhost:8000 ..."
open http://localhost:8000

# ── Keep the terminal open; Ctrl+C shuts everything down ─────────────────────
echo ""
echo "  GangaFlow is running at http://localhost:8000"
echo "  Press Ctrl+C to stop."
echo ""

trap "echo ''; echo 'Stopping GangaFlow...'; kill $DAPHNE_PID 2>/dev/null; exit 0" INT
wait $DAPHNE_PID
