#!/bin/bash
# One-Click Start Script for Hostel Operations Platform (HostelOps)

echo "=========================================================="
echo "  Starting Hostel Operations Platform (HostelOps)"
echo "=========================================================="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# 1. Start Docker PostgreSQL
echo "[1/4] Starting PostgreSQL Container (Port 5432)..."
docker compose up -d

# Wait for DB to become ready
echo "Waiting for database to be ready..."
sleep 2

# 2. Start FastAPI Backend
echo "[2/4] Starting FastAPI Backend on http://localhost:8008..."
nohup python3 -m uvicorn src.api:app --host 0.0.0.0 --port 8008 > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID, logs: backend.log)"

# 3. Start Next.js Frontend
echo "[3/4] Starting Next.js Frontend on http://localhost:3001..."
cd "$ROOT_DIR/frontend"
nohup npx next dev -p 3001 > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID, logs: frontend/frontend.log)"
cd "$ROOT_DIR"

# 4. Start ngrok Tunnel (Port 8008)
echo "[4/4] Starting ngrok tunnel for Backend Webhooks..."
if command -v ngrok &> /dev/null; then
    # Kill any stale ngrok instances
    pkill -f "ngrok http" > /dev/null 2>&1 || true
    nohup ngrok http 8008 > ngrok.log 2>&1 &
    NGROK_PID=$!
    echo "ngrok started (PID: $NGROK_PID, logs: ngrok.log)"
    
    # Wait for tunnel initialization and retrieve public URL
    sleep 3
    NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    tunnels = data.get('tunnels', [])
    https_tunnels = [t['public_url'] for t in tunnels if t.get('proto') == 'https']
    print(https_tunnels[0] if https_tunnels else (tunnels[0]['public_url'] if tunnels else ''))
except Exception:
    print('')
" 2>/dev/null)

    if [ -n "$NGROK_URL" ]; then
        echo "ngrok Public Tunnel: $NGROK_URL"
        # Update APP_BASE_URL in .env if present
        if [ -f .env ]; then
            if grep -q "^APP_BASE_URL=" .env; then
                sed -i '' "s|^APP_BASE_URL=.*|APP_BASE_URL=$NGROK_URL|" .env 2>/dev/null || sed -i "s|^APP_BASE_URL=.*|APP_BASE_URL=$NGROK_URL|" .env
            else
                echo "APP_BASE_URL=$NGROK_URL" >> .env
            fi
            echo "Updated .env APP_BASE_URL to $NGROK_URL"
        fi
    else
        echo "ngrok URL is initializing (check http://127.0.0.1:4040/status or ngrok.log)"
    fi
else
    echo "Warning: ngrok command not found in PATH. Webhooks will run on local network only."
fi

echo "=========================================================="
echo "  HostelOps Platform is RUNNING!"
echo "  - Web Dashboard:    http://localhost:3001"
echo "  - Local Backend:    http://localhost:8008"
echo "  - API Swagger:      http://localhost:8008/docs"
if [ -n "$NGROK_URL" ]; then
echo "  - Public Tunnel:    $NGROK_URL"
echo "  - Webhook URL:      $NGROK_URL/api/elevenlabs/webhook"
fi
echo "  - PostgreSQL:       localhost:5432 (agentic-mess-db)"
echo "=========================================================="
echo "To stop all services, run: ./stop.sh"
