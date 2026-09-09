#!/bin/bash
# One-Click Start Script for Hostel Mess Operations Agent

echo "=========================================================="
echo "  Starting Hostel Mess Operations Agent System"
echo "=========================================================="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# 1. Start Docker PostgreSQL
echo "[1/3] Starting PostgreSQL Container (Port 5432)..."
docker compose up -d

# Wait for DB to become ready
echo "Waiting for database to be ready..."
sleep 3

# 2. Start FastAPI Backend
echo "[2/3] Starting FastAPI Backend on http://localhost:8008..."
nohup python3 -m uvicorn src.api:app --host 0.0.0.0 --port 8008 > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID, logs: backend.log)"

# 3. Start Next.js Frontend
echo "[3/3] Starting Next.js Frontend on http://localhost:3001..."
cd frontend
nohup npx next start -p 3001 > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID, logs: frontend/frontend.log)"

echo "=========================================================="
echo "  Hostel Mess Operations Agent is RUNNING!"
echo "  - Web Dashboard:  http://localhost:3001"
echo "  - Backend API:    http://localhost:8008"
echo "  - API Swagger:    http://localhost:8008/docs"
echo "  - PostgreSQL:     localhost:5432 (agentic-mess-db)"
echo "=========================================================="
echo "To stop the system, run: ./stop.sh"
