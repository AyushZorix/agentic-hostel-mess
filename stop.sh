#!/bin/bash
# One-Click Stop Script for Hostel Mess Operations Agent

echo "=========================================================="
echo "  Stopping Hostel Mess Operations Agent System"
echo "=========================================================="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# 1. Stop Frontend and Backend processes
echo "[1/2] Terminating FastAPI and Next.js processes..."
pkill -f "uvicorn src.api:app"
pkill -f "next start" || pkill -f "next dev"

# 2. Stop Docker PostgreSQL
echo "[2/2] Stopping PostgreSQL container..."
docker compose stop

echo "=========================================================="
echo "  All services stopped successfully."
echo "=========================================================="
